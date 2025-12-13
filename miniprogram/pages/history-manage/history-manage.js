Page({
  data: {
    historyType: 'browse', // 'browse' 或 'watch'
    browseHistory: [],
    watchHistory: [],
    deleteMode: false, // 是否处于删除模式
    selectedItems: [], // 选中的要删除的项目
    selectedIndexes: [], // 选中的索引列表，用于wxml判断
    selectedMap: {}, // 选中状态映射对象，key为索引，value为true/false
    isAllSelected: false // 是否全选
  },

  onLoad(options) {
    const type = options.type || 'browse';
    this.setData({ historyType: type });
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: type === 'watch' ? '观看记录管理' : '浏览记录管理'
    });
    
    if (type === 'watch') {
      this.loadWatchHistory();
    } else {
      this.loadBrowseHistory();
    }
  },

  onShow() {
    // 每次显示页面时重新加载记录
    if (this.data.historyType === 'watch') {
      this.loadWatchHistory();
    } else {
      this.loadBrowseHistory();
    }
  },

  // 加载浏览记录
  loadBrowseHistory() {
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
      const historyKey = `browse_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      // 按浏览时间倒序排列
      history.sort((a, b) => {
        const timeA = new Date(a.browseTime || 0).getTime();
        const timeB = new Date(b.browseTime || 0).getTime();
        return timeB - timeA;
      });
      
      this.setData({
        browseHistory: history,
        deleteMode: false,
        selectedItems: [],
        selectedIndexes: [],
        selectedMap: {},
        isAllSelected: false
      });
    } catch (error) {
      console.error('加载浏览记录失败:', error);
      this.setData({
        browseHistory: []
      });
    }
  },

  // 切换删除模式
  toggleDeleteMode() {
    this.setData({
      deleteMode: !this.data.deleteMode,
      selectedItems: [],
      selectedIndexes: [],
      selectedMap: {},
      isAllSelected: false
    });
  },

  // 全选/取消全选
  toggleSelectAll() {
    const historyList = this.data.historyType === 'watch' ? this.data.watchHistory : this.data.browseHistory;
    const isAllSelected = this.data.isAllSelected;
    
    if (isAllSelected) {
      // 取消全选
      this.setData({
        selectedItems: [],
        selectedIndexes: [],
        selectedMap: {},
        isAllSelected: false
      });
    } else {
      // 全选
      const allItems = [...historyList];
      const allIndexes = historyList.map((_, index) => parseInt(index)); // 确保是数字类型
      const selectedMap = {};
      allIndexes.forEach(idx => {
        selectedMap[idx] = true;
      });
      this.setData({
        selectedItems: allItems,
        selectedIndexes: allIndexes,
        selectedMap: selectedMap,
        isAllSelected: true
      });
    }
  },

  // 选择/取消选择要删除的项目
  toggleSelectItem(e) {
    const index = parseInt(e.currentTarget.dataset.index); // 确保是数字类型
    const historyList = this.data.historyType === 'watch' ? this.data.watchHistory : this.data.browseHistory;
    const item = historyList[index];
    const selectedItems = [...this.data.selectedItems];
    let selectedIndexes = [...this.data.selectedIndexes].map(idx => parseInt(idx)); // 确保都是数字类型
    const selectedMap = {...this.data.selectedMap}; // 复制选中映射对象
    
    // 根据类型判断唯一标识
    const uniqueKey = this.data.historyType === 'watch' 
      ? (selected => selected.videoId === item.videoId && selected.watchTime === item.watchTime)
      : (selected => selected.insectId === item.insectId && selected.browseTime === item.browseTime);
    
    const itemIndex = selectedItems.findIndex(uniqueKey);
    
    if (itemIndex >= 0) {
      // 取消选择
      selectedItems.splice(itemIndex, 1);
      const idxIndex = selectedIndexes.indexOf(index);
      if (idxIndex >= 0) {
        selectedIndexes.splice(idxIndex, 1);
      }
      delete selectedMap[index]; // 从映射中删除
    } else {
      // 选择
      selectedItems.push(item);
      if (selectedIndexes.indexOf(index) < 0) {
        selectedIndexes.push(index);
      }
      selectedMap[index] = true; // 添加到映射
    }
    
    // 检查是否全选
    const isAllSelected = selectedItems.length === historyList.length && historyList.length > 0;
    
    this.setData({
      selectedItems: selectedItems,
      selectedIndexes: selectedIndexes,
      selectedMap: selectedMap,
      isAllSelected: isAllSelected
    });
  },

  // 删除选中的记录
  deleteSelectedItems() {
    if (this.data.selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要删除的记录',
        icon: 'none'
      });
      return;
    }

    const recordType = this.data.historyType === 'watch' ? '观看记录' : '浏览记录';
    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${this.data.selectedItems.length} 条${recordType}吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performDelete();
        }
      }
    });
  },

  // 执行删除操作
  performDelete() {
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
      const historyKey = this.data.historyType === 'watch' 
        ? `watch_history_${userId}_${userType}`
        : `browse_history_${userId}_${userType}`;
      let history = wx.getStorageSync(historyKey) || [];
      
      // 删除选中的记录
      const selectedItems = this.data.selectedItems;
      if (this.data.historyType === 'watch') {
        history = history.filter(item => {
          return !selectedItems.some(selected => 
            selected.videoId === item.videoId && selected.watchTime === item.watchTime
          );
        });
      } else {
        history = history.filter(item => {
          return !selectedItems.some(selected => 
            selected.insectId === item.insectId && selected.browseTime === item.browseTime
          );
        });
      }
      
      // 保存更新后的记录
      wx.setStorageSync(historyKey, history);
      
      // 重新加载记录
      if (this.data.historyType === 'watch') {
        this.loadWatchHistory();
      } else {
        this.loadBrowseHistory();
      }
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除记录失败:', error);
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  // 格式化浏览时间
  formatBrowseTime(timestamp) {
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
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    }
  },

  // 跳转到详情（昆虫或视频）
  goToDetail(e) {
    // 如果处于删除模式，不跳转，而是切换选择状态
    if (this.data.deleteMode) {
      this.toggleSelectItem(e);
      return;
    }
    
    const item = e.currentTarget.dataset.item;
    if (this.data.historyType === 'watch') {
      // 跳转到视频详情
      wx.navigateTo({
        url: `/pages/video/video?id=${item.videoId}`
      });
    } else {
      // 跳转到昆虫详情
      wx.navigateTo({
        url: `/pages/detail/detail?name=${item.name}&id=${item.insectId}`
      });
    }
  },

  // 加载观看记录
  loadWatchHistory() {
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
      
      // 按观看时间倒序排列
      history.sort((a, b) => {
        const timeA = new Date(a.watchTime || 0).getTime();
        const timeB = new Date(b.watchTime || 0).getTime();
        return timeB - timeA;
      });
      
      this.setData({
        watchHistory: history,
        deleteMode: false,
        selectedItems: [],
        selectedIndexes: [],
        selectedMap: {},
        isAllSelected: false
      });
    } catch (error) {
      console.error('加载观看记录失败:', error);
      this.setData({
        watchHistory: []
      });
    }
  }
});
