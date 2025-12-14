// 后台管理系统云函数
const cloud = require('wx-server-sdk')
const mysql = require('mysql2/promise')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 数据库连接配置（与现有服务保持一致）
const dbConfig = {
  host: 'sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com',
  port: 22809,
  user: 'root123456',
  password: 'Zz123456',
  database: 'cloud1-5g6ssvupb26437e4',
  waitForConnections: true,
  connectionLimit: 5,
  timezone: 'Z',
  connectTimeout: 1500
}

const pool = mysql.createPool(dbConfig)

// 初始化管理员相关表
async function ensureTables() {
  // 管理员表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
      password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
      nickname VARCHAR(128) COMMENT '昵称',
      role VARCHAR(32) DEFAULT 'editor' COMMENT '角色：super_admin/admin/editor',
      status VARCHAR(32) DEFAULT 'active' COMMENT '状态：active/disabled',
      last_login_at DATETIME NULL,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_username (username),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 操作日志表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL COMMENT '管理员ID',
      action VARCHAR(64) NOT NULL COMMENT '操作类型',
      resource VARCHAR(64) COMMENT '资源类型',
      resource_id INT COMMENT '资源ID',
      description TEXT COMMENT '操作描述',
      ip_address VARCHAR(64) COMMENT 'IP地址',
      user_agent TEXT COMMENT '用户代理',
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_admin_id (admin_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 系统配置表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      config_key VARCHAR(128) NOT NULL UNIQUE COMMENT '配置键',
      config_value TEXT COMMENT '配置值',
      config_type VARCHAR(32) DEFAULT 'string' COMMENT '类型：string/number/boolean/json',
      description VARCHAR(255) COMMENT '描述',
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 管理员Token表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      token VARCHAR(128) NOT NULL,
      expire_time BIGINT NOT NULL,
      is_active TINYINT DEFAULT 1,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000),
      INDEX idx_token (token),
      INDEX idx_admin_id (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建默认超级管理员（如果不存在）
  const [admins] = await pool.query('SELECT COUNT(*) as count FROM admins WHERE username = ?', ['admin'])
  if (admins[0].count === 0) {
    const defaultPassword = await bcrypt.hash('admin123456', 10)
    await pool.query(
      'INSERT INTO admins (username, password, nickname, role, status) VALUES (?, ?, ?, ?, ?)',
      ['admin', defaultPassword, '超级管理员', 'super_admin', 'active']
    )
  }
}

let tablesReady = false
async function ensureTablesOnce() {
  if (tablesReady) return
  await ensureTables()
  tablesReady = true
}

// 生成Token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// 验证Token
async function verifyToken(token) {
  if (!token) {
    return { success: false, message: 'Token is required' }
  }

  const now = Date.now()
  const [tokens] = await pool.query(
    'SELECT * FROM admin_tokens WHERE token=? AND is_active=1 AND expire_time>? LIMIT 1',
    [token, now]
  )

  if (tokens.length === 0) {
    return { success: false, message: 'Invalid or expired token' }
  }

  const adminId = tokens[0].admin_id
  const [admins] = await pool.query('SELECT * FROM admins WHERE id=? AND status=? LIMIT 1', [adminId, 'active'])

  if (admins.length === 0) {
    return { success: false, message: 'Admin not found or disabled' }
  }

  return { success: true, admin: admins[0] }
}

// 记录操作日志
async function logAction(adminId, action, resource = null, resourceId = null, description = null, event = null) {
  try {
    const ipAddress = event?.headers?.['x-forwarded-for'] || event?.headers?.['x-real-ip'] || 'unknown'
    const userAgent = event?.headers?.['user-agent'] || 'unknown'
    
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, resource, resource_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminId, action, resource, resourceId, description, ipAddress, userAgent]
    )
  } catch (error) {
    console.error('记录操作日志失败:', error)
  }
}

// CORS 响应头
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

// 处理 OPTIONS 预检请求
function handleOptionsRequest() {
  return {
    statusCode: 200,
    headers: getCorsHeaders(),
    body: JSON.stringify({ success: true })
  }
}

// 包装响应，添加 CORS 头
function wrapResponse(data) {
  return {
    statusCode: 200,
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }
}

