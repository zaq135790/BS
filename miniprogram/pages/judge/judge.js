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
    responseTime: 0,
    loading: true
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
      currentIndex: 0,
      score: 0,
      answeredQuestions: 0,
      gameEnded: false,
      currentInsect: this.data.insects[0]
    });
  },

  // 选择答案
  selectAnswer(e) {
    const answer = e.currentTarget.dataset.answer;
    const responseTime = Date.now() - this.data.startTime;
    
    this.setData({
      userAnswer: answer,
      responseTime: responseTime,
      showResult: true
    });

    // 检查答案是否正确
    const isCorrect = answer === this.data.currentInsect.type;
    
    if (isCorrect) {
      this.setData({
        score: this.data.score + 1
      });
    }

    // 保存判断记录
    this.saveJudgeRecord(answer, isCorrect, responseTime);

    // 延迟显示下一题
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  },

  // 保存判断记录
  async saveJudgeRecord(userAnswer, isCorrect, responseTime) {
    const app = getApp();
    
    try {
      await app.saveJudgeRecord({
        userId: app.globalData.userId,
        insectId: this.data.currentInsect.id,
        userJudgment: userAnswer,
        isCorrect: isCorrect,
        responseTime: responseTime
      });
    } catch (error) {
      console.error('保存判断记录失败:', error);
    }
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
        startTime: Date.now()
      });
    }
  },

  // 结束游戏
  async endGame() {
    const app = getApp();
    
    // 保存游戏记录
    try {
      await app.saveGameRecord({
        userId: app.globalData.userId,
        gameType: '益害判官',
        score: this.data.score,
        completionTime: Math.floor((Date.now() - this.data.startTime) / 1000),
        difficultyLevel: '简单'
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }

    this.setData({
      gameEnded: true,
      gameStarted: false
    });

    // 显示结果
    wx.showModal({
      title: '游戏结束',
      content: `恭喜你！答对了 ${this.data.score} 题，正确率 ${Math.round((this.data.score / this.data.totalQuestions) * 100)}%`,
      showCancel: false,
      confirmText: '再来一局',
      success: (res) => {
        if (res.confirm) {
          this.restartGame();
        }
      }
    });
  },

  // 重新开始游戏
  restartGame() {
    this.setData({
      gameStarted: false,
      gameEnded: false,
      currentIndex: 0,
      score: 0,
      answeredQuestions: 0,
      userAnswer: null,
      showResult: false,
      currentInsect: this.data.insects[0]
    });
  },

  // 返回游戏主页
  goBack() {
    wx.navigateBack();
  },

  // 格式化时间
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return `${seconds}秒`;
  }
});

