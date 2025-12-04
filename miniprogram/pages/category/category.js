Page({
  data: {
    activeTab: 'beneficial', // 默认显示益虫
    insects: {
      beneficial: [],
      harmful: []
    },
    currentInsects: [],
    loading: true
  },

  async onLoad() {
    await this.loadInsects();
  },

  async loadInsects() {
    const app = getApp();
    
    try {
      const defaultImage = '/images/bj3.png';
      // 获取益虫数据
      const beneficialResult = await app.getInsects('益虫', 1, 50);
      // 获取害虫数据
      const harmfulResult = await app.getInsects('害虫', 1, 50);
      
      const insects = {
        beneficial: beneficialResult.success ? beneficialResult.data.map(insect => ({
          id: insect.id,
          name: insect.name,
          image: defaultImage,
          shortDesc: insect.child_description ? insect.child_description.substring(0, 20) + '...' : '暂无描述'
        })) : [],
        harmful: harmfulResult.success ? harmfulResult.data.map(insect => ({
          id: insect.id,
          name: insect.name,
          image: defaultImage,
          shortDesc: insect.child_description ? insect.child_description.substring(0, 20) + '...' : '暂无描述'
        })) : []
      };
      
      this.setData({
        insects,
        currentInsects: insects.beneficial,
        loading: false
      });
      
    } catch (error) {
      console.error('加载昆虫数据失败:', error);
      // 使用模拟数据
      this.setData({
        insects: this.getMockInsects(),
        currentInsects: this.getMockInsects().beneficial,
        loading: false
      });
    }
  },

  // 模拟昆虫数据
  getMockInsects() {
    const defaultImage = '/images/bj3.png';
    return {
      beneficial: [
        { 
          id: 1, 
          name: '蜜蜂', 
          image: defaultImage,
          shortDesc: '传粉酿蜜的小能手，群居生活'
        },
        { 
          id: 2, 
          name: '七星瓢虫', 
          image: '/images/insects/ladybug_card.jpg',
          shortDesc: '捕食蚜虫的益虫，有七个斑点'
        },
        { 
          id: 3, 
          name: '螳螂', 
          image: '/images/insects/mantis_card.jpg',
          shortDesc: '捕食害虫的高手，前足似镰刀'
        },
        { 
          id: 4, 
          name: '蜻蜓', 
          image: '/images/insects/dragonfly_card.jpg',
          shortDesc: '飞行能手，捕食蚊子等害虫'
        },
        { 
          id: 5, 
          name: '蚯蚓', 
          image: '/images/insects/earthworm_card.jpg',
          shortDesc: '改良土壤的好帮手，分解有机物'
        },
        { 
          id: 6, 
          name: '食蚜蝇', 
          image: defaultImage,
          shortDesc: '拟态蜜蜂，幼虫捕食蚜虫'
        },
        { 
          id: 13, 
          name: '蜜蜂守卫', 
          image: defaultImage,
          shortDesc: '守护蜂巢入口的蜜蜂战士'
        },
        { 
          id: 14, 
          name: '步甲', 
          image: defaultImage,
          shortDesc: '夜行益虫，捕食幼虫和蛞蝓'
        }
      ],
      harmful: [
        { 
          id: 7, 
          name: '蚊子', 
          image: defaultImage,
          shortDesc: '传播疾病，幼虫叫孑孓'
        },
        { 
          id: 8, 
          name: '德国小蠊', 
          image: '/images/insects/cockroach_card.jpg',
          shortDesc: '常见家居害虫，繁殖能力强'
        },
        { 
          id: 9, 
          name: '蚜虫', 
          image: '/images/insects/aphid_card.jpg',
          shortDesc: '危害植物，吸食汁液'
        },
        { 
          id: 10, 
          name: '菜青虫', 
          image: '/images/insects/cabbageworm_card.jpg',
          shortDesc: '十字花科蔬菜的主要害虫'
        },
        { 
          id: 11, 
          name: '跳蚤', 
          image: '/images/insects/flea_card.jpg',
          shortDesc: '寄生在动物身上，吸食血液'
        },
        { 
          id: 12, 
          name: '米象', 
          image: defaultImage,
          shortDesc: '危害储存粮食的害虫'
        },
        { 
          id: 15, 
          name: '棉铃虫', 
          image: defaultImage,
          shortDesc: '棉花等作物的重要害虫'
        },
        { 
          id: 16, 
          name: '松毛虫', 
          image: defaultImage,
          shortDesc: '危害松树叶片的鳞翅目幼虫'
        }
      ]
    };
  },

  // 切换分类
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      currentInsects: this.data.insects[tab]
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadInsects();
    wx.stopPullDownRefresh();
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
