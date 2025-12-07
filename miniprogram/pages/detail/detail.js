const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    insectData: {},
    loading: true,
    videoUrl: ''  // 动画视频URL（后期导入）
  },

  onLoad(options) {
    // 从options获取昆虫信息（可能是从图鉴页面跳转过来的）
    const insectName = options.name || '';
    const insectId = options.id || '';
    this.loadInsectData(insectName, insectId);
  },

  // 加载昆虫数据
  loadInsectData(insectName, insectId) {
    // 合并所有昆虫数据
    const allInsects = [...beneficialInsects, ...harmfulInsects];
    
    let insect = null;
    
    // 优先通过名称查找
    if (insectName) {
      insect = allInsects.find(item => item.name === insectName);
    } else if (insectId) {
      // 通过ID查找（格式：b_0, h_0等）
      const parts = insectId.split('_');
      if (parts[0] === 'b') {
        insect = beneficialInsects[parseInt(parts[1])];
      } else if (parts[0] === 'h') {
        insect = harmfulInsects[parseInt(parts[1])];
      }
    }
    
    if (insect) {
      // 生成适合儿童的知识内容（基于adultDesc扩展）
      const knowledge = this.generateChildKnowledge(insect);
      
      this.setData({
        insectData: {
          name: insect.name,
          image: insect.cartoonImg,
          rhyme: insect.childDesc,  // 昆虫口诀
          knowledge: knowledge,  // 昆虫小知识
          type: beneficialInsects.includes(insect) ? '益虫' : '害虫'
        },
        loading: false
      });
      
      // 记录浏览历史
      this.saveBrowseHistory(insect);
    } else {
      // 如果找不到，使用默认数据
      this.setData({
        insectData: {
          name: '未知昆虫',
          image: '/images/bj1(1).png',
          rhyme: '等待探索中...',
          knowledge: '让我们一起探索这个有趣的昆虫吧！',
          type: '未知'
        },
        loading: false
      });
    }
  },

  // 生成适合儿童的知识内容
  generateChildKnowledge(insect) {
    // 判断是益虫还是害虫
    const isBeneficial = beneficialInsects.some(item => item.name === insect.name);
    const type = isBeneficial ? '益虫' : '害虫';
    const identify = insect.adultDesc.identify;
    const guide = insect.adultDesc.guide;
    
    // 将成人版信息转换为适合儿童的语言
    let knowledge = '';
    
    if (type === '益虫') {
      knowledge = `这是我们的好朋友${insect.name}！${identify}。它们可以帮助我们保护植物，让我们的花园更美丽。${guide}`;
    } else {
      knowledge = `这是${insect.name}，它们可能会给我们带来一些小麻烦。${identify}。不过不用担心，我们可以用一些好方法来处理它们：${guide}`;
    }
    
    return knowledge;
  },

  // 保存浏览记录
  saveBrowseHistory(insect) {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    
    // 获取当前用户身份（默认儿童）
    let userType = 'child';
    try {
      const userInfoKey = `user_info_${userId}`;
      const storedUserInfo = wx.getStorageSync(userInfoKey);
      if (storedUserInfo && storedUserInfo.user_type) {
        userType = storedUserInfo.user_type;
      }
    } catch (error) {
      console.error('获取用户身份失败:', error);
    }
    
    try {
      const historyKey = `browse_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      const browseRecord = {
        insectId: insect.name,
        name: insect.name,
        image: insect.cartoonImg,
        browseTime: new Date().toISOString()
      };
      
      // 检查是否已存在
      const existingIndex = history.findIndex(item => item.name === insect.name);
      if (existingIndex >= 0) {
        history[existingIndex] = browseRecord;
      } else {
        history.unshift(browseRecord);
      }
      
      // 只保留最近50条
      history = history.slice(0, 50);
      wx.setStorageSync(historyKey, history);
    } catch (error) {
      console.error('保存浏览记录失败:', error);
    }
  },


  // 分享
  onShareAppMessage() {
    return {
      title: `发现了一只${this.data.insectData.name}！`,
      path: `/pages/detail/detail?name=${this.data.insectData.name}`,
      imageUrl: this.data.insectData.image
    };
  }
});
