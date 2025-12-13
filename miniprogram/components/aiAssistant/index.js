Component({
  data: {
    showPanel: false,
    inputValue: '',
    loading: false,
    messages: [],
    // 浮动按钮位置（px）
    fabTop: 460,
    fabLeft: 0,
    isDragging: false,
    lastTouch: null,
    fabSizePx: 80,
    quickPrompts: [
      '七星瓢虫为什么是益虫？',
      '孩子在野外观察昆虫要注意什么？',
      '如何安全地驱赶家里的蚊虫？'
    ]
  },

  lifetimes: {
    attached() {
      const { windowWidth, windowHeight } = wx.getSystemInfoSync()
      // 将 120rpx 转为 px，避免 rpx/px 不一致
      const FAB_RPX = 120
      const fabSizePx = Math.max(60, Math.round((windowWidth / 750) * FAB_RPX))
      this.setData({
        fabSizePx,
        // 默认停靠右侧半露
        fabLeft: windowWidth - fabSizePx / 2,
        fabTop: Math.max(120, Math.min(windowHeight * 0.55, windowHeight - fabSizePx - 120))
      })
    }
  },

  methods: {
    openPanel() {
      if (this.data.isDragging) return
      this.setData({ showPanel: true })
    },

    closePanel() {
      this.setData({ showPanel: false })
    },

    onFabTouchStart(e) {
      const touch = e.touches[0]
      this.setData({
        isDragging: false,
        lastTouch: { x: touch.clientX, y: touch.clientY }
      })
    },

    onFabTouchMove(e) {
      if (!this.data.lastTouch) return
      const touch = e.touches[0]
      const dx = touch.clientX - this.data.lastTouch.x
      const dy = touch.clientY - this.data.lastTouch.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.setData({ isDragging: true })
      }
      const fabSize = this.data.fabSizePx
      const { windowWidth, windowHeight } = wx.getSystemInfoSync()
      const nextLeft = Math.min(
        Math.max(0, this.data.fabLeft + dx),
        windowWidth - fabSize
      )
      const nextTop = Math.min(
        Math.max(100, this.data.fabTop + dy),
        windowHeight - fabSize - 100
      )
      this.setData({
        fabLeft: nextLeft,
        fabTop: nextTop,
        lastTouch: { x: touch.clientX, y: touch.clientY }
      })
    },

    onFabTouchEnd() {
      const { windowWidth } = wx.getSystemInfoSync()
      const fabSize = this.data.fabSizePx
      // 右侧吸附半露出（1/2 圆）
      const snappedLeft = windowWidth - fabSize / 2
      this.setData({
        fabLeft: snappedLeft,
        lastTouch: null
      })
      setTimeout(() => {
        this.setData({ isDragging: false })
      }, 100)
    },

    onInput(e) {
      this.setData({ inputValue: e.detail.value })
    },

    usePrompt(e) {
      const prompt = e.currentTarget.dataset.prompt || ''
      this.setData({ inputValue: prompt })
      this.sendMessage()
    },

    async sendMessage() {
      if (this.data.loading) return

      const content = (this.data.inputValue || '').trim()
      if (!content) {
        wx.showToast({
          title: '请先输入问题哦~',
          icon: 'none'
        })
        return
      }

      const messages = [...this.data.messages, { role: 'user', content }]
      this.setData({ messages, inputValue: '', loading: true })

      try {
        const res = await wx.cloud.callFunction({
          name: 'ai-service',
          // 拉长前端调用超时，避免 8s 误判
          timeout: 20000,
          data: {
            action: 'chat',
            data: {
              prompt: content,
              history: messages
            }
          }
        })

        const result = res.result || {}
        if (result.success) {
          const answer = result.data?.answer || '我还在学习中，请稍后再问我吧~'
          this.setData({
            messages: [...messages, { role: 'assistant', content: answer }]
          })
        } else {
          wx.showToast({
            title: result.message || 'AI 助手开小差了',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('AI 调用失败:', error)
        wx.showToast({
          title: '网络或服务异常',
          icon: 'none'
        })
      } finally {
        this.setData({ loading: false })
      }
    }
  }
})

