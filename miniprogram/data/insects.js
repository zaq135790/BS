// 益虫数组（含核心字段：名称、卡通图路径、实拍图路径、儿童版口诀、成人版信息）
// 暂时统一使用 /images/bj1(1).png，后续可替换为真实图片路径

const commonImg = '/images/bj1(1).png';

const beneficialInsects = [
  {
    name: '蜜蜂',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '黄黑条纹衫，传粉小专家',
    adultDesc: {
      identify: '体长8-15mm，体表有密毛，后足为携粉足',
      guide: '勿主动惊扰，阳台可放置糖水吸引（远离门口），被蛰后用肥皂水清洗'
    }
  },
  {
    name: '七星瓢虫',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '红袍带黑点，一天吃百蚜',
    adultDesc: {
      identify: '体长5-7mm，鞘翅红色，有7个黑色斑点',
      guide: '菜园可人工投放，捕食蚜虫，无需驱赶'
    }
  },
  {
    name: '螳螂',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '举着大刀臂，专吃小害虫',
    adultDesc: {
      identify: '体长5-10cm，前足呈镰刀状，体色多为绿色/褐色',
      guide: '家庭阳台出现无需处理，可捕食蚊子、苍蝇等害虫'
    }
  },
  {
    name: '蜻蜓',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '薄翅像飞机，水面点水忙',
    adultDesc: {
      identify: '体长3-10cm，复眼大，翅膀透明有翅脉',
      guide: '成虫捕食蚊子幼虫，庭院有水区易出现，无需干预'
    }
  },
  {
    name: '蚯蚓',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '土里钻呀钻，松土又施肥',
    adultDesc: {
      identify: '体长10-30cm，身体分节，体色红褐/灰褐色',
      guide: '花盆/菜园出现可保留，改善土壤透气性，避免用盐/杀虫剂驱赶'
    }
  },
  {
    name: '食蚜蝇',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '长得像蜜蜂，专吃蚜虫卵',
    adultDesc: {
      identify: '体长5-15mm，形似蜜蜂但无蛰针，飞行时能悬停',
      guide: '菜园常见，幼虫捕食蚜虫，是重要益虫，勿误认成蜜蜂驱赶'
    }
  }
];

// 害虫数组（含核心字段：名称、卡通图路径、实拍图路径、儿童版口诀、成人版信息）

const harmfulInsects = [
  {
    name: '蚊子',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '小细腿尖尖嘴，叮人起红包',
    adultDesc: {
      identify: '雌蚊体长3-6mm，口器细长，雄蚊不吸血',
      guide: '定期清理积水（花盆、地漏），用蚊帐/电蚊拍，避免用蚊香直吹儿童'
    }
  },
  {
    name: '蟑螂（德国小蠊）',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '黑褐色小虫子，夜里偷吃东西',
    adultDesc: {
      identify: '体长10-15mm，体色浅褐，前胸背板有两条黑色纵纹',
      guide: '保持厨房干燥，密封食物，用硼酸粉/蟑螂屋，避免喷洒杀虫剂在餐具旁'
    }
  },
  {
    name: '蚜虫',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '黏在菜叶上，吸汁长不快',
    adultDesc: {
      identify: '体长1-4mm，体色绿/黄/黑，群集在菜叶/嫩枝上',
      guide: '菜园可喷洒肥皂水，或投放七星瓢虫捕食，避免过量用农药'
    }
  },
  {
    name: '菜青虫',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '绿身子胖嘟嘟，啃食青菜叶',
    adultDesc: {
      identify: '体长25-35mm，体色鲜绿，体表光滑，是菜粉蝶幼虫',
      guide: '手工捕捉幼虫，菜园套防虫网，或用苏云金杆菌（BT）生物防治'
    }
  },
  {
    name: '跳蚤',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '小小黑虫子，跳着咬宠物',
    adultDesc: {
      identify: '体长1-3mm，侧扁，无翅，后足发达善跳',
      guide: '定期给宠物驱虫，清洗宠物窝，用吸尘器清理地毯缝隙，喷洒跳蚤粉（避开儿童）'
    }
  },
  {
    name: '米象',
    cartoonImg: commonImg,
    realImg: commonImg,
    childDesc: '钻到米袋里，啃食白米粒',
    adultDesc: {
      identify: '体长2-3mm，体色褐黑，口吻细长，常见于大米/小米中',
      guide: '米粮密封存放，放入大蒜/花椒驱虫，轻度生虫可暴晒后筛除'
    }
  }
];

// 导出供小程序页面调用

module.exports = {
  beneficialInsects,
  harmfulInsects
};


