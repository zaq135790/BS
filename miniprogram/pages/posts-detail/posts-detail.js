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

  // 加载帖子详情
  loadPostDetail(postId) {
    // 模拟数据
    const mockPosts = {
      '1': {
        id: '1',
        nickname: '小明',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '今天在院子里发现了一只七星瓢虫，它正在吃蚜虫，真是农民的好帮手！仔细观察发现它背上有七个黑点，非常漂亮。',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '2小时前',
        likeCount: 12,
        commentCount: 5,
        viewCount: 128,
        location: '后院花园',
        insectName: '七星瓢虫'
      },
      '2': {
        id: '2',
        nickname: '小红',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '雨后看到很多蚯蚓从土里钻出来，它们真的能改良土壤吗？查了资料才知道，蚯蚓是土壤的好朋友，能帮助松土和分解有机物。',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '昨天',
        likeCount: 8,
        commentCount: 3,
        viewCount: 89,
        location: '小区花园',
        insectName: '蚯蚓'
      },
      '3': {
        id: '3',
        nickname: '小华',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '在公园里看到一只美丽的蝴蝶，翅膀上的花纹像彩虹一样绚丽。它停在花朵上采蜜，动作优雅极了！',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '3小时前',
        likeCount: 15,
        commentCount: 7,
        viewCount: 156,
        location: '城市公园',
        insectName: '蝴蝶'
      },
      '4': {
        id: '4',
        nickname: '小丽',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '晚上在路灯下发现了一只螳螂，它举着前爪好像在祈祷。妈妈说螳螂是益虫，会捕食害虫，我们要保护它。',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '5小时前',
        likeCount: 20,
        commentCount: 9,
        viewCount: 201,
        location: '小区路灯下',
        insectName: '螳螂'
      },
      '5': {
        id: '5',
        nickname: '小强',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: '在菜园里发现了一只蜜蜂正在采蜜，它的小翅膀扇得飞快。蜜蜂不仅会采蜜，还能帮助花朵授粉，真是太厉害了！',
        imageUrl: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png',
        createTime: '1天前',
        likeCount: 18,
        commentCount: 6,
        viewCount: 167,
        location: '菜园',
        insectName: '蜜蜂'
      }
    };

    const post = mockPosts[postId];
    if (post) {
      // 模拟评论数据
      const mockComments = [
        {
          id: '1',
          nickname: '用户A',
          avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
          content: '真有趣！我也见过这种昆虫。',
          createTime: '1小时前'
        },
        {
          id: '2',
          nickname: '用户B',
          avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
          content: '👍👍👍',
          createTime: '2小时前'
        },
        {
          id: '3',
          nickname: '用户C',
          avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
          content: '学到了新知识！',
          createTime: '3小时前'
        }
      ];

      this.setData({
        post: post,
        comments: mockComments,
        loading: false
      });
    } else {
      wx.showToast({
        title: '帖子不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 点赞帖子
  likePost() {
    const post = this.data.post;
    const liked = !this.data.liked;
    this.setData({
      liked: liked,
      'post.likeCount': liked ? post.likeCount + 1 : post.likeCount - 1
    });
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
  submitComment() {
    const content = this.data.commentInput.trim();
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    // 模拟提交评论
    setTimeout(() => {
      const newComment = {
        id: Date.now().toString(),
        nickname: '我',
        avatar: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg',
        content: content,
        createTime: '刚刚'
      };

      const comments = [newComment, ...this.data.comments];
      const post = this.data.post;
      
      this.setData({
        comments: comments,
        commentInput: '',
        submitting: false,
        'post.commentCount': post.commentCount + 1
      });

      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });
    }, 500);
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
  }
});

