// pages/theater/theater.js
Page({
  data: {
    videos: [],
    loading: true,
    categories: ['全部', '益虫', '害虫', '其他'],
    activeCategory: '全部',
    page: 1,
    hasMore: false
  },

  async onLoad() {
    await this.loadVideos();
  },

  // 加载视频数据（使用云存储地址的本地映射）
  async loadVideos() {
    try {
      const allVideos = this.getMockVideos();
      const { activeCategory } = this.data;
      const filtered =
        activeCategory === '全部'
          ? allVideos
          : allVideos.filter(v => v.category === activeCategory);

      this.setData({
        videos: filtered,
        loading: false,
        hasMore: false,
        page: 1
      });
    } catch (error) {
      console.error('加载视频失败:', error);
      this.setData({
        videos: this.getMockVideos(),
        loading: false,
        hasMore: false
      });
    }
  },

  // 视频数据（云存储映射，含 14 条）
  getMockVideos() {
    const base = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/videos';
    const makeTitle = (name) => `了不起的小虫——${name}`;
    const dbmfTitle = '蜜蜂嗡嗡的小趣事';
    const dbyhcTitle = '萤火虫点点';
    return [
      // 益虫
      {
        id: 'qt',
        category: '益虫',
        insect_name: '蜻蜓',
        title: makeTitle('蜻蜓'),
        description: '近距离观察蜻蜓的盘旋与捕食。',
        video_url: `${base}/qt_蜻蜓/qt.mp4`,
        thumbnail_url: `${base}/qt_蜻蜓/qt.jpg`,
        duration: '02:34',
        view_count: '1000+'
      },
      {
        id: 'qxpc',
        category: '益虫',
        insect_name: '七星瓢虫',
        title: makeTitle('七星瓢虫'),
        description: '小甲虫如何消灭蚜虫，保护庄稼。',
        video_url: `${base}/qxpc_七星瓢虫/qxpc.mp4`,
        thumbnail_url: `${base}/qxpc_七星瓢虫/qxpc.jpg`,
        duration: '02:18',
        view_count: '1000+'
      },
      {
        id: 'qy',
        category: '益虫',
        insect_name: '蚯蚓',
        title: makeTitle('蚯蚓'),
        description: '看看蚯蚓如何疏松土壤、帮助植物生长。',
        video_url: `${base}/qy_蚯蚓/qy.mp4`,
        thumbnail_url: `${base}/qy_蚯蚓/qy.jpg`,
        duration: '02:23',
        view_count: '1000+'
      },
      {
        id: 'tl',
        category: '益虫',
        insect_name: '螳螂',
        title: makeTitle('螳螂'),
        description: '捕食高手螳螂如何耐心等待猎物。',
        video_url: `${base}/tl_螳螂/tl.mp4`,
        thumbnail_url: `${base}/tl_螳螂/tl.jpg`,
        duration: '01:59',
        view_count: '1000+'
      },
      // 害虫
      {
        id: 'zl',
        category: '害虫',
        insect_name: '蟑螂',
        title: makeTitle('蟑螂'),
        description: '认识蟑螂的习性与危害，保持环境卫生。',
        video_url: `${base}/zl_蟑螂/zl.mp4`,
        thumbnail_url: `${base}/zl_蟑螂/zl.jpg`,
        duration: '02:17',
        view_count: '1000+'
      },
      {
        id: 'tz',
        category: '害虫',
        insect_name: '跳蚤',
        title: makeTitle('跳蚤'),
        description: '显微镜下的跳蚤，惊人的跳跃与防护建议。',
        video_url: `${base}/tz_跳蚤/tz.mp4`,
        thumbnail_url: `${base}/tz_跳蚤/tz.jpg`,
        duration: '02:01',
        view_count: '1000+'
      },
      {
        id: 'wz',
        category: '害虫',
        insect_name: '蚊子',
        title: makeTitle('蚊子'),
        description: '了解蚊子的吸血过程与防蚊小妙招。',
        video_url: `${base}/wz_蚊子/wz.mp4`,
        thumbnail_url: `${base}/wz_蚊子/wz.jpg`,
        duration: '02:19',
        view_count: '1000+'
      },
      {
        id: 'xbc',
        category: '害虫',
        insect_name: '象鼻虫',
        title: makeTitle('象鼻虫'),
        description: '农作物克星象鼻虫，如何防治？',
        video_url: `${base}/xbc_象鼻虫/xbc.mp4`,
        thumbnail_url: `${base}/xbc_象鼻虫/xbc.jpg`,
        duration: '02:18',
        view_count: '1000+'
      },
      {
        id: 'yc',
        category: '害虫',
        insect_name: '蚜虫',
        title: makeTitle('蚜虫'),
        description: '蚜虫吸汁危害与瓢虫天敌的故事。',
        video_url: `${base}/yc_蚜虫/yc.mp4`,
        thumbnail_url: `${base}/yc_蚜虫/yc.jpg`,
        duration: '02:27',
        view_count: '1000+'
      },
      // 其他
      {
        id: 'fe',
        category: '其他',
        insect_name: '飞蛾',
        title: makeTitle('飞蛾'),
        description: '飞蛾扑火的原因与夜行习性。',
        video_url: `${base}/fe_飞蛾/fe.mp4`,
        thumbnail_url: `${base}/fe_飞蛾/fe.jpg`,
        duration: '02:04',
        view_count: '1000+'
      },
      {
        id: 'c',
        category: '其他',
        insect_name: '蝉',
        title: makeTitle('蝉'),
        description: '聆听蝉鸣，了解它们的蜕变与成长。',
        video_url: `${base}/c_蝉/c.mp4`,
        thumbnail_url: `${base}/c_蝉/c.jpg`,
        duration: '02:11',
        view_count: '1000+'
      },
      {
        id: 'yhc',
        category: '其他',
        insect_name: '萤火虫',
        title: makeTitle('萤火虫'),
        description: '夜空下的微光，萤火虫如何发光？',
        video_url: `${base}/yhc_萤火虫/yhc.mp4`,
        // 按文件命名约定优先用 jpg，如无则可换回 png
        thumbnail_url: `${base}/yhc_萤火虫/yhc.jpg`,
        duration: '02:06',
        view_count: '1000+'
      },
      {
        id: 'dbmf',
        category: '其他',
        insect_name: '豆包蜜蜂',
        title: dbmfTitle,
        description: '跟随豆包蜜蜂采蜜、酿蜜的旅程。',
        video_url: `${base}/DB_豆包AL/DBmf.mp4`,
        thumbnail_url: `${base}/DB_豆包AL/mf.jpg`,
        duration: '01:13',
        view_count: '1000+'
      },
      {
        id: 'dbyhc',
        category: '其他',
        insect_name: '豆包萤火虫',
        title: dbyhcTitle,
        description: '豆包主题的萤火虫短片，感受夜色闪烁。',
        video_url: `${base}/DB_豆包AL/DByhc.mp4`,
        thumbnail_url: `${base}/DB_豆包AL/yhc.png`,
        duration: '01:21',
        view_count: '1000+'
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

  // 上拉加载更多（本地数据，无更多）
  async onReachBottom() {
    // 本地静态数据，直接标记无更多
    this.setData({ hasMore: false });
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