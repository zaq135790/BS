Page({
  data: {
    userInfo: {
      nickname: '',
      avatar_url: '',
      user_type: 'parent'
    },
    isLoggedIn: false,
    browseHistory: [], // 浏览记录
    browseDays: 0, // 浏览天数
    watchHistory: [], // 观看记录
    profileBackground: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj1.jpg',
    showBackgroundPicker: false,
    // 名片背景可选图片，使用绝对路径，便于在 style 中直接使用
    backgroundOptions: [
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj1.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj2.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj3.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj4.jpg'
    ],
    avatarOptions: [
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx2.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx3.jpg'
    ],
    showAvatarPicker: false,
    // 身份切换动画标记
    roleSwitching: false
  },

  async onLoad() {
    await this.refreshLoginState();
  },

  async onShow() {
    // 每次显示页面时重新同步登录态与浏览记录
    await this.refreshLoginState(false);
  },

  // 刷新登录态并加载数据
  async refreshLoginState(showLoading = true) {
    const app = getApp();
    const isLoggedIn = app.checkLoginStatus ? app.checkLoginStatus() : false;

    this.setData({ isLoggedIn });

    if (!isLoggedIn) {
      // 未登录，重置为访客视图
      const defaultBg = this.data.backgroundOptions[0];
      this.setData({
        userInfo: {
          nickname: '未登录',
          avatar_url: '',
          user_type: 'child'
        },
        browseHistory: [],
        browseDays: 0,
        watchHistory: [],
        profileBackground: defaultBg
      });
      wx.setStorageSync('profile_bg_default', defaultBg);
      return;
    }

    // 已登录，加载用户数据
    await this.loadUserInfo(showLoading);
    await this.initProfileBackground();
    await this.loadBrowseHistory();
    await this.loadWatchHistory();
  },

  // 加载用户信息
  async loadUserInfo() {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userInfoKey = `user_info_${userId}`;
    
    try {
      // 优先从本地存储读取
      let storedUserInfo = wx.getStorageSync(userInfoKey);
      
      if (storedUserInfo && storedUserInfo.nickname) {
        // 本地有数据，直接使用
        this.setData({
          userInfo: storedUserInfo
        });
        return;
      }
      
      // 本地没有数据，尝试从数据库获取
      if (app.globalData.userInfo && app.globalData.openid) {
        const result = await app.callDatabase('getUserInfo', {
          openid: app.globalData.openid
        });
        
        if (result.success && result.data) {
          const userInfo = {
            nickname: result.data.nickname || '新用户',
            avatar_url: result.data.avatar_url || '',
            user_type: result.data.user_type || 'child'  // 默认儿童版本
          };
          this.setData({
            userInfo: userInfo
          });
          wx.setStorageSync(userInfoKey, userInfo);
          return;
        }
      }
      
      // 如果都没有，使用全局数据或默认值
      const userInfo = {
        nickname: (app.globalData.userInfo && app.globalData.userInfo.nickName) || '新用户',
        avatar_url: (app.globalData.userInfo && app.globalData.userInfo.avatarUrl) || '',
        user_type: 'child'  // 初始注册默认儿童版本
      };
      this.setData({
        userInfo: userInfo
      });
      wx.setStorageSync(userInfoKey, userInfo);
    } catch (error) {
      console.error('加载用户信息失败:', error);
      // 出错时使用默认值
      const userInfo = {
        nickname: '新用户',
        avatar_url: '',
        user_type: 'child'
      };
      this.setData({
        userInfo: userInfo
      });
      const userId = app.globalData.userId || app.globalData.openid || 'default';
      const userInfoKey = `user_info_${userId}`;
      wx.setStorageSync(userInfoKey, userInfo);
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
      await app.loginCloud();
      
      // 重新加载用户信息
      await this.refreshLoginState();
    } catch (error) {
      console.error('登录失败:', error);
    }
  },

  // 退出登录
  logout() {
    const app = getApp();
    if (app.clearLoginState) {
      app.clearLoginState();
    }
    this.setData({
      isLoggedIn: false,
      userInfo: {
        nickname: '未登录',
        avatar_url: '',
        user_type: 'child'
      },
      browseHistory: [],
      browseDays: 0,
      watchHistory: []
    });
    wx.showToast({
      title: '已退出',
      icon: 'none'
    });
  },

  // 修改头像
  changeAvatar() {
    this.setData({ showAvatarPicker: true });
  },

  closeAvatarPicker() {
    this.setData({ showAvatarPicker: false });
  },

  async selectAvatar(e) {
    const url = e.currentTarget.dataset.url;
    try {
      await this.updateUserInfo({ avatar_url: url });
      this.setData({
        'userInfo.avatar_url': url,
        showAvatarPicker: false
      });
      wx.showToast({
        title: '头像已更新',
        icon: 'success'
      });
    } catch (err) {
      console.error('选择头像失败:', err);
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'none'
      });
    }
  },

  // 修改昵称
  async changeNickname() {
    try {
      const res = await wx.showModal({
        title: '修改昵称',
        editable: true,
        placeholderText: '请输入新昵称',
        content: this.data.userInfo.nickname || ''
      });

      if (!res.confirm) return;

      const nickname = (res.content || '').trim();
      if (!nickname) {
        wx.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }

      await this.updateUserInfo({ nickname });
      this.setData({
        'userInfo.nickname': nickname
      });
      wx.showToast({
        title: '昵称已更新',
        icon: 'success'
      });
    } catch (err) {
      console.error('修改昵称失败:', err);
      wx.showToast({
        title: '修改失败，请重试',
        icon: 'none'
      });
    }
  },

  // 更新用户信息（优先本地存储，失败不影响使用）
  async updateUserInfo(updateData) {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userInfoKey = `user_info_${userId}`;
    
    try {
      // 合并更新数据
      const updatedUserInfo = {
        ...this.data.userInfo,
        ...updateData
      };
      
      // 先更新本地存储（确保立即生效）
      this.setData({
        userInfo: updatedUserInfo
      });
      wx.setStorageSync(userInfoKey, updatedUserInfo);
      
      // 尝试同步到云端（失败不影响本地使用）
      if (app.globalData.openid) {
        try {
          const result = await wx.cloud.callFunction({
            name: 'user-service',
            data: {
              action: 'updateUserInfo',
              data: {
                openid: app.globalData.openid,
                userInfo: {
                  nickname: updatedUserInfo.nickname,
                  avatar_url: updatedUserInfo.avatar_url,
                  user_type: updatedUserInfo.user_type
                }
              }
            }
          });
          if (!result.result || !result.result.success) {
            console.log('云端同步失败，但本地已更新');
          }
        } catch (cloudError) {
          console.log('云端同步出错，但本地已更新:', cloudError);
        }
      }
      
      // 本地更新成功即返回成功
      return true;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return false;
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
          // 执行切换（优先本地存储）
          const success = await this.updateUserInfo({
            user_type: targetType
          });
          
          if (success) {
            // 更新本地数据并触发简单淡入动画
            this.setData({
              'userInfo.user_type': targetType,
              roleSwitching: true
            });

            // 重新加载浏览记录（因为不同身份有不同的浏览记录）
            await this.loadBrowseHistory();

            // 轻微延时后移除动画标记，避免数据混乱
            setTimeout(() => {
              this.setData({
                roleSwitching: false
              });
            }, 300);
            
            // 显示切换成功提示
            wx.showToast({
              title: '切换成功',
              icon: 'success',
              duration: 1500
            });
          } else {
            wx.showToast({
              title: '切换失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 初始化背景
  async initProfileBackground() {
    // 无论登录与否，固定使用序号为 1 的背景（数组第一个）
    const background = this.data.backgroundOptions[0];
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const bgKey = `profile_bg_${userId}`;
    wx.setStorageSync(bgKey, background);
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
      profileBackground: url,
      showBackgroundPicker: false  // 选择后关闭选择器
    });
    wx.showToast({
      title: '背景已更新',
      icon: 'success',
      duration: 1500
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
      
      // 儿童身份：只显示最新3条；家长身份：显示最近20条
      const displayCount = userType === 'child' ? 3 : 20;
      const displayHistory = history.slice(0, displayCount);
      
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
        browseHistory: displayHistory,
        allBrowseHistory: history, // 保存全部记录用于管理页面
        browseDays: browseDays
      });
    } catch (error) {
      console.error('加载浏览记录失败:', error);
      this.setData({
        browseHistory: [],
        allBrowseHistory: []
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

  // 跳转到浏览记录管理页面
  goToHistoryManage() {
    wx.navigateTo({
      url: '/pages/history-manage/history-manage?type=browse'
    });
  },

  // 跳转到观看记录管理页面
  goToWatchHistoryManage() {
    wx.navigateTo({
      url: '/pages/history-manage/history-manage?type=watch'
    });
  },

  // 加载观看记录
  async loadWatchHistory() {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userType = this.data.userInfo.user_type || 'parent';
    
    try {
      // 从本地存储获取观看记录（按身份区分）
      const historyKey = `watch_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      // 按观看时间倒序排列
      history.sort((a, b) => {
        const timeA = new Date(a.watchTime || 0).getTime();
        const timeB = new Date(b.watchTime || 0).getTime();
        return timeB - timeA;
      });
      
      // 儿童身份：只显示最新3条；家长身份：显示最近20条
      const displayCount = userType === 'child' ? 3 : 20;
      const displayHistory = history.slice(0, displayCount);
      
      this.setData({
        watchHistory: displayHistory,
        allWatchHistory: history // 保存全部记录用于管理页面
      });
    } catch (error) {
      console.error('加载观看记录失败:', error);
      this.setData({
        watchHistory: [],
        allWatchHistory: []
      });
    }
  },

  // 格式化观看时间
  formatWatchTime(timestamp) {
    return this.formatBrowseTime(timestamp);
  },

  // 跳转到视频详情
  goToVideoDetail(e) {
    const videoId = e.currentTarget.dataset.id;
    if (!videoId) return;
    wx.navigateTo({
      url: `/pages/video/video?id=${videoId}`
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadUserInfo();
    await this.initProfileBackground();
    await this.loadBrowseHistory();
    await this.loadWatchHistory();
    wx.stopPullDownRefresh();
  }
});
