// pages/posts/posts.js
Page({
  data: {
    posts: [],
    loading: true,
    page: 1,
    hasMore: true,
    showAll: false,
    imageUrl: '',
    content: '',
    submitting: false
  },

  async onLoad(options) {
    const showAll = options.all === 'true';
    this.setData({ showAll });
    await this.loadPosts();
  },

  // 加载帖子列表
  async loadPosts(loadMore = false) {
    const app = getApp();
    
    try {
      const page = loadMore ? this.data.page + 1 : 1;
      const limit = this.data.showAll ? 20 : 6;
      
      // 从数据库获取观察记录作为帖子
      const result = await app.getObservationRecords(null, page, limit);
      
      if (result.success) {
        const posts = result.data.map(record => ({
          id: record.id,
          nickname: record.nickname || '匿名用户',
          avatar: '/images/avatars/default.png',
          content: record.notes || `在${record.observation_location}发现了${record.insect_name}`,
          imageUrl: record.photo_url,
          createTime: this.formatTime(record.created_at),
          likeCount: record.like_count || 0,
          liked: false,
          location: record.observation_location,
          insectName: record.insect_name
        }));
        
        this.setData({
          posts: loadMore ? [...this.data.posts, ...posts] : posts,
          page: page,
          hasMore: posts.length >= limit,
          loading: false
        });
      } else {
        // 使用模拟数据
        this.setData({
          posts: loadMore ? [...this.data.posts, ...this.getMockPosts()] : this.getMockPosts(),
          loading: false,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
      this.setData({
        posts: loadMore ? [...this.data.posts, ...this.getMockPosts()] : this.getMockPosts(),
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
        avatar: '/images/avatars/avatar1.png',
        content: '今天在院子里发现了一只七星瓢虫，它正在吃蚜虫，真是农民的好帮手！',
        imageUrl: '/images/posts/post1.jpg',
        createTime: '2小时前',
        likeCount: 12,
        liked: false,
        location: '后院花园',
        insectName: '七星瓢虫'
      },
      {
        id: '2',
        nickname: '小红',
        avatar: '/images/avatars/avatar2.png',
        content: '雨后看到很多蚯蚓从土里钻出来，它们真的能改良土壤吗？',
        imageUrl: '/images/posts/post2.jpg',
        createTime: '昨天',
        likeCount: 8,
        liked: false,
        location: '小区花园',
        insectName: '蚯蚓'
      }
    ];
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

  // 输入内容变化
  onContentChange(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 提交帖子
  async submitPost() {
    if (!this.data.imageUrl || !this.data.content) {
      wx.showToast({
        title: '请上传图片和填写内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      const app = getApp();
      
      // 上传图片到云存储
      const cloudPath = 'post-images/' + Date.now() + '-' + Math.random().toString(36).substr(2, 10) + '.png';
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.imageUrl
      });
      
      // 保存观察记录
      const result = await app.saveObservationRecord({
        userId: app.globalData.userId,
        insectId: 1, // 默认昆虫ID，实际应该让用户选择
        observationLocation: '用户分享',
        observationTime: new Date().toISOString(),
        photoUrl: uploadResult.fileID,
        notes: this.data.content
      });
      
      if (result.success) {
        wx.showToast({
          title: '发布成功'
        });
        
        // 重置表单
        this.setData({
          imageUrl: '',
          content: ''
        });
        
        // 重新加载帖子列表
        await this.loadPosts();
      } else {
        throw new Error(result.message || '发布失败');
      }
      
    } catch (error) {
      console.error('发布帖子失败:', error);
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 点赞帖子
  likePost(e) {
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

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadPosts();
    wx.stopPullDownRefresh();
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