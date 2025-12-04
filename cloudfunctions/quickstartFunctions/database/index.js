// 数据库连接云函数
const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

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

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'getInsects':
        return await getInsects(data);
      case 'getInsectById':
        return await getInsectById(data.id);
      case 'getVideos':
        return await getVideos(data);
      case 'getVideoById':
        return await getVideoById(data.id);
      case 'getGameRecords':
        return await getGameRecords(data);
      case 'saveGameRecord':
        return await saveGameRecord(data);
      case 'getObservationRecords':
        return await getObservationRecords(data);
      case 'saveObservationRecord':
        return await saveObservationRecord(data);
      case 'getComments':
        return await getComments(data);
      case 'saveComment':
        return await saveComment(data);
      case 'getLearningProgress':
        return await getLearningProgress(data);
      case 'updateLearningProgress':
        return await updateLearningProgress(data);
      case 'getJudgeRecords':
        return await getJudgeRecords(data);
      case 'saveJudgeRecord':
        return await saveJudgeRecord(data);
      case 'getPuzzleConfigs':
        return await getPuzzleConfigs(data);
      case 'getUserInfo':
        return await getUserInfo(data);
      case 'saveUserInfo':
        return await saveUserInfo(data);
      case 'checkCheckin':
        return await checkCheckin(data);
      case 'saveCheckin':
        return await saveCheckin(data);
      case 'getCheckinDays':
        return await getCheckinDays(data);
      default:
        return {
          success: false,
          message: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('数据库操作错误:', error);
    return {
      success: false,
      message: '数据库操作失败',
      error: error.message
    };
  }
};

// 获取昆虫列表
async function getInsects(data) {
  const { type, page = 1, limit = 20 } = data;
  const offset = (page - 1) * limit;
  
  let sql = 'SELECT * FROM insects WHERE 1=1';
  const params = [];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [rows] = await pool.execute(sql, params);
  
  return {
    success: true,
    data: rows,
    total: rows.length
  };
}

// 根据ID获取昆虫详情
async function getInsectById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM insects WHERE id = ?',
    [id]
  );
  
  return {
    success: true,
    data: rows[0] || null
  };
}

// 获取视频列表
async function getVideos(data) {
  const { insectId, page = 1, limit = 20 } = data;
  const offset = (page - 1) * limit;
  
  let sql = 'SELECT v.*, i.name as insect_name FROM videos v LEFT JOIN insects i ON v.insect_id = i.id WHERE 1=1';
  const params = [];
  
  if (insectId) {
    sql += ' AND v.insect_id = ?';
    params.push(insectId);
  }
  
  sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [rows] = await pool.execute(sql, params);
  
  return {
    success: true,
    data: rows,
    total: rows.length
  };
}

// 根据ID获取视频详情
async function getVideoById(id) {
  const [rows] = await pool.execute(
    'SELECT v.*, i.name as insect_name FROM videos v LEFT JOIN insects i ON v.insect_id = i.id WHERE v.id = ?',
    [id]
  );
  
  return {
    success: true,
    data: rows[0] || null
  };
}

// 获取游戏记录
async function getGameRecords(data) {
  const { userId, gameType, page = 1, limit = 20 } = data;
  const offset = (page - 1) * limit;
  
  let sql = 'SELECT * FROM game_records WHERE 1=1';
  const params = [];
  
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }
  
  if (gameType) {
    sql += ' AND game_type = ?';
    params.push(gameType);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [rows] = await pool.execute(sql, params);
  
  return {
    success: true,
    data: rows,
    total: rows.length
  };
}

// 保存游戏记录
async function saveGameRecord(data) {
  const { userId, gameType, score, completionTime, difficultyLevel, completedPuzzles } = data;
  
  const [result] = await pool.execute(
    'INSERT INTO game_records (user_id, game_type, score, completion_time, difficulty_level, completed_puzzles) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, gameType, score, completionTime, difficultyLevel, JSON.stringify(completedPuzzles)]
  );
  
  return {
    success: true,
    data: { id: result.insertId }
  };
}

// 获取观察记录
async function getObservationRecords(data) {
  const { userId, insectId, page = 1, limit = 20 } = data;
  const offset = (page - 1) * limit;
  
  let sql = 'SELECT o.*, i.name as insect_name, u.nickname FROM observation_records o LEFT JOIN insects i ON o.insect_id = i.id LEFT JOIN users u ON o.user_id = u.id WHERE 1=1';
  const params = [];
  
  if (userId) {
    sql += ' AND o.user_id = ?';
    params.push(userId);
  }
  
  if (insectId) {
    sql += ' AND o.insect_id = ?';
    params.push(insectId);
  }
  
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [rows] = await pool.execute(sql, params);
  
  return {
    success: true,
    data: rows,
    total: rows.length
  };
}

// 保存观察记录
async function saveObservationRecord(data) {
  const { userId, insectId, observationLocation, observationTime, photoUrl, notes } = data;
  
  const [result] = await pool.execute(
    'INSERT INTO observation_records (user_id, insect_id, observation_location, observation_time, photo_url, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, insectId, observationLocation, observationTime, photoUrl, notes]
  );
  
  return {
    success: true,
    data: { id: result.insertId }
  };
}

// 获取评论
async function getComments(data) {
  const { observationId, page = 1, limit = 20 } = data;
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.execute(
    'SELECT c.*, u.nickname FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.observation_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?',
    [observationId, limit, offset]
  );
  
  return {
    success: true,
    data: rows,
    total: rows.length
  };
}

// 保存评论
async function saveComment(data) {
  const { observationId, userId, content, parentId } = data;
  
  const [result] = await pool.execute(
    'INSERT INTO comments (observation_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
    [observationId, userId, content, parentId]
  );
  
  return {
    success: true,
    data: { id: result.insertId }
  };
}

// 获取学习进度
async function getLearningProgress(data) {
  const { userId, insectId } = data;
  
  let sql = 'SELECT * FROM learning_progress WHERE 1=1';
  const params = [];
  
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }
  
  if (insectId) {
    sql += ' AND insect_id = ?';
    params.push(insectId);
  }
  
  const [rows] = await pool.execute(sql, params);
  
  return {
    success: true,
    data: rows
  };
}

// 更新学习进度
async function updateLearningProgress(data) {
  const { userId, insectId, hasLearned, learnedTimes, quizScore } = data;
  
  // 检查是否已存在记录
  const [existing] = await pool.execute(
    'SELECT id FROM learning_progress WHERE user_id = ? AND insect_id = ?',
    [userId, insectId]
  );
  
  if (existing.length > 0) {
    // 更新现有记录
    const [result] = await pool.execute(
      'UPDATE learning_progress SET has_learned = ?, learned_times = ?, last_learned_at = NOW(), quiz_score = ?, updated_at = NOW() WHERE user_id = ? AND insect_id = ?',
      [hasLearned, learnedTimes, quizScore, userId, insectId]
    );
    
    return {
      success: true,
      data: { id: existing[0].id, updated: true }
    };
  } else {
    // 创建新记录
    const [result] = await pool.execute(
      'INSERT INTO learning_progress (user_id, insect_id, has_learned, learned_times, last_learned_at, quiz_score) VALUES (?, ?, ?, ?, NOW(), ?)',
      [userId, insectId, hasLearned, learnedTimes, quizScore]
    );
    
    return {
      success: true,
      data: { id: result.insertId, updated: false }
    };
  }
}

