// pages/search/search.js
const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    searchKeyword: '', // 搜索关键词
    searchResults: [], // 搜索结果
    searchHistory: [], // 搜索历史记录
    allInsects: [], // 所有昆虫数据
    showHistory: true, // 是否显示历史记录
    loading: false
  },

  onLoad() {
    this.loadAllInsects();
    this.loadSearchHistory();
  },

  // 加载所有昆虫数据
  loadAllInsects() {
    const allInsects = [
      ...beneficialInsects.map((item, index) => ({
        id: `b_${index}`,
        name: item.name,
        type: '益虫',
        image: item.cartoonImg || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png'
      })),
      ...harmfulInsects.map((item, index) => ({
        id: `h_${index}`,
        name: item.name,
        type: '害虫',
        image: item.cartoonImg || 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png'
      }))
    ];
    
    this.setData({
      allInsects: allInsects
    });
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('search_history') || [];
      // 只显示最近10条
      const recentHistory = history.slice(0, 10);
      this.setData({
        searchHistory: recentHistory
      });
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      this.setData({
        searchHistory: []
      });
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword || keyword.trim() === '') return;
    
    try {
      let history = wx.getStorageSync('search_history') || [];
      
      // 移除重复项
      history = history.filter(item => item !== keyword);
      
      // 添加到最前面
      history.unshift(keyword);
      
      // 只保留最近20条
      history = history.slice(0, 20);
      
      wx.setStorageSync('search_history', history);
      
      // 更新显示的历史记录
      this.setData({
        searchHistory: history.slice(0, 10)
      });
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword,
      showHistory: keyword.length === 0
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
    this.setData({
      loading: true
    });

    // 模拟搜索延迟
    setTimeout(() => {
      const results = this.data.allInsects.filter(insect => 
        insect.name.includes(keyword)
      );
      
      this.setData({
        searchResults: results,
        loading: false
      });
    }, 100);
  },

  // 点击历史记录
  onHistoryItemTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword,
      showHistory: false
    });
    this.performSearch(keyword);
  },

  // 选择搜索结果
  selectSearchResult(e) {
    const index = e.currentTarget.dataset.index;
    const insect = this.data.searchResults[index];
    
    // 保存搜索历史
    this.saveSearchHistory(this.data.searchKeyword);
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?name=${insect.name}&id=${insect.id}`
    });
  },

  // 清除搜索历史
  clearSearchHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有搜索记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('search_history');
            this.setData({
              searchHistory: []
            });
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          } catch (error) {
            console.error('清除搜索历史失败:', error);
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 删除单条历史记录
  deleteHistoryItem(e) {
    const keyword = e.currentTarget.dataset.keyword;
    try {
      let history = wx.getStorageSync('search_history') || [];
      history = history.filter(item => item !== keyword);
      wx.setStorageSync('search_history', history);
      
      this.setData({
        searchHistory: history.slice(0, 10)
      });
      
      wx.showToast({
        title: '已删除',
        icon: 'success',
        duration: 1000
      });
    } catch (error) {
      console.error('删除历史记录失败:', error);
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});

