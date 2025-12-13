const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    activeTab: 'beneficial', // 默认显示益虫
    parentInsects: {
      beneficial: [],
      harmful: []
    },
    currentInsects: [],
    loading: true
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 每次显示页面时重新加载数据
    this.initData(false);
  },

  // 初始化数据
  initData(showLoading = true) {
    if (showLoading) {
      this.setData({ loading: true });
    }

    // 生成家长版数据（科普知识库）
    const parentInsects = {
      beneficial: beneficialInsects.map((item, index) => ({
        id: `pb_${index}`,
        name: item.name,
        image: item.realImg || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        identify: item.adultDesc.identify,
        identifyImage: item.adultDesc.identifyImage || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        guide: item.adultDesc.guide,
        guideImage: item.adultDesc.guideImage || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png'
      })),
      harmful: harmfulInsects.map((item, index) => ({
        id: `ph_${index}`,
        name: item.name,
        image: item.realImg || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        identify: item.adultDesc.identify,
        identifyImage: item.adultDesc.identifyImage || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        guide: item.adultDesc.guide,
        guideImage: item.adultDesc.guideImage || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png'
      }))
    };

    const currentInsects = parentInsects[this.data.activeTab];

    this.setData({
      parentInsects,
      currentInsects,
      loading: false
    });
  },

  // 切换"益虫 / 害虫"
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    const list = this.data.parentInsects[tab];

    this.setData({
      activeTab: tab,
      currentInsects: list
    });
  },

  // 跳转到详情页
  goToDetail(e) {
    const index = e.currentTarget.dataset.index;
    const insect = this.data.currentInsects[index];
    if (!insect) return;
    
    // 跳转到详情页（传递昆虫名称和ID）
    wx.navigateTo({
      url: `/pages/detail/detail?name=${insect.name}&id=${insect.id}`
    });
  },

  // 预览图片（点击放大）
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.urls || [current];
    
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.initData();
    wx.stopPullDownRefresh();
  }
});