// 云函数入口
exports.main = async (event, context) => {
  // 处理 OPTIONS 预检请求（CORS）
  if (event.httpMethod === 'OPTIONS' || (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS')) {
    return handleOptionsRequest()
  }

  // 从 HTTP 请求中提取数据
  let action, data = {}
  
  // 判断是否为 HTTP 触发器调用
  const isHttpRequest = event.httpMethod || (event.requestContext && event.requestContext.http)
  
  if (isHttpRequest) {
    try {
      // 处理 POST 请求体
      let body = event.body
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body)
        } catch (e) {
          // 如果不是 JSON，尝试解析 URL 编码
          body = {}
        }
      }
      
      // 支持多种格式的请求体
      if (body.action) {
        action = body.action
        data = body.data || {}
      } else if (body.data && body.data.action) {
        // 兼容嵌套格式
        action = body.data.action
        data = body.data.data || {}
      } else {
        // 直接使用 body
        action = body.action || event.pathParameters?.action
        data = body.data || body
      }
    } catch (error) {
      return wrapResponse({ success: false, message: 'Invalid request body' })
    }
  } else {
    // 兼容旧的调用方式（直接传 action 和 data）
    action = event.action
    data = event.data || {}
  }

  try {
    await ensureTablesOnce()

    let result
    switch (action) {
      case 'login':
        result = await handleLogin(data, event)
        break
      case 'register':
        result = await handleRegister(data, event)
        break
      case 'logout':
        result = await handleLogout(data, event)
        break
      case 'getProfile':
        result = await getProfile(data, event)
        break
      case 'getDashboardStats':
        result = await getDashboardStats(data, event)
        break
      case 'getInsectList':
        result = await getInsectList(data, event)
        break
      case 'getInsectDetail':
        result = await getInsectDetail(data, event)
        break
      case 'createInsect':
        result = await createInsect(data, event)
        break
      case 'updateInsect':
        result = await updateInsect(data, event)
        break
      case 'deleteInsect':
        result = await deleteInsect(data, event)
        break
      default:
        result = { success: false, message: 'Invalid action' }
    }

    // 如果是 HTTP 请求，返回包装后的响应
    if (isHttpRequest) {
      return wrapResponse(result)
    }
    
    // 否则返回原始结果（兼容旧调用方式），但也要添加 CORS 头
    // 注意：非 HTTP 触发器可能不支持自定义响应头，但尝试添加
    return {
      ...result,
      headers: getCorsHeaders()
    }
  } catch (error) {
    console.error('Admin service error:', error)
    const errorResult = { success: false, message: error.message || '服务器错误' }
    
    if (isHttpRequest) {
      return wrapResponse(errorResult)
    }
    
    // 非 HTTP 请求也尝试添加 CORS 头
    return {
      ...errorResult,
      headers: getCorsHeaders()
    }
  }
}

// 注册
async function handleRegister({ username, password, nickname, confirmPassword }, event) {
  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' }
  }

  if (password.length < 6) {
    return { success: false, message: '密码长度不能少于6位' }
  }

  if (password !== confirmPassword) {
    return { success: false, message: '两次输入的密码不一致' }
  }

  // 检查用户名是否已存在
  const [existing] = await pool.query('SELECT id FROM admins WHERE username=?', [username])
  if (existing.length > 0) {
    return { success: false, message: '用户名已存在' }
  }

  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建管理员（默认角色为 editor）
    const [result] = await pool.query(
      'INSERT INTO admins (username, password, nickname, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, 'editor', 'active']
    )

    // 记录注册日志
    await logAction(result.insertId, 'register', null, null, `管理员注册：${username}`, event)

    return {
      success: true,
      message: '注册成功，请登录',
      data: {
        id: result.insertId,
        username
      }
    }
  } catch (error) {
    console.error('注册失败:', error)
    return { success: false, message: '注册失败，请稍后重试' }
  }
}

// 登录
async function handleLogin({ username, password }, event) {
  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' }
  }

  const [admins] = await pool.query('SELECT * FROM admins WHERE username=? AND status=?', [username, 'active'])

  if (admins.length === 0) {
    return { success: false, message: '用户名或密码错误' }
  }

  const admin = admins[0]
  const passwordMatch = await bcrypt.compare(password, admin.password)

  if (!passwordMatch) {
    return { success: false, message: '用户名或密码错误' }
  }

  // 生成Token
  const token = generateToken()
  const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天

  // 保存Token
  await pool.query(
    'INSERT INTO admin_tokens (admin_id, token, expire_time, is_active) VALUES (?, ?, ?, 1)',
    [admin.id, token, expireTime]
  )

  // 更新最后登录时间
  await pool.query('UPDATE admins SET last_login_at=NOW(3) WHERE id=?', [admin.id])

  // 记录登录日志
  await logAction(admin.id, 'login', null, null, '管理员登录', event)

  return {
    success: true,
    data: {
      token,
      expireTime,
      adminInfo: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role
      }
    }
  }
}

// 登出
async function handleLogout({ token }, event) {
  if (!token) {
    return { success: false, message: 'Token is required' }
  }

  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  // 失效Token
  await pool.query('UPDATE admin_tokens SET is_active=0 WHERE token=?', [token])

  // 记录登出日志
  await logAction(verify.admin.id, 'logout', null, null, '管理员登出', event)

  return { success: true }
}

// 获取管理员信息
async function getProfile({ token }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  const admin = verify.admin
  return {
    success: true,
    data: {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role
    }
  }
}

