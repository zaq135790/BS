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

  // 云登录函数
  loginCloud() {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        userInfo: this.globalData.userInfo
      },
      success: res => {
        console.log('云函数登录成功', res.result);
        if (res.result.success) {
          this.globalData.openid = res.result.openid;
          this.globalData.userId = res.result.userInfo.id;
          
          // 如果是新用户，显示欢迎信息
          if (res.result.isNewUser) {
            wx.showToast({
              title: '欢迎来到虫虫小侦探！',
              icon: 'success',
              duration: 2000
            });
          }
        } else {
          console.error('登录失败:', res.result.error);
        }
      },
      fail: err => {
        console.error('云函数登录失败', err);
      }
    });
  },

  globalData: {
    userInfo: null,
    openid: null,
    db: null, // 云数据库引用
    userId: null // 数据库中的用户ID
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
    return await this.callDatabase('saveGameRecord', gameData);
  },

  // 获取游戏记录
  async getGameRecords(gameType = null, page = 1, limit = 20) {
    return await this.callDatabase('getGameRecords', { 
      userId: this.globalData.userId, 
      gameType, 
      page, 
      limit 
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
    