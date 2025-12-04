Page({
  data: {
    gameType: 'judge', // 默认游戏类型：judge(益害判官) 或 puzzle(虫虫拼图)
    gameRecords: {
      judge: [],
      puzzle: []
    },
    loading: true,
    stats: {
      totalGames: 0,
      correctRate: 0,
      bestScore: 0
    }
  },

  async onLoad() {
    await this.loadGameRecords();
    await this.loadStats();
  },

  // 加载游戏记录
  async loadGameRecords() {
    const app = getApp();
    
    try {
      // 获取益害判官记录
      const judgeResult = await app.getGameRecords('益害判官', 1, 10);
      // 获取拼图游戏记录
      const puzzleResult = await app.getGameRecords('虫虫拼图', 1, 10);
      
      this.setData({
        gameRecords: {
          judge: judgeResult.success ? judgeResult.data : [],
          puzzle: puzzleResult.success ? puzzleResult.data : []
        },
        loading: false
      });
      
    } catch (error) {
      console.error('加载游戏记录失败:', error);
      this.setData({
        loading: false
      });
    }
  },

  // 加载统计数据
  async loadStats() {
    const app = getApp();
    
    try {
      const allRecordsResult = await app.getGameRecords(null, 1, 100);
      
      if (allRecordsResult.success) {
        const records = allRecordsResult.data;
        const totalGames = records.length;
        
        // 计算正确率（针对益害判官游戏）
        const judgeRecords = records.filter(r => r.game_type === '益害判官');
        const correctCount = judgeRecords.filter(r => r.score > 0).length;
        const correctRate = judgeRecords.length > 0 ? Math.round((correctCount / judgeRecords.length) * 100) : 0;
        
        // 计算最高分
        const bestScore = Math.max(...records.map(r => r.score || 0), 0);
        
        this.setData({
          stats: {
            totalGames,
            correctRate,
            bestScore
          }
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 切换游戏类型
  switchGameType(e) {
    const gameType = e.currentTarget.dataset.type;
    this.setData({
      gameType: gameType
    });
  },

  // 开始益害判官游戏
  startJudgeGame() {
    wx.navigateTo({
      url: '/pages/judge/judge'
    });
  },

  // 开始拼图游戏
  startPuzzleGame() {
    wx.navigateTo({
      url: '/pages/puzzle/puzzle'
    });
  },

  // 查看游戏记录详情
  viewGameRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const gameType = e.currentTarget.dataset.gameType;
    
    wx.navigateTo({
      url: `/pages/gameRecord/gameRecord?id=${recordId}&type=${gameType}`
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadGameRecords();
    await this.loadStats();
    wx.stopPullDownRefresh();
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else {
      return Math.floor(diff / 86400000) + '天前';
    }
  },

  // 格式化游戏时长
  formatDuration(seconds) {
    if (!seconds) return '--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  }
});
