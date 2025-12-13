// pages/video/video.js
Page({
  data: {
    videoId: null,
    videoInfo: null,
    loading: true,
    playing: false,
    currentTime: 0,
    duration: 0,
    fullscreen: false,
    fsBusy: false,
    // 双击节流
    lastTapTime: 0,
    showPauseIcon: false,
    relatedVideos: []
  },

  onReady() {
    this.videoCtx = wx.createVideoContext('video-player');
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
        const hydrated = await this.hydrateFileUrls(result.data);
        this.setData({
          videoInfo: hydrated,
          loading: false
        });
        
        // 更新观看次数
        this.updateViewCount();
        this.updateRelatedVideos();
        // 保存观看记录
        this.saveWatchHistory();
      } else {
        // 使用本地静态数据兜底
        const fallback = await this.hydrateFileUrls(this.getStaticVideoData());
        this.setData({
          videoInfo: fallback,
          loading: false
        });
        this.updateRelatedVideos();
        // 保存观看记录
        this.saveWatchHistory();
      }
    } catch (error) {
      console.error('加载视频信息失败:', error);
      const fallback = await this.hydrateFileUrls(this.getStaticVideoData());
      this.setData({
        videoInfo: fallback,
        loading: false
      });
      this.updateRelatedVideos();
      // 保存观看记录
      this.saveWatchHistory();
    }
  },

  // 静态视频数据（与 theater 页一致）
  getStaticVideos() {
    const base = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes';
    const makeTitle = (name) => `了不起的小虫——${name}`;
    const dbmfTitle = '蜜蜂嗡嗡的小趣事';
    const dbyhcTitle = '萤火虫点点的困惑';
    return [
      { id: 'qt',  category: '益虫', insect_name: '蜻蜓', title: makeTitle('蜻蜓'), description: '近距离观察蜻蜓的盘旋与捕食。', video_url: `${base}/qt_蜻蜓/qt.mp4`, thumbnail_url: `${base}/qt_蜻蜓/qt.jpg`, duration: 154, view_count: 1001 },
      { id: 'qxpc',category: '益虫', insect_name: '七星瓢虫', title: makeTitle('七星瓢虫'), description: '小甲虫如何消灭蚜虫，保护庄稼。', video_url: `${base}/qxpc_七星瓢虫/qxpc.mp4`, thumbnail_url: `${base}/qxpc_七星瓢虫/qxpc.jpg`, duration: 138, view_count: 1001 },
      { id: 'qy',  category: '益虫', insect_name: '蚯蚓', title: makeTitle('蚯蚓'), description: '看看蚯蚓如何疏松土壤、帮助植物生长。', video_url: `${base}/qy_蚯蚓/qy.mp4`, thumbnail_url: `${base}/qy_蚯蚓/qy.jpg`, duration: 143, view_count: 1001 },
      { id: 'tl',  category: '益虫', insect_name: '螳螂', title: makeTitle('螳螂'), description: '捕食高手螳螂如何耐心等待猎物。', video_url: `${base}/tl_螳螂/tl.mp4`, thumbnail_url: `${base}/tl_螳螂/tl.jpg`, duration: 119, view_count: 1001 },
      { id: 'zl',  category: '害虫', insect_name: '蟑螂', title: makeTitle('蟑螂'), description: '认识蟑螂的习性与危害，保持环境卫生。', video_url: `${base}/zl_蟑螂/zl.mp4`, thumbnail_url: `${base}/zl_蟑螂/zl.jpg`, duration: 137, view_count: 1001 },
      { id: 'tz',  category: '害虫', insect_name: '跳蚤', title: makeTitle('跳蚤'), description: '显微镜下的跳蚤，惊人的跳跃与防护建议。', video_url: `${base}/tz_跳蚤/tz.mp4`, thumbnail_url: `${base}/tz_跳蚤/tz.jpg`, duration: 121, view_count: 1001 },
      { id: 'wz',  category: '害虫', insect_name: '蚊子', title: makeTitle('蚊子'), description: '了解蚊子的吸血过程与防蚊小妙招。', video_url: `${base}/wz_蚊子/wz.mp4`, thumbnail_url: `${base}/wz_蚊子/wz.jpg`, duration: 139, view_count: 1001 },
      { id: 'xbc', category: '害虫', insect_name: '象鼻虫', title: makeTitle('象鼻虫'), description: '农作物克星象鼻虫，如何防治？', video_url: `${base}/xbc_象鼻虫/xbc.mp4`, thumbnail_url: `${base}/xbc_象鼻虫/xbc.jpg`, duration: 138, view_count: 1001 },
      { id: 'yc',  category: '害虫', insect_name: '蚜虫', title: makeTitle('蚜虫'), description: '蚜虫吸汁危害与瓢虫天敌的故事。', video_url: `${base}/yc_蚜虫/yc.mp4`, thumbnail_url: `${base}/yc_蚜虫/yc.jpg`, duration: 147, view_count: 1001 },
      { id: 'fe',  category: '其他', insect_name: '飞蛾', title: makeTitle('飞蛾'), description: '飞蛾扑火的原因与夜行习性。', video_url: `${base}/fe_飞蛾/fe.mp4`, thumbnail_url: `${base}/fe_飞蛾/fe.jpg`, duration: 124, view_count: 1001 },
      { id: 'c',   category: '其他', insect_name: '蝉', title: makeTitle('蝉'), description: '聆听蝉鸣，了解它们的蜕变与成长。', video_url: `${base}/c_蝉/c.mp4`, thumbnail_url: `${base}/c_蝉/c.jpg`, duration: 131, view_count: 1001 },
      { id: 'yhc', category: '其他', insect_name: '萤火虫', title: makeTitle('萤火虫'), description: '夜空下的微光，萤火虫如何发光？', video_url: `${base}/yhc_萤火虫/yhc.mp4`, thumbnail_url: `${base}/yhc_萤火虫/yhc.jpg`, duration: 126, view_count: 1001 },
      { id: 'dbmf',category: '其他', insect_name: '豆包蜜蜂', title: dbmfTitle, description: '跟随豆包蜜蜂采蜜、酿蜜的旅程。', video_url: `${base}/DB_豆包AL/DBmf.mp4`, thumbnail_url: `${base}/DB_豆包AL/mf.jpg`, duration: 73, view_count: 1001 },
      { id: 'dbyhc',category: '其他', insect_name: '豆包萤火虫', title: dbyhcTitle, description: '豆包主题的萤火虫短片，感受夜色闪烁。', video_url: `${base}/DB_豆包AL/DByhc.mp4`, thumbnail_url: `${base}/DB_豆包AL/yhc.png`, duration: 81, view_count: 1001 }
    ];
  },

  // 根据 id 获取静态数据
  getStaticVideoData() {
    const list = this.getStaticVideos();
    const found = list.find(item => String(item.id) === String(this.data.videoId));
    return (
      found || {
        id: this.data.videoId,
        title: '虫虫小剧场',
        description: '正在加载视频，请稍后重试。',
        video_url: '',
        duration: 0,
        view_count: 0,
        insect_name: ''
      }
    );
  },

  // 生成相关推荐（与当前不同的 3 个）
  updateRelatedVideos() {
    const list = this.getStaticVideos().filter(item => String(item.id) !== String(this.data.videoId));
    this.setData({
      relatedVideos: list.slice(0, 3)
    });
  },

  // 将 cloud:// 转为可播放的临时链接
  async hydrateFileUrls(item) {
    if (!item) return item;
    const need = [];
    if (item.video_url && item.video_url.startsWith('cloud://')) need.push(item.video_url);
    if (item.thumbnail_url && item.thumbnail_url.startsWith('cloud://')) need.push(item.thumbnail_url);
    if (!need.length) return item;
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: need });
      const map = {};
      (res.fileList || []).forEach(f => {
        if (f.fileID && f.tempFileURL) map[f.fileID] = f.tempFileURL;
      });
      return {
        ...item,
        video_url: map[item.video_url] || item.video_url,
        thumbnail_url: map[item.thumbnail_url] || item.thumbnail_url
      };
    } catch (e) {
      console.error('获取临时链接失败', e);
      return item;
    }
  },

  // 更新观看次数
  async updateViewCount() {
    // 这里可以调用云函数更新观看次数
    // 暂时跳过实现
  },

  // 视频双击播放/暂停
  onVideoOverlayTap() {
    const now = Date.now();
    if (now - this.data.lastTapTime < 300) {
      // 双击
      this.togglePlayPause();
      this.setData({ lastTapTime: 0 });
    } else {
      this.setData({ lastTapTime: now });
    }
  },

  togglePlayPause() {
    const ctx = this.videoCtx || wx.createVideoContext('video-player');
    if (this.data.playing) {
      ctx.pause();
      this.setData({ playing: false, showPauseIcon: true });
      setTimeout(() => this.setData({ showPauseIcon: false }), 800);
    } else {
      ctx.play();
      this.setData({ playing: true, showPauseIcon: true });
      setTimeout(() => this.setData({ showPauseIcon: false }), 800);
    }
  },

  // 全屏切换
  toggleFullscreen() {
    const ctx = this.videoCtx || wx.createVideoContext('video-player');
    if (!ctx || this.data.fsBusy) return;

    // 如果已在全屏，直接退出
    if (this.data.fullscreen) {
      this.setData({ fsBusy: true });
      ctx.exitFullScreen({
        complete: () => this.setData({ fsBusy: false })
      });
      return;
    }

    // 进入全屏：先确保正在播放，再按 无方向 / 0 / 90 度双保险尝试
    this.setData({ fsBusy: true });
    ctx.play();

    const tryRequest = (direction) =>
      new Promise((resolve) => {
        ctx.requestFullScreen({
          direction,
          success: () => resolve(true),
          fail: () => resolve(false)
        });
      });

    (async () => {
      // iOS 部分机型对 direction 兼容性差，先尝试不传 direction
      const okNoDir = await tryRequest(undefined);
      const okDefault = okNoDir ? true : await tryRequest(0);
      const okFallback = okDefault ? true : await tryRequest(90);
      if (!okFallback) wx.showToast({ title: '全屏未响应，请再次点击', icon: 'none' });
      this.setData({ fsBusy: false });
    })();
  },

  onFullscreenChange(e) {
    const isFull = e.detail.fullScreen;
    // 事件里兼容性最好，再次解锁状态
    this.setData({ fullscreen: isFull, fsBusy: false });
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

  // 顶部返回（全屏时显示）
  onBackTap() {
    wx.navigateBack({ delta: 1 });
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

  // 点击相关推荐
  onRecommendTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/video/video?id=${id}`
    });
  },

  // 保存观看记录
  saveWatchHistory() {
    if (!this.data.videoInfo) return;
    
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
      const historyKey = `watch_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      const videoInfo = this.data.videoInfo;
      const watchRecord = {
        videoId: videoInfo.id || this.data.videoId,
        title: videoInfo.title || videoInfo.insect_name || '未知视频',
        insectName: videoInfo.insect_name || '',
        thumbnail: videoInfo.thumbnail_url || '',
        category: videoInfo.category || '其他',
        watchTime: new Date().toISOString()
      };
      
      // 检查是否已存在（根据videoId）
      const existingIndex = history.findIndex(item => item.videoId === watchRecord.videoId);
      if (existingIndex >= 0) {
        // 更新观看时间
        history[existingIndex] = watchRecord;
      } else {
        // 添加到开头
        history.unshift(watchRecord);
      }
      
      // 只保留最近50条
      history = history.slice(0, 50);
      wx.setStorageSync(historyKey, history);
    } catch (error) {
      console.error('保存观看记录失败:', error);
    }
  }
});