// 云函数入口文件（改为直连 MySQL 实现内容管理）
const cloud = require('wx-server-sdk')
const mysql = require('mysql2/promise')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 数据库连接配置（与user-service保持一致）
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

// 初始化数据表
async function ensureTables() {
  // 创建昆虫表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS insects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      alias VARCHAR(255),
      type VARCHAR(32),
      description TEXT,
      status VARCHAR(32) DEFAULT 'published',
      sort INT DEFAULT 0,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_status (status),
      INDEX idx_type (type),
      INDEX idx_sort (sort)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建昆虫浏览记录表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS insect_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      insect_id INT NOT NULL,
      view_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_insect_id (insect_id),
      INDEX idx_view_time (view_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建轮播图表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(128),
      image_url VARCHAR(255),
      link_url VARCHAR(255),
      status VARCHAR(32) DEFAULT 'published',
      sort INT DEFAULT 0,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_status (status),
      INDEX idx_sort (sort)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建文章表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      category VARCHAR(64),
      view_count INT DEFAULT 0,
      status VARCHAR(32) DEFAULT 'published',
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_status (status),
      INDEX idx_category (category),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

let tablesReady = false
async function ensureTablesOnce() {
  if (tablesReady) return
  await ensureTables()
  tablesReady = true
}

exports.main = async (event, context) => {
  const { action, data = {} } = event
  
  try {
    await ensureTablesOnce()
    
    switch (action) {
      case 'getInsectList':
        return await getInsectList(data)
      case 'getInsectDetail':
        return await getInsectDetail(data)
      case 'searchInsects':
        return await searchInsects(data)
      case 'getBannerList':
        return await getBannerList(data)
      case 'getArticleList':
        return await getArticleList(data)
      case 'getArticleDetail':
        return await getArticleDetail(data)
      // 兼容 app.callDatabase 里的其他调用（如用户、视频等），返回占位，避免 FUNCTION_NOT_FOUND
      case 'getUserInfo':
        return { success: false, message: 'getUserInfo 未实现，请补充逻辑' }
      case 'getVideos':
        return { success: false, message: 'getVideos 未实现，请补充逻辑' }
      case 'getVideoById':
        return { success: false, message: 'getVideoById 未实现，请补充逻辑' }
      default:
        return { success: false, message: 'Invalid action' }
    }
  } catch (error) {
    console.error('Content service error:', error)
    return { success: false, message: error.message }
  }
}

// 获取昆虫列表
async function getInsectList({ type, page = 1, pageSize = 10 }) {
  try {
    let sql = 'SELECT * FROM insects WHERE status = ?'
    const params = ['published']
    
    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }
    
    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [countRows] = await pool.query(countSql, params)
    const total = countRows[0].total
    
    // 获取列表
    sql += ' ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?'
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
    return {
      success: false,
      message: '获取昆虫列表失败',
      error: error.message
    }
  }
}

// 获取昆虫详情
async function getInsectDetail({ insectId }) {
  try {
    if (!insectId) {
      return { success: false, message: '昆虫ID不能为空' }
    }
    
    // 增加浏览记录
    await pool.query(
      'INSERT INTO insect_views (insect_id, view_time) VALUES (?, NOW(3))',
      [insectId]
    )
    
    // 获取昆虫详情
    const [rows] = await pool.query('SELECT * FROM insects WHERE id = ?', [insectId])
    
    if (rows.length === 0) {
      return { success: false, message: '昆虫不存在' }
    }
    
    return { success: true, data: rows[0] }
  } catch (error) {
    console.error('获取昆虫详情失败:', error)
    return {
      success: false,
      message: '获取昆虫详情失败',
      error: error.message
    }
  }
}

// 搜索昆虫
async function searchInsects({ keyword, page = 1, pageSize = 10 }) {
  try {
    if (!keyword) {
      return { success: true, data: [] }
    }
    
    const sql = `
      SELECT * FROM insects 
      WHERE status = 'published' 
        AND (name LIKE ? OR alias LIKE ? OR description LIKE ?)
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `
    const searchPattern = `%${keyword}%`
    const [rows] = await pool.query(sql, [
      searchPattern,
      searchPattern,
      searchPattern,
      pageSize,
      (page - 1) * pageSize
    ])
    
    return { success: true, data: rows }
  } catch (error) {
    console.error('搜索昆虫失败:', error)
    return {
      success: false,
      message: '搜索昆虫失败',
      error: error.message
    }
  }
}

// 获取轮播图列表
async function getBannerList() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM banners WHERE status = ? ORDER BY sort ASC, id ASC',
      ['published']
    )
    
    return { success: true, data: rows }
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    return {
      success: false,
      message: '获取轮播图列表失败',
      error: error.message
    }
  }
}

// 获取文章列表
async function getArticleList({ category, page = 1, pageSize = 10 }) {
  try {
    let sql = 'SELECT * FROM articles WHERE status = ?'
    const params = ['published']
    
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    
    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [countRows] = await pool.query(countSql, params)
    const total = countRows[0].total
    
    // 获取列表
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
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
    console.error('获取文章列表失败:', error)
    return {
      success: false,
      message: '获取文章列表失败',
      error: error.message
    }
  }
}

// 获取文章详情
async function getArticleDetail({ articleId }) {
  try {
    if (!articleId) {
      return { success: false, message: '文章ID不能为空' }
    }
    
    // 获取文章详情
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [articleId])
    
    if (rows.length === 0) {
      return { success: false, message: '文章不存在' }
    }
    
    // 增加阅读量
    await pool.query(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = ?',
      [articleId]
    )
    
    // 更新返回数据中的阅读量
    rows[0].view_count = (rows[0].view_count || 0) + 1
    
    return { success: true, data: rows[0] }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return {
      success: false,
      message: '获取文章详情失败',
      error: error.message
    }
  }
}
