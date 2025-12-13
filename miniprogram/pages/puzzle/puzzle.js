// pages/puzzle/puzzle.js
Page({
  data: {
    insectId: null,
    difficulty: '简单',
    puzzleConfig: null,
    pieces: [],
    trayPieces: [],
    slots: [],
    selectedPieceId: null,
    completedPieces: [],
    fullImageUrl: null,
    gameStarted: false,
    gameEnded: false,
    startTime: null,
    completionTime: 0,
    formattedTime: '',
    score: 0,
    loading: true,
    showHint: false,
    gridSize: 2, // 默认简单难度为2*2
    startBackground: '' // 开始界面背景图片URL
  },

  async onLoad(options) {
    const insectId = options.insectId;
    this.setData({ insectId });
    await this.loadStartBackground();
    await this.loadPuzzleConfig();
  },

  // 加载开始界面背景图片
  async loadStartBackground() {
    const cloudUrl = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/game2.jpg';
    console.log('开始加载拼图游戏背景图片:', cloudUrl);
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: [cloudUrl]
      });
      console.log('拼图游戏背景图片转换结果:', res);
      if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
        const tempUrl = res.fileList[0].tempFileURL;
        console.log('拼图游戏背景图片转换后的URL:', tempUrl);
        this.setData({
          startBackground: tempUrl
        });
      } else {
        console.warn('拼图游戏背景图片转换失败，使用原始URL');
        // 如果转换失败，使用原始URL
        this.setData({
          startBackground: cloudUrl
        });
      }
    } catch (error) {
      console.error('获取拼图游戏背景图片临时URL失败:', error);
      // 如果转换失败，使用原始URL
      this.setData({
        startBackground: cloudUrl
      });
    }
  },

  onUnload() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // 加载拼图配置
  async loadPuzzleConfig() {
    const app = getApp();
    
    try {
      const result = await app.getPuzzleConfigs(this.data.insectId, this.data.difficulty);
      
      if (result.success && result.data.length > 0) {
        this.setData({
          puzzleConfig: result.data[0],
          loading: false
        });
        this.generatePuzzle();
      } else {
        // 使用默认配置：简单2*2(4块)、困难3*3(9块)
        const piecesCount = this.data.difficulty === '简单' ? 4 : 9;
        this.setData({
          puzzleConfig: {
            pieces_count: piecesCount,
            base_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
            full_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
            slice_urls: [
              'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/1.jpg',
              'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/2.jpg',
              'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/3.jpg',
              'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/4.jpg'
            ]
          },
          loading: false
        });
        this.generatePuzzle();
      }
    } catch (error) {
      console.error('加载拼图配置失败:', error);
      // 使用默认配置：简单2*2(4块)、困难3*3(9块)
      const piecesCount = this.data.difficulty === '简单' ? 4 : 9;
      this.setData({
        puzzleConfig: {
          pieces_count: piecesCount,
          base_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
          full_image_url: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
          slice_urls: [
            'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/1.jpg',
            'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/2.jpg',
            'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/3.jpg',
            'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/4.jpg'
          ]
        },
        loading: false
      });
      this.generatePuzzle();
    }
  },

  // 生成拼图
  async generatePuzzle() {
    const piecesCount = this.data.puzzleConfig.pieces_count;
    const gridSize = Math.sqrt(piecesCount);
    const pieces = [];
    let baseImageUrl = this.data.puzzleConfig.base_image_url;
    let fullImageUrl = this.data.puzzleConfig.full_image_url || baseImageUrl;
    let sliceUrls = this.data.puzzleConfig.slice_urls || null;
    
    // 如果是云存储路径，转换为临时URL
    if (baseImageUrl && baseImageUrl.startsWith('cloud://')) {
      try {
        const res = await wx.cloud.getTempFileURL({
          fileList: [baseImageUrl]
        });
        console.log('云存储转换结果:', res);
        if (res.fileList && res.fileList.length > 0) {
          const fileInfo = res.fileList[0];
          if (fileInfo.tempFileURL) {
            baseImageUrl = fileInfo.tempFileURL;
            console.log('转换后的URL:', baseImageUrl);
          } else if (fileInfo.errCode === 0) {
            console.warn('URL转换成功但tempFileURL为空');
          } else {
            console.error('URL转换失败:', fileInfo.errMsg);
          }
        } else {
          console.warn('URL转换失败，fileList为空');
        }
      } catch (error) {
        console.error('获取云存储临时URL失败:', error);
        wx.showToast({
          title: '图片加载失败',
          icon: 'none',
          duration: 2000
        });
      }
    }
    
    // full image 转换
    if (fullImageUrl && fullImageUrl.startsWith('cloud://')) {
      try {
        const res = await wx.cloud.getTempFileURL({
          fileList: [fullImageUrl]
        });
        if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
          fullImageUrl = res.fileList[0].tempFileURL;
        }
      } catch (error) {
        console.error('获取 full image 临时URL失败:', error);
      }
    }

    // sliceUrls 转换（保持顺序：上方待放区固定1/2/3/4）
    let orderedSliceUrls = null;
    if (sliceUrls && Array.isArray(sliceUrls) && sliceUrls.length > 0) {
      try {
        if (sliceUrls[0].startsWith('cloud://')) {
          const res = await wx.cloud.getTempFileURL({ fileList: sliceUrls });
          if (res.fileList && res.fileList.length > 0) {
            orderedSliceUrls = res.fileList.map(f => f.tempFileURL || f.fileID).filter(Boolean);
          }
        } else {
          orderedSliceUrls = [...sliceUrls];
        }
      } catch (error) {
        console.error('获取切片临时URL失败:', error);
      }
    }

    console.log('最终使用的图片URL:', baseImageUrl);
    
    // 创建拼图块，每个块显示原图的一个区域
    // 使用background-image配合 position 来实现图片切分
    for (let i = 0; i < piecesCount; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      let pieceImg = baseImageUrl;
      let bgStyle;

      // 使用固定顺序的切片，与槽位一一对应（0,1,2,3...）
      if (orderedSliceUrls && orderedSliceUrls.length >= piecesCount) {
        pieceImg = orderedSliceUrls[i];
        bgStyle = `background-image: url('${pieceImg}'); background-size: 100% 100%; background-position: center; background-repeat: no-repeat;`;
      } else {
        // 计算该拼图块在原图中的位置（百分比）
        // 每个块占原图的 1/gridSize，所以需要将图片放大gridSize倍
        const xPercent = (col / gridSize) * 100;
        const yPercent = (row / gridSize) * 100;
        const scale = gridSize; // 图片放大倍数
        const bgSize = scale * 100; // 背景图放大倍数（百分比）
        bgStyle = `background-image: url('${baseImageUrl}'); background-size: ${bgSize}% ${bgSize}%; background-position: ${xPercent}% ${yPercent}%; background-repeat: no-repeat;`;
      }
      
      const piece = {
        id: i,
        correctPosition: i, // 正确位置
        currentIndex: i, // 当前在数组中的索引
        image: pieceImg, // 完整图片URL（用于调试）
        bgStyle: bgStyle, // 背景样式字符串
        completed: false,
        row: row,
        col: col
      };
      pieces.push(piece);
    }
    
    // 打乱顺序（用于下方拼图区），但保持正确位置信息不变
    const trayPieces = this.shuffleArray(pieces.map(p => ({ ...p })));

    // 初始化槽位（上方空白区域）
    const slots = Array(piecesCount).fill(null);

    this.setData({
      pieces,
      trayPieces,
      slots,
      completedPieces: [],
      gridSize: gridSize,
      baseImageUrl: baseImageUrl, // 保存转换后的图片URL
      fullImageUrl: fullImageUrl
    });
  },

  // 数组随机排序
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // 选择难度
  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    this.setData({ difficulty });
    this.loadPuzzleConfig();
  },

  // 开始游戏
  startGame() {
    this.setData({
      gameStarted: true,
      startTime: Date.now(),
      gameEnded: false,
      formattedTime: '0秒'
    });
    
    // 定时更新显示时间
    this.timer = setInterval(() => {
      if (this.data.gameStarted && !this.data.gameEnded) {
        const elapsed = Math.floor((Date.now() - this.data.startTime) / 1000);
        this.setData({
          formattedTime: this.formatTime(elapsed)
        });
      }
    }, 1000);
  },

  // 点击拼图块
  clickPiece(e) {
    if (!this.data.gameStarted || this.data.gameEnded) return;
    const pieceId = parseInt(e.currentTarget.dataset.id);
    this.setData({ selectedPieceId: pieceId });
  },

  // 点击槽位（空白待放区）
  handleSlotTap(e) {
    if (!this.data.gameStarted || this.data.gameEnded) return;
    const slotIndex = parseInt(e.currentTarget.dataset.index);
    const { selectedPieceId, slots, trayPieces, completedPieces } = this.data;

    if (selectedPieceId === null) {
      wx.showToast({ title: '先选择一个拼图块', icon: 'none' });
      return;
    }

    if (slots[slotIndex]) {
      wx.showToast({ title: '该位置已有拼图', icon: 'none' });
      return;
    }

    const pieceIdx = trayPieces.findIndex(p => p.id === selectedPieceId);
    if (pieceIdx === -1) {
      wx.showToast({ title: '请选择有效的拼图块', icon: 'none' });
      return;
    }

    const piece = trayPieces[pieceIdx];
    const isCorrect = piece.correctPosition === slotIndex;

    if (isCorrect) {
      const newSlots = [...slots];
      newSlots[slotIndex] = { ...piece, completed: true };
      const newTray = [...trayPieces];
      newTray.splice(pieceIdx, 1);
      const newCompleted = [...completedPieces, piece];

      this.setData({
        slots: newSlots,
        trayPieces: newTray,
        completedPieces: newCompleted,
        selectedPieceId: null
      });

      wx.vibrateShort({ type: 'light' });

      if (newCompleted.length === this.data.puzzleConfig.pieces_count) {
        this.endGame();
      }
    } else {
      wx.vibrateShort({ type: 'medium' });
      const encouragements = ['再仔细看看，加油！', '别急，你可以的！', '很棒，再试试别的位置~'];
      const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
      wx.showToast({ title: msg, icon: 'none' });
      this.setData({ selectedPieceId: null });
    }
  },

  // 结束游戏
  async endGame() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    const duration = Math.floor((Date.now() - this.data.startTime) / 1000);
    const score = this.calculateScore(duration);
    
    this.setData({
      gameEnded: true,
      completionTime: duration,
      formattedTime: this.formatTime(duration),
      score
    });
    
    // 保存游戏记录
    const app = getApp();
    try {
      await app.saveGameRecord({
        userId: app.globalData.userId,
        gameType: '虫虫拼图',
        score: score,
        completionTime: duration,
        difficultyLevel: this.data.difficulty,
        completedPuzzles: this.data.completedPieces.map(p => ({
          id: p.id,
          correctPosition: p.correctPosition,
          row: p.row,
          col: p.col
        }))
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
    
    // 不弹窗，直接显示结束界面按钮
  },

  // 计算得分
  calculateScore(completionTime) {
    const baseScore = 1000;
    // 根据难度调整时间奖励：简单300秒，中等600秒，困难900秒
    const maxTime = this.data.difficulty === '简单' ? 300 : this.data.difficulty === '中等' ? 600 : 900;
    const timeBonus = Math.max(0, maxTime - completionTime) * 2;
    // 难度倍数：简单1倍，中等1.5倍，困难2倍
    const difficultyMultiplier = this.data.difficulty === '简单' ? 1 : this.data.difficulty === '中等' ? 1.5 : 2;
    
    return Math.floor((baseScore + timeBonus) * difficultyMultiplier);
  },

  // 重新开始游戏
  restartGame() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.generatePuzzle();
    this.setData({
      gameStarted: false,
      gameEnded: false,
      startTime: null,
      completionTime: 0,
      formattedTime: '0秒',
      score: 0,
      selectedPieceId: null
    });
  },

  // 显示提示
  toggleHint() {
    if (!this.data.fullImageUrl) {
      wx.showToast({ title: '暂无提示图片', icon: 'none' });
      return;
    }
    this.setData({
      showHint: !this.data.showHint
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      return `${remainingSeconds}秒`;
    }
  }
});

