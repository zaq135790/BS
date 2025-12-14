// pages/posts-detail/posts-detail.js
Page({
  data: {
    postId: '',
    post: null,
    comments: [],
    loading: true,
    commentInput: '',
    showEmojiPicker: false,
    submitting: false,
    liked: false,
    emojis: ['👍', '❤️', '😊', '😄', '😍', '🤔', '😮', '😢', '😡', '👏', '🙏', '🎉', '🔥', '💯', '✨', '🌟', '💪', '🙌', '😎', '🤗', '😘', '🥰', '😋', '🤩']
  },

  onLoad(options) {
    const postId = options.id;
    if (postId) {
      this.setData({ postId });
      this.loadPostDetail(postId);
    }
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

  // 加载帖子详情
  async loadPostDetail(postId) {
    const app = getApp();
    
    try {
      this.setData({ loading: true });
      
      const result = await app.getPostDetail(postId);
      
      if (result.success && result.data) {
        const postData = result.data;
        
        // 收集所有需要转换的URL（头像和图片）
        const allUrls = [];
        if (postData.user && postData.user.avatarUrl) {
          allUrls.push(postData.user.avatarUrl);
        }
        if (postData.images && Array.isArray(postData.images) && postData.images.length > 0) {
          allUrls.push(...postData.images.filter(Boolean));
        }
        if (postData.comments && postData.comments.length > 0) {
          postData.comments.forEach(comment => {
            if (comment.user && comment.user.avatarUrl) {
              allUrls.push(comment.user.avatarUrl);
            }
          });
        }
        
        const urlMap = await this.convertCloudUrls(allUrls);
        
        // 转换帖子数据
        const defaultAvatar = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg';
        const avatarUrl = postData.user?.avatarUrl || defaultAvatar;
        const imageUrl = postData.images && postData.images.length > 0 ? postData.images[0] : '';
        
        // 转换图片数组
        const images = (postData.images || []).map(img => {
          return urlMap[img] || img;
        });
        
        const post = {
          id: postData._id || postData.id,
          userId: postData.userId,
          nickname: postData.user?.nickName || postData.user?.nickname || '未知用户',
          avatar: urlMap[avatarUrl] || avatarUrl,
          content: postData.content || '',
          imageUrl: imageUrl ? (urlMap[imageUrl] || imageUrl) : '', // 保留单图兼容
          images: images, // 多图支持
          createTime: this.formatTime(postData.createTime || postData.created_at),
          likeCount: postData.likeCount || postData.like_count || 0,
          commentCount: postData.commentCount || postData.comment_count || 0,
          viewCount: postData.viewCount || postData.view_count || 0,
          location: postData.location || '',
          insectName: postData.insectName || postData.insect_name || ''
        };
        
        // 转换评论数据
        const comments = (postData.comments || []).map(comment => {
          const commentAvatarUrl = comment.user?.avatarUrl || defaultAvatar;
          return {
            id: comment._id || comment.id,
            userId: comment.userId,
            nickname: comment.user?.nickName || comment.user?.nickname || '未知用户',
            avatar: urlMap[commentAvatarUrl] || commentAvatarUrl,
            content: comment.content || '',
            createTime: this.formatTime(comment.createTime || comment.created_at),
            replyTo: comment.replyTo || comment.reply_to,
            replyToNickname: comment.replyToNickname || null
          };
        });
        
        this.setData({
          post: post,
          comments: comments,
          liked: postData.isLiked || false,
          loading: false
        });
      } else {
        wx.showToast({
          title: result.message || '帖子不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        this.setData({ loading: false });
      }
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      this.setData({ loading: false });
    }
  },

  // 点赞帖子
  async likePost() {
    const app = getApp();
    const postId = this.data.postId;
    const currentLiked = this.data.liked;
    
    // 乐观更新
    const newLiked = !currentLiked;
    const post = this.data.post;
    this.setData({
      liked: newLiked,
      'post.likeCount': newLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1)
    });
    
    // 调用后端接口
    try {
      const result = await app.likePost(postId);
      if (!result.success) {
        // 如果失败，恢复原状态
        this.setData({
          liked: currentLiked,
          'post.likeCount': post.likeCount
        });
        wx.showToast({
          title: result.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
      // 恢复原状态
      this.setData({
        liked: currentLiked,
        'post.likeCount': post.likeCount
      });
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  // 输入评论
  onCommentInput(e) {
    this.setData({
      commentInput: e.detail.value
    });
  },

  // 显示/隐藏表情选择器
  toggleEmojiPicker() {
    this.setData({
      showEmojiPicker: !this.data.showEmojiPicker
    });
  },

  // 选择表情
  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    this.setData({
      commentInput: this.data.commentInput + emoji,
      showEmojiPicker: false
    });
  },

  // 提交评论
  async submitComment() {
    const content = this.data.commentInput.trim();
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    const postId = this.data.postId;
    
    this.setData({ submitting: true });

    try {
      const result = await app.createComment({
        postId: postId,
        content: content
      });
      
      if (result.success) {
        // 重新加载帖子详情以获取最新评论
        await this.loadPostDetail(postId);
        
        this.setData({
          commentInput: '',
          submitting: false
        });

        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.message || '评论失败',
          icon: 'none'
        });
        this.setData({ submitting: false });
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      wx.showToast({
        title: '评论失败，请重试',
        icon: 'none'
      });
      this.setData({ submitting: false });
    }
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

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 预览图片
  async previewImage(e) {
    const current = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls || [current];
    
    // 转换云存储URL为临时URL
    const urlMap = await this.convertCloudUrls(urls);
    const convertedUrls = urls.map(url => urlMap[url] || url);
    const currentUrl = urlMap[current] || current;
    
    // 找到当前图片的索引
    let currentIndex = convertedUrls.indexOf(currentUrl);
    if (currentIndex === -1) {
      currentIndex = 0;
    }
    
    wx.previewImage({
      current: currentUrl,
      urls: convertedUrls.filter(Boolean)
    });
  },

  // 图片加载错误处理
  async onImageError(e) {
    const type = e.currentTarget.dataset.type;
    const defaultAvatar = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg';
    
    if (type === 'avatar') {
      try {
        const urlMap = await this.convertCloudUrls([defaultAvatar]);
        const convertedUrl = urlMap[defaultAvatar] || defaultAvatar;
        
        this.setData({
          'post.avatar': convertedUrl
        });
      } catch (err) {
        console.error('转换头像URL失败:', err);
      }
    }
  }
});

