const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    swiperList: [],
    allInsects: [],  // 所有12种昆虫
    featuredInsects: [],  // 当前显示的3种昆虫
    displayedIndices: [],  // 已显示的索引
    userRole: 'child'  // 当前用户身份
  },

  onLoad() {
    this.initData();
    this.loadUserRole();
  },

  onShow() {
    // 每次显示页面时重新加载用户身份
    this.loadUserRole();
  },

  // 加载用户身份
  loadUserRole() {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userInfoKey = `user_info_${userId}`;
    const storedUserInfo = wx.getStorageSync(userInfoKey);
    
    if (storedUserInfo && storedUserInfo.user_type) {
      this.setData({
        userRole: storedUserInfo.user_type
      });
    }
  },

  // 初始化数据
  initData() {
    const defaultImg = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png';
    // 合并所有昆虫数据
    const allInsects = [
      ...beneficialInsects.map((item, index) => ({
        id: `b_${index}`,
        name: item.name,
        image: item.cartoonImg || defaultImg,
        type: '益虫',
        childDesc: item.childDesc
      })),
      ...harmfulInsects.map((item, index) => ({
        id: `h_${index}`,
        name: item.name,
        image: item.cartoonImg || defaultImg,
        type: '害虫',
        childDesc: item.childDesc
      }))
    ];

    // 生成轮播图数据
    const cloudBase = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image';
    const swiperList = [
      { id: 1, image: `${cloudBase}/lbt1.jpg`, title: '探索昆虫世界' },
      { id: 2, image: `${cloudBase}/lbt2.jpg`, title: '发现自然奥秘' },
      { id: 3, image: `${cloudBase}/lbt3.jpg`, title: '学习昆虫知识' }
    ];

    // 初始化精选昆虫（前3个）
    const featuredInsects = allInsects.slice(0, 3);
    const displayedIndices = [0, 1, 2];

    this.setData({
      allInsects,
      swiperList,
      featuredInsects,
      displayedIndices
    });
  },

  // 跳转到搜索页面
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 轮播图点击（不进行任何操作）
  onSwiperTap() {
    // 点击轮播图不进行任何操作
  },

  // 换一换功能
  refreshFeaturedInsects() {
    const { allInsects, displayedIndices, featuredInsects } = this.data;
    const totalCount = allInsects.length;
    
    // 获取当前显示的3个昆虫的索引
    const currentIndices = featuredInsects.map(item => {
      return allInsects.findIndex(insect => insect.id === item.id);
    }).filter(idx => idx >= 0);
    
    // 如果已经显示过所有昆虫，重新开始（可以随机到第一次的）
    if (displayedIndices.length >= totalCount) {
      const newIndices = this.getRandomIndices(totalCount, 3, []);
      const newFeatured = newIndices.map(idx => allInsects[idx]);
      this.setData({
        featuredInsects: newFeatured,
        displayedIndices: newIndices
      });
      wx.showToast({
        title: '已刷新',
        icon: 'success',
        duration: 1000
      });
      return;
    }

    // 获取未显示的索引（排除当前显示的3个）
    const availableIndices = [];
    for (let i = 0; i < totalCount; i++) {
      if (!displayedIndices.includes(i)) {
        availableIndices.push(i);
      }
    }

    // 如果可用的索引不足3个，说明已经显示过大部分，可以重新开始
    if (availableIndices.length < 3) {
      const newIndices = this.getRandomIndices(totalCount, 3, []);
      const newFeatured = newIndices.map(idx => allInsects[idx]);
      this.setData({
        featuredInsects: newFeatured,
        displayedIndices: newIndices
      });
      wx.showToast({
        title: '已刷新',
        icon: 'success',
        duration: 1000
      });
      return;
    }

    // 从可用索引中随机选择3个
    const shuffled = [...availableIndices].sort(() => Math.random() - 0.5);
    const selectedIndices = shuffled.slice(0, 3);
    const newFeatured = selectedIndices.map(idx => allInsects[idx]);

    // 更新已显示索引（合并，避免重复）
    const updatedDisplayed = [...new Set([...displayedIndices, ...selectedIndices])];

    this.setData({
      featuredInsects: newFeatured,
      displayedIndices: updatedDisplayed
    });

    wx.showToast({
      title: '已刷新',
      icon: 'success',
      duration: 1000
    });
  },

  // 获取随机索引（确保不重复）
  getRandomIndices(maxCount, needCount, excludeIndices) {
    const indices = [];
    const available = [];
    for (let i = 0; i < maxCount; i++) {
      if (!excludeIndices.includes(i)) {
        available.push(i);
      }
    }
    
    // 随机打乱
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    
    // 选择前needCount个
    for (let i = 0; i < Math.min(needCount, shuffled.length); i++) {
      indices.push(shuffled[i]);
    }
    
    return indices;
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.initData();
    wx.stopPullDownRefresh();
  },

  // 页面跳转
  goToCategory() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  goToGame() {
    wx.switchTab({
      url: '/pages/game/game'
    });
  },

  goToTheater() {
    wx.switchTab({
      url: '/pages/theater/theater'
    });
  },

  // 畅所欲言（家长版功能）
  goToPosts() {
    if (this.data.userRole === 'child') {
      this.showChildReminder('posts');
      return;
    }
    wx.navigateTo({
      url: '/pages/posts/posts?all=true'
    });
  },

  // 科普知识库（家长版功能）
  goToKnowledgeBase() {
    if (this.data.userRole === 'child') {
      this.showChildReminder('knowledge');
      return;
    }
    wx.navigateTo({
      url: '/pages/knowledge/knowledge'
    });
  },

  // 虫虫识别（儿童和家长都可用）
  goToInsectRecognition() {
    wx.navigateTo({
      url: '/pages/recognition/recognition'
    });
  },

  // 显示儿童提醒（随机3句话）
  showChildReminder(type) {
    const reminders = [
      '小朋友，可不要随意点击我哦～等你长大了再来探索吧！',
      '这是给大人们准备的功能，小朋友先去看看虫虫图鉴吧！',
      '等你变成家长身份后，就可以使用这个功能啦！'
    ];
    const randomIndex = Math.floor(Math.random() * reminders.length);
    wx.showModal({
      title: '温馨提示',
      content: reminders[randomIndex],
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#4CAF50'
    });
  },

  // 跳转到详情页（从精选昆虫点击）
  goToDetail(e) {
    const index = e.currentTarget.dataset.index;
    const insect = this.data.featuredInsects[index];
    if (!insect) return;
    
    // 跳转到详情页（传递昆虫名称）
    wx.navigateTo({
      url: `/pages/detail/detail?name=${insect.name}&id=${insect.id}`
    });
  },

});