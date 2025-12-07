const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    swiperList: [],
    allInsects: [],  // 所有12种昆虫
    featuredInsects: [],  // 当前显示的3种昆虫
    displayedIndices: [],  // 已显示的索引
    searchKeyword: '',
    searchResults: [],
    showSearchResults: false,
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
    // 合并所有昆虫数据
    const allInsects = [
      ...beneficialInsects.map((item, index) => ({
        id: `b_${index}`,
        name: item.name,
        image: item.cartoonImg,
        type: '益虫',
        childDesc: item.childDesc
      })),
      ...harmfulInsects.map((item, index) => ({
        id: `h_${index}`,
        name: item.name,
        image: item.cartoonImg,
        type: '害虫',
        childDesc: item.childDesc
      }))
    ];

    // 生成轮播图数据（使用bj3图片，统一使用同一张图片）
    const swiperList = [
      { id: 1, image: '/images/bj3(1).png', title: '探索昆虫世界' },
      { id: 2, image: '/images/bj3(1).png', title: '发现自然奥秘' },
      { id: 3, image: '/images/bj3(1).png', title: '学习昆虫知识' }
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

  // 搜索功能
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword,
      showSearchResults: keyword.length > 0
    });

    if (keyword.length > 0) {
      this.performSearch(keyword);
    } else {
      this.setData({
        searchResults: []
      });
    }
  },

  // 执行搜索
  performSearch(keyword) {
    const results = this.data.allInsects.filter(insect => 
      insect.name.includes(keyword)
    );
    this.setData({
      searchResults: results
    });
  },

  // 选择搜索结果
  selectSearchResult(e) {
    const index = e.currentTarget.dataset.index;
    const insect = this.data.searchResults[index];
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?name=${insect.name}&id=${insect.id}`
    });
    // 清空搜索
    this.setData({
      searchKeyword: '',
      showSearchResults: false,
      searchResults: []
    });
  },

  // 轮播图点击（不进行任何操作）
  onSwiperTap() {
    // 点击轮播图不进行任何操作
  },

  // 换一换功能
  refreshFeaturedInsects() {
    const { allInsects, displayedIndices } = this.data;
    const totalCount = allInsects.length;
    
    // 如果已经显示过所有昆虫，重新开始
    if (displayedIndices.length >= totalCount) {
      const newIndices = this.getRandomIndices(totalCount, 3, []);
      const newFeatured = newIndices.map(idx => allInsects[idx]);
      this.setData({
        featuredInsects: newFeatured,
        displayedIndices: newIndices
      });
      return;
    }

    // 获取未显示的索引
    const availableIndices = [];
    for (let i = 0; i < totalCount; i++) {
      if (!displayedIndices.includes(i)) {
        availableIndices.push(i);
      }
    }

    // 随机选择3个
    const newIndices = this.getRandomIndices(availableIndices.length, 3, displayedIndices);
    const actualIndices = newIndices.map(idx => availableIndices[idx]);
    const newFeatured = actualIndices.map(idx => allInsects[idx]);

    // 更新已显示索引（合并，避免重复）
    const updatedDisplayed = [...new Set([...displayedIndices, ...actualIndices])];

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
    
    // 随机选择
    for (let i = 0; i < Math.min(needCount, available.length); i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      indices.push(available[randomIndex]);
      available.splice(randomIndex, 1);
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
    wx.switchTab({
      url: '/pages/category/category'
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
  }
});
