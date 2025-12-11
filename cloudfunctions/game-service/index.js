// 云函数入口文件（改为直连 MySQL 实现游戏记录管理）
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
  // 创建游戏记录表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      game_type VARCHAR(64) NOT NULL,
      score INT DEFAULT 0,
      completion_time INT DEFAULT 0,
      difficulty_level VARCHAR(32) NULL,
      completed_puzzles JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_game_type (game_type),
      INDEX idx_score (score),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建拼图配置表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS puzzle_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(128) NULL,
      difficulty VARCHAR(32) NOT NULL,
      pieces_count INT NOT NULL DEFAULT 4,
      base_image_url TEXT NOT NULL,
      full_image_url TEXT NULL,
      slice_urls JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_difficulty (difficulty)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 创建用户游戏统计表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_game_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      game_type VARCHAR(64) NOT NULL,
      play_count INT DEFAULT 0,
      best_score INT DEFAULT 0,
      total_score INT DEFAULT 0,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY uk_user_game (user_id, game_type),
      INDEX idx_user_id (user_id),
      INDEX idx_game_type (game_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

// 确保表结构完整（检查并添加缺失的字段）
async function ensureTableColumns() {
  const columns = [
    { table: 'game_records', name: 'completion_time', def: 'INT DEFAULT 0' },
    { table: 'game_records', name: 'difficulty_level', def: 'VARCHAR(32) NULL' },
    { table: 'game_records', name: 'completed_puzzles', def: 'JSON NULL' },
    { table: 'puzzle_configs', name: 'full_image_url', def: 'TEXT NULL' },
    { table: 'puzzle_configs', name: 'slice_urls', def: 'JSON NULL' }
  ]

  for (const col of columns) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
        [dbConfig.database, col.table, col.name]
      )
      if (rows[0].cnt === 0) {
        await pool.query(`ALTER TABLE ${col.table} ADD COLUMN ${col.name} ${col.def}`)
        console.log(`Added column ${col.name} to ${col.table}`)
      }
    } catch (e) {
      console.log(`ensureTableColumns skip: ${col.table}.${col.name}`, e.message)
    }
  }
  
  // 迁移旧字段数据（如果存在）
  try {
    // 检查是否存在 duration 字段，如果存在则迁移到 completion_time
    const [durationCheck] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',
      [dbConfig.database, 'game_records', 'duration']
    )
    if (durationCheck[0].cnt > 0) {
      // 迁移数据
      await pool.query(`
        UPDATE game_records 
        SET completion_time = duration 
        WHERE completion_time = 0 AND duration > 0
      `)
      console.log('Migrated duration to completion_time')
    }
  } catch (e) {
    console.log('Migration skip:', e.message)
  }
}

let tablesReady = false
async function ensureTablesOnce() {
  // 每次都检查并更新表结构，确保字段完整
  await ensureTables()
  await ensureTableColumns()
  // 不设置 tablesReady = true，确保每次都能检查字段
}

// 获取游戏列表（暂时返回空，如果需要可以从games表获取）
async function getGameList() {
  try {
    // 如果将来需要从数据库获取游戏列表，可以在这里实现
    return { success: true, data: [] };
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    return {
      success: false,
      message: '获取游戏列表失败',
      error: error.message
    };
  }
}

// 获取拼图配置
async function getPuzzleConfigs({ difficulty = null }) {
  try {
    await ensureTablesOnce();

    let sql = 'SELECT * FROM puzzle_configs';
    const params = [];
    if (difficulty) {
      sql += ' WHERE difficulty = ?';
      params.push(difficulty);
    }
    sql += ' ORDER BY id ASC';

    const [rows] = await pool.query(sql, params);

    // 如果表为空，返回默认两套配置（蜜蜂 / 蚊子）
    const defaults = [
      {
        id: -1,
        name: '蜜蜂拼图',
        difficulty: '简单',
        pieces_count: 4,
        base_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
        full_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
        slice_urls: [
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/1.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/2.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/3.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/4.jpg'
        ]
      },
      {
        id: -2,
        name: '蚊子拼图',
        difficulty: '困难',
        pieces_count: 9,
        base_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/wz.jpg',
        full_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/wz.jpg',
        slice_urls: [
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/1.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/2.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/3.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/4.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/5.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/6.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/7.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/8.jpg',
          'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/9.jpg'
        ]
      }
    ];

    let data = rows;
    if (rows.length === 0) {
      data = defaults.filter(d => !difficulty || d.difficulty === difficulty);
    }

    // 解析 JSON 字段
    const normalized = data.map(r => ({
      ...r,
      slice_urls: typeof r.slice_urls === 'string' ? JSON.parse(r.slice_urls) : r.slice_urls
    }));

    return { success: true, data: normalized };
  } catch (error) {
    console.error('获取拼图配置失败:', error);
    return {
      success: false,
      message: '获取拼图配置失败',
      error: error.message
    };
  }
}

// 获取游戏详情
async function getGameDetail({ gameId }) {
  try {
    if (!gameId) {
      return { success: false, message: '游戏ID不能为空' };
    }
    // 如果将来需要从数据库获取游戏详情，可以在这里实现
    return { success: false, message: '游戏不存在' };
  } catch (error) {
    console.error('获取游戏详情失败:', error);
    return {
      success: false,
      message: '获取游戏详情失败',
      error: error.message
    };
  }
}

// 保存游戏记录
async function saveGameRecord({ userId, gameType, score = 0, completionTime = 0, difficultyLevel = null, completedPuzzles = null }) {
  try {
    await ensureTablesOnce();
    
    // 处理 completed_puzzles：如果是对象或数组，转换为JSON字符串
    let completedPuzzlesJson = null;
    if (completedPuzzles !== null && completedPuzzles !== undefined) {
      if (typeof completedPuzzles === 'string') {
        completedPuzzlesJson = completedPuzzles;
      } else {
        completedPuzzlesJson = JSON.stringify(completedPuzzles);
      }
    }
    
    try {
      const [result] = await pool.query(
        `INSERT INTO game_records 
          (user_id, game_type, score, completion_time, difficulty_level, completed_puzzles, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          gameType || '未知游戏',
          Number(score) || 0,
          Number(completionTime) || 0,
          difficultyLevel || null,
          completedPuzzlesJson
        ]
      );

      // 更新统计（若无文档则新建）
      try {
        await updateGameStats(userId, gameType || '未知游戏', Number(score) || 0);
      } catch (statsError) {
        console.warn('更新游戏统计失败（不影响保存记录）:', statsError);
      }

      return {
        success: true,
        data: { id: result.insertId }
      };
    } catch (insertError) {
      // 如果是因为字段不存在，尝试添加字段后重试
      if (insertError.code === 'ER_BAD_FIELD_ERROR' || insertError.message.includes('Unknown column')) {
        console.warn('检测到字段缺失，尝试添加字段:', insertError.message);
        await ensureTableColumns();
        
        // 重试插入
        const [result] = await pool.query(
          `INSERT INTO game_records 
            (user_id, game_type, score, completion_time, difficulty_level, completed_puzzles, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            gameType || '未知游戏',
            Number(score) || 0,
            Number(completionTime) || 0,
            difficultyLevel || null,
            completedPuzzlesJson
          ]
        );

        // 更新统计
        try {
          await updateGameStats(userId, gameType || '未知游戏', Number(score) || 0);
        } catch (statsError) {
          console.warn('更新游戏统计失败（不影响保存记录）:', statsError);
        }

        return {
          success: true,
          data: { id: result.insertId }
        };
      }
      throw insertError;
    }
  } catch (error) {
    console.error('保存游戏记录失败:', error);
    return {
      success: false,
      message: '保存游戏记录失败',
      error: error.message
    };
  }
}

// 获取游戏记录（按用户、可选游戏类型，按分数排序）
async function getGameRecords({ userId, gameType = null, page = 1, pageSize = 10 }) {
  try {
    await ensureTablesOnce();
    
    let sql = 'SELECT * FROM game_records WHERE user_id = ?';
    const params = [userId];
    
    if (gameType) {
      sql += ' AND game_type = ?';
      params.push(gameType);
    }
    
    // 确保使用 completion_time 字段排序（字段已通过 ensureTableColumns 确保存在）
    sql += ' ORDER BY score DESC, completion_time ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);
    
    let rows;
    try {
      [rows] = await pool.query(sql, params);
    } catch (queryError) {
      // 如果字段不存在，先添加字段后重试
      if (queryError.code === 'ER_BAD_FIELD_ERROR' || queryError.message.includes('Unknown column')) {
        console.warn('检测到字段缺失，尝试添加字段后重试:', queryError.message);
        await ensureTableColumns();
        // 重置 tablesReady 标志，确保下次会重新检查
        tablesReady = false;
        // 重试查询
        [rows] = await pool.query(sql, params);
      } else {
        throw queryError;
      }
    }
    
    const normalized = rows.map(r => {
      // 兼容旧数据：如果 completion_time 为 0 但 duration 存在，使用 duration
      const completionTime = r.completion_time || r.duration || 0;
      
      // 解析 completed_puzzles JSON
      let completedPuzzles = null;
      if (r.completed_puzzles) {
        try {
          completedPuzzles = typeof r.completed_puzzles === 'string' 
            ? JSON.parse(r.completed_puzzles) 
            : r.completed_puzzles;
        } catch (e) {
          console.warn('解析 completed_puzzles 失败:', e);
        }
      }
      
      return {
        id: r.id,
        game_type: r.game_type || '未知游戏',
        score: r.score || 0,
        completion_time: completionTime,
        duration: completionTime, // 保持向后兼容
        difficulty_level: r.difficulty_level,
        completed_puzzles: completedPuzzles,
        created_at: r.created_at
      };
    });

    return {
      success: true,
      data: normalized
    };
  } catch (error) {
    console.error('获取游戏记录失败:', error);
    return {
      success: false,
      message: '获取游戏记录失败',
      error: error.message
    };
  }
}

