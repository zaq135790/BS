const { beneficialInsects, harmfulInsects } = require('../../data/insects.js');

Page({
  data: {
    insectData: {},
    loading: true,
    videoUrl: '',  // 动画视频URL（后期导入）
    userRole: 'child',  // 当前用户身份
    previewImage: '', // 预览图片URL
    showImagePreview: false, // 是否显示图片预览
    audioSrc: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/mf_yp.mp3',
    isReading: false,
    currentInsectId: '',
    currentInsectName: ''
  },

  onLoad(options) {
    // 从options获取昆虫信息（可能是从图鉴页面跳转过来的）
    const insectName = options.name || '';
    const insectId = options.id || '';
    this.setData({
      currentInsectId: insectId,
      currentInsectName: insectName
    });
    this.loadUserRole();
    this.loadInsectData(insectName, insectId);
    this.initAudio();
  },

  // 加载用户身份
  loadUserRole() {
    const app = getApp();
    const userId = app.globalData.userId || app.globalData.openid || 'default';
    const userInfoKey = `user_info_${userId}`;
    const storedUserInfo = wx.getStorageSync(userInfoKey);
    
    if (storedUserInfo && storedUserInfo.user_type) {
      this.setData({
        userRole: storedUserInfo.user_type
      });
    }
  },

  // 加载昆虫数据
  loadInsectData(insectName, insectId) {
    // 合并所有昆虫数据
    const allInsects = [...beneficialInsects, ...harmfulInsects];
    
    let insect = null;
    
    // 优先通过名称查找
    if (insectName) {
      insect = allInsects.find(item => item.name === insectName);
    } else if (insectId) {
      // 通过ID查找（格式：b_0, h_0, pb_0, ph_0等）
      const parts = insectId.split('_');
      if (parts[0] === 'b' || parts[0] === 'pb') {
        insect = beneficialInsects[parseInt(parts[1])];
      } else if (parts[0] === 'h' || parts[0] === 'ph') {
        insect = harmfulInsects[parseInt(parts[1])];
      }
    }
    
    if (insect) {
      const isParent = this.data.userRole === 'parent';
      const defaultImg = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png';
      
      if (isParent) {
        // 家长身份：显示科普知识
    // 生成三张图片（识别要点图片、家庭指引图片、实拍图）
        const identifyImage = insect.adultDesc.identifyImage || defaultImg;
        const guideImage = insect.adultDesc.guideImage || defaultImg;
        const realImg = insect.realImg || defaultImg;
        const galleryImages = [
          identifyImage, // 第一张：识别要点
          guideImage,    // 第二张：家庭指引
          realImg        // 第三张：实拍图
        ];
        
        this.setData({
          insectData: {
            name: insect.name,
            image: realImg,
            galleryImages: galleryImages, // 三张图片数组
            identify: insect.adultDesc.identify, // 识别要点
            guide: insect.adultDesc.guide, // 家庭指引
            type: beneficialInsects.includes(insect) ? '益虫' : '害虫'
          },
          loading: false
        });
      } else {
        // 儿童身份：显示口诀和知识
        const knowledge = this.generateChildKnowledge(insect);
        const detailRhyme = this.generateDetailRhyme(insect);
        
        this.setData({
          insectData: {
            name: insect.name,
            image: insect.cartoonImg || defaultImg,
            rhyme: detailRhyme,  // 详情页昆虫口诀（与列表页不同）
            listRhyme: insect.childDesc,  // 列表页口诀（保留用于对比）
            knowledge: knowledge,  // 昆虫小知识
            type: beneficialInsects.includes(insect) ? '益虫' : '害虫'
          },
          loading: false
        });
      }
      
      // 记录浏览历史
      this.saveBrowseHistory(insect);
    } else {
      // 如果找不到，使用默认数据
      const defaultImg = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png';
      this.setData({
        insectData: {
          name: '未知昆虫',
          image: defaultImg,
          rhyme: '等待探索中...',
          knowledge: '让我们一起探索这个有趣的昆虫吧！',
          type: '未知'
        },
        loading: false,
        currentInsectName: this.data.currentInsectName || '未知昆虫'
      });
    }
  },

  // 生成适合儿童的知识内容
  generateChildKnowledge(insect) {
    // 判断是益虫还是害虫
    const isBeneficial = beneficialInsects.some(item => item.name === insect.name);
    const type = isBeneficial ? '益虫' : '害虫';
    const identify = insect.adultDesc.identify;
    const guide = insect.adultDesc.guide;
    
    // 将成人版信息转换为适合儿童的语言
    let knowledge = '';
    
    if (type === '益虫') {
      knowledge = `这是我们的好朋友${insect.name}！${identify}。它们可以帮助我们保护植物，让我们的花园更美丽。${guide}`;
    } else {
      knowledge = `这是${insect.name}，它们可能会给我们带来一些小麻烦。${identify}。不过不用担心，我们可以用一些好方法来处理它们：${guide}`;
    }
    
    return knowledge;
  },

  // 生成详情页专用的口诀（与列表页不同）
  generateDetailRhyme(insect) {
    // 判断是益虫还是害虫
    const isBeneficial = beneficialInsects.some(item => item.name === insect.name);
    const listRhyme = insect.childDesc; // 列表页口诀
    
    // 为详情页生成一个不同的口诀版本
    // 基于列表页口诀，生成一个更详细的版本
    const detailRhymes = {
      '蜜蜂': '黄黑条纹衫，传粉小专家。嗡嗡采花蜜，甜蜜送大家。',
      '七星瓢虫': '红袍带黑点，一天吃百蚜。小小守护者，菜园好帮手。',
      '螳螂': '举着大刀臂，专吃小害虫。绿色小卫士，保护菜园忙。',
      '蜻蜓': '薄翅像飞机，水面点水忙。空中捕蚊虫，夏日好伙伴。',
      '蚯蚓': '土里钻呀钻，松土又施肥。默默做贡献，植物更健康。',
      '食蚜蝇': '长得像蜜蜂，专吃蚜虫卵。菜园小助手，保护蔬菜好。',
      '蚊子': '小细腿尖尖嘴，叮人起红包。记得防蚊虫，健康最重要。',
      '蟑螂（德国小蠊）': '黑褐色小虫子，夜里偷吃东西。保持环境好，远离小困扰。',
      '蚜虫': '黏在菜叶上，吸汁长不快。小小麻烦虫，需要多注意。',
      '菜青虫': '绿身子胖嘟嘟，啃食青菜叶。菜园小破坏，需要多防护。',
      '跳蚤': '小小黑虫子，跳着咬宠物。定期要驱虫，宠物更健康。',
      '米象': '钻到米袋里，啃食白米粒。密封保存好，粮食更安全。'
    };
    
    // 如果有预设的详情口诀，使用它；否则基于列表口诀生成
    if (detailRhymes[insect.name]) {
      return detailRhymes[insect.name];
    }
    
    // 如果没有预设，基于列表口诀生成一个扩展版本
    return `${listRhyme}，了解更多知识，让我们一起来探索吧！`;
  },

  // 保存浏览记录
  saveBrowseHistory(insect) {
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
      
      // 根据用户身份选择图片
      const defaultImg = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj3.png';
      const imageUrl = userType === 'parent' ? (insect.realImg || defaultImg) : (insect.cartoonImg || defaultImg);
      const insectId = this.data.currentInsectId || insect.id || insect.name || 'unknown';
      const insectName = insect.name || this.data.currentInsectName || '未知昆虫';
      
      const browseRecord = {
        insectId,
        name: insectName,
        image: imageUrl,
        browseTime: new Date().toISOString()
      };
      
      // 检查是否已存在
      const existingIndex = history.findIndex(item => item.name === insect.name);
      if (existingIndex >= 0) {
        history[existingIndex] = browseRecord;
      } else {
        history.unshift(browseRecord);
      }
      
      // 只保留最近50条
      history = history.slice(0, 50);
      wx.setStorageSync(historyKey, history);
    } catch (error) {
      console.error('保存浏览记录失败:', error);
    }
  },


  // 预览图片（点击放大）
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.urls || [current];
    
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `发现了一只${this.data.insectData.name}！`,
      path: `/pages/detail/detail?name=${this.data.insectData.name}`,
      imageUrl: this.data.insectData.image
    };
  },

  // 初始化朗读音频
  initAudio() {
    try {
      this.audioCtx = wx.createInnerAudioContext();
      this.audioCtx.src = this.data.audioSrc;
      this.audioCtx.obeyMuteSwitch = true;
      this.audioCtx.onPlay(() => this.setData({ isReading: true }));
      this.audioCtx.onPause(() => this.setData({ isReading: false }));
      this.audioCtx.onStop(() => this.setData({ isReading: false }));
      this.audioCtx.onEnded(() => this.setData({ isReading: false }));
    } catch (e) {
      console.error('初始化朗读音频失败', e);
    }
  },

  // 切换朗读 / 暂停
  onToggleRead() {
    if (!this.audioCtx) {
      this.initAudio();
    }
    if (!this.audioCtx) return;

    if (this.data.isReading) {
      this.audioCtx.pause();
    } else {
      this.audioCtx.play();
    }
  },

  onUnload() {
    if (this.audioCtx) {
      this.audioCtx.destroy();
      this.audioCtx = null;
    }
  }
});
