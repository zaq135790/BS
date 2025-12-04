// pages/video/video.js
Page({
  data: {
    videoId: null,
    videoInfo: null,
    loading: true,
    playing: false,
    currentTime: 0,
    duration: 0,
    fullscreen: false
  },

  async onLoad(options) {
    const videoId = options.id;
    this.setData({ videoId });
    await this.loadVideoInfo();
  },

  // 加载视频信息
  async loadVideoInfo() {
    const app = getApp();
    
    try {
      const result = await app.getVideoById(this.data.videoId);
      
      if (result.success && result.data) {
        this.setData({
          videoInfo: result.data,
          loading: false
        });
        
        // 更新观看次数
        this.updateViewCount();
      } else {
        // 使用模拟数据
        this.setData({
          videoInfo: this.getMockVideoData(),
          loading: false
        });
      }
    } catch (error) {
      console.error('加载视频信息失败:', error);
      this.setData({
        videoInfo: this.getMockVideoData(),
        loading: false
      });
    }
  },

  // 模拟视频数据
  getMockVideoData() {
    return {
      id: this.data.videoId,
      title: '蜜蜂的采蜜之旅',
      description: '跟随小蜜蜂一起探索采蜜的奥秘，了解蜜蜂如何采集花粉和花蜜，以及它们在生态系统中的重要作用。',
      video_url: '/videos/bee_collecting.mp4',
      duration: 225, // 3分45秒
      view_count: 1250,
      insect_name: '蜜蜂'
    };
  },

  // 更新观看次数
  async updateViewCount() {
    // 这里可以调用云函数更新观看次数
    // 暂时跳过实现
  },

  // 视频播放事件
  onVideoPlay() {
    this.setData({ playing: true });
  },

  // 视频暂停事件
  onVideoPause() {
    this.setData({ playing: false });
  },

  // 视频播放进度更新
  onVideoTimeUpdate(e) {
    this.setData({
      currentTime: e.detail.currentTime,
      duration: e.detail.duration
    });
  },

  // 视频播放结束
  onVideoEnded() {
    this.setData({ playing: false });
    
    // 可以在这里添加学习进度更新
    this.updateLearningProgress();
  },

  // 更新学习进度
  async updateLearningProgress() {
    const app = getApp();
    
    if (this.data.videoInfo && this.data.videoInfo.insect_id) {
      try {
        await app.updateLearningProgress({
          userId: app.globalData.userId,
          insectId: this.data.videoInfo.insect_id,
          hasLearned: true,
          learnedTimes: 1
        });
      } catch (error) {
        console.error('更新学习进度失败:', error);
      }
    }
  },

  // 全屏切换
  toggleFullscreen() {
    this.setData({
      fullscreen: !this.data.fullscreen
    });
  },

  // 格式化时间
  formatTime(seconds) {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: this.data.videoInfo ? this.data.videoInfo.title : '虫虫小剧场',
      path: `/pages/video/video?id=${this.data.videoId}`,
      imageUrl: this.data.videoInfo ? this.data.videoInfo.thumbnail_url : ''
    };
  }
});