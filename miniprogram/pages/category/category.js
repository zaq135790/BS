const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    activeTab: 'beneficial', // 默认显示益虫
    role: 'child', // 当前身份：child / parent
    // 儿童版：只用动漫图 + 儿童版口诀
    childInsects: {
      beneficial: [],
      harmful: []
    },
    // 家长版：实拍图 + 识别要点 + 指导建议
    parentInsects: {
      beneficial: [],
      harmful: []
    },
    currentInsects: [],
    loading: true
  },

  onLoad() {
    this.initRoleAndData();
  },

  onShow() {
    // 返回该页面时再次确认身份，避免从“我的”切换身份后数据不一致
    this.initRoleAndData(false);
  },

  // 初始化当前身份与昆虫数据
  initRoleAndData(showLoading = true) {
    if (showLoading) {
      this.setData({ loading: true });
    }

    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userInfoKey = `user_info_${userId}`;
    const storedUserInfo = wx.getStorageSync(userInfoKey) || {};
    const role = storedUserInfo.user_type || 'parent';

    // 生成儿童版 & 家长版两套数据
    const childInsects = {
      beneficial: beneficialInsects.map((item, index) => ({
        id: `b_${index}`,
        name: item.name,
        image: item.cartoonImg,
        childDesc: item.childDesc
      })),
      harmful: harmfulInsects.map((item, index) => ({
        id: `h_${index}`,
        name: item.name,
        image: item.cartoonImg,
        childDesc: item.childDesc
      }))
    };

    const parentInsects = {
      beneficial: beneficialInsects.map((item, index) => ({
        id: `pb_${index}`,
        name: item.name,
        image: item.realImg,
        identify: item.adultDesc.identify,
        guide: item.adultDesc.guide
      })),
      harmful: harmfulInsects.map((item, index) => ({
        id: `ph_${index}`,
        name: item.name,
        image: item.realImg,
        identify: item.adultDesc.identify,
        guide: item.adultDesc.guide
      }))
    };

    const currentInsects =
      role === 'child'
        ? childInsects[this.data.activeTab]
        : parentInsects[this.data.activeTab];

    this.setData({
      role,
      childInsects,
      parentInsects,
      currentInsects,
      loading: false
    });
  },

  // 切换"益虫 / 害虫"
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    const { role, childInsects, parentInsects } = this.data;
    const list = role === 'child' ? childInsects[tab] : parentInsects[tab];

    this.setData({
      activeTab: tab,
      currentInsects: list
    });
  },

  // 跳转到详情页（从图鉴点击）
  goToDetail(e) {
    const index = e.currentTarget.dataset.index;
    const insect = this.data.currentInsects[index];
    if (!insect) return;
    
    // 跳转到详情页（传递昆虫名称和ID）
    wx.navigateTo({
      url: `/pages/detail/detail?name=${insect.name}&id=${insect.id}`
    });
  }
});
