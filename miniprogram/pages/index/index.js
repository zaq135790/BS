Page({
  data: {
    swiperList: [],
    featuredInsects: [],
    loading: true
  },

  async onLoad() {
    await this.loadData();
  },

  async loadData() {
    const app = getApp();
    
    try {
      const defaultImage = '/images/bj3.png';
      // 获取昆虫数据（统一展示默认图片）
      const insectsResult = await app.getInsects(null, 1, 6);
      
      if (insectsResult.success) {
        const insects = insectsResult.data;
        
        // 生成轮播图数据
        const swiperList = insects.slice(0, 3).map(insect => ({
          id: insect.id,
          image: defaultImage,
          title: insect.name
        }));
        
        // 生成特色昆虫数据
        const featuredInsects = insects.map(insect => ({
          id: insect.id,
          name: insect.name,
          image: defaultImage,
          type: insect.type
        }));
        
        this.setData({
          swiperList,
          featuredInsects,
          loading: false
        });
      } else {
        // 如果数据库查询失败，使用模拟数据
        this.setData({
          swiperList: this.getMockSwiperData(),
          featuredInsects: this.getMockFeaturedData(),
          loading: false
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      // 使用模拟数据
      this.setData({
        swiperList: this.getMockSwiperData(),
        featuredInsects: this.getMockFeaturedData(),
        loading: false
      });
    }
  },

  // 模拟轮播图数据
  getMockSwiperData() {
    return [
      { id: 1, image: '/images/bj3.png', title: '蜜蜂' },
      { id: 2, image: '/images/bj3.png', title: '七星瓢虫' },
      { id: 3, image: '/images/bj3.png', title: '螳螂' }
    ];
  },

  // 模拟特色昆虫数据
  getMockFeaturedData() {
    return [
      { id: 1, name: '蜜蜂', image: '/images/bj3.png', type: '益虫' },
      { id: 2, name: '七星瓢虫', image: '/images/bj3.png', type: '益虫' },
      { id: 3, name: '螳螂', image: '/images/bj3.png', type: '益虫' },
      { id: 4, name: '蜻蜓', image: '/images/bj3.png', type: '益虫' },
      { id: 5, name: '蚊子', image: '/images/bj3.png', type: '害虫' },
      { id: 6, name: '蚜虫', image: '/images/bj3.png', type: '害虫' }
    ];
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadData();
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

  goToPosts() {
    wx.navigateTo({
      url: '/pages/posts/posts?all=true'
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
