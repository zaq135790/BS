// 云函数入口文件（改为直连 MySQL 实现登录与 Token 管理）
const cloud = require('wx-server-sdk')
const mysql = require('mysql2/promise')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 数据库连接配置（来自用户提供的连接串）
const dbConfig = {
  // 使用外网地址，避免内网不可达导致超时
  // 注意：外网域名以控制台展示为准（此前有字母顺序差异导致解析失败）
  host: 'sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com',
  port: 22809,
  user: 'root123456',
  password: 'Zz123456',
  database: 'cloud1-5g6ssvupb26437e4',
  waitForConnections: true,
  connectionLimit: 5,
  timezone: 'Z',
  connectTimeout: 1500 // 快速失败，避免云函数超时
}

const pool = mysql.createPool(dbConfig)

// 初始化数据表（简化处理：每次调用时确保存在）
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openid VARCHAR(64) NOT NULL UNIQUE,
      nickname VARCHAR(128),
      avatar_url VARCHAR(255),
      user_type VARCHAR(32) DEFAULT 'child',
      gender INT NULL,
      country VARCHAR(64),
      province VARCHAR(64),
      city VARCHAR(64),
      login_count INT DEFAULT 0,
      last_login_at DATETIME NULL,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openid VARCHAR(64) NOT NULL,
      token VARCHAR(128) NOT NULL,
      expire_time BIGINT NOT NULL,
      is_active TINYINT DEFAULT 1,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000),
      INDEX idx_token (token),
      INDEX idx_openid (openid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

let tablesReady = false
async function ensureTablesOnce() {
  if (tablesReady) return
  await ensureTables()
  await ensureUserColumns()
  tablesReady = true
}

// 针对历史已建表但缺少字段的场景，补齐必要列（MySQL 8 不支持 ADD COLUMN IF NOT EXISTS 带 AFTER）
async function ensureUserColumns() {
  const columns = [
    { name: 'gender', def: 'INT NULL' },
    { name: 'country', def: 'VARCHAR(64) NULL' },
    { name: 'province', def: 'VARCHAR(64) NULL' },
    { name: 'city', def: 'VARCHAR(64) NULL' },
    { name: 'login_count', def: 'INT DEFAULT 0' },
    { name: 'last_login_at', def: 'DATETIME NULL' },
    { name: 'profile_background', def: 'VARCHAR(500) NULL' },
    { name: 'profile_background_type', def: "VARCHAR(32) DEFAULT 'color'" },
    { name: 'created_at', def: 'DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)' },
    { name: 'updated_at', def: 'DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' }
  ]

  for (const col of columns) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
        [dbConfig.database, 'users', col.name]
      )
      if (rows[0].cnt === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`)
      }
    } catch (e) {
      console.log('ensureUserColumns skip:', col.name, e.message)
    }
  }
}

// 公共：行数据 -> 前端需要的字段
function mapUser(row) {
  return {
    _id: row.id,
    _openid: row.openid,
    nickname: row.nickname,
    avatar_url: row.avatar_url,
    user_type: row.user_type || 'child',
    gender: row.gender,
    country: row.country,
    province: row.province,
    city: row.city,
    loginCount: row.login_count || 0,
    lastLoginTime: row.last_login_at || null,
    profile_background: row.profile_background || null,
    profile_background_type: row.profile_background_type || 'color'
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function saveToken(openid, oldToken = null) {
  const token = generateToken()
  const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000

  // 失效旧 token
  if (oldToken) {
    await pool.query(
      'UPDATE user_tokens SET is_active=0 WHERE token=? AND openid=?',
      [oldToken, openid]
    )
  }

  await pool.query(
    'INSERT INTO user_tokens (openid, token, expire_time, is_active) VALUES (?, ?, ?, 1)',
    [openid, token, expireTime]
  )

  return { token, expireTime }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data = {} } = event

  try {
    await ensureTablesOnce()

    switch (action) {
      case 'login':
        return await handleLogin(data, context)
      case 'refreshToken':
        return await handleRefreshToken(data)
      case 'getUserInfo':
        return await getUserInfo(data)
      case 'updateUserInfo':
        return await updateUserInfo(data)
      case 'checkToken':
        return await checkToken(data)
      case 'logout':
        return await handleLogout(data)
      default:
        return { success: false, message: 'Invalid action' }
    }
  } catch (error) {
    console.error('User service error:', error)
    return { success: false, message: error.message }
  }
}

// 登录：基于云函数上下文获取 openid，不再依赖 code
async function handleLogin({ userInfo = {} }, context) {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    throw new Error('无法获取 OPENID，请在微信云函数环境下调用')
  }

  // 查询用户
  const [rows] = await pool.query('SELECT * FROM users WHERE openid=?', [OPENID])
  let userRow = rows[0]
  let isNewUser = false

  if (!userRow) {
    // 注册
    const now = new Date()
    const payload = {
      openid: OPENID,
      nickname: userInfo.nickName || userInfo.nickname || '新用户',
      avatar_url: userInfo.avatarUrl || userInfo.avatar_url || '',
      user_type: userInfo.user_type || 'child',
      gender: userInfo.gender || null,
      country: userInfo.country || null,
      province: userInfo.province || null,
      city: userInfo.city || null,
      login_count: 1,
      last_login_at: now,
      created_at: now,
      updated_at: now
    }
    const [insertRes] = await pool.query(
      `INSERT INTO users
        (openid, nickname, avatar_url, user_type, gender, country, province, city, login_count, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.openid,
        payload.nickname,
        payload.avatar_url,
        payload.user_type,
        payload.gender,
        payload.country,
        payload.province,
        payload.city,
        payload.login_count,
        payload.last_login_at,
        payload.created_at,
        payload.updated_at
      ]
    )
    userRow = { id: insertRes.insertId, ...payload }
    isNewUser = true
  } else {
    // 更新登录计数与时间
    const now = new Date()
    await pool.query(
      'UPDATE users SET login_count=login_count+1, last_login_at=?, updated_at=? WHERE id=?',
      [now, now, userRow.id]
    )
    userRow = { ...userRow, login_count: userRow.login_count + 1, last_login_at: now, updated_at: now }
  }

  const tokenInfo = await saveToken(OPENID)

  return {
    success: true,
    data: {
      token: tokenInfo.token,
      expireTime: tokenInfo.expireTime,
      userInfo: mapUser(userRow),
      isNewUser
    }
  }
}

