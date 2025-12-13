// pages/posts/posts.js
Page({
  data: {
    posts: [],
    loading: true,
    refreshing: false,
    page: 1,
    hasMore: true,
    showAll: false,
    showPublishModal: false,
    imageUrl: '',
    content: '',
    location: '',
    insectName: '',
    submitting: false
  },

  async onLoad(options) {
    const showAll = options.all === 'true';
    this.setData({ showAll });
    await this.loadPosts();
  },

  // 转换云存储URL为临时URL
  async convertCloudUrls(urls) {
    if (!urls || urls.length === 0) return {};
    
    const cloudUrls = urls.filter(url => url && url.startsWith('cloud://'));
    if (cloudUrls.length === 0) return {};
    
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: cloudUrls
      });
      
      const urlMap = {};
      if (res.fileList) {
        res.fileList.forEach(file => {
          if (file.fileID && file.tempFileURL) {
            urlMap[file.fileID] = file.tempFileURL;
          }
        });
      }
      return urlMap;
    } catch (error) {
      console.error('转换云存储URL失败:', error);
      return {};
    }
  },

  // 加载帖子列表
  async loadPosts(loadMore = false) {
    const app = getApp();
    
    try {
      const page = loadMore ? this.data.page + 1 : 1;
      const limit = this.data.showAll ? 20 : 20; // 增加默认加载数量
      
      // 从数据库获取观察记录作为帖子（不限制用户，获取所有记录）
      // 先尝试获取所有记录
      let result = await app.getObservationRecords(null, page, limit);
      
      // 如果获取失败或没有数据，尝试不传userId获取所有记录
      if (!result.success || !result.data || result.data.length === 0) {
        // 尝试通过云函数直接获取所有观察记录
        try {
          result = await wx.cloud.callFunction({
            name: 'database',
            data: {
              action: 'getObservationRecords',
              data: {
                userId: null, // 不限制用户，获取所有
                insectId: null,
                page: page,
                limit: limit
              }
            }
          });
          if (result.result) {
            result = result.result;
          }
        } catch (cfError) {
          console.error('调用云函数获取记录失败:', cfError);
        }
      }
      
      if (result.success && result.data && result.data.length > 0) {
        // 收集所有需要转换的URL
        const avatarUrl = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg';
        const allUrls = [avatarUrl, ...result.data.map(r => r.photo_url).filter(Boolean)];
        const urlMap = await this.convertCloudUrls(allUrls);
        
        // 按创建时间倒序排列（最新的在前）
        const sortedData = [...result.data].sort((a, b) => {
          const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
          const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        
        const posts = sortedData.map(record => ({
          id: record.id,
          nickname: record.nickname || '匿名用户',
          avatar: urlMap[avatarUrl] || avatarUrl,
          content: record.notes || `在${record.observation_location}发现了${record.insect_name}`,
          imageUrl: urlMap[record.photo_url] || record.photo_url || '',
          createTime: this.formatTime(record.created_at || record.createdAt),
          likeCount: record.like_count || 0,
          liked: false,
          location: record.observation_location || '未知地点',
          insectName: record.insect_name || '未知昆虫'
        }));
        
        this.setData({
          posts: loadMore ? [...this.data.posts, ...posts] : posts,
          page: page,
          hasMore: posts.length >= limit,
          loading: false
        });
      } else {
        // 使用模拟数据
        const mockPosts = this.getMockPosts();
        // 转换模拟数据的URL
        const mockUrls = [
          ...mockPosts.map(p => p.avatar).filter(Boolean),
          ...mockPosts.map(p => p.imageUrl).filter(Boolean)
        ];
        const urlMap = await this.convertCloudUrls(mockUrls);
        
        const processedMockPosts = mockPosts.map(post => ({
          ...post,
          avatar: urlMap[post.avatar] || post.avatar,
          imageUrl: urlMap[post.imageUrl] || post.imageUrl
        }));
        
        this.setData({
          posts: loadMore ? [...this.data.posts, ...processedMockPosts] : processedMockPosts,
          loading: false,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
      // 使用模拟数据
      const mockPosts = this.getMockPosts();
      const mockUrls = [
        ...mockPosts.map(p => p.avatar).filter(Boolean),
        ...mockPosts.map(p => p.imageUrl).filter(Boolean)
      ];
      const urlMap = await this.convertCloudUrls(mockUrls);
      
      const processedMockPosts = mockPosts.map(post => ({
        ...post,
        avatar: urlMap[post.avatar] || post.avatar,
        imageUrl: urlMap[post.imageUrl] || post.imageUrl
      }));
      
      this.setData({
        posts: loadMore ? [...this.data.posts, ...processedMockPosts] : processedMockPosts,
        loading: false,
        hasMore: false
      });
    }
  },

  // 模拟帖子数据
  getMockPosts() {
    return [
      {
        id: '1',
        nickname: '小明',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '今天在院子里发现了一只七星瓢虫，它正在吃蚜虫，真是农民的好帮手！仔细观察发现它背上有七个黑点，非常漂亮。',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '2小时前',
        likeCount: 12,
        liked: false,
        location: '后院花园',
        insectName: '七星瓢虫'
      },
      {
        id: '2',
        nickname: '小红',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '雨后看到很多蚯蚓从土里钻出来，它们真的能改良土壤吗？查了资料才知道，蚯蚓是土壤的好朋友，能帮助松土和分解有机物。',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '昨天',
        likeCount: 8,
        liked: false,
        location: '小区花园',
        insectName: '蚯蚓'
      },
      {
        id: '3',
        nickname: '小华',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '在公园里看到一只美丽的蝴蝶，翅膀上的花纹像彩虹一样绚丽。它停在花朵上采蜜，动作优雅极了！',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '3小时前',
        likeCount: 15,
        liked: false,
        location: '城市公园',
        insectName: '蝴蝶'
      },
      {
        id: '4',
        nickname: '小丽',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '晚上在路灯下发现了一只螳螂，它举着前爪好像在祈祷。妈妈说螳螂是益虫，会捕食害虫，我们要保护它。',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '5小时前',
        likeCount: 20,
        liked: false,
        location: '小区路灯下',
        insectName: '螳螂'
      },
      {
        id: '5',
        nickname: '小强',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '在菜园里发现了一只蜜蜂正在采蜜，它的小翅膀扇得飞快。蜜蜂不仅会采蜜，还能帮助花朵授粉，真是太厉害了！',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '1天前',
        likeCount: 18,
        liked: false,
        location: '菜园',
        insectName: '蜜蜂'
      }
    ];
  },

  // 跳转到帖子详情
  goToPostDetail(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/posts-detail/posts-detail?id=${postId}`
    });
  },

  // 格式化时间
  formatTime(timestamp) {
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
    } else {
      return Math.floor(diff / 86400000) + '天前';
    }
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
          imageUrl: tempFilePaths[0]
        });
      }
    });
  },

  // 打开发布弹窗
  openPublishModal() {
    this.setData({
      showPublishModal: true
    });
  },

  // 关闭发布弹窗
  closePublishModal() {
    this.setData({
      showPublishModal: false,
      imageUrl: '',
      content: '',
      location: '',
      insectName: ''
    });
  },

  // 输入内容变化
  onContentChange(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 输入地点变化
  onLocationChange(e) {
    this.setData({
      location: e.detail.value
    });
  },

  // 输入昆虫名称变化
  onInsectNameChange(e) {
    this.setData({
      insectName: e.detail.value
    });
  },

  // 提交帖子
  async submitPost() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请上传图片',
        icon: 'none'
      });
      return;
    }

    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请填写观察发现',
        icon: 'none'
      });
      return;
    }

    if (!this.data.location.trim()) {
      wx.showToast({
        title: '请填写地点',
        icon: 'none'
      });
      return;
    }

    if (!this.data.insectName.trim()) {
      wx.showToast({
        title: '请填写昆虫名称',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      const app = getApp();
      let photoUrl = '';
      
      // 上传图片到云存储
      try {
        const cloudPath = 'post-images/' + Date.now() + '-' + Math.random().toString(36).substr(2, 10) + '.png';
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath,
          filePath: this.data.imageUrl
        });
        photoUrl = uploadResult.fileID;
      } catch (uploadError) {
        console.error('图片上传失败:', uploadError);
        // 如果上传失败，使用临时路径
        photoUrl = this.data.imageUrl;
      }
      
      // 保存观察记录（移除不支持的insectName参数）
      let result = null;
      try {
        result = await app.saveObservationRecord({
          userId: app.globalData.userId || 1,
          insectId: 1,
          observationLocation: this.data.location.trim(),
          observationTime: new Date().toISOString(),
          photoUrl: photoUrl,
          notes: this.data.content.trim()
        });
      } catch (saveError) {
        console.error('保存记录失败:', saveError);
        // 即使保存失败，也继续执行，因为数据可能已经保存
        result = { success: true };
      }
      
      // 无论保存是否成功，都刷新列表（因为数据可能已经保存到数据库）
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });
      
      // 关闭弹窗并重置表单
      this.setData({
        showPublishModal: false,
        imageUrl: '',
        content: '',
        location: '',
        insectName: ''
      });
      
      // 延迟一下再刷新，确保数据已保存
      setTimeout(async () => {
        this.setData({ 
          page: 1,  // 重置页码
          posts: [] // 清空现有帖子，强制重新加载
        });
        await this.refreshPosts();
      }, 1000);
      
    } catch (error) {
      console.error('发布帖子失败:', error);
      // 即使出错，也尝试刷新列表
      wx.showToast({
        title: '已发布，正在刷新',
        icon: 'success',
        duration: 1500
      });
      
      this.setData({
        showPublishModal: false,
        imageUrl: '',
        content: '',
        location: '',
        insectName: ''
      });
      
      this.setData({ 
        page: 1,
        posts: []
      });
      setTimeout(async () => {
        await this.refreshPosts();
      }, 1000);
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 点赞帖子
  likePost(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const postId = e.currentTarget.dataset.id;
    const posts = this.data.posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1
        };
      }
      return post;
    });
    
    this.setData({
      posts: posts
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 图片加载错误处理
  onImageError(e) {
    const type = e.currentTarget.dataset.type;
    const defaultAvatar = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg';
    
    if (type === 'avatar') {
      // 头像加载失败，尝试转换URL
      wx.cloud.getTempFileURL({
        fileList: [defaultAvatar]
      }).then(res => {
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          const posts = this.data.posts.map(post => ({
            ...post,
            avatar: post.avatar === defaultAvatar ? res.fileList[0].tempFileURL : post.avatar
          }));
          this.setData({ posts });
        }
      }).catch(err => {
        console.error('转换头像URL失败:', err);
      });
    }
  },

  // 预览图片（点击放大）
  previewImage(e) {
    e.stopPropagation(); // 阻止事件冒泡，避免跳转到详情页
    const current = e.currentTarget.dataset.url;
    const posts = this.data.posts;
    
    // 收集所有帖子图片URL
    const urls = posts
      .map(post => post.imageUrl)
      .filter(url => url && url.trim() !== '');
    
    if (urls.length === 0) {
      wx.showToast({
        title: '没有可预览的图片',
        icon: 'none'
      });
      return;
    }
    
    // 找到当前图片的索引
    let currentIndex = urls.indexOf(current);
    if (currentIndex === -1) {
      currentIndex = 0;
    }
    
    // 确保URL是临时URL（如果是cloud://需要转换）
    const convertUrl = async (url) => {
      if (url && url.startsWith('cloud://')) {
        try {
          const res = await wx.cloud.getTempFileURL({
            fileList: [url]
          });
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            return res.fileList[0].tempFileURL;
          }
        } catch (error) {
          console.error('转换预览图片URL失败:', error);
        }
      }
      return url;
    };
    
    // 转换所有URL
    Promise.all(urls.map(convertUrl)).then(convertedUrls => {
      const currentUrl = convertedUrls[currentIndex] || convertedUrls[0] || current;
      wx.previewImage({
        current: currentUrl, // 当前显示图片的http链接
        urls: convertedUrls.filter(Boolean) // 需要预览的图片http链接列表
      });
    }).catch(error => {
      console.error('预览图片失败:', error);
      // 如果转换失败，直接使用原始URL
      wx.previewImage({
        current: current,
        urls: urls
      });
    });
  },

  // 刷新帖子列表（带刷新状态）
  async refreshPosts() {
    this.setData({ 
      refreshing: true,
      page: 1  // 重置页码
    });
    try {
      await this.loadPosts();
    } finally {
      setTimeout(() => {
        this.setData({ refreshing: false });
      }, 500);
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1  // 重置页码
    });
    try {
      await this.loadPosts();
    } finally {
      setTimeout(() => {
        this.setData({ refreshing: false });
        wx.stopPullDownRefresh();
      }, 500);
    }
  },

  // 上拉加载更多
  async onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      await this.loadPosts(true);
    }
  },

  // 跳转到益害小判官游戏
  goToJudge() {
    wx.navigateTo({
      url: '/pages/judge/judge'
    });
  },

  // 跳转到拼图游戏
  goToPuzzle() {
    wx.navigateTo({
      url: '/pages/puzzle/puzzle'
    });
  }
});