// 获取仪表盘统计数据
async function getDashboardStats({ token }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  try {
    // 总用户数
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users')
    const totalUsers = userCount[0].count

    // 总昆虫数
    const [insectCount] = await pool.query('SELECT COUNT(*) as count FROM insects')
    const totalInsects = insectCount[0].count

    // 总帖子数
    const [postCount] = await pool.query('SELECT COUNT(*) as count FROM posts')
    const totalPosts = postCount[0].count

    // 总视频数
    const [videoCount] = await pool.query('SELECT COUNT(*) as count FROM videos')
    const totalVideos = videoCount[0].count

    // 用户增长趋势（最近7天）
    const [userTrend] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)

    return {
      success: true,
      data: {
        totalUsers,
        totalInsects,
        totalPosts,
        totalVideos,
        userTrend: userTrend.map(item => ({
          date: item.date.toISOString().split('T')[0],
          count: item.count
        }))
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return { success: false, message: '获取统计数据失败' }
  }
}

// 获取昆虫列表
async function getInsectList({ token, page = 1, pageSize = 10, keyword, type, status }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  try {
    let sql = 'SELECT * FROM insects WHERE 1=1'
    const params = []

    if (keyword) {
      sql += ' AND (name LIKE ? OR alias LIKE ?)'
      const keywordPattern = `%${keyword}%`
      params.push(keywordPattern, keywordPattern)
    }

    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [countRows] = await pool.query(countSql, params)
    const total = countRows[0].total

    // 获取列表
    sql += ' ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?'
    params.push(pageSize, (page - 1) * pageSize)

    const [rows] = await pool.query(sql, params)

    return {
      success: true,
      data: {
        list: rows,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    }
  } catch (error) {
    console.error('获取昆虫列表失败:', error)
    return { success: false, message: '获取昆虫列表失败' }
  }
}

// 获取昆虫详情
async function getInsectDetail({ token, id }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  try {
    const [rows] = await pool.query('SELECT * FROM insects WHERE id=?', [id])
    if (rows.length === 0) {
      return { success: false, message: '昆虫不存在' }
    }

    return { success: true, data: rows[0] }
  } catch (error) {
    console.error('获取昆虫详情失败:', error)
    return { success: false, message: '获取昆虫详情失败' }
  }
}

// 创建昆虫
async function createInsect({ token, data: insectData }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  // 权限检查
  if (verify.admin.role === 'editor') {
    return { success: false, message: '无权限执行此操作' }
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO insects (name, alias, type, description, status, sort, cartoon_img, real_img, child_desc, adult_desc, identify_image, guide_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insectData.name,
        insectData.alias || null,
        insectData.type,
        insectData.description || null,
        insectData.status || 'draft',
        insectData.sort || 0,
        insectData.cartoon_img || null,
        insectData.real_img || null,
        insectData.child_desc || null,
        insectData.adult_desc ? JSON.stringify(insectData.adult_desc) : null,
        insectData.identify_image || null,
        insectData.guide_image || null
      ]
    )

    await logAction(verify.admin.id, 'create', 'insect', result.insertId, `创建昆虫：${insectData.name}`, event)

    return { success: true, data: { id: result.insertId } }
  } catch (error) {
    console.error('创建昆虫失败:', error)
    return { success: false, message: '创建昆虫失败' }
  }
}

// 更新昆虫
async function updateInsect({ token, id, data: insectData }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  try {
    const fields = []
    const values = []

    const allowedFields = ['name', 'alias', 'type', 'description', 'status', 'sort', 'cartoon_img', 'real_img', 'child_desc', 'adult_desc', 'identify_image', 'guide_image']

    allowedFields.forEach(field => {
      if (insectData[field] !== undefined) {
        if (field === 'adult_desc' && typeof insectData[field] === 'object') {
          fields.push(`${field} = ?`)
          values.push(JSON.stringify(insectData[field]))
        } else {
          fields.push(`${field} = ?`)
          values.push(insectData[field])
        }
      }
    })

    if (fields.length === 0) {
      return { success: false, message: '没有要更新的字段' }
    }

    values.push(id)
    await pool.query(`UPDATE insects SET ${fields.join(', ')} WHERE id=?`, values)

    await logAction(verify.admin.id, 'update', 'insect', id, `更新昆虫：${id}`, event)

    return { success: true }
  } catch (error) {
    console.error('更新昆虫失败:', error)
    return { success: false, message: '更新昆虫失败' }
  }
}

// 删除昆虫
async function deleteInsect({ token, id }, event) {
  const verify = await verifyToken(token)
  if (!verify.success) {
    return verify
  }

  // 权限检查
  if (verify.admin.role === 'editor') {
    return { success: false, message: '无权限执行此操作' }
  }

  try {
    await pool.query('DELETE FROM insects WHERE id=?', [id])
    await logAction(verify.admin.id, 'delete', 'insect', id, `删除昆虫：${id}`, event)
    return { success: true }
  } catch (error) {
    console.error('删除昆虫失败:', error)
    return { success: false, message: '删除昆虫失败' }
  }
}

