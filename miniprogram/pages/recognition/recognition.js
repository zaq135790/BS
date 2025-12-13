// pages/recognition/recognition.js
Page({
  data: {
    imageUrl: '',
    recognizing: false,
    result: null,
    error: null
  },

  onLoad() {
    // 页面加载
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths;
        this.setData({
          imageUrl: tempFilePaths[0],
          result: null,
          error: null
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

  // 开始识别
  async startRecognition() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({
      recognizing: true,
      result: null,
      error: null
    });

    try {
      // 先上传图片到云存储
      const cloudPath = `recognition-images/${Date.now()}-${Math.random().toString(36).substr(2, 10)}.jpg`;
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.imageUrl
      });

      // 获取临时URL用于AI识别
      const tempUrlResult = await wx.cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      });

      const imageUrl = tempUrlResult.fileList[0]?.tempFileURL || uploadResult.fileID;

      // 调用AI服务进行识别
      const result = await wx.cloud.callFunction({
        name: 'ai-service',
        data: {
          action: 'recognizeInsect',
          data: {
            imageUrl: imageUrl,
            fileID: uploadResult.fileID
          }
        }
      });

      console.log('识别结果:', result);

      // 处理返回结果
      if (result.result) {
        if (result.result.success) {
          this.setData({
            result: result.result.data,
            recognizing: false
          });
        } else {
          throw new Error(result.result.message || '识别失败，请重试');
        }
      } else {
        throw new Error('识别服务返回异常，请重试');
      }
    } catch (error) {
      console.error('识别失败:', error);
      this.setData({
        error: error.message || '识别失败，请重试',
        recognizing: false
      });
      wx.showToast({
        title: '识别失败，请重试',
        icon: 'none'
      });
    }
  },

  // 重新选择
  reset() {
    this.setData({
      imageUrl: '',
      result: null,
      error: null
    });
  },

  // 跳转到淘宝
  goToTaobao(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      // 复制链接到剪贴板
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({
            title: '链接已复制，请打开淘宝',
            icon: 'success'
          });
        }
      });
    }
  },

  // 预览图片
  previewImage() {
    if (this.data.imageUrl) {
      wx.previewImage({
        current: this.data.imageUrl,
        urls: [this.data.imageUrl]
      });
    }
  }
});

