// pages/theater/theater.js
Page({
  data: {
    videos: [],
    loading: true,
    categories: ['全部', '益虫', '害虫'],
    activeCategory: '全部',
    page: 1,
    hasMore: true
  },

  async onLoad() {
    await this.loadVideos();
  },

  // 加载视频数据
  async loadVideos(loadMore = false) {
    const app = getApp();
    
    try {
      const page = loadMore ? this.data.page + 1 : 1;
      const insectType = this.data.activeCategory === '全部' ? null : this.data.activeCategory;
      
      // 根据分类获取视频
      let result;
      if (insectType) {
        // 先获取对应类型的昆虫ID
        const insectsResult = await app.getInsects(insectType, 1, 100);
        if (insectsResult.success) {
          const insectIds = insectsResult.data.map(insect => insect.id);
          // 获取这些昆虫的视频
          result = await app.getVideos(null, page, 20);
          if (result.success) {
            result.data = result.data.filter(video => insectIds.includes(video.insect_id));
          }
        } else {
          result = { success: false, data: [] };
        }
      } else {
        result = await app.getVideos(null, page, 20);
      }
      
      if (result.success) {
        const videos = result.data.map(video => ({
          ...video,
          duration: this.formatDuration(video.duration),
          createTime: this.formatTime(video.created_at)
        }));
        
        this.setData({
          videos: loadMore ? [...this.data.videos, ...videos] : videos,
          page: page,
          hasMore: videos.length >= 20,
          loading: false
        });
      } else {
        // 使用模拟数据
        this.setData({
          videos: loadMore ? [...this.data.videos, ...this.getMockVideos()] : this.getMockVideos(),
          loading: false,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('加载视频失败:', error);
      this.setData({
        videos: loadMore ? [...this.data.videos, ...this.getMockVideos()] : this.getMockVideos(),
        loading: false,
        hasMore: false
      });
    }
  },

  // 模拟视频数据
  getMockVideos() {
    return [
      {
        id: 1,
        title: '蜜蜂的采蜜之旅',
        description: '跟随小蜜蜂一起探索采蜜的奥秘',
        video_url: '/videos/bee_collecting.mp4',
        duration: '3:45',
        view_count: 1250,
        insect_name: '蜜蜂',
        createTime: '2天前'
      },
      {
        id: 2,
        title: '七星瓢虫的一天',
        description: '看看七星瓢虫是如何捕食蚜虫的',
        video_url: '/videos/ladybug_hunting.mp4',
        duration: '2:30',
        view_count: 980,
        insect_name: '七星瓢虫',
        createTime: '3天前'
      },
      {
        id: 3,
        title: '螳螂的捕食技巧',
        description: '螳螂是如何成为捕食高手的',
        video_url: '/videos/mantis_hunting.mp4',
        duration: '4:12',
        view_count: 1560,
        insect_name: '螳螂',
        createTime: '5天前'
      }
    ];
  },

  // 切换分类
  async switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: category,
      page: 1,
      hasMore: true
    });
    
    await this.loadVideos();
  },

  // 播放视频
  playVideo(e) {
    const videoId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/video/video?id=${videoId}`
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadVideos();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  async onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      await this.loadVideos(true);
    }
  },

  // 格式化时长
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // 格式化时间
  formatTime(timestamp) {
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
    } else {
      return Math.floor(diff / 86400000) + '天前';
    }
  }
});