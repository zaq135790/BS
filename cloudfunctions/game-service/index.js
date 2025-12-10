 // 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
  }
};

// 导出云函数
module.exports = cloudFunction;

// 获取游戏列表
async function getGameList() {
  const games = await db.collection('games')
    .where({ status: 'published' })
    .orderBy('sort', 'asc')
    .get()
  return { success: true, data: games.data }
}

// 获取游戏详情
async function getGameDetail({ gameId }) {
  const game = await db.collection('games').doc(gameId).get()
  return { success: true, data: game.data }
}

// 保存游戏记录
async function saveGameRecord({ userId, gameType, gameId = null, score = 0, duration = 0, details = {} }) {
  try {
    const now = db.serverDate();
    const record = {
      userId,
      gameType: gameType || '未知游戏',
      gameId: gameId || '',
      score: Number(score) || 0,
      duration: Number(duration) || 0,
      details: details || {},
      createTime: now,
      updateTime: now
    };

    const result = await db.collection('game_records').add({ data: record });

    // 更新统计（若无文档则新建）
    await updateGameStats(userId, record.gameType, record.score);

    return {
      success: true,
      data: { id: result._id }
    };
  } catch (error) {
    console.error('保存游戏记录失败:', error);
    return {
      success: false,
      message: '保存游戏记录失败',
      error: error.message
    };
  }
}

// 获取游戏记录（按用户、可选游戏类型）
async function getGameRecords({ userId, gameType = null, page = 1, pageSize = 10 }) {
  const query = { userId };
  if (gameType) query.gameType = gameType;

  try {
    const records = await db.collection('game_records')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const normalized = records.data.map(r => ({
      id: r._id,
      game_type: r.gameType || r.gameId || '未知游戏',
      score: r.score || 0,
      duration: r.duration || 0,
      details: r.details || {},
      created_at: r.createTime
    }));

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
  // 构建查询条件
  const query = {};
  if (gameId) query.gameId = gameId;
  if (gameType) query.gameType = gameType;
  
  // 根据类型筛选
  if (type !== 'all') {
    query.type = type;
  }
  
  // 根据时间范围筛选
  if (timeRange !== 'all') {
    const now = new Date();
    const startDate = new Date();
    
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
    
    query.createTime = db.command.gte(startDate);
  }
  
  // 获取排行榜数据
  const ranking = await db.collection('game_records')
    .where(query)
    .orderBy('score', 'desc')
    .orderBy('duration', 'asc')
    .limit(limit)
    .get();
    
  // 获取用户信息
  const userIds = [...new Set(ranking.data.map(item => item.userId))];
  let users = [];
  
  if (userIds.length > 0) {
    const userResult = await db.collection('users')
      .where({
        _id: db.command.in(userIds)
      })
      .get();
    users = userResult.data;
  }
  
  const userMap = {};
  users.forEach(user => {
    userMap[user._id] = user;
  });
  
  // 处理排行榜数据
  const rankingWithUser = ranking.data.map(record => ({
    ...record,
    userInfo: userMap[record.userId] || {
      nickName: '匿名用户',
      avatarUrl: '/images/default_avatar.png'
    }
  }));
  
  return { success: true, data: rankingWithUser };
}

// 检查并解锁成就
async function checkAndUnlockAchievements(userId, gameId, score, transaction) {
  // 获取用户当前成就
  const userAchievements = await transaction.collection('user_achievements')
    .where({ userId })
    .get();
    
  // 获取游戏所有成就
  const achievements = await transaction.collection('achievements')
    .where({ gameId, isActive: true })
    .get();
    
  // 获取用户游戏统计
  const stats = await transaction.collection('user_game_stats')
    .where({ userId, gameId })
    .get();
    
  if (stats.data.length === 0) return;
    
  const userStats = stats.data[0];
  const unlockedAchievements = userAchievements.data.map(ua => ua.achievementId);
  
  // 检查每个成就条件
  for (const achievement of achievements.data) {
    // 如果已经解锁则跳过
    if (unlockedAchievements.includes(achievement._id)) continue;
    
    let isUnlocked = false;
    
    // 根据成就类型检查条件
    switch (achievement.type) {
      case 'score':
        isUnlocked = userStats.bestScore >= achievement.condition.value;
        break;
      case 'games_played':
        isUnlocked = userStats.totalGames >= achievement.condition.value;
        break;
      case 'total_score':
        isUnlocked = userStats.totalScore >= achievement.condition.value;
        break;
      case 'perfect_game':
        isUnlocked = score === achievement.condition.value;
        break;
    }
    
    // 如果满足条件，解锁成就
    if (isUnlocked) {
      await transaction.collection('user_achievements').add({
        data: {
          userId,
          gameId,
          achievementId: achievement._id,
          unlockTime: db.serverDate(),
          createTime: db.serverDate()
        }
      });
    }
  }
}

// 更新游戏统计（无则创建）
async function updateGameStats(userId, gameType, score) {
  const _ = db.command;
  const statsColl = db.collection('user_game_stats');
  const now = db.serverDate();

  const existing = await statsColl.where({ userId, gameType }).get();

  if (!existing.data.length) {
    await statsColl.add({
      data: {
        userId,
        gameType,
        playCount: 1,
        bestScore: score,
        totalScore: score,
        createTime: now,
        updateTime: now
      }
    });
  } else {
    await statsColl.doc(existing.data[0]._id).update({
      data: {
        playCount: _.inc(1),
        bestScore: _.max(score),
        totalScore: _.inc(score),
        updateTime: now
      }
    });
  }
}

// 将处理函数挂到导出对象
cloudFunction.getGameList = getGameList;
cloudFunction.getGameDetail = getGameDetail;
cloudFunction.saveGameRecord = saveGameRecord;
cloudFunction.getGameRecords = getGameRecords;
cloudFunction.getGameRanking = getGameRanking;
