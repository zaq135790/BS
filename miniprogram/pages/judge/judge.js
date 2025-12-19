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
    bgmEnabled: true, // BGM开关
    bgmContext: null, // 背景音乐上下文
    
    // 题目相关
    totalQuestions: 5, // 总共5道题
    currentQuestionIndex: 0, // 当前题目索引
    currentStep: 1, // 当前步骤：1=猜名字，2=判断益害
    questions: [], // 所有题目
    
    // 当前题目
    currentInsect: null,
    currentInsectName: '', // 当前昆虫名字（用于记录选择）
    showInsectName: false, // 是否显示昆虫名字（提示后）
    nameWrongCount: 0, // 名字错误次数（新的规则中：0=答对，1=答错，2=使用提示跳过）
    showCorrectAnswer: false, // 是否显示正确答案（用于提示）
    nameOptions: [], // 第一步三个名字选项
    selectedName: '', // 当前选中的名字
    usedHint: false, // 当前题目是否使用了提示跳过
    
    // 提示相关
    hintClicked: false, // 是否点击过提示
    hintClickTime: 0, // 提示点击时间（保留字段，便于以后扩展）
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
      '再仔细看看图片里的小细节，你一定能发现线索！',
      '别着急，深呼吸一下，慢慢回想刚才学过的昆虫名字～',
      '可以把口诀轻声读一遍，说不定灵感就来了！',
      '看看它的颜色、形状和腿的样子，和记住的昆虫对一对～',
      '小小科学家，再想一想，这次一定可以选对的！'
    ],
    wrongMessages: [
      '每一次尝试都是进步的一小步！',
      '连大科学家也会答错题，坚持下去最重要！',
      '你已经很棒了，等会儿我们再一起挑战新的昆虫吧～'
    ]
  },

  async onLoad(options) {
    await this.loadStartBackground();
    // 初始化BGM
    this.initBGM();
    
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

  // 初始化BGM
  initBGM() {
    const bgmPath = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/music/Sunbeam Smile.mp3';
    
    // 先获取临时URL
    wx.cloud.getTempFileURL({
      fileList: [bgmPath]
    }).then(res => {
      if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
        const bgmUrl = res.fileList[0].tempFileURL;
        const bgmContext = wx.createInnerAudioContext();
        bgmContext.src = bgmUrl;
        bgmContext.loop = true; // 循环播放
        bgmContext.volume = 0.5; // 音量50%
        bgmContext.onError((err) => {
          console.error('BGM播放错误:', err);
        });
        this.setData({ bgmContext });
      } else {
        console.warn('BGM URL转换失败，尝试直接使用云存储路径');
        const bgmContext = wx.createInnerAudioContext();
        bgmContext.src = bgmPath;
        bgmContext.loop = true;
        bgmContext.volume = 0.5;
        bgmContext.onError((err) => {
          console.error('BGM播放错误:', err);
        });
        this.setData({ bgmContext });
      }
    }).catch(err => {
      console.error('获取BGM临时URL失败:', err);
      // 如果转换失败，直接使用云存储路径
      const bgmContext = wx.createInnerAudioContext();
      bgmContext.src = bgmPath;
      bgmContext.loop = true;
      bgmContext.volume = 0.5;
      bgmContext.onError((err) => {
        console.error('BGM播放错误:', err);
      });
      this.setData({ bgmContext });
    });
  },

  // 播放BGM
  playBGM() {
    if (this.data.bgmContext && this.data.bgmEnabled) {
      this.data.bgmContext.play();
    }
  },

  // 停止BGM
  stopBGM() {
    if (this.data.bgmContext) {
      this.data.bgmContext.stop();
    }
  },

  // 暂停BGM
  pauseBGM() {
    if (this.data.bgmContext) {
      this.data.bgmContext.pause();
    }
  },

  // 切换BGM开关
  toggleBGM() {
    const newState = !this.data.bgmEnabled;
    this.setData({ bgmEnabled: newState });
    if (newState) {
      this.playBGM();
    } else {
      this.pauseBGM();
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
    
    const firstInsect = questions[0];
    this.setData({
      questions: questions,
      currentInsect: firstInsect,
      nameOptions: this.generateNameOptions(firstInsect.name),
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

  // 为当前昆虫生成三个名字选项（1个正确 + 2个随机错误）
  generateNameOptions(correctName) {
    const allInsects = [...beneficialInsects, ...harmfulInsects];
    const allNames = allInsects.map(item => item.name);
    const otherNames = allNames.filter(name => name !== correctName);
    const wrongNames = this.shuffleArray(otherNames).slice(0, 2);
    const options = [correctName, ...wrongNames];
    return this.shuffleArray(options);
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
      progressPercent: 0,
      nameOptions: this.generateNameOptions(this.data.questions[0].name),
      selectedName: '',
      usedHint: false
    });
    // 开始播放BGM
    this.playBGM();
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
    // 新规则：提示按钮直接显示正确答案，并跳过"猜名字"步骤，
    // 点击"知道了"后进入第二步（判断益虫还是害虫）
    if (this.data.currentStep !== 1) {
      return;
    }

    const correctName = this.data.currentInsect?.name || '';

    this.setData({
      hintClicked: true,
      showInsectName: true,
      showCorrectAnswer: true,
      hintMessage: `正确答案是：${correctName}`,
      usedHint: true,
      nameWrongCount: 2, // 记录为使用提示跳过
      currentInsectName: correctName,
      selectedName: correctName
    });

    wx.showModal({
      title: '小提示',
      content: `这只昆虫的名字是「${correctName}」。\n我们先记住它，一起来判断它是益虫还是害虫吧！`,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        // 直接进入第二步
        this.setData({
          currentStep: 2,
          showResult: false,
          userAnswer: null
        });
        this.updateProgress();
      }
    });
  },

  // 输入昆虫名字
  onNameInput(e) {
    this.setData({
      currentInsectName: e.detail.value
    });
  },

  // 提交名字答案
  submitNameAnswer() {
    // 三选一模式：从选中的按钮中读取答案
    const userAnswer = this.data.selectedName || this.data.currentInsectName.trim();
    const correctAnswer = this.data.currentInsect.name;
    const isCorrect = userAnswer === correctAnswer;
    const currentWrongCount = this.data.nameWrongCount;
    
    if (!userAnswer) {
      wx.showToast({
        title: '请先选择一个昆虫名字',
        icon: 'none'
      });
      return;
    }
    
    if (isCorrect) {
      // 回答正确，正常进入第二步
      this.setData({
        isCorrect: true,
        showResult: true,
        userAnswer: userAnswer,
        currentInsectName: userAnswer,
        nameWrongCount: 0,
        showCorrectAnswer: false
      });

      wx.showToast({
        title: '回答正确！',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        this.setData({
          currentStep: 2,
          showResult: false,
          userAnswer: null,
          hintClicked: false,
          hintClickTime: 0,
          hintMessage: '',
          showCorrectAnswer: false,
          selectedName: ''
        });
        this.updateProgress();
      }, 1500);
    } else {
      // 回答错误，给两次机会
      if (currentWrongCount === 0) {
        // 第一次答错：给出鼓励，不显示正确答案，允许再选一次
        const messages = this.data.thinkingMessages || [];
        const randomMessage = messages.length
          ? messages[Math.floor(Math.random() * messages.length)]
          : '再好好想一想，你可以的！';

        this.setData({
          isCorrect: false,
          showResult: true,
          userAnswer: userAnswer,
          currentInsectName: userAnswer,
          nameWrongCount: 1,
          showCorrectAnswer: false
        });

        wx.showToast({
          title: randomMessage,
          icon: 'none',
          duration: 2000
        });

        // 过一会儿收起结果提示，让儿童重新选择
        setTimeout(() => {
          this.setData({
            showResult: false,
            userAnswer: null,
            selectedName: '',
            currentInsectName: ''
          });
        }, 2000);
      } else {
        // 第二次答错：简洁提示 + 正确答案
        const contentLines = [
          '别灰心，这一题有点难。',
          '',
          `正确答案是：${correctAnswer}`,
          '',
          '记住它的名字，我们一起看看它是益虫还是害虫吧。'
        ];

        this.setData({
          isCorrect: false,
          showResult: true,
          userAnswer: userAnswer,
          currentInsectName: userAnswer,
          nameWrongCount: 2,
          showCorrectAnswer: true,
          showInsectName: true
        });

        wx.showModal({
          title: '别灰心',
          content: contentLines.join('\n'),
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 进入当前题的第二步（判断益虫/害虫）
            this.setData({
              currentStep: 2,
              showResult: false,
              userAnswer: null,
              hintClicked: false,
              hintClickTime: 0,
              hintMessage: '',
              // 保留 showCorrectAnswer / showInsectName 状态，仅影响第一步显示
              selectedName: this.data.selectedName
            });
            this.updateProgress();
          }
        });
      }
    }
  },

  // 选择名字选项
  selectNameOption(e) {
    const answer = e.currentTarget.dataset.answer;
    this.setData({
      selectedName: answer,
      currentInsectName: answer
    });
  },

  // 选择益害答案
  selectAnswer(e) {
    if (this.data.showResult) return;
    
    const answer = e.currentTarget.dataset.answer;
    const insectName = this.data.currentInsect?.name;
    
    // 为避免类型字段异常，这里重新根据名称判断真实类型
    const isBeneficialInList = beneficialInsects.some(b => b.name === insectName);
    const realType = isBeneficialInList ? '益虫' : '害虫';
    const typeCorrect = answer === realType;
    
    // 判断名字是否正确（0=正确；1=选错；2=使用提示跳过）
    const nameCorrect = this.data.nameWrongCount === 0 && !this.data.usedHint;
    
    // 记录答题
    const record = {
      questionIndex: this.data.currentQuestionIndex + 1,
      insectName: insectName,
      nameAnswer: this.data.currentInsectName || this.data.currentInsect.name, // 最终显示的名字
      nameCorrect: nameCorrect, // 名字是否正确
      nameWrongCount: this.data.nameWrongCount, // 记录错误次数
      typeAnswer: answer,
      typeCorrect: typeCorrect,
      step1Time: 0, // 可以后续添加计时
      step2Time: 0
    };
    
    // 第二步界面只根据益虫/害虫判断对错来显示结果
    this.setData({
      userAnswer: answer,
      isCorrect: typeCorrect,
      showResult: true
    });
    
    if (typeCorrect && nameCorrect) {
      // 只有名字和益害都正确时才计分
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
        isCorrect: false,
        nameOptions: this.generateNameOptions(this.data.questions[nextIndex].name),
        selectedName: '',
        usedHint: false
      });
      this.updateProgress();
    }
  },

  // 结束游戏
  async endGame() {
    // 停止BGM
    this.stopBGM();
    
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
    // 停止BGM
    this.stopBGM();
    
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
    // 停止BGM
    this.stopBGM();
    
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
            // 停止BGM
            this.stopBGM();
            wx.navigateBack();
          }
        }
      });
    } else {
      // 停止BGM
      this.stopBGM();
      wx.navigateBack();
    }
  },

  onUnload() {
    // 页面卸载时停止BGM
    this.stopBGM();
  }
});
