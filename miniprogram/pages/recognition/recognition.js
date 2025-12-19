// pages/recognition/recognition.js
Page({
  data: {
    imageUrl: '',
    recognizing: false,
    result: null,
    error: null
  },

  // 清理模型返回中的特殊标记，避免在界面显示
  stripArtifacts(text = '') {
    return String(text || '')
      .replace(/<\s*end_of_[^>]+>/gi, '')
      .replace(/<\|\s*end_of_[^|>]+?\|>/gi, '')
      .replace(/<\s*\/?think[^>]*>/gi, '')
      .replace(/<\|[^|>]+\|>/g, '')
      .trim();
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

      if (result.result) {
        if (result.result.success) {
          const data = result.result.data || {};

          // 添加详细的日志
          console.log('==== 识别结果详情 ====');
          console.log('昆虫名称:', data.insectName);
          console.log('是否害虫:', data.isHarmful);
          console.log('淘宝链接:', data.taobaoLink);
          console.log('防治建议:', data.preventionTip);
          console.log('百科全书长度:', data.encyclopedia?.length);
          console.log('==== END ====');

          const clean = {
            insectName: this.stripArtifacts(data.insectName),
            isHarmful: data.isHarmful || false,
            encyclopedia: this.stripArtifacts(data.encyclopedia),
            taobaoLink: data.taobaoLink, // 直接使用，不清理
            preventionTip: this.stripArtifacts(data.preventionTip)
          };

          // 强制检查：如果是害虫但淘宝链接为空，设置默认链接
          if (clean.isHarmful && (!clean.taobaoLink || clean.taobaoLink.trim() === '')) {
            console.log('⚠️ 检测到害虫但淘宝链接为空，设置默认链接');
            const safeInsectName = clean.insectName
              ? clean.insectName.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '')
              : '';
            if (safeInsectName) {
              const encodedName = encodeURIComponent(safeInsectName + ' 防治');
              clean.taobaoLink = `https://s.taobao.com/search?q=${encodedName}`;
              clean.preventionTip =
                clean.preventionTip ||
                `建议搜索"${clean.insectName} 防治"购买相关产品。`;
            }
          }

          // 再次检查淘宝链接
          if (clean.isHarmful) {
            console.log('✅ 最终淘宝链接:', clean.taobaoLink ? '有链接' : '无链接');
          }

          this.setData({
            result: clean,
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
    // 清空后直接唤起图片选择，让用户无缝继续识别
    this.chooseImage();
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

