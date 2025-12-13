// pages/judge/judge.js
const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

const defaultImg = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png';

Page({
  data: {
    // 游戏状态
    loading: true,
    gameStarted: false,
    gameEnded: false,
    showReport: false,
    startBackground: '', // 开始界面背景图片URL
    
    // 题目相关
    totalQuestions: 5, // 总共5道题
    currentQuestionIndex: 0, // 当前题目索引
    currentStep: 1, // 当前步骤：1=猜名字，2=判断益害
    questions: [], // 所有题目
    
    // 当前题目
    currentInsect: null,
    currentInsectName: '', // 当前昆虫名字（用于输入）
    showInsectName: false, // 是否显示昆虫名字（提示后）
    nameWrongCount: 0, // 名字错误次数（第一次不算，第二次才算错）
    showCorrectAnswer: false, // 是否显示正确答案（第二次错误后显示）
    
    // 提示相关
    hintClicked: false, // 是否点击过提示
    hintClickTime: 0, // 提示点击时间
    hintMessage: '', // 提示消息
    
    // 答题相关
    userAnswer: null, // 用户答案（名字或益害）
    showResult: false, // 是否显示结果
    isCorrect: false, // 是否答对
    
    // 统计
    score: 0, // 得分
    answeredQuestions: 0, // 已回答题目数
    answerRecords: [], // 答题记录
    accuracy: 0, // 正确率
    progressPercent: 0, // 进度百分比
    
    // 鼓励话语
    thinkingMessages: [
      '小朋友，好好思考一下，看看图片和口诀，你能猜出来的！',
      '再仔细看看，图片和口诀会给你提示的哦～',
      '不要着急，慢慢想，你一定可以的！'
    ],
    wrongMessages: [
      '没关系，再好好想想，看看图片和口诀的提示！',
      '加油！仔细看看图片和口诀，你一定能猜对的！',
      '别灰心，再想想，图片和口诀会帮助你的！'
    ]
  },

  async onLoad(options) {
    await this.loadStartBackground();
    
    // 如果是从记录页面跳转过来的，加载报告数据
    if (options.fromRecord === 'true' && options.recordId) {
      await this.loadRecordReport(options.recordId);
    } else {
      this.initGame();
    }
  },

  // 从数据库加载记录报告
  async loadRecordReport(recordId) {
    const app = getApp();
    try {
      // 通过getGameRecords获取记录，然后筛选出对应的记录
      const result = await app.getGameRecords(null, 1, 100);
      if (result.success && result.data) {
        const record = result.data.find(r => r.id == recordId);
        if (record) {
          let answerRecords = [];
          
          // 解析答题记录
          if (record.completed_puzzles) {
            try {
              if (typeof record.completed_puzzles === 'string') {
                answerRecords = JSON.parse(record.completed_puzzles);
              } else {
                answerRecords = record.completed_puzzles;
              }
            } catch (error) {
              console.error('解析答题记录失败:', error);
            }
          }
          
          const totalQuestions = answerRecords.length || 5;
          const accuracy = totalQuestions > 0 ? Math.round((record.score / totalQuestions) * 100) : 0;
          
          this.setData({
            showReport: true,
            answerRecords: answerRecords,
            score: record.score,
            totalQuestions: totalQuestions,
            accuracy: accuracy,
            gameEnded: true,
            gameStarted: false,
            loading: false
          });
        }
      }
    } catch (error) {
      console.error('加载记录报告失败:', error);
      wx.showToast({
        title: '加载报告失败',
        icon: 'none'
      });
      this.setData({
        loading: false
      });
    }
  },

  // 加载开始界面背景图片
  async loadStartBackground() {
    const cloudUrl = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/game1.jpg';
    console.log('开始加载小判官游戏背景图片:', cloudUrl);
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: [cloudUrl]
      });
      console.log('小判官游戏背景图片转换结果:', res);
      if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
        const tempUrl = res.fileList[0].tempFileURL;
        console.log('小判官游戏背景图片转换后的URL:', tempUrl);
        this.setData({
          startBackground: tempUrl
        });
      } else {
        console.warn('小判官游戏背景图片转换失败，使用原始URL');
        // 如果转换失败，使用原始URL
        this.setData({
          startBackground: cloudUrl
        });
      }
    } catch (error) {
      console.error('获取小判官游戏背景图片临时URL失败:', error);
      // 如果转换失败，使用原始URL
      this.setData({
        startBackground: cloudUrl
      });
    }
  },

  // 初始化游戏
  initGame() {
    // 合并所有昆虫数据
    const allInsects = [...beneficialInsects, ...harmfulInsects];
    
    // 随机选择5道题目
    const shuffled = this.shuffleArray([...allInsects]);
    const selectedInsects = shuffled.slice(0, this.data.totalQuestions);
    
    // 为每个昆虫添加类型信息
    const questions = selectedInsects.map(insect => {
      const isBeneficial = beneficialInsects.some(b => b.name === insect.name);
      return {
        ...insect,
        type: isBeneficial ? '益虫' : '害虫',
        image: insect.cartoonImg || defaultImg,
        rhyme: insect.childDesc || ''
      };
    });
    
    this.setData({
      questions: questions,
      currentInsect: questions[0],
      loading: false
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

  // 开始游戏
  startGame() {
    this.setData({
      gameStarted: true,
      gameEnded: false,
      showReport: false,
      currentQuestionIndex: 0,
      currentStep: 1,
      score: 0,
      answeredQuestions: 0,
      answerRecords: [],
      currentInsect: this.data.questions[0],
      currentInsectName: '',
      showInsectName: false,
      nameWrongCount: 0,
      showCorrectAnswer: false,
      hintClicked: false,
      hintClickTime: 0,
      hintMessage: '',
      userAnswer: null,
      showResult: false,
      isCorrect: false,
      progressPercent: 0
    });
    this.updateProgress();
  },
  
  // 更新进度
  updateProgress() {
    const totalSteps = this.data.totalQuestions * 2;
    const currentStep = this.data.currentQuestionIndex * 2 + (this.data.currentStep === 2 ? 1 : 0);
    const progressPercent = (currentStep / totalSteps) * 100;
    this.setData({
      progressPercent: progressPercent
    });
  },

  // 点击提示按钮
  onHintClick() {
    const now = Date.now();
    const lastClickTime = this.data.hintClickTime;
    
    if (!this.data.hintClicked) {
      // 第一次点击：显示鼓励思考的话
      const messages = this.data.thinkingMessages;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      this.setData({
        hintClicked: true,
        hintClickTime: now,
        hintMessage: randomMessage
      });
      
      wx.showToast({
        title: randomMessage,
        icon: 'none',
        duration: 2000
      });
    } else if (now - lastClickTime <= 3000) {
      // 3秒内再次点击：显示正确答案
      this.setData({
        showInsectName: true,
        hintMessage: `正确答案是：${this.data.currentInsect.name}`
      });
      
      wx.showToast({
        title: `正确答案：${this.data.currentInsect.name}`,
        icon: 'none',
        duration: 2000
      });
    } else {
      // 超过3秒，重新开始计时
      const messages = this.data.thinkingMessages;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      this.setData({
        hintClickTime: now,
        hintMessage: randomMessage
      });
      
      wx.showToast({
        title: randomMessage,
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 输入昆虫名字
  onNameInput(e) {
    this.setData({
      currentInsectName: e.detail.value
    });
  },

  // 提交名字答案
  submitNameAnswer() {
    const userAnswer = this.data.currentInsectName.trim();
    const correctAnswer = this.data.currentInsect.name;
    const isCorrect = userAnswer === correctAnswer;
    
    if (!userAnswer) {
      wx.showToast({
        title: '请输入昆虫名字',
        icon: 'none'
      });
      return;
    }
    
    if (isCorrect) {
      // 答对了，进入第二步
      this.setData({
        isCorrect: true,
        showResult: true,
        userAnswer: userAnswer,
        nameWrongCount: 0 // 重置错误次数
      });
      
      wx.showToast({
        title: '回答正确！',
        icon: 'success',
        duration: 1500
      });
      
      // 延迟进入第二步
      setTimeout(() => {
        this.setData({
          currentStep: 2,
          showResult: false,
          userAnswer: null,
          hintClicked: false,
          hintClickTime: 0,
          hintMessage: '',
          nameWrongCount: 0,
          showCorrectAnswer: false
        });
        this.updateProgress();
      }, 1500);
    } else {
      // 答错了
      const wrongCount = this.data.nameWrongCount + 1;
      const messages = this.data.wrongMessages;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      if (wrongCount === 1) {
        // 第一次错误，不算错，只提示，不显示正确答案
        this.setData({
          isCorrect: false,
          showResult: true,
          userAnswer: userAnswer,
          nameWrongCount: wrongCount,
          showCorrectAnswer: false
        });
        
        wx.showToast({
          title: randomMessage,
          icon: 'none',
          duration: 2000
        });
        
        // 清空输入框，让用户重新输入
        setTimeout(() => {
          this.setData({
            showResult: false,
            currentInsectName: ''
          });
        }, 2000);
      } else {
        // 第二次错误，算错，显示正确答案，然后自动跳转到第二步
        this.setData({
          isCorrect: false,
          showResult: true,
          userAnswer: userAnswer,
          nameWrongCount: wrongCount,
          showCorrectAnswer: true
        });
        
        wx.showToast({
          title: '正确答案已显示，即将进入下一题',
          icon: 'none',
          duration: 2000
        });
        
        // 显示正确答案后，延迟跳转到第二步
        setTimeout(() => {
          this.setData({
            currentStep: 2,
            showResult: false,
            userAnswer: null,
            hintClicked: false,
            hintClickTime: 0,
            hintMessage: '',
            showCorrectAnswer: false
          });
          this.updateProgress();
        }, 2500);
      }
    }
  },

  // 选择益害答案
  selectAnswer(e) {
    if (this.data.showResult) return;
    
    const answer = e.currentTarget.dataset.answer;
    const typeCorrect = answer === this.data.currentInsect.type;
    
    // 判断名字是否正确（如果错误次数>=2，则算错）
    const nameCorrect = this.data.nameWrongCount < 2;
    const bothCorrect = nameCorrect && typeCorrect;
    
    // 记录答题
    const record = {
      questionIndex: this.data.currentQuestionIndex + 1,
      insectName: this.data.currentInsect.name,
      nameAnswer: this.data.currentInsect.name, // 最终答对的名字
      nameCorrect: nameCorrect, // 名字是否正确（第一次错误不算，第二次错误才算）
      nameWrongCount: this.data.nameWrongCount, // 记录错误次数
      typeAnswer: answer,
      typeCorrect: typeCorrect,
      step1Time: 0, // 可以后续添加计时
      step2Time: 0
    };
    
    this.setData({
      userAnswer: answer,
      isCorrect: bothCorrect,
      showResult: true
    });
    
    if (bothCorrect) {
      this.setData({
        score: this.data.score + 1
      });
      wx.vibrateShort({ type: 'light' });
    } else {
      wx.vibrateShort({ type: 'medium' });
    }
    
    // 保存答题记录
    const answerRecords = [...this.data.answerRecords, record];
    this.setData({
      answerRecords: answerRecords,
      answeredQuestions: this.data.answeredQuestions + 1
    });
    
    // 延迟进入下一题
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  },

  // 下一题
  nextQuestion() {
    const nextIndex = this.data.currentQuestionIndex + 1;
    
    if (nextIndex >= this.data.totalQuestions) {
      // 游戏结束
      this.endGame();
    } else {
      // 进入下一题
      this.setData({
        currentQuestionIndex: nextIndex,
        currentStep: 1,
        currentInsect: this.data.questions[nextIndex],
        currentInsectName: '',
        showInsectName: false,
        nameWrongCount: 0,
        showCorrectAnswer: false,
        hintClicked: false,
        hintClickTime: 0,
        hintMessage: '',
        userAnswer: null,
        showResult: false,
        isCorrect: false
      });
      this.updateProgress();
    }
  },

  // 结束游戏
  async endGame() {
    const accuracy = Math.round((this.data.score / this.data.totalQuestions) * 100);
    this.setData({
      gameEnded: true,
      gameStarted: false,
      accuracy: accuracy
    });
    
    // 保存游戏记录（包含答题报告）
    const app = getApp();
    try {
      await app.saveGameRecord({
        userId: app.globalData.userId,
        gameType: '益害判官',
        score: this.data.score,
        completionTime: 0,
        difficultyLevel: null,
        completedPuzzles: this.data.answerRecords // 使用completedPuzzles字段存储答题记录
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  },

  // 提前结束并查看报告
  async finishEarly() {
    const accuracy = Math.round((this.data.score / this.data.totalQuestions) * 100);
    this.setData({
      gameEnded: true,
      gameStarted: false,
      showReport: true,
      accuracy: accuracy
    });
    
    // 保存游戏记录（包含答题报告）
    const app = getApp();
    try {
      await app.saveGameRecord({
        userId: app.globalData.userId,
        gameType: '益害判官',
        score: this.data.score,
        completionTime: 0,
        difficultyLevel: null,
        completedPuzzles: this.data.answerRecords // 使用completedPuzzles字段存储答题记录
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  },

  // 查看答题报告
  viewReport() {
    this.setData({
      showReport: true
    });
  },

  // 关闭报告
  closeReport() {
    this.setData({
      showReport: false
    });
  },

  // 重新开始游戏
  restartGame() {
    this.initGame();
    this.setData({
      gameStarted: false,
      gameEnded: false,
      showReport: false,
      currentQuestionIndex: 0,
      currentStep: 1,
      score: 0,
      answeredQuestions: 0,
      answerRecords: []
    });
  },

  // 返回
  goBack() {
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
      wx.navigateBack();
    }
  }
});