// 获取游戏排行榜
async function getGameRanking({ gameType = null, gameId = null, type = 'all', timeRange = 'all', limit = 10 }) {
  try {
    await ensureTablesOnce();
    
    let sql = 'SELECT gr.*, u.nickname, u.avatar_url FROM game_records gr';
    sql += ' LEFT JOIN users u ON gr.user_id = u.id';
    const params = [];
    const conditions = [];
    
    if (gameId) {
      conditions.push('gr.game_id = ?');
      params.push(gameId);
    }
    
    if (gameType) {
      conditions.push('gr.game_type = ?');
      params.push(gameType);
    }
    
    // 根据时间范围筛选
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
      
      conditions.push('gr.created_at >= ?');
      params.push(startDate);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY gr.score DESC, gr.completion_time ASC LIMIT ?';
    params.push(limit);
    
    const [rows] = await pool.query(sql, params);
    
    // 处理排行榜数据
    const rankingWithUser = rows.map(record => {
      // 兼容旧数据
      const completionTime = record.completion_time || record.duration || 0;
      
      // 解析 completed_puzzles JSON
      let completedPuzzles = null;
      if (record.completed_puzzles) {
        try {
          completedPuzzles = typeof record.completed_puzzles === 'string' 
            ? JSON.parse(record.completed_puzzles) 
            : record.completed_puzzles;
        } catch (e) {
          console.warn('解析 completed_puzzles 失败:', e);
        }
      }
      
      return {
        id: record.id,
        userId: record.user_id,
        gameType: record.game_type,
        score: record.score,
        completion_time: completionTime,
        duration: completionTime, // 保持向后兼容
        difficulty_level: record.difficulty_level,
        completed_puzzles: completedPuzzles,
        createTime: record.created_at,
        userInfo: {
          nickName: record.nickname || '匿名用户',
          avatarUrl: record.avatar_url || '/images/default_avatar.png'
        }
      };
    });
    
    return { success: true, data: rankingWithUser };
  } catch (error) {
    console.error('获取游戏排行榜失败:', error);
    return {
      success: false,
      message: '获取游戏排行榜失败',
      error: error.message
    };
  }
}

// 更新游戏统计（无则创建）
async function updateGameStats(userId, gameType, score) {
  try {
    await ensureTablesOnce();
    
    // 检查是否存在
    const [existing] = await pool.query(
      'SELECT * FROM user_game_stats WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );

    if (existing.length === 0) {
      // 创建新记录
      await pool.query(
        `INSERT INTO user_game_stats 
          (user_id, game_type, play_count, best_score, total_score, created_at, updated_at)
         VALUES (?, ?, 1, ?, ?, NOW(3), NOW(3))`,
        [userId, gameType, score, score]
      );
    } else {
      // 更新现有记录
      await pool.query(
        `UPDATE user_game_stats 
         SET play_count = play_count + 1,
             best_score = GREATEST(best_score, ?),
             total_score = total_score + ?,
             updated_at = NOW(3)
         WHERE user_id = ? AND game_type = ?`,
        [score, score, userId, gameType]
      );
    }
  } catch (error) {
    console.error('更新游戏统计失败:', error);
    throw error;
  }
}

// 导出云函数
const cloudFunction = {
  // 入口路由
  main: async (event) => {
    const { action, data = {} } = event;

    try {
      // 需要鉴权的 action
      const needAuth = !['getGameList', 'getGameDetail'].includes(action);
      if (needAuth) {
        const authResult = await cloudFunction.checkAuth(data.token);
        if (!authResult.success) {
          return authResult;
        }
        data.userId = authResult.userId;
      }

      const handler = cloudFunction[action];
      if (typeof handler === 'function') {
        return await handler(data);
      }

      return { success: false, message: 'Invalid action' };
    } catch (error) {
      console.error('Game service error:', error);
      return {
        success: false,
        message: error.message || '服务器错误，请稍后重试',
        code: error.code || 'INTERNAL_SERVER_ERROR'
      };
    }
  },

  // 检查用户认证
  checkAuth: async (token) => {
    if (!token) {
      return { success: false, message: '未授权访问', code: 'UNAUTHORIZED' };
    }

    try {
      const result = await cloud.callFunction({
        name: 'user-service',
        data: { action: 'checkToken', data: { token } }
      });

      if (result.result && result.result.success) {
        return {
          success: true,
          userId: result.result.data.userInfo._id
        };
      }

      return {
        success: false,
        message: '登录已过期，请重新登录',
        code: 'TOKEN_EXPIRED'
      };
    } catch (error) {
      console.error('Token验证失败:', error);
      return {
        success: false,
        message: '认证失败，请重新登录',
        code: 'AUTH_FAILED'
      };
    }
  },

  // 将处理函数挂到导出对象
  getGameList,
  getGameDetail,
  saveGameRecord,
  getGameRecords,
  getGameRanking,
  getPuzzleConfigs
};

// 导出云函数
exports.main = cloudFunction.main;
module.exports = cloudFunction;
