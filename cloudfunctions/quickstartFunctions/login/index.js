// 云函数入口文件
const cloud = require('wx-server-sdk')
const mysql = require('mysql2/promise')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456', // 请替换为实际密码
  database: 'insect_detective_db',
  charset: 'utf8mb3'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  
  try {
    const openid = wxContext.OPENID
    
    // 检查用户是否已存在
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    )
    
    if (existing.length > 0) {
      // 用户已存在，更新信息
      if (userInfo) {
        await pool.execute(
          'UPDATE users SET nickname = ?, avatar_url = ? WHERE openid = ?',
          [userInfo.nickName, userInfo.avatarUrl, openid]
        )
      }
      
      return {
        success: true,
        openid: openid,
        userInfo: existing[0],
        isNewUser: false
      }
    } else {
      // 新用户，创建记录
      const [result] = await pool.execute(
        'INSERT INTO users (openid, nickname, avatar_url, user_type) VALUES (?, ?, ?, ?)',
        [
          openid,
          userInfo ? userInfo.nickName : '新用户',
          userInfo ? userInfo.avatarUrl : '',
          'parent' // 默认为家长用户
        ]
      )
      
      const newUser = {
        id: result.insertId,
        openid: openid,
        nickname: userInfo ? userInfo.nickName : '新用户',
        avatar_url: userInfo ? userInfo.avatarUrl : '',
        user_type: 'parent'
      }
      
      return {
        success: true,
        openid: openid,
        userInfo: newUser,
        isNewUser: true
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID
    }
  }
}