// 云函数入口文件（改为直连 MySQL 实现社交功能）
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
  // 创建帖子表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      images JSON NULL,
      like_count INT DEFAULT 0,
      comment_count INT DEFAULT 0,
      view_count INT DEFAULT 0,
      status VARCHAR(32) DEFAULT 'published',
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_like_count (like_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建帖子浏览记录表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT,
      view_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_post_id (post_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建帖子点赞表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uk_post_user (post_id, user_id),
      INDEX idx_post_id (post_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建评论表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      reply_to INT NULL,
      status VARCHAR(32) DEFAULT 'published',
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_post_id (post_id),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
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
      case 'createPost':
        return await createPost(data)
      case 'getPostList':
        return await getPostList(data)
      case 'getPostDetail':
        return await getPostDetail(data)
      case 'createComment':
        return await createComment(data)
      case 'likePost':
        return await likePost(data)
      case 'getUserPosts':
        return await getUserPosts(data)
      default:
        return { success: false, message: 'Invalid action' }
    }
  } catch (error) {
    console.error('Social service error:', error)
    return { success: false, message: error.message }
  }
}

// 创建帖子
async function createPost({ userId, content, images = [] }) {
  try {
    const imagesJson = JSON.stringify(images || [])
    const now = new Date()
    
    const [result] = await pool.query(
      `INSERT INTO posts (user_id, content, images, like_count, comment_count, view_count, status, created_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 0, 'published', ?, ?)`,
      [userId, content, imagesJson, now, now]
    )
    
    return { success: true, data: { postId: result.insertId } }
  } catch (error) {
    console.error('创建帖子失败:', error)
    return {
      success: false,
      message: '创建帖子失败',
      error: error.message
    }
  }
}

// 获取帖子列表
async function getPostList({ page = 1, pageSize = 10, sort = 'latest' }) {
  try {
    let orderBy = 'created_at DESC'
    if (sort === 'hottest') {
      orderBy = 'like_count DESC'
    }
    
    // 获取总数
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM posts WHERE status = ?',
      ['published']
    )
    const total = countRows[0].total
    
    // 获取帖子列表
    const [posts] = await pool.query(
      `SELECT * FROM posts 
       WHERE status = ? 
       ORDER BY ${orderBy} 
       LIMIT ? OFFSET ?`,
      ['published', pageSize, (page - 1) * pageSize]
    )
    
    // 获取用户信息
    const userIds = [...new Set(posts.map(p => p.user_id))]
    let users = []
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      const [userRows] = await pool.query(
        `SELECT id, nickname, avatar_url FROM users WHERE id IN (${placeholders})`,
        userIds
      )
      users = userRows
    }
    
    const userMap = users.reduce((map, user) => {
      map[user.id] = {
        _id: user.id,
        nickName: user.nickname || '未知用户',
        avatarUrl: user.avatar_url || ''
      }
      return map
    }, {})
    
    // 组合数据
    const postList = posts.map(post => ({
      _id: post.id,
      userId: post.user_id,
      content: post.content,
      images: post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : [],
      likeCount: post.like_count,
      commentCount: post.comment_count,
      viewCount: post.view_count,
      status: post.status,
      createTime: post.created_at,
      updateTime: post.updated_at,
      user: userMap[post.user_id] || { nickName: '未知用户' }
    }))
    
    return {
      success: true,
      data: {
        list: postList,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    return {
      success: false,
      message: '获取帖子列表失败',
      error: error.message
    }
  }
}

