// 益虫数组（含核心字段：名称、卡通图路径、实拍图路径、儿童版口诀、成人版信息）
const parentBase = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/parents-家长图片 - fb';
const commonImg = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj1.png';

const beneficialInsects = [
  {
    name: '蜜蜂',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
    realImg: `${parentBase}/mf/3.jpg`,
    childDesc: '黄黑条纹衫，传粉小专家',
    adultDesc: {
      identify: '体长8-20mm。体色黄褐/深褐，带黑色环状花纹。有两对膜质翅膀（后翅小，易被忽略）。腹部末端有蛰针（只有工蜂有，雄蜂没有）。与食蚜蝇的区别：蜜蜂有两对翅膀，食蚜蝇只有一对。',
      identifyImage: `${parentBase}/mf/1.jpg`,
      guide: '【户外场景】不要驱赶蜜蜂，远离蜂巢（特别是土洞、树洞），避免群攻。\n【被蜇处理】用指甲刮掉蛰针（不要挤压毒囊，防止更多毒液注入），然后涂抹肥皂水或炉甘石洗剂。\n【特殊人群】儿童和过敏体质者应立即远离蜜蜂；严重过敏需就医。',
      guideImage: `${parentBase}/mf/2.jpg`
    }
  },
  {
    name: '七星瓢虫',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/qxpc.jpg',
    realImg: `${parentBase}/qxpc/3.jpg`,
    childDesc: '红袍带黑点，一天吃百蚜',
    adultDesc: {
      identify: '体长5-7mm。圆形，鞘翅鲜红色，有7个黑色斑点（注意：斑点数量可能为6-9个）。足短，黑色，爬行缓慢。与"二十八星瓢虫"（害虫）的区别：后者鞘翅有28个斑点，且啃食菜叶。',
      identifyImage: `${parentBase}/qxpc/1.jpg`,
      guide: '【菜园场景】蚜虫爆发时，投放瓢虫（网购幼虫，每亩投放500只），避免喷洒广谱杀虫剂。\n【室内场景】室内发现瓢虫，用纸巾轻轻拿起，放到阳台植物上（不要直接拍打）。\n【盆栽场景】盆栽有蚜虫时，保留瓢虫；一只瓢虫一天可吃50+只蚜虫。',
      guideImage: `${parentBase}/qxpc/2.jpg`
    }
  },
  {
    name: '螳螂',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tl螳螂/tl.jpg',
    realImg: `${parentBase}/tl/3.jpg`,
    childDesc: '举着大刀臂，专吃小害虫',
    adultDesc: {
      identify: '体长50-100mm。常见绿色或褐色。身体分为胸部和腹部两部分。前足呈镰刀状，有锯齿，用作捕食工具。头部可360°旋转。与"竹节虫"的区别：螳螂前足粗壮，竹节虫身体细长如树枝。',
      identifyImage: `${parentBase}/tl/1.jpg`,
      guide: '【菜园场景】保留螳螂，可捕食菜青虫、蚜虫、蝗虫，减少农药使用。\n【室内场景】室内发现螳螂，用筷子移到阳台植物上（无毒，对人无害）。\n【繁殖期】螳螂秋季产卵（卵鞘附在树枝上），不要破坏，来年可孵化新螳螂。',
      guideImage: `${parentBase}/tl/2.jpg`
    }
  },
  {
    name: '蜻蜓',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/qt.jpg',
    realImg: `${parentBase}/qt/3.jpg`,
    childDesc: '薄翅像飞机，水面点水忙',
    adultDesc: {
      identify: '体长30-90mm。身体细长（蓝绿色/红褐色/黑色）。复眼占头部70%以上。有两对透明翅膀，翅脉清晰，呈网状。停歇时翅膀平展（部分种类可能略微下垂）。与"豆娘"的区别：蜻蜓停歇时翅膀平展，豆娘翅膀合拢。',
      identifyImage: `${parentBase}/qt/1.jpg`,
      guide: '【庭院场景】夏季清理积水（减少蜻蜓幼虫"水虿"的栖息地）；但成虫蜻蜓可控制蚊子，平衡即可。\n【户外场景】不要捕捉蜻蜓（部分种类如"碧伟蜓"为保护动物）；一只蜻蜓一天可吃30+只蚊子。\n【教育场景】带孩子观察蜻蜓点水产卵行为，了解生命周期。',
      guideImage: `${parentBase}/qt/2.jpg`
    }
  },
  {
    name: '蚯蚓',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/qy.jpg',
    realImg: `${parentBase}/qy/3.jpg`,
    childDesc: '土里钻呀钻，松土又施肥',
    adultDesc: {
      identify: '体长10-30cm。身体圆柱形，分节（每节有细毛，肉眼难见）。体色红褐色/灰褐色。体表湿润（通过皮肤呼吸，干燥会死亡）。与"水蛭"的区别：蚯蚓生活在土壤中，水蛭生活在淡水中，会吸血。',
      identifyImage: `${parentBase}/qy/1.jpg`,
      guide: '【花盆场景】保留蚯蚓（可疏松土壤，分解有机肥）；不要使用杀虫剂，会杀死蚯蚓。\n【雨后场景】雨后室外蚯蚓爬出土壤，捡起重新埋入花盆（保护其免受日晒和踩踏）。\n【喂养注意】人工饲养蚯蚓时，喂食菜叶、果皮（不要喂食咸、油食物）。',
      guideImage: `${parentBase}/qy/2.jpg`
    }
  },
  {
    name: '食蚜蝇',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/syy食蚜蝇/syy.jpg',
    realImg: `${parentBase}/syy/3.jpg`,
    childDesc: '长得像蜜蜂，专吃蚜虫卵',
    adultDesc: {
      identify: '体长5-15mm。黄黑相间条纹（模仿蜜蜂，避免天敌）。只有1对翅膀（蜜蜂有2对）。飞行时能悬停（蜜蜂很少悬停），动作敏捷。接近时无蛰针威胁。可通过观察翅膀数量快速识别。',
      identifyImage: `${parentBase}/syy/1.jpg`,
      guide: '【阳台场景】种植向日葵、波斯菊吸引食蚜蝇，有助于授粉。\n【菜园场景】蚜虫多时，不要误拍食蚜蝇（其幼虫在叶片背面吃蚜虫）。\n【儿童互动】带孩子观察食蚜蝇悬停，了解"拟态"（模仿蜜蜂自我保护）。',
      guideImage: `${parentBase}/syy/2.jpg`
    }
  }
];