// 刷新 token
async function handleRefreshToken({ token }) {
  const check = await checkToken({ token })
  if (!check.success) return check

  const openid = check.data.userInfo._openid
  const tokenInfo = await saveToken(openid, token)

  return {
    success: true,
    token: tokenInfo.token,
    expireTime: tokenInfo.expireTime
  }
}

// 获取用户信息（按 _id / openid 均可）
async function getUserInfo({ userId, openid }) {
  if (!userId && !openid) {
    return { success: false, message: 'userId 或 openid 必填' }
  }

  const [rows] = await pool.query(
    userId ? 'SELECT * FROM users WHERE id=?' : 'SELECT * FROM users WHERE openid=?',
    [userId || openid]
  )

  if (rows.length === 0) {
    return { success: false, message: 'User not found' }
  }

  return { success: true, data: mapUser(rows[0]) }
}

// 更新用户信息
async function updateUserInfo({ userId, openid, userInfo }) {
  if (!userId && !openid) {
    return { success: false, message: 'userId 或 openid 必填' }
  }

  const fields = []
  const values = []
  const allowed = ['nickname', 'avatar_url', 'user_type', 'gender', 'country', 'province', 'city', 'profile_background', 'profile_background_type']

  allowed.forEach((key) => {
    if (userInfo && userInfo[key] !== undefined) {
      fields.push(`${key}=?`)
      values.push(userInfo[key])
    }
  })

  if (fields.length === 0) {
    return { success: false, message: '无可更新字段' }
  }

  const now = new Date()
  fields.push('updated_at=?')
  values.push(now)

  values.push(userId || openid)

  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE ${userId ? 'id' : 'openid'}=?`,
    values
  )

  return { success: true }
}

// 检查 token 有效性
async function checkToken({ token }) {
  if (!token) {
    return { success: false, message: 'Token is required' }
  }

  const now = Date.now()
  const [tokens] = await pool.query(
    'SELECT * FROM user_tokens WHERE token=? AND is_active=1 AND expire_time>? LIMIT 1',
    [token, now]
  )

  if (tokens.length === 0) {
    return { success: false, message: 'Invalid or expired token' }
  }

  const openid = tokens[0].openid
  const [users] = await pool.query('SELECT * FROM users WHERE openid=? LIMIT 1', [openid])

  if (users.length === 0) {
    return { success: false, message: 'User not found' }
  }

  return {
    success: true,
    data: { userInfo: mapUser(users[0]) }
  }
}

// 登出：直接失效 token
async function handleLogout({ token }) {
  if (!token) {
    return { success: false, message: 'Token is required' }
  }

  await pool.query('UPDATE user_tokens SET is_active=0 WHERE token=?', [token])
  return { success: true }
}