// 获取帖子详情
async function getPostDetail({ postId, userId }) {
  try {
    if (!postId) {
      return { success: false, message: '帖子ID不能为空' }
    }
    
    // 增加浏览记录
    if (userId) {
      await pool.query(
        'INSERT INTO post_views (post_id, user_id, view_time) VALUES (?, ?, NOW(3))',
        [postId, userId]
      )
    }
    
    // 更新浏览数
    await pool.query(
      'UPDATE posts SET view_count = view_count + 1 WHERE id = ?',
      [postId]
    )
    
    // 获取帖子详情
    const [postRows] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId])
    if (postRows.length === 0) {
      return { success: false, message: '帖子不存在' }
    }
    
    const post = postRows[0]
    
    // 获取用户信息
    const [userRows] = await pool.query('SELECT id, nickname, avatar_url FROM users WHERE id = ?', [post.user_id])
    const user = userRows.length > 0 ? {
      _id: userRows[0].id,
      nickName: userRows[0].nickname || '未知用户',
      avatarUrl: userRows[0].avatar_url || ''
    } : { nickName: '未知用户' }
    
    // 获取评论
    const [comments] = await pool.query(
      `SELECT * FROM comments 
       WHERE post_id = ? AND status = 'published' 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [postId]
    )
    
    // 获取评论用户信息
    const commentUserIds = [...new Set(comments.map(c => c.user_id))]
    let commentUsers = []
    if (commentUserIds.length > 0) {
      const placeholders = commentUserIds.map(() => '?').join(',')
      const [commentUserRows] = await pool.query(
        `SELECT id, nickname, avatar_url FROM users WHERE id IN (${placeholders})`,
        commentUserIds
      )
      commentUsers = commentUserRows
    }
    
    const commentUserMap = commentUsers.reduce((map, user) => {
      map[user.id] = {
        _id: user.id,
        nickName: user.nickname || '未知用户',
        avatarUrl: user.avatar_url || ''
      }
      return map
    }, {})
    
    // 组合评论数据
    const commentList = comments.map(comment => ({
      _id: comment.id,
      userId: comment.user_id,
      postId: comment.post_id,
      content: comment.content,
      replyTo: comment.reply_to,
      status: comment.status,
      createTime: comment.created_at,
      user: commentUserMap[comment.user_id] || { nickName: '未知用户' }
    }))
    
    // 检查当前用户是否点赞
    let isLiked = false
    if (userId) {
      const [likeRows] = await pool.query(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      )
      isLiked = likeRows.length > 0
    }
    
    return {
      success: true,
      data: {
        _id: post.id,
        userId: post.user_id,
        content: post.content,
        images: post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : [],
        likeCount: post.like_count,
        commentCount: post.comment_count,
        viewCount: post.view_count + 1, // 已更新
        status: post.status,
        createTime: post.created_at,
        updateTime: post.updated_at,
        user,
        comments: commentList,
        isLiked
      }
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    return {
      success: false,
      message: '获取帖子详情失败',
      error: error.message
    }
  }
}

// 创建评论
async function createComment({ userId, postId, content, replyTo = null }) {
  try {
    const now = new Date()
    
    const [result] = await pool.query(
      `INSERT INTO comments (post_id, user_id, content, reply_to, status, created_at)
       VALUES (?, ?, ?, ?, 'published', ?)`,
      [postId, userId, content, replyTo, now]
    )
    
    // 更新帖子评论数
    await pool.query(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?',
      [postId]
    )
    
    return { success: true, data: { commentId: result.insertId } }
  } catch (error) {
    console.error('创建评论失败:', error)
    return {
      success: false,
      message: '创建评论失败',
      error: error.message
    }
  }
}

// 点赞/取消点赞
async function likePost({ userId, postId }) {
  try {
    if (!userId || !postId) {
      return { success: false, message: '用户ID和帖子ID不能为空' }
    }
    
    // 检查是否已点赞
    const [likeRows] = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    )
    
    if (likeRows.length > 0) {
      // 取消点赞
      await pool.query(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      )
      await pool.query(
        'UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
        [postId]
      )
      return { success: true, data: { isLiked: false } }
    } else {
      // 点赞
      await pool.query(
        'INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW(3))',
        [postId, userId]
      )
      await pool.query(
        'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
        [postId]
      )
      return { success: true, data: { isLiked: true } }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    return {
      success: false,
      message: '点赞操作失败',
      error: error.message
    }
  }
}

// 获取用户帖子
async function getUserPosts({ userId, page = 1, pageSize = 10 }) {
  try {
    if (!userId) {
      return { success: false, message: '用户ID不能为空' }
    }
    
    // 获取总数
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND status = ?',
      [userId, 'published']
    )
    const total = countRows[0].total
    
    // 获取帖子列表
    const [posts] = await pool.query(
      `SELECT * FROM posts 
       WHERE user_id = ? AND status = 'published' 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, (page - 1) * pageSize]
    )
    
    const postList = posts.map(post => ({
      _id: post.id,
      userId: post.user_id,
      content: post.content,
      images: post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : [],
      likeCount: post.like_count,
      commentCount: post.comment_count,
      viewCount: post.view_count,
      status: post.status,
      createTime: post.created_at,
      updateTime: post.updated_at
    }))
    
    return {
      success: true,
      data: {
        list: postList,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    }
  } catch (error) {
    console.error('获取用户帖子失败:', error)
    return {
      success: false,
      message: '获取用户帖子失败',
      error: error.message
    }
  }
}
