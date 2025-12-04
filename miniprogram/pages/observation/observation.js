// pages/observation/observation.js
Page({
  data: {
    insectId: null,
    insectInfo: null,
    observationData: {
      location: '',
      time: '',
      notes: '',
      photoUrl: ''
    },
    loading: true,
    submitting: false
  },

  async onLoad(options) {
    const insectId = options.insectId;
    this.setData({ insectId });
    await this.loadInsectInfo();
    this.setDefaultTime();
  },

  // 加载昆虫信息
  async loadInsectInfo() {
    const app = getApp();
    
    try {
      const result = await app.getInsectById(this.data.insectId);
      
      if (result.success && result.data) {
        this.setData({
          insectInfo: result.data,
          loading: false
        });
      } else {
        this.setData({
          loading: false
        });
      }
    } catch (error) {
      console.error('加载昆虫信息失败:', error);
      this.setData({
        loading: false
      });
    }
  },

  // 设置默认时间
  setDefaultTime() {
    const now = new Date();
    const timeString = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    
    this.setData({
      'observationData.time': timeString
    });
  },

  // 输入变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`observationData.${field}`]: value
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'observationData.photoUrl': tempFilePath
        });
      },
      fail: err => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览图片
  previewImage() {
    if (!this.data.observationData.photoUrl) return;
    
    wx.previewImage({
      urls: [this.data.observationData.photoUrl],
      current: this.data.observationData.photoUrl
    });
  },

  // 删除图片
  deleteImage() {
    this.setData({
      'observationData.photoUrl': ''
    });
  },

  // 提交观察记录
  async submitObservation() {
    const { location, time, notes, photoUrl } = this.data.observationData;
    
    if (!location.trim()) {
      wx.showToast({
        title: '请输入观察地点',
        icon: 'none'
      });
      return;
    }
    
    if (!time) {
      wx.showToast({
        title: '请选择观察时间',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    try {
      const app = getApp();
      let finalPhotoUrl = photoUrl;
      
      // 如果有图片，先上传到云存储
      if (photoUrl) {
        const cloudPath = `observation-images/${Date.now()}-${Math.random().toString(36).substr(2, 10)}.jpg`;
        
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath,
          filePath: photoUrl
        });
        
        finalPhotoUrl = uploadResult.fileID;
      }
      
      // 保存观察记录
      const result = await app.saveObservationRecord({
        userId: app.globalData.userId,
        insectId: this.data.insectId,
        observationLocation: location,
        observationTime: time,
        photoUrl: finalPhotoUrl,
        notes: notes
      });
      
      if (result.success) {
        wx.showToast({
          title: '记录保存成功',
          icon: 'success'
        });
        
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.message || '保存失败');
      }
      
    } catch (error) {
      console.error('保存观察记录失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});


