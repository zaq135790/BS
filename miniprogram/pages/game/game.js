Page({
  data: {
    gameType: 'judge', // 默认游戏类型：judge(益害判官) 或 puzzle(虫虫拼图)
    gameRecords: {
      judge: [],
      puzzle: []
    },
    loading: true,
    refreshing: false,
    stats: {
      judge: {
        totalGames: 0,
        correctRate: 0,
        bestScore: 0
      },
      puzzle: {
        totalGames: 0,
        correctRate: 0,
        bestScore: 0
      }
    },
    timeUpdateTimer: null // 时间更新定时器
  },

  async onLoad() {
    await this.loadGameRecords();
    await this.loadStats();
    this.startTimeUpdate();
  },

  async onShow() {
    // 返回页面时刷新记录与统计，确保能看到最新成绩
    await this.loadGameRecords();
    await this.loadStats();
    this.startTimeUpdate();
  },

  onUnload() {
    // 清除定时器
    if (this.data.timeUpdateTimer) {
      clearInterval(this.data.timeUpdateTimer);
    }
  },

  // 加载游戏记录
  async loadGameRecords() {
    const app = getApp();
    this.setData({ loading: true });
    try {
      const sortRecords = (records) => {
        return [...records].sort((a, b) => {
          const tA = new Date(a.created_at || a.createdAt || a.createdTime || 0).getTime();
          const tB = new Date(b.created_at || b.createdAt || b.createdTime || 0).getTime();
          return tB - tA;
        });
      };

      // 获取益害判官记录
      const judgeResult = await app.getGameRecords('益害判官', 1, 10);
      // 获取拼图游戏记录
      const puzzleResult = await app.getGameRecords('虫虫拼图', 1, 10);
      
      // 格式化时间
      const formatRecords = (records) => {
        return records.map(record => ({
          ...record,
          formattedTime: this.formatTime(record.created_at),
          formattedDuration: this.formatDuration(record.completion_time || record.duration),
          created_at: record.created_at, // 保留原始时间戳用于后续更新
          reportAvailable: !!record.completed_puzzles // 益害判官的报告标记
        }));
      };
      
      this.setData({
        gameRecords: {
          judge: judgeResult.success ? sortRecords(formatRecords(judgeResult.data)) : [],
          puzzle: puzzleResult.success ? sortRecords(formatRecords(puzzleResult.data)) : []
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
        const records = allRecordsResult.data || [];
        
        const judgeRecords = records.filter(r => r.game_type === '益害判官');
        const puzzleRecords = records.filter(r => r.game_type === '虫虫拼图');

        // 益害小判官统计
        const judgeTotal = judgeRecords.length;
        const judgeCorrectCount = judgeRecords.filter(r => r.score > 0).length;
        const judgeCorrectRate = judgeTotal > 0 ? Math.round((judgeCorrectCount / judgeTotal) * 100) : 0;
        const judgeBestScore = judgeTotal > 0 ? Math.max(...judgeRecords.map(r => r.score || 0)) : 0;

        // 虫虫拼图统计（这里用完成局数和最高得分）
        const puzzleTotal = puzzleRecords.length;
        const puzzleCorrectRate = puzzleTotal > 0 ? 100 : 0; // 拼图只记录完成局，视为100%完成率
        const puzzleBestScore = puzzleTotal > 0 ? Math.max(...puzzleRecords.map(r => r.score || 0)) : 0;
        
        this.setData({
          stats: {
            judge: {
              totalGames: judgeTotal,
              correctRate: judgeCorrectRate,
              bestScore: judgeBestScore
            },
            puzzle: {
              totalGames: puzzleTotal,
              correctRate: puzzleCorrectRate,
              bestScore: puzzleBestScore
            }
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
    const record = this.data.gameRecords[this.data.gameType].find(r => r.id == recordId);
    
    // 如果是益害判官游戏，跳转到judge页面显示报告
    if (gameType === '益害判官') {
      wx.navigateTo({
        url: `/pages/judge/judge?fromRecord=true&recordId=${recordId}`
      });
    } else {
      // 其他游戏类型，跳转到详情页
      wx.navigateTo({
        url: `/pages/gameRecord/gameRecord?id=${recordId}&type=${gameType}`
      });
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    wx.showNavigationBarLoading();
    this.setData({ refreshing: true, loading: true });
    await this.loadGameRecords();
    await this.loadStats();
    this.setData({ refreshing: false });
    wx.hideNavigationBarLoading();
    wx.stopPullDownRefresh();
  },

  // 手动刷新
  async manualRefresh() {
    if (this.data.refreshing) return;
    this.setData({ refreshing: true });
    await this.loadGameRecords();
    await this.loadStats();
    this.setData({ refreshing: false });
    wx.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
    });
  },

  // 开始时间更新定时器（每分钟更新一次）
  startTimeUpdate() {
    // 清除旧的定时器
    if (this.data.timeUpdateTimer) {
      clearInterval(this.data.timeUpdateTimer);
    }
    
    // 设置新的定时器，每分钟更新一次
    const timer = setInterval(() => {
      this.updateTimeDisplay();
    }, 60000); // 60000毫秒 = 1分钟
    
    this.setData({
      timeUpdateTimer: timer
    });
  },

  // 更新时间显示
  updateTimeDisplay() {
    const formatRecords = (records) => {
      return records.map(record => ({
        ...record,
        formattedTime: this.formatTime(record.created_at),
        formattedDuration: this.formatDuration(record.completion_time || record.duration)
      }));
    };
    
    // 更新当前显示的游戏类型的记录时间
    const currentRecords = this.data.gameRecords[this.data.gameType];
    const updatedRecords = formatRecords(currentRecords);
    
    this.setData({
      [`gameRecords.${this.data.gameType}`]: updatedRecords
    });
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
