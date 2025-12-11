// pages/judge/judge.js
Page({
  data: {
    insects: [],
    currentInsect: null,
    currentIndex: 0,
    score: 0,
    totalQuestions: 10,
    answeredQuestions: 0,
    gameStarted: false,
    gameEnded: false,
    userAnswer: null,
    showResult: false,
    correctAnswer: null,
    startTime: null,
    questionStartTime: null,
    responseTime: 0,
    formattedResponseTime: '',
    accuracy: 0,
    loading: true,
    // 保存所有题目的答题记录
    answerRecords: []
  },

  async onLoad(options) {
    await this.loadInsects();
  },

  // 加载昆虫数据
  async loadInsects() {
    const app = getApp();
    
    try {
      // 获取所有昆虫数据
      const result = await app.getInsects(null, 1, 50);
      
      if (result.success) {
        // 随机选择10个昆虫
        const allInsects = result.data;
        const shuffled = this.shuffleArray(allInsects);
        const selectedInsects = shuffled.slice(0, this.data.totalQuestions);
        
        this.setData({
          insects: selectedInsects,
          currentInsect: selectedInsects[0],
          loading: false
        });
      } else {
        // 使用模拟数据
        this.setData({
          insects: this.getMockInsects(),
          currentInsect: this.getMockInsects()[0],
          loading: false
        });
      }
    } catch (error) {
      console.error('加载昆虫数据失败:', error);
      this.setData({
        insects: this.getMockInsects(),
        currentInsect: this.getMockInsects()[0],
        loading: false
      });
    }
  },

  // 模拟昆虫数据
  getMockInsects() {
    return [
      { id: 1, name: '蜜蜂', type: '益虫', child_image_url: '/images/insects/bee.jpg' },
      { id: 2, name: '七星瓢虫', type: '益虫', child_image_url: '/images/insects/ladybug.jpg' },
      { id: 3, name: '螳螂', type: '益虫', child_image_url: '/images/insects/mantis.jpg' },
      { id: 4, name: '蚊子', type: '害虫', child_image_url: '/images/insects/mosquito.jpg' },
      { id: 5, name: '蚜虫', type: '害虫', child_image_url: '/images/insects/aphid.jpg' },
      { id: 6, name: '蜻蜓', type: '益虫', child_image_url: '/images/insects/dragonfly.jpg' },
      { id: 7, name: '蟑螂', type: '害虫', child_image_url: '/images/insects/cockroach.jpg' },
      { id: 8, name: '蚯蚓', type: '益虫', child_image_url: '/images/insects/earthworm.jpg' },
      { id: 9, name: '苍蝇', type: '害虫', child_image_url: '/images/insects/fly.jpg' },
      { id: 10, name: '蝴蝶', type: '益虫', child_image_url: '/images/insects/butterfly.jpg' }
    ];
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

  // 开始游戏
  startGame() {
    this.setData({
      gameStarted: true,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      currentIndex: 0,
      score: 0,
      answeredQuestions: 0,
      gameEnded: false,
      currentInsect: this.data.insects[0],
      answerRecords: [] // 重置答题记录
    });
  },

  // 选择答案
  selectAnswer(e) {
    if (this.data.showResult) return; // 防止重复点击
    
    const answer = e.currentTarget.dataset.answer;
    const responseTime = Date.now() - (this.data.questionStartTime || this.data.startTime);
    const formattedResponseTime = this.formatTime(responseTime);
    
    // 检查答案是否正确
    const isCorrect = answer === this.data.currentInsect.type;
    
    // 保存当前题目的答题记录到本地数组（不立即保存到数据库）
    const answerRecords = [...this.data.answerRecords];
    answerRecords.push({
      insectId: this.data.currentInsect.id,
      insectName: this.data.currentInsect.name,
      userAnswer: answer,
      correctAnswer: this.data.currentInsect.type,
      isCorrect: isCorrect,
      responseTime: responseTime,
      questionIndex: this.data.currentIndex + 1
    });
    
    this.setData({
      userAnswer: answer,
      responseTime: responseTime,
      formattedResponseTime: formattedResponseTime,
      showResult: true,
      answerRecords: answerRecords
    });
    
    if (isCorrect) {
      this.setData({
        score: this.data.score + 1
      });
      // 播放成功音效
      wx.vibrateShort({
        type: 'light'
      });
    } else {
      // 播放错误音效
      wx.vibrateShort({
        type: 'medium'
      });
    }

    // 延迟显示下一题（不再每答一题就保存到数据库）
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  },


  // 下一题
  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    const answeredQuestions = this.data.answeredQuestions + 1;
    
    if (nextIndex >= this.data.insects.length) {
      // 游戏结束
      this.endGame();
    } else {
      this.setData({
        currentIndex: nextIndex,
        answeredQuestions: answeredQuestions,
        currentInsect: this.data.insects[nextIndex],
        userAnswer: null,
        showResult: false,
        questionStartTime: Date.now(),
        responseTime: 0
      });
    }
  },

  // 结束游戏
  async endGame() {
    const app = getApp();
    const duration = Math.floor((Date.now() - this.data.startTime) / 1000);
    const accuracy = Math.round((this.data.score / this.data.totalQuestions) * 100);
    
    // 答完所有题目后，一次性保存游戏记录到数据库
    try {
      const result = await app.saveGameRecord({
        userId: app.globalData.userId,
        gameType: '益害判官',
        score: this.data.score,
        completionTime: duration,
        difficultyLevel: null, // 益害判官游戏没有难度等级
        completedPuzzles: this.data.answerRecords // 保存所有题目的详细答题记录
      });
      
      if (result.success) {
        console.log('游戏记录保存成功:', result.data);
      } else {
        console.error('保存游戏记录失败:', result.message);
      }
    } catch (error) {
      console.error('保存游戏记录失败:', error);
      // 即使保存失败，也显示游戏结束界面
    }

    // 直接显示游戏结束界面，不显示弹窗
    this.setData({
      gameEnded: true,
      gameStarted: false,
      accuracy: accuracy,
      userAnswer: null,
      showResult: false
    });
  },

  // 重新开始游戏
  async restartGame() {
    // 重置所有游戏状态
    this.setData({
      gameStarted: false,
      gameEnded: false,
      currentIndex: 0,
      score: 0,
      answeredQuestions: 0,
      userAnswer: null,
      showResult: false,
      startTime: null,
      questionStartTime: null,
      responseTime: 0,
      formattedResponseTime: '',
      accuracy: 0,
      loading: true,
      answerRecords: [] // 重置答题记录
    });

    try {
      // 重新加载昆虫数据（重新随机选择）
      const app = getApp();
      const result = await app.getInsects(null, 1, 50);
      
      if (result.success && result.data.length > 0) {
        // 随机选择10个昆虫
        const allInsects = result.data;
        const shuffled = this.shuffleArray(allInsects);
        const selectedInsects = shuffled.slice(0, this.data.totalQuestions);
        
        this.setData({
          insects: selectedInsects,
          currentInsect: selectedInsects[0],
          loading: false
        });
      } else {
        // 使用模拟数据
        const mockInsects = this.getMockInsects();
        const shuffled = this.shuffleArray(mockInsects);
        const selectedInsects = shuffled.slice(0, this.data.totalQuestions);
        
        this.setData({
          insects: selectedInsects,
          currentInsect: selectedInsects[0],
          loading: false
        });
      }
    } catch (error) {
      console.error('重新加载昆虫数据失败:', error);
      // 使用模拟数据作为备用
      const mockInsects = this.getMockInsects();
      const shuffled = this.shuffleArray(mockInsects);
      const selectedInsects = shuffled.slice(0, this.data.totalQuestions);
      
      this.setData({
        insects: selectedInsects,
        currentInsect: selectedInsects[0],
        loading: false
      });
    }
  },

  // 返回游戏主页
  goBack() {
    // 如果游戏正在进行中，提示用户确认
    if (this.data.gameStarted && !this.data.gameEnded) {
      wx.showModal({
        title: '确认退出',
        content: '游戏正在进行中，确定要退出吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      // 游戏未开始或已结束，直接返回
      wx.navigateBack();
    }
  },

  // 格式化时间
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return `${seconds}秒`;
  }
});

