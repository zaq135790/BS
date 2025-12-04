Page({
  data: {
    userInfo: {
      nickname: '',
      avatar_url: '',
      user_type: 'parent'
    },
    browseHistory: [], // 浏览记录
    browseDays: 0, // 浏览天数
    profileBackground: '',
    showBackgroundPicker: false,
    backgroundOptions: [
      '../../images/bj1(1).png',
      '../../images/bj2(1).png',
      '../../images/bj3(1).png',
      '../../images/bj4(1).png'
    ]
  },

  async onLoad() {
    await this.loadUserInfo();
    await this.initProfileBackground();
    await this.loadBrowseHistory();
  },

  async onShow() {
    // 每次显示页面时重新加载浏览记录
    await this.loadBrowseHistory();
  },

  // 加载用户信息
  async loadUserInfo() {
    const app = getApp();
    
    try {
      // 从全局数据获取用户信息
      if (app.globalData.userInfo) {
        // 从数据库获取最新用户信息
        const result = await app.callDatabase('getUserInfo', {
          openid: app.globalData.openid
        });
        
        if (result.success && result.data) {
          const userInfo = {
            nickname: result.data.nickname || '新用户',
            avatar_url: result.data.avatar_url || '',
            user_type: result.data.user_type || 'parent'
          };
          this.setData({
            userInfo: userInfo
          });
          // 保存到本地存储
          const userId = app.globalData.userId || app.globalData.openid || 'default';
          const userInfoKey = `user_info_${userId}`;
          wx.setStorageSync(userInfoKey, userInfo);
        } else {
          // 使用全局数据
          const userInfo = {
            nickname: app.globalData.userInfo.nickName || '新用户',
            avatar_url: app.globalData.userInfo.avatarUrl || '',
            user_type: 'parent'
          };
          this.setData({
            userInfo: userInfo
          });
          // 保存到本地存储
          const userId = app.globalData.userId || app.globalData.openid || 'default';
          const userInfoKey = `user_info_${userId}`;
          wx.setStorageSync(userInfoKey, userInfo);
        }
      } else {
        // 如果没有用户信息，尝试登录
        await this.login();
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 登录
  async login() {
    const app = getApp();
    
    try {
      // 获取用户信息
      const res = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });
      
      app.globalData.userInfo = res.userInfo;
      app.loginCloud();
      
      // 重新加载用户信息
      await this.loadUserInfo();
      await this.initProfileBackground();
    } catch (error) {
      console.error('登录失败:', error);
    }
  },

  // 修改头像
  changeAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 这里可以上传到云存储，暂时直接使用本地路径
        // 实际项目中应该上传到云存储获取URL
        
        // 更新用户信息
        await that.updateUserInfo({
          avatar_url: tempFilePath
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  // 更新用户信息
  async updateUserInfo(updateData) {
    const app = getApp();
    
    try {
      // 合并更新数据
      const updatedUserInfo = {
        ...this.data.userInfo,
        ...updateData
      };
      
      const result = await app.callDatabase('saveUserInfo', {
        openid: app.globalData.openid,
        nickname: updatedUserInfo.nickname,
        avatarUrl: updatedUserInfo.avatar_url,
        userType: updatedUserInfo.user_type
      });
      
      if (result.success) {
        // 更新本地数据
        this.setData({
          userInfo: updatedUserInfo
        });
        
        // 保存用户信息到本地存储（供其他页面使用）
        const userId = app.globalData.userId || app.globalData.openid || 'default';
        const userInfoKey = `user_info_${userId}`;
        wx.setStorageSync(userInfoKey, updatedUserInfo);
        
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    }
  },

  // 切换身份
  async switchIdentity(e) {
    const targetType = e.currentTarget.dataset.type;
    const currentType = this.data.userInfo.user_type;
    
    // 如果已经是目标身份，不执行切换
    if (targetType === currentType) {
      return;
    }
    
    const roleName = targetType === 'parent' ? '家长' : '儿童';
    
    // 显示确认对话框
    wx.showModal({
      title: '切换身份',
      content: `是否切换为${roleName}角色？`,
      success: async (res) => {
        if (res.confirm) {
          // 执行切换
          await this.updateUserInfo({
            user_type: targetType
          });
          
          // 更新本地数据
          this.setData({
            'userInfo.user_type': targetType
          });
          
          // 重新加载浏览记录（因为不同身份有不同的浏览记录）
          await this.loadBrowseHistory();
          
          // 显示切换成功提示
          wx.showModal({
            title: '切换成功',
            content: '切换成功，您可以自由探索了！',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      }
    });
  },

  // 初始化背景
  async initProfileBackground() {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const bgKey = `profile_bg_${userId}`;
    let background = wx.getStorageSync(bgKey);
    
    if (!background) {
      background = this.getRandomBackground();
      wx.setStorageSync(bgKey, background);
    }
    
    this.setData({
      profileBackground: background
    });
  },

  getRandomBackground() {
    const options = this.data.backgroundOptions;
    const index = Math.floor(Math.random() * options.length);
    return options[index];
  },

  openBackgroundPicker() {
    this.setData({
      showBackgroundPicker: true
    });
  },

  closeBackgroundPicker() {
    this.setData({
      showBackgroundPicker: false
    });
  },

  selectBackground(e) {
    const url = e.currentTarget.dataset.url;
    this.saveProfileBackground(url);
  },

  async uploadBackground() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        this.saveProfileBackground(res.tempFilePaths[0]);
      }
    } catch (error) {
      console.error('上传背景失败:', error);
    }
  },

  useRandomBackground() {
    const randomBg = this.getRandomBackground();
    this.saveProfileBackground(randomBg);
  },

  saveProfileBackground(url) {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const bgKey = `profile_bg_${userId}`;
    wx.setStorageSync(bgKey, url);
    this.setData({
      profileBackground: url
    });
  },

  stopPropagation() {},

  // 加载浏览记录
  async loadBrowseHistory() {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userType = this.data.userInfo.user_type || 'parent';
    
    try {
      // 从本地存储获取浏览记录（按身份区分）
      const historyKey = `browse_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      // 按浏览时间倒序排列
      history.sort((a, b) => {
        const timeA = new Date(a.browseTime || 0).getTime();
        const timeB = new Date(b.browseTime || 0).getTime();
        return timeB - timeA;
      });
      
      // 只保留最近20条记录
      history = history.slice(0, 20);
      
      // 计算浏览天数
      let browseDays = 0;
      if (history.length > 0) {
        try {
          const firstBrowseTime = new Date(history[history.length - 1].browseTime);
          const now = new Date();
          const diff = now - firstBrowseTime;
          browseDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (browseDays <= 0) browseDays = 1;
        } catch (error) {
          browseDays = 0;
        }
      }
      
      this.setData({
        browseHistory: history,
        browseDays: browseDays
      });
    } catch (error) {
      console.error('加载浏览记录失败:', error);
      this.setData({
        browseHistory: []
      });
    }
  },

  // 格式化浏览时间
  formatBrowseTime(timestamp) {
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
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    }
  },

  // 跳转到昆虫详情
  goToInsectDetail(e) {
    const insectId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${insectId}`
    });
  },

  // 跳转到分类页面（虫虫图鉴）
  goToCategory() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 跳转到游戏页面
  goToGame() {
    wx.switchTab({
      url: '/pages/game/game'
    });
  },

  // 跳转到剧场页面
  goToTheater() {
    wx.switchTab({
      url: '/pages/theater/theater'
    });
  },

  // 跳转到社区（家长功能）
  goToCommunity() {
    wx.navigateTo({
      url: '/pages/posts/posts'
    });
  },

  // 跳转到知识库（家长功能）
  goToKnowledgeBase() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 跳转到昆虫识别（家长功能）
  goToInsectRecognition() {
    wx.showToast({
      title: '昆虫识别功能开发中',
      icon: 'none'
    });
  },

  // 跳转到游戏记录
  goToGameRecords() {
    wx.switchTab({
      url: '/pages/game/game'
    });
  },

  // 跳转到观察记录
  goToObservations() {
    wx.navigateTo({
      url: '/pages/posts/posts?mine=true'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadUserInfo();
    await this.initProfileBackground();
    await this.loadBrowseHistory();
    wx.stopPullDownRefresh();
  }
});
