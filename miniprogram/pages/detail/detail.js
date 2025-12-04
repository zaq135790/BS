Page({
  data: {
    currentVersion: 'child', // 默认显示儿童版
    insectData: {},
    loading: true,
    videos: [],
    learningProgress: null
  },

  async onLoad(options) {
    const insectId = options.id;
    await this.loadInsectData(insectId);
    await this.loadVideos(insectId);
    await this.loadLearningProgress(insectId);
  },

  // 加载昆虫详情数据
  async loadInsectData(id) {
    const app = getApp();
    const defaultImage = '/images/bj3.png';
    
    try {
      const result = await app.getInsectById(id);
      
      if (result.success && result.data) {
        const insect = result.data;
        this.setData({
          insectData: {
            id: insect.id,
            name: insect.name,
            scientificName: insect.scientific_name,
            type: insect.type,
            childDescription: insect.child_description,
            adultDescription: insect.adult_description,
            childImageUrl: insect.child_image_url,
            adultImageUrl: insect.adult_image_url,
            identificationPoints: insect.identification_points ? insect.identification_points.split('\n') : [],
            harmOrValue: insect.harm_or_value,
            familyGuidance: insect.family_guidance,
            habitat: insect.habitat,
            image: defaultImage
          },
          loading: false
        });
        
        // 更新学习进度
        await this.updateLearningProgress(id);
        
        // 记录浏览历史（数据加载完成后）
        this.saveBrowseHistory(id, insect);
        
      } else {
        // 使用模拟数据
        const mock = this.getMockInsectData(id);
        this.setData({
          insectData: mock,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载昆虫详情失败:', error);
      const mock = this.getMockInsectData(id);
      this.setData({
        insectData: mock,
        loading: false
      });
    }
  },

  // 加载相关视频
  async loadVideos(insectId) {
    const app = getApp();
    
    try {
      const result = await app.getVideos(insectId, 1, 5);
      
      if (result.success) {
        this.setData({
          videos: result.data
        });
      }
    } catch (error) {
      console.error('加载视频失败:', error);
    }
  },

  // 加载学习进度
  async loadLearningProgress(insectId) {
    const app = getApp();
    
    try {
      const result = await app.getLearningProgress(insectId);
      
      if (result.success && result.data.length > 0) {
        this.setData({
          learningProgress: result.data[0]
        });
      }
    } catch (error) {
      console.error('加载学习进度失败:', error);
    }
  },

  // 更新学习进度
  async updateLearningProgress(insectId) {
    const app = getApp();
    
    try {
      const progressData = {
        userId: app.globalData.userId,
        insectId: insectId,
        hasLearned: true,
        learnedTimes: this.data.learningProgress ? this.data.learningProgress.learned_times + 1 : 1
      };
      
      await app.updateLearningProgress(progressData);
      
      // 重新加载学习进度
      await this.loadLearningProgress(insectId);
      
    } catch (error) {
      console.error('更新学习进度失败:', error);
    }
  },

  // 模拟昆虫数据
  getMockInsectData(id) {
    const defaultImage = '/images/bj3.png';
    const mockData = {
      1: {
        id: 1,
        name: '蜜蜂',
        scientificName: 'Apis mellifera',
        type: '益虫',
        childDescription: '蜜蜂是勤劳的昆虫，它们住在蜂巢里，每天都会飞到花丛中采集花粉和花蜜，然后酿成甜甜的蜂蜜。一个蜂巢里有很多蜜蜂，它们分工合作，有的负责采蜜，有的负责照顾幼虫，还有的负责保卫蜂巢。',
        adultDescription: '蜜蜂属于膜翅目蜜蜂科，是社会性昆虫，群体中有蜂王、工蜂和雄蜂三种类型。工蜂是生殖器官发育不全的雌性蜜蜂，负责采集花粉和花蜜、建造蜂巢、哺育幼虫等工作。蜜蜂通过跳"8字舞"来向同伴传递蜜源的位置信息。',
        identificationPoints: [
          '体型中等，体色黄黑相间，有明显的环纹',
          '两对膜质翅，后翅较小，有翅钩与前翅相连',
          '后足特化为携粉足，便于携带花粉',
          '头部有一对复眼和三个单眼，触角膝状'
        ],
        harmOrValue: '蜜蜂是重要的传粉昆虫，对农业生产和生态平衡有重要作用。它们酿造的蜂蜜、蜂蜡等产品有很高的经济价值。',
        familyGuidance: '如果发现蜂巢，不要轻易打扰，尤其是对蜜蜂过敏的人应远离。若蜜蜂进入家中，可打开窗户让其自行飞出，不要拍打。',
        habitat: '花园、果园、农田、森林边缘',
        image: defaultImage
      },
      2: {
        id: 2,
        name: '七星瓢虫',
        scientificName: 'Coccinella septempunctata',
        type: '益虫',
        childDescription: '七星瓢虫是一种很可爱的小虫子，它的身体是圆形的，像一个小红球，背上有七个黑色的小圆点，所以叫七星瓢虫。它最喜欢吃蚜虫，而蚜虫会伤害庄稼，所以七星瓢虫是农民伯伯的好帮手。',
        adultDescription: '七星瓢虫属于鞘翅目瓢虫科，是著名的捕食性昆虫。成虫和幼虫均以蚜虫为主要食物，一只七星瓢虫一生可捕食数千只蚜虫，是重要的天敌昆虫。',
        identificationPoints: [
          '体长约5-7毫米，体呈半球形，背面光滑',
          '鞘翅红色或橙黄色，上有7个黑色斑点',
          '头部黑色，复眼发达',
          '足黑色，较短'
        ],
        harmOrValue: '七星瓢虫是重要的天敌昆虫，能有效控制蚜虫等害虫的数量，减少农药使用，保护农作物。',
        familyGuidance: '七星瓢虫是益虫，应加以保护。在园艺种植中，可利用七星瓢虫控制蚜虫等害虫，减少农药使用。',
        habitat: '花园、菜园、农田、草地',
        image: defaultImage
      }
    };
    
    return mockData[id] || {};
  },

  // 切换儿童版/成人版
  switchVersion(e) {
    const version = e.currentTarget.dataset.version;
    this.setData({
      currentVersion: version
    });
  },

  // 播放视频
  playVideo(e) {
    const videoId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/video/video?id=${videoId}`
    });
  },

  // 开始游戏
  startGame(e) {
    const gameType = e.currentTarget.dataset.type;
    const insectId = this.data.insectData.id;
    
    if (gameType === 'judge') {
      wx.navigateTo({
        url: `/pages/judge/judge?insectId=${insectId}`
      });
    } else if (gameType === 'puzzle') {
      wx.navigateTo({
        url: `/pages/puzzle/puzzle?insectId=${insectId}`
      });
    }
  },

  // 记录观察
  recordObservation() {
    const insectId = this.data.insectData.id;
    wx.navigateTo({
      url: `/pages/observation/observation?insectId=${insectId}`
    });
  },

  // 保存浏览记录
  saveBrowseHistory(insectId, insectData) {
    const app = getApp();
    const userId = app.globalData.userId || 'default';
    
    // 获取当前用户身份（从全局数据或本地存储）
    let userType = 'parent';
    try {
      // 尝试从数据库获取用户信息
      const userInfoKey = `user_info_${userId}`;
      const storedUserInfo = wx.getStorageSync(userInfoKey);
      if (storedUserInfo && storedUserInfo.user_type) {
        userType = storedUserInfo.user_type;
      } else if (app.globalData.userInfo && app.globalData.userInfo.user_type) {
        userType = app.globalData.userInfo.user_type;
      }
    } catch (error) {
      console.error('获取用户身份失败:', error);
    }
    
    try {
      const historyKey = `browse_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      // 检查是否已存在该昆虫的浏览记录
      const existingIndex = history.findIndex(item => item.insectId == insectId);
      
      // 使用传入的数据或当前页面数据
      const insect = insectData || this.data.insectData;
      const browseRecord = {
        insectId: insectId,
        name: insect.name || '未知昆虫',
        image: '/images/bj3.png',
        browseTime: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        // 更新现有记录的时间
        history[existingIndex] = browseRecord;
      } else {
        // 添加新记录
        history.unshift(browseRecord);
      }
      
      // 只保留最近50条记录
      history = history.slice(0, 50);
      
      // 保存到本地存储
      wx.setStorageSync(historyKey, history);
    } catch (error) {
      console.error('保存浏览记录失败:', error);
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `发现了一只${this.data.insectData.name}！`,
      path: `/pages/detail/detail?id=${this.data.insectData.id}`,
      imageUrl: this.data.insectData.childImageUrl || this.data.insectData.adultImageUrl
    };
  }
});
