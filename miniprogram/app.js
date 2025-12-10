// app.js
App({
  onLaunch() {
    // 初始化云服务
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 配置云环境ID，如果不配置会使用默认环境
        traceUser: true, // 追踪用户操作
      });
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              
              // 登录云服务
              this.loginCloud();
            }
          })
        } else {
          // 未授权，后续在需要的地方处理
        }
      }
    });

    // 初始化云数据库引用
    this.globalData.db = wx.cloud.database();
  },

  // 检查登录状态
  checkLoginStatus() {
    const { token, tokenExpireTime } = this.globalData;
    
    // 检查token是否存在且未过期（提前5分钟刷新）
    if (token && tokenExpireTime && tokenExpireTime > Date.now() + 5 * 60 * 1000) {
      this.globalData.isLoggedIn = true;
      return true;
    }
    
    // 尝试从本地存储恢复登录状态
    try {
      const loginData = wx.getStorageSync('loginData');
      if (loginData && loginData.token && loginData.expireTime > Date.now()) {
        Object.assign(this.globalData, {
          token: loginData.token,
          tokenExpireTime: loginData.expireTime,
          userInfo: loginData.userInfo,
          openid: loginData.openid,
          userId: loginData.userId,
          isLoggedIn: true,
          lastLoginTime: loginData.lastLoginTime
        });
        return true;
      }
    } catch (e) {
      console.error('读取本地登录状态失败', e);
    }
    
    return false;
  },
  
  // 保存登录状态到本地
  saveLoginState(loginData) {
    try {
      wx.setStorageSync('loginData', {
        token: loginData.token,
        expireTime: loginData.expireTime,
        userInfo: loginData.userInfo,
        openid: loginData.openid,
        userId: loginData.userId,
        lastLoginTime: Date.now()
      });
    } catch (e) {
      console.error('保存登录状态失败', e);
    }
  },
  
  // 清除登录状态
  clearLoginState() {
    this.globalData = {
      ...this.globalData,
      token: null,
      tokenExpireTime: null,
      userInfo: null,
      openid: null,
      userId: null,
      isLoggedIn: false,
      lastLoginTime: null
    };
    
    try {
      wx.removeStorageSync('loginData');
    } catch (e) {
      console.error('清除本地登录状态失败', e);
    }
  },
  
  // 刷新token
  async refreshToken() {
    if (this.globalData.isRefreshingToken) {
      return;
    }
    
    this.globalData.isRefreshingToken = true;
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'refreshToken',
          data: {
            token: this.globalData.token
          }
        }
      });
      
      if (result && result.result.success) {
        this.globalData.token = result.result.token;
        this.globalData.tokenExpireTime = result.result.expireTime;
        this.saveLoginState({
          token: this.globalData.token,
          expireTime: this.globalData.tokenExpireTime,
          userInfo: this.globalData.userInfo,
          openid: this.globalData.openid,
          userId: this.globalData.userId
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('刷新token失败', error);
      return false;
    } finally {
      this.globalData.isRefreshingToken = false;
    }
  },
  
  // 云登录函数
  async loginCloud() {
    try {
      // 先检查是否已经登录
      if (this.checkLoginStatus()) {
        return { success: true, isCached: true };
      }
      
      // 获取用户信息
      const { userInfo } = await new Promise((resolve, reject) => {
        wx.getUserInfo({
          success: resolve,
          fail: reject
        });
      });
      
      // 调用云函数登录
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'login',
          data: {
            userInfo: this.globalData.userInfo || userInfo
          }
        }
      });
      
      if (result.result.success) {
        const { token, userInfo: userData, isNewUser } = result.result.data;
        const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天有效期
        
        // 更新全局状态
        Object.assign(this.globalData, {
          token,
          tokenExpireTime: expireTime,
          userInfo: userData,
          openid: userData._openid,
          userId: userData._id,
          isLoggedIn: true,
          lastLoginTime: Date.now()
        });
        
        // 保存到本地
        this.saveLoginState({
          token,
          expireTime,
          userInfo: userData,
          openid: userData._openid,
          userId: userData._id
        });
        
        // 如果是新用户，显示欢迎信息
        if (isNewUser) {
          wx.showToast({
            title: '欢迎来到虫虫小侦探！',
            icon: 'success',
            duration: 2000
          });
        }
        
        return { success: true, isNewUser };
      } else {
        throw new Error(result.result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.clearLoginState();
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2000
      });
      return { success: false, message: error.message };
    }
  },

  // 统一调用游戏云函数
  async callGameService(action, data = {}) {
    // 确保已登录获取 token
    if (!this.checkLoginStatus()) {
      const loginRes = await this.loginCloud();
      if (!loginRes.success) {
        return { success: false, message: '未登录，无法调用游戏服务' };
      }
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'game-service',
        data: {
          action,
          data: {
            ...data,
            token: this.globalData.token
          }
        }
      });
      return result.result;
    } catch (error) {
      console.error('游戏服务调用失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  globalData: {
    // 用户信息
    userInfo: null,
    openid: null,
    userId: null,
    token: null,
    tokenExpireTime: null,
    isLoggedIn: false,
    lastLoginTime: null,
    
    // 系统状态
    db: null, // 云数据库引用
    isRefreshingToken: false, // 数据库中的用户ID
  },

  // 数据库操作工具函数
  async callDatabase(action, data = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'database',
        data: { action, ...data }
      });
      return result.result;
    } catch (error) {
      console.error('数据库操作失败:', error);
      return { success: false, message: '网络错误' };
    }
  },

  // 获取昆虫列表
  async getInsects(type = null, page = 1, limit = 20) {
    return await this.callDatabase('getInsects', { type, page, limit });
  },

  // 获取昆虫详情
  async getInsectById(id) {
    return await this.callDatabase('getInsectById', { id });
  },

  // 获取视频列表
  async getVideos(insectId = null, page = 1, limit = 20) {
    return await this.callDatabase('getVideos', { insectId, page, limit });
  },

  // 获取视频详情
  async getVideoById(id) {
    return await this.callDatabase('getVideoById', { id });
  },

  // 保存游戏记录
  async saveGameRecord(gameData) {
    return await this.callGameService('saveGameRecord', gameData);
  },

  // 获取游戏记录
  async getGameRecords(gameType = null, page = 1, limit = 20) {
    return await this.callGameService('getGameRecords', { 
      gameType, 
      page, 
      pageSize: limit 
    });
  },

  // 保存观察记录
  async saveObservationRecord(observationData) {
    return await this.callDatabase('saveObservationRecord', observationData);
  },

  // 获取观察记录
  async getObservationRecords(insectId = null, page = 1, limit = 20) {
    return await this.callDatabase('getObservationRecords', { 
      userId: this.globalData.userId, 
      insectId, 
      page, 
      limit 
    });
  },

  // 保存评论
  async saveComment(commentData) {
    return await this.callDatabase('saveComment', commentData);
  },

  // 获取评论
  async getComments(observationId, page = 1, limit = 20) {
    return await this.callDatabase('getComments', { observationId, page, limit });
  },

  // 更新学习进度
  async updateLearningProgress(progressData) {
    return await this.callDatabase('updateLearningProgress', progressData);
  },

  // 获取学习进度
  async getLearningProgress(insectId = null) {
    return await this.callDatabase('getLearningProgress', { 
      userId: this.globalData.userId, 
      insectId 
    });
  },

  // 保存判断记录
  async saveJudgeRecord(judgeData) {
    return await this.callDatabase('saveJudgeRecord', judgeData);
  },

  // 获取判断记录
  async getJudgeRecords(page = 1, limit = 20) {
    return await this.callDatabase('getJudgeRecords', { 
      userId: this.globalData.userId, 
      page, 
      limit 
    });
  },

  // 获取拼图配置
  async getPuzzleConfigs(insectId, difficulty = null) {
    return await this.callDatabase('getPuzzleConfigs', { insectId, difficulty });
  }
});
    