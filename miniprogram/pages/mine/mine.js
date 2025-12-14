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
    profileBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    profileBackgroundType: 'color', // 'color' 或 'image'
    profileCardStyle: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);', // 计算好的样式字符串
    showBackgroundPicker: false,
    currentTab: 'color', // 背景选择器当前标签页
    // 名片背景可选颜色（渐变色）
    backgroundColorOptions: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ],
    // 名片背景可选图片，使用绝对路径，便于在 style 中直接使用
    backgroundImageOptions: [
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj1.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj2.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj3.jpg',
      'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/bj4.jpg'
    ],
    backgroundOptions: [], // 动态组合的颜色和图片选项
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
    // 初始化背景选项
    this.initBackgroundOptions();
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
      const defaultBg = this.data.backgroundColorOptions[0];
      this.setData({
        userInfo: {
          nickname: '未登录',
          avatar_url: '',
          user_type: 'child'
        },
        browseHistory: [],
        browseDays: 0,
        watchHistory: [],
        profileBackground: defaultBg,
        profileBackgroundType: 'color'
      });
      await this.updateProfileCardStyle(defaultBg, 'color');
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
        const result = await wx.cloud.callFunction({
          name: 'user-service',
          data: {
            action: 'getUserInfo',
            data: {
              openid: app.globalData.openid
            }
          }
        });
        const userResult = result.result;
        
        if (userResult.success && userResult.data) {
          const userInfo = {
            nickname: userResult.data.nickname || '新用户',
            avatar_url: userResult.data.avatar_url || '',
            user_type: userResult.data.user_type || 'child'  // 默认儿童版本
          };
          this.setData({
            userInfo: userInfo
          });
          wx.setStorageSync(userInfoKey, userInfo);
          
          // 从数据库加载背景信息
          if (userResult.data.profile_background && userResult.data.profile_background_type) {
            this.setData({
              profileBackground: userResult.data.profile_background,
              profileBackgroundType: userResult.data.profile_background_type
            });
            await this.updateProfileCardStyle(userResult.data.profile_background, userResult.data.profile_background_type);
          }
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
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    
    // 优先从数据库读取
    if (app.globalData.openid) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'user-service',
          data: {
            action: 'getUserInfo',
            data: {
              openid: app.globalData.openid
            }
          }
        });
        const userResult = result.result;
        
        if (userResult.success && userResult.data && userResult.data.profile_background && userResult.data.profile_background_type) {
          this.setData({
            profileBackground: userResult.data.profile_background,
            profileBackgroundType: userResult.data.profile_background_type
          });
          await this.updateProfileCardStyle(userResult.data.profile_background, userResult.data.profile_background_type);
          // 同步到本地存储
          const bgKey = `profile_bg_${userId}`;
          const bgTypeKey = `profile_bg_type_${userId}`;
          wx.setStorageSync(bgKey, userResult.data.profile_background);
          wx.setStorageSync(bgTypeKey, userResult.data.profile_background_type);
          this.initBackgroundOptions();
          return;
        }
      } catch (error) {
        console.error('从数据库加载背景失败:', error);
      }
    }
    
    // 从本地存储读取
    const bgKey = `profile_bg_${userId}`;
    const bgTypeKey = `profile_bg_type_${userId}`;
    let savedBg = wx.getStorageSync(bgKey);
    let savedType = wx.getStorageSync(bgTypeKey);
    
    if (savedBg && savedType) {
      this.setData({
        profileBackground: savedBg,
        profileBackgroundType: savedType
      });
      await this.updateProfileCardStyle(savedBg, savedType);
    } else {
      // 默认使用第一个颜色背景
      const defaultBg = this.data.backgroundColorOptions[0];
      this.setData({
        profileBackground: defaultBg,
        profileBackgroundType: 'color'
      });
      wx.setStorageSync(bgKey, defaultBg);
      wx.setStorageSync(bgTypeKey, 'color');
      await this.updateProfileCardStyle(defaultBg, 'color');
    }
    
    // 初始化背景选项（颜色 + 图片） 
    this.initBackgroundOptions();
  },

  // 初始化背景选项
  initBackgroundOptions() {
    const colorOptions = this.data.backgroundColorOptions.map(color => ({
      value: color,
      type: 'color'
    }));
    const imageOptions = this.data.backgroundImageOptions.map(image => ({
      value: image,
      type: 'image'
    }));
    this.setData({
      backgroundOptions: [...colorOptions, ...imageOptions]
    });
  },

  // 更新名片样式
  async updateProfileCardStyle(background, type) {
    let style = '';
    if (type === 'color') {
      style = `background: ${background};`;
      this.setData({
        profileCardStyle: style,
        profileBackgroundType: 'color'
      });
    } else {
      // 如果是图片，需要处理云存储URL
      let imageUrl = background;
      if (background && background.startsWith('cloud://')) {
        try {
          const res = await wx.cloud.getTempFileURL({
            fileList: [background]
          });
          if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
            imageUrl = res.fileList[0].tempFileURL;
          }
        } catch (error) {
          console.error('转换背景图片URL失败:', error);
          // 转换失败时使用原URL
        }
      }
      // 图片背景需要完整的样式属性
      style = `background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
      this.setData({
        profileCardStyle: style,
        profileBackgroundType: 'image'
      });
    }
  },

  getRandomBackground() {
    const colorOptions = this.data.backgroundColorOptions;
    const index = Math.floor(Math.random() * colorOptions.length);
    return {
      value: colorOptions[index],
      type: 'color'
    };
  },

  openBackgroundPicker() {
    this.setData({
      showBackgroundPicker: true,
      currentTab: this.data.profileBackgroundType || 'color'
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  closeBackgroundPicker() {
    this.setData({
      showBackgroundPicker: false
    });
  },

  selectBackground(e) {
    const value = e.currentTarget.dataset.value;
    const type = e.currentTarget.dataset.type;
    this.saveProfileBackground(value, type);
  },

  async uploadBackground() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        // 上传图片到云存储（如果需要）
        // 这里暂时直接使用本地路径
        this.saveProfileBackground(res.tempFilePaths[0], 'image');
      }
    } catch (error) {
      console.error('上传背景失败:', error);
      wx.showToast({
        title: '上传失败，请重试',
        icon: 'none'
      });
    }
  },

  useRandomBackground() {
    const randomBg = this.getRandomBackground();
    this.saveProfileBackground(randomBg.value, randomBg.type);
  },

  async saveProfileBackground(value, type) {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const bgKey = `profile_bg_${userId}`;
    const bgTypeKey = `profile_bg_type_${userId}`;
    
    // 先更新本地存储（确保立即生效）
    wx.setStorageSync(bgKey, value);
    wx.setStorageSync(bgTypeKey, type);
    
    this.setData({
      profileBackground: value,
      profileBackgroundType: type,
      showBackgroundPicker: false  // 选择后关闭选择器
    });
    
    // 更新名片样式
    await this.updateProfileCardStyle(value, type);
    
    // 同步到数据库
    if (app.globalData.openid) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'user-service',
          data: {
            action: 'updateUserInfo',
            data: {
              openid: app.globalData.openid,
              userInfo: {
                profile_background: value,
                profile_background_type: type
              }
            }
          }
        });
        
        const updateResult = result.result;
        if (!updateResult.success) {
          console.error('保存背景到数据库失败:', updateResult.message);
        }
      } catch (error) {
        console.error('保存背景到数据库出错:', error);
        // 失败不影响本地使用
      }
    }
    
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
      let displayHistory = history.slice(0, displayCount);
      
      // 转换云存储URL为临时URL
      displayHistory = await this.convertWatchHistoryUrls(displayHistory);
      
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

  // 转换观看记录中的云存储URL为临时URL
  async convertWatchHistoryUrls(history) {
    if (!history || history.length === 0) return history;
    
    // 修复路径拼写错误（vidoes -> videos）
    history = history.map(item => {
      if (item.thumbnail && item.thumbnail.includes('/vidoes/')) {
        item.thumbnail = item.thumbnail.replace('/vidoes/', '/videos/');
      }
      if (item.video_url && item.video_url.includes('/vidoes/')) {
        item.video_url = item.video_url.replace('/vidoes/', '/videos/');
      }
      return item;
    });
    
    // 收集所有需要转换的云存储URL
    const cloudUrls = [];
    history.forEach(item => {
      if (item.thumbnail && item.thumbnail.startsWith('cloud://')) {
        cloudUrls.push(item.thumbnail);
      }
    });
    
    if (cloudUrls.length === 0) return history;
    
    try {
      // 批量转换URL
      const res = await wx.cloud.getTempFileURL({
        fileList: cloudUrls
      });
      
      // 创建URL映射
      const urlMap = {};
      if (res.fileList) {
        res.fileList.forEach(file => {
          if (file.fileID && file.tempFileURL) {
            urlMap[file.fileID] = file.tempFileURL;
          }
        });
      }
      
      // 更新历史记录中的URL
      return history.map(item => {
        if (item.thumbnail && item.thumbnail.startsWith('cloud://') && urlMap[item.thumbnail]) {
          return {
            ...item,
            thumbnail: urlMap[item.thumbnail]
          };
        }
        return item;
      });
    } catch (error) {
      console.error('转换观看记录URL失败:', error);
      return history; // 转换失败时返回原数据
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
