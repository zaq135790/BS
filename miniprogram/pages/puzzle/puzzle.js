// pages/puzzle/puzzle.js
Page({
  data: {
    insectId: null,
    difficulty: '简单',
    puzzleConfig: null,
    pieces: [],
    completedPieces: [],
    gameStarted: false,
    gameEnded: false,
    startTime: null,
    completionTime: 0,
    score: 0,
    loading: true,
    showHint: false
  },

  async onLoad(options) {
    const insectId = options.insectId;
    this.setData({ insectId });
    await this.loadPuzzleConfig();
  },

  // 加载拼图配置
  async loadPuzzleConfig() {
    const app = getApp();
    
    try {
      const result = await app.getPuzzleConfigs(this.data.insectId, this.data.difficulty);
      
      if (result.success && result.data.length > 0) {
        this.setData({
          puzzleConfig: result.data[0],
          loading: false
        });
        this.generatePuzzle();
      } else {
        // 使用默认配置
        this.setData({
          puzzleConfig: {
            pieces_count: this.data.difficulty === '简单' ? 9 : this.data.difficulty === '中等' ? 16 : 25,
            base_image_url: '/images/puzzle/default.jpg'
          },
          loading: false
        });
        this.generatePuzzle();
      }
    } catch (error) {
      console.error('加载拼图配置失败:', error);
      this.setData({
        puzzleConfig: {
          pieces_count: 9,
          base_image_url: '/images/puzzle/default.jpg'
        },
        loading: false
      });
      this.generatePuzzle();
    }
  },

  // 生成拼图
  generatePuzzle() {
    const piecesCount = this.data.puzzleConfig.pieces_count;
    const pieces = [];
    
    // 创建拼图块
    for (let i = 0; i < piecesCount; i++) {
      pieces.push({
        id: i,
        position: i, // 正确位置
        currentPosition: i, // 当前位置
        image: this.data.puzzleConfig.base_image_url,
        completed: false
      });
    }
    
    // 打乱顺序
    const shuffledPieces = this.shuffleArray(pieces);
    
    this.setData({
      pieces: shuffledPieces,
      completedPieces: []
    });
  },

  // 数组随机排序
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // 选择难度
  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    this.setData({ difficulty });
    this.loadPuzzleConfig();
  },

  // 开始游戏
  startGame() {
    this.setData({
      gameStarted: true,
      startTime: Date.now(),
      gameEnded: false
    });
  },

  // 点击拼图块
  clickPiece(e) {
    if (!this.data.gameStarted || this.data.gameEnded) return;
    
    const pieceId = e.currentTarget.dataset.id;
    const pieces = this.data.pieces;
    const piece = pieces.find(p => p.id === pieceId);
    
    if (piece.completed) return;
    
    // 检查是否可以放置
    const canPlace = this.checkCanPlace(piece);
    
    if (canPlace) {
      // 放置拼图块
      this.placePiece(piece);
    } else {
      // 显示提示
      wx.showToast({
        title: '这个位置不对哦',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 检查是否可以放置
  checkCanPlace(piece) {
    // 简化逻辑：随机决定是否可以放置
    return Math.random() > 0.3;
  },

  // 放置拼图块
  placePiece(piece) {
    const pieces = this.data.pieces.map(p => {
      if (p.id === piece.id) {
        return { ...p, completed: true };
      }
      return p;
    });
    
    const completedPieces = [...this.data.completedPieces, piece];
    
    this.setData({
      pieces,
      completedPieces
    });
    
    // 检查是否完成
    if (completedPieces.length === this.data.puzzleConfig.pieces_count) {
      this.endGame();
    }
  },

  // 结束游戏
  async endGame() {
    const completionTime = Math.floor((Date.now() - this.data.startTime) / 1000);
    const score = this.calculateScore(completionTime);
    
    this.setData({
      gameEnded: true,
      completionTime,
      score
    });
    
    // 保存游戏记录
    const app = getApp();
    try {
      await app.saveGameRecord({
        userId: app.globalData.userId,
        gameType: '虫虫拼图',
        score: score,
        completionTime: completionTime,
        difficultyLevel: this.data.difficulty,
        completedPuzzles: this.data.completedPieces.map(p => p.id)
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
    
    // 显示结果
    wx.showModal({
      title: '恭喜完成！',
      content: `用时: ${this.formatTime(completionTime)}\n得分: ${score}`,
      showCancel: false,
      confirmText: '再来一局',
      success: (res) => {
        if (res.confirm) {
          this.restartGame();
        }
      }
    });
  },

  // 计算得分
  calculateScore(completionTime) {
    const baseScore = 1000;
    const timeBonus = Math.max(0, 300 - completionTime) * 2;
    const difficultyMultiplier = this.data.difficulty === '简单' ? 1 : this.data.difficulty === '中等' ? 1.5 : 2;
    
    return Math.floor((baseScore + timeBonus) * difficultyMultiplier);
  },

  // 重新开始游戏
  restartGame() {
    this.generatePuzzle();
    this.setData({
      gameStarted: false,
      gameEnded: false,
      startTime: null,
      completionTime: 0,
      score: 0
    });
  },

  // 显示提示
  toggleHint() {
    this.setData({
      showHint: !this.data.showHint
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  }
});