// 害虫数组（含核心字段：名称、卡通图路径、实拍图路径、儿童版口诀、成人版信息）

const harmfulInsects = [
  {
    name: '蚊子',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/wz.jpg',
    realImg: `${parentBase}/wz/3.jpg`,
    childDesc: '小细腿尖尖嘴，叮人起红包',
    adultDesc: {
      identify: '体长3-6mm。身体细长，灰黑色。雌蚊口器细长（用于吸血），雄蚊口器短（用于吸植物汁液）。停歇时身体与停歇面平行（与"蠓"相比，蠓身体更小，停歇时倾斜）。幼虫叫"孑孓"，生活在积水中，呈弯曲状游动。',
      identifyImage: `${parentBase}/wz/1.jpg`,
      guide: '【防蚊场景】每周清理积水（花盆托盘、水桶、空调水），消除蚊子幼虫。\n【室内场景】使用蚊帐、电蚊拍（儿童房避免蚊香，选择无味电蚊液）。\n【被咬处理】不要抓挠（防止感染）；涂抹薄荷膏或氢化可的松软膏。严重肿胀需就医。',
      guideImage: `${parentBase}/wz/2.jpg`
    }
  },
  {
    name: '蟑螂（德国小蠊）',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/zl.jpg',
    realImg: `${parentBase}/zl/3.jpg`,
    childDesc: '黑褐色小虫子，夜里偷吃东西',
    adultDesc: {
      identify: '体长10-15mm（约为"美洲大蠊"的一半）。体色浅褐，背部有2条黑色纵纹（最明显特征）。动作敏捷，夜行性，喜欢温暖潮湿环境（如厨房水槽下、柜子缝隙）。与"蟋蟀"的区别：无翅膀，无发声器，身体更扁平。',
      identifyImage: `${parentBase}/zl/1.jpg`,
      guide: '【厨房场景】密封食物（用玻璃罐）；每天倒垃圾；保持灶台无油渍。\n【灭蟑方法】使用蟑螂胶饵（放在柜子角落，远离儿童）；不要用喷雾，易使蟑螂四散。\n【预防场景】定期用开水冲下水道（可破坏卵鞘，卵鞘耐低温）。',
      guideImage: `${parentBase}/zl/2.jpg`
    }
  },
  {
    name: '蚜虫',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/yc.jpg',
    realImg: `${parentBase}/yc/3.jpg`,
    childDesc: '黏在菜叶上，吸汁长不快',
    adultDesc: {
      identify: '体长1-3mm。常见绿色（也有黑色、黄色、粉色）。身体椭圆形，尾部有1对腹管（"小管子"，分泌蜜露）。常聚集在植物嫩枝、叶片背面（单个难找，成群易识别）。与"介壳虫"的区别：无蜡质外壳，活动性强。',
      identifyImage: `${parentBase}/yc/1.jpg`,
      guide: '【盆栽场景】发现蚜虫，用水冲洗叶片（每周一次）或用酒精棉签擦拭（可杀死成虫）。\n【菜园场景】种植薄荷或大蒜（可驱避蚜虫），或投放瓢虫、食蚜蝇（生物防治）。\n【严重情况】使用吡虫啉（低毒农药，按说明稀释，不要喷在开花植物上）。',
      guideImage: `${parentBase}/yc/2.jpg`
    }
  },
  {
    name: '菜青虫',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/xqc菜青虫/cqc.jpg',
    realImg: `${parentBase}/cqc/3.png`,
    childDesc: '绿身子胖嘟嘟，啃食青菜叶',
    adultDesc: {
      identify: '体长28-35mm。身体青绿色，体表光滑，背部有1条淡黄色细纵线。主要取食十字花科植物（白菜、油菜、萝卜）。叶片出现不规则小洞，粪便为绿色颗粒。与"小菜蛾幼虫"的区别：身体更粗，无黑点。',
      identifyImage: `${parentBase}/cqc/1.png`,
      guide: '【菜园场景】早晨手工捉虫（行动缓慢，常藏在叶片背面），放入肥皂水杀死。\n【生物防治】使用苏云金杆菌（Bt制剂），对人无害，只杀菜青虫，需喷在叶片上。\n【种植建议】避免十字花科蔬菜连作（减少虫源），轮作玉米、番茄等。',
      guideImage: `${parentBase}/cqc/2.png`
    }
  },
  {
    name: '跳蚤',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/tz.jpg',
    realImg: `${parentBase}/tz/3.png`,
    childDesc: '小小黑虫子，跳着咬宠物',
    adultDesc: {
      identify: '体长1-3mm。深褐色，身体侧扁（便于在毛发中移动）。后足发达（可跳10-30cm，是体长的100倍）。无翅，靠吸食哺乳动物血液生存。叮咬后出现小红疹，中心有红点。与"螨虫"的区别：肉眼可见，螨虫需显微镜。',
      identifyImage: `${parentBase}/tz/1.png`,
      guide: '【宠物场景】每周给猫狗用跳蚤香波洗澡；使用跳蚤项圈（选择知名品牌，避免中毒）。\n【家居场景】用吸尘器清理地毯、沙发（可清除跳蚤卵）；在角落喷洒宠物安全跳蚤喷雾（喷后通风3小时）。\n【被咬处理】涂抹氢化可的松软膏，避免抓挠；感染后涂抹碘伏。',
      guideImage: `${parentBase}/tz/2.png`
    }
  },
  {
    name: '米象',
    cartoonImg: 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/mx.jpg',
    realImg: `${parentBase}/mx/3.png`,
    childDesc: '钻到米袋里，啃食白米粒',
    adultDesc: {
      identify: '体长2.5-4mm。褐色，头部有细长"鼻子"（口吻，用于钻入米粒）。鞘翅有4个淡褐色斑点。幼虫白色（钻入米粒，成虫后留下空壳）。成虫可爬行和飞行（趋光性，喜欢光亮）。与"玉米象"的区别：身体更小，斑点更淡。',
      identifyImage: `${parentBase}/mx/1.png`,
      guide: '【存米场景】使用玻璃或陶瓷米罐（密封，塑料罐易被咬破）；一次购买不超过3个月用量。\n【驱避方法】在米罐中放入3-5瓣大蒜和干辣椒（米象不喜欢辛辣味，不影响米质）。\n【除虫方法】发现米象，将米放入冰箱冷冻24小时（可杀死成虫和虫卵），筛除后再食用。',
      guideImage: `${parentBase}/mx/2.png`
    }
  }
];

// 导出供小程序页面调用

module.exports = {
  beneficialInsects,
  harmfulInsects
};