// 获取判断记录
async function getJudgeRecords(data) {
  const { userId, page = 1, limit = 20 } = data;
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.execute(
    'SELECT j.*, i.name as insect_name, i.type as correct_type FROM judge_records j LEFT JOIN insects i ON j.insect_id = i.id WHERE j.user_id = ? ORDER BY j.created_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  );
  
  return {
    success: true,
    data: rows,
    total: rows.length
  };
}

// 保存判断记录
async function saveJudgeRecord(data) {
  const { userId, insectId, userJudgment, isCorrect, responseTime } = data;
  
  const [result] = await pool.execute(
    'INSERT INTO judge_records (user_id, insect_id, user_judgment, is_correct, response_time) VALUES (?, ?, ?, ?, ?)',
    [userId, insectId, userJudgment, isCorrect, responseTime]
  );
  
  return {
    success: true,
    data: { id: result.insertId }
  };
}

// 获取拼图配置
async function getPuzzleConfigs(data) {
  const { insectId, difficulty } = data;
  
  let sql = 'SELECT * FROM puzzle_configs WHERE 1=1';
  const params = [];
  
  if (insectId) {
    sql += ' AND insect_id = ?';
    params.push(insectId);
  }
  
  if (difficulty) {
    sql += ' AND difficulty = ?';
    params.push(difficulty);
  }
  
  const [rows] = await pool.execute(sql, params);
  
  return {
    success: true,
    data: rows
  };
}

// 获取用户信息
async function getUserInfo(data) {
  const { openid } = data;
  
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE openid = ?',
    [openid]
  );
  
  return {
    success: true,
    data: rows[0] || null
  };
}

// 保存用户信息
async function saveUserInfo(data) {
  const { openid, nickname, avatarUrl, userType } = data;
  
  // 检查用户是否已存在
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE openid = ?',
    [openid]
  );
  
  if (existing.length > 0) {
    // 更新现有用户
    const [result] = await pool.execute(
      'UPDATE users SET nickname = ?, avatar_url = ?, user_type = ? WHERE openid = ?',
      [nickname, avatarUrl, userType, openid]
    );
    
    return {
      success: true,
      data: { id: existing[0].id, updated: true }
    };
  } else {
    // 创建新用户
    const [result] = await pool.execute(
      'INSERT INTO users (openid, nickname, avatar_url, user_type) VALUES (?, ?, ?, ?)',
      [openid, nickname, avatarUrl, userType]
    );
    
    return {
      success: true,
      data: { id: result.insertId, updated: false }
    };
  }
}

// 检查今天是否已打卡
async function checkCheckin(data) {
  const { userId, date } = data;
  
  try {
    // 尝试查询checkin_records表（如果存在）
    const [rows] = await pool.execute(
      'SELECT * FROM checkin_records WHERE user_id = ? AND checkin_date = ?',
      [userId, date]
    );
    
    return {
      success: true,
      checked: rows.length > 0
    };
  } catch (error) {
    // 如果表不存在，返回未打卡状态
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return {
        success: true,
        checked: false
      };
    }
    throw error;
  }
}

// 保存打卡记录
async function saveCheckin(data) {
  const { userId, date } = data;
  
  try {
    // 先检查今天是否已打卡
    const checkResult = await checkCheckin(data);
    if (checkResult.checked) {
      return {
        success: false,
        message: '今天已打卡'
      };
    }
    
    // 尝试插入打卡记录（如果表存在）
    const [result] = await pool.execute(
      'INSERT INTO checkin_records (user_id, checkin_date, created_at) VALUES (?, ?, NOW())',
      [userId, date]
    );
    
    return {
      success: true,
      data: { id: result.insertId }
    };
  } catch (error) {
    // 如果表不存在，返回成功（前端会使用本地存储）
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return {
        success: true,
        data: { id: null },
        message: '使用本地存储'
      };
    }
    throw error;
  }
}

// 获取打卡天数
async function getCheckinDays(data) {
  const { userId } = data;
  
  try {
    // 尝试查询打卡记录数（如果表存在）
    const [rows] = await pool.execute(
      'SELECT COUNT(DISTINCT checkin_date) as days FROM checkin_records WHERE user_id = ?',
      [userId]
    );
    
    return {
      success: true,
      days: rows[0]?.days || 0
    };
  } catch (error) {
    // 如果表不存在，返回0（前端会从本地存储计算）
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return {
        success: true,
        days: 0
      };
    }
    throw error;
  }
}


