// AI 助手云函数：调用 SiliconFlow Chat Completions
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 固定模型与密钥（由业务方提供）
const MODEL = 'deepseek-ai/DeepSeek-V3.2'
const API_KEY = 'sk-hglpylwsfbizzckehuwyrrylpnebxvjlcmhgjphfbsqgowjy'
const ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'
// axios 实例，统一超时 20s（与云函数配置一致）
const client = axios.create({
  timeout: 20000
})

// 构造系统提示，确保回答贴合虫虫科普与儿童友好场景
const SYSTEM_PROMPT = [
  '你是虫虫小侦探小程序里的AI知识助手，面向儿童和家长，语气友好、简洁。',
  '请用通俗的中文回答昆虫、生物与自然探索类问题，可给出安全、环保的建议。',
  '若问题超出安全或隐私范围，请委婉拒绝并引导用户提出与虫虫相关的问题。',
].join('\n')

exports.main = async (event) => {
  const { action, data = {} } = event || {}

  if (action === 'chat') {
    return await handleChat(data)
  } else if (action === 'recognizeInsect') {
    return await handleInsectRecognition(data)
  } else {
    return { success: false, message: 'Invalid action' }
  }
}

async function handleChat({ prompt, history = [] }) {
  const question = (prompt || '').trim()
  if (!question) {
    return { success: false, message: '请先输入想要咨询的问题~' }
  }

  // 仅保留最近 6 条对话做上下文，避免请求过长
  const recentHistory = (history || []).slice(-6)
  const historyMessages = recentHistory.map(item => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: String(item.content || '').slice(0, 600)
  }))

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historyMessages,
    { role: 'user', content: question }
  ]

  try {
    const res = await client.post(ENDPOINT, {
      model: MODEL,
      messages,
      stream: false,
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 256
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      // 双保险，保持 20s
      timeout: 20000
    })

    const reply = res.data?.choices?.[0]?.message?.content || ''
    return {
      success: true,
      data: {
        answer: reply.trim() || '我还没有想好回答，再试一次吧~',
        usage: res.data?.usage || null
      }
    }
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      'AI 助手暂时开小差了，请稍后重试'
    console.error('AI chat error:', message)
    // 区分超时，前端可给出更友好提示
    if (message && message.includes('timeout')) {
      return {
        success: false,
        message: '回答有点慢，已超时，请再试一次或换个说法~'
      }
    }
    return { success: false, message }
  }
}

// 昆虫识别处理函数
async function handleInsectRecognition({ imageUrl, fileID }) {
  if (!imageUrl) {
    return { success: false, message: '图片URL不能为空' }
  }

  // 害虫列表和对应的防治工具（覆盖更多常见害虫）
  const harmfulInsects = {
    '蚊子': { 
      tool: '驱蚊产品', 
      keyword: '驱蚊喷雾 电蚊拍',
      link: 'https://s.taobao.com/search?q=%E9%A9%B1%E8%9A%8A%E5%96%B7%E9%9B%BE%20%E7%94%B5%E8%9A%8A%E6%8B%8D'
    },
    '蟑螂': { 
      tool: '蟑螂药', 
      keyword: '蟑螂药 杀蟑胶饵',
      link: 'https://s.taobao.com/search?q=%E8%9F%91%E8%9E%82%E8%8D%AF%20%E6%9D%80%E8%9F%91%E8%83%B6%E9%A5%B5'
    },
    '菜青虫': { 
      tool: '菜青虫防治产品', 
      keyword: '菜青虫 防治',
      link: 'https://s.taobao.com/search?q=%E8%8F%9C%E9%9D%92%E8%99%AB%20%E9%98%B2%E6%B2%BB'
    },
    '米象': { 
      tool: '粮仓防虫剂', 
      keyword: '米象 防治',
      link: 'https://s.taobao.com/search?q=%E7%B1%B3%E8%B1%A1%20%E9%98%B2%E6%B2%BB'
    },
    '跳蚤': { 
      tool: '除跳蚤用品', 
      keyword: '跳蚤药 除跳蚤',
      link: 'https://s.taobao.com/search?q=%E8%B7%B3%E8%9A%A4%E8%8D%AF%20%E9%99%A4%E8%B7%B3%E8%9A%A4'
    },
    '虱子': { 
      tool: '除虱剂', 
      keyword: '除虱剂 去虱',
      link: 'https://s.taobao.com/search?q=%E9%99%A4%E8%99%B1%E5%89%82%20%E5%8E%BB%E8%99%B1'
    },
    '苍蝇': { 
      tool: '灭蝇用品', 
      keyword: '苍蝇拍 灭蝇贴',
      link: 'https://s.taobao.com/search?q=%E8%8B%8D%E8%9D%87%E6%8B%8D%20%E7%81%AD%E8%9D%87%E8%B4%B4'
    },
    '蚂蚁': { 
      tool: '灭蚁产品', 
      keyword: '蚂蚁药 杀蚂蚁',
      link: 'https://s.taobao.com/search?q=%E8%9A%82%E8%9A%81%E8%8D%AF%20%E6%9D%80%E8%9A%82%E8%9A%81'
    },
    '果蝇': { 
      tool: '果蝇防治产品', 
      keyword: '果蝇诱捕器',
      link: 'https://s.taobao.com/search?q=%E6%9E%9C%E8%9D%87%E8%AF%B1%E6%8D%95%E5%99%A8'
    },
    '衣蛾': { 
      tool: '防虫用品', 
      keyword: '衣蛾 防治',
      link: 'https://s.taobao.com/search?q=%E8%A1%A3%E8%9B%BE%20%E9%98%B2%E6%B2%BB'
    },
    '衣鱼': { 
      tool: '除虫产品', 
      keyword: '衣鱼 防治',
      link: 'https://s.taobao.com/search?q=%E8%A1%A3%E9%B1%BC%20%E9%98%B2%E6%B2%BB'
    },
    '白蚁': { 
      tool: '白蚁防治产品', 
      keyword: '白蚁药 灭白蚁',
      link: 'https://s.taobao.com/search?q=%E7%99%BD%E8%9A%81%E8%8D%AF%20%E7%81%AD%E7%99%BD%E8%9A%81'
    },
    '蛾蚋': { 
      tool: '下水道清洁剂', 
      keyword: '蛾蚋 防治',
      link: 'https://s.taobao.com/search?q=%E8%9B%BE%E8%9A%8B%20%E9%98%B2%E6%B2%BB'
    },
    '蟋蟀': { 
      tool: '除蟋蟀产品', 
      keyword: '蟋蟀 防治',
      link: 'https://s.taobao.com/search?q=%E8%9F%8B%E8%9F%80%20%E9%98%B2%E6%B2%BB'
    },
    '蠼螋': { 
      tool: '除虫剂', 
      keyword: '蠼螋 防治',
      link: 'https://s.taobao.com/search?q=%E8%A0%BC%E8%9E%8B%20%E9%98%B2%E6%B2%BB'
    },
    '蠓虫': { 
      tool: '驱蠓产品', 
      keyword: '蠓虫 防治',
      link: 'https://s.taobao.com/search?q=%E8%A0%93%E8%99%AB%20%E9%98%B2%E6%B2%BB'
    },
    '德国小蠊': { 
      tool: '蟑螂药', 
      keyword: '蟑螂药 杀蟑胶饵',
      link: 'https://s.taobao.com/search?q=%E8%9F%91%E8%9E%82%E8%8D%AF%20%E6%9D%80%E8%9F%91%E8%83%B6%E9%A5%B5'
    }
  }

  // 害虫判定函数：结合名称、预设表和关键词打分
  function checkIfHarmful(reply, insectName) {
    console.log('检查害虫:', { insectName, reply: reply.substring(0, 100) })
  
    const lowerReply = reply.toLowerCase()
    const lowerInsectName = (insectName || '').toLowerCase()
  
    // 1. 先看预设害虫表
    for (const [name, info] of Object.entries(harmfulInsects)) {
      const lowerName = name.toLowerCase()
      const isMatch =
        lowerReply.includes(lowerName) ||
        lowerInsectName.includes(lowerName) ||
        (name === '蟑螂' &&
          (lowerReply.includes('德国小蠊') ||
            lowerReply.includes('小蠊') ||
            lowerInsectName.includes('小蠊'))) ||
        (name === '蚊子' &&
          (lowerReply.includes('蚊') || lowerInsectName.includes('蚊'))) ||
        (name === '苍蝇' &&
          (lowerReply.includes('蝇') || lowerInsectName.includes('蝇'))) ||
        (name === '蚂蚁' &&
          (lowerReply.includes('蚁') || lowerInsectName.includes('蚁')))
  
      if (isMatch) {
        console.log(`匹配到预设害虫: ${name}`)
        return { isHarmful: true, matchedName: name, info }
      }
    }
  
    // 2. 关键词打分
    const harmfulKeywords = [
      '害虫','有害','传播疾病','叮咬','害虫防治','消灭','防治','杀灭',
      '驱赶','叮人','咬人','传播病菌','危害'
    ]
    const beneficialKeywords = [
      '益虫','有益','捕食害虫','传粉','保护','有益于','帮助','生态平衡'
    ]
  
    let harmfulScore = 0
    let beneficialScore = 0
  
    harmfulKeywords.forEach((keyword) => {
      if (lowerReply.includes(keyword.toLowerCase())) harmfulScore += 1
    })
  
    beneficialKeywords.forEach((keyword) => {
      if (lowerReply.includes(keyword.toLowerCase())) beneficialScore += 1
    })
  
    console.log(`有害关键词得分: ${harmfulScore}, 有益关键词得分: ${beneficialScore}`)
  
    if (harmfulScore > beneficialScore || (harmfulScore > 0 && beneficialScore === 0)) {
      console.log('根据关键词判断为害虫')
      return { isHarmful: true, matchedName: insectName, info: null }
    }
  
    // 3. 名称中是否包含明显有害暗示
    const harmfulNamePatterns = ['蚊','蝇','蟑','蠊','蚤','虱','蚁','蠹','蠼','螋','蠓']
    for (const pattern of harmfulNamePatterns) {
      if (lowerInsectName.includes(pattern) || lowerReply.includes(pattern)) {
        console.log(`昆虫名称包含有害暗示: ${pattern}`)
        return { isHarmful: true, matchedName: insectName, info: null }
      }
    }
  
    return { isHarmful: false, matchedName: insectName, info: null }
  }

  // 益虫列表
  const beneficialInsects = ['蜜蜂', '七星瓢虫', '蜻蜓', '螳螂', '蚯蚓', '食蚜蝇']

  try {
    // 构建识别提示词 - 要求AI生成详细的百科全书
    const recognitionPrompt = `用户上传了一张昆虫照片，请根据图片识别昆虫并生成详细的百科全书内容。

请按照以下要求回答：
1. 首先识别图片中的昆虫名称（中文名称）
2. 判断是益虫还是害虫
3. 生成一篇约1000字的百科全书式介绍，必须包含以下内容：
   - 基本信息：分类、学名、形态特征（体长、颜色、特殊标记等）
   - 生活习性：栖息环境、活动时间、食性、繁殖方式
   - 生态作用：对自然环境的影响、与人类的关系
   - 识别要点：如何准确识别这种昆虫，与相似昆虫的区别
   - 防治或保护：如果是害虫，提供防治方法；如果是益虫，提供保护建议

要求：
- 内容专业但通俗易懂，适合家长阅读
- 字数控制在800-1200字之间
- 使用分段清晰的格式
- 如果无法准确识别，请说明可能是什么昆虫，并给出通用介绍

请直接开始回答，格式如下：
【昆虫名称】：XXX
【类型】：益虫/害虫
【百科全书】：
（这里写详细的百科全书内容）`

    const res = await client.post(ENDPOINT, {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的昆虫识别专家和科普作家，擅长识别各种昆虫并撰写详细的百科全书式介绍。你的回答要专业、准确、通俗易懂。'
        },
        {
          role: 'user',
          content: recognitionPrompt
        }
      ],
      stream: false,
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 2500  // 增加token数量以生成1000字内容
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000  // 增加超时时间
    })

    const reply = res.data?.choices?.[0]?.message?.content || ''
    
    // 解析回复，提取昆虫名称和类型
    let insectName = '未知昆虫'
    let isHarmful = false
    let encyclopedia = reply.trim()
    let taobaoLink = null
    let preventionTip = ''

    // 尝试从回复中提取昆虫名称
    const namePatterns = [
      /【昆虫名称】[：:]\s*([^\n]+)/,
      /昆虫名称[：:]\s*([^\n]+)/,
      /是[：:]\s*([^\n，,。]+)/,
      /([蜜蜂|七星瓢虫|蜻蜓|螳螂|蚯蚓|食蚜蝇|蚊子|蟑螂|苍蝇|蚂蚁|跳蚤|虱子|德国小蠊]+)/
    ]
    
    for (const pattern of namePatterns) {
      const match = reply.match(pattern)
      if (match && match[1]) {
        insectName = match[1].trim()
        break
      }
    }

    // 使用统一函数检查是否为害虫，并生成对应的淘宝链接/防治建议
    const harmfulCheck = checkIfHarmful(reply, insectName)
    isHarmful = harmfulCheck.isHarmful
    taobaoLink = null
    preventionTip = ''

    console.log(`害虫检查结果: ${isHarmful ? '是害虫' : '不是害虫'}`, harmfulCheck)

    if (isHarmful) {
      if (harmfulCheck.info) {
        taobaoLink = harmfulCheck.info.link
        preventionTip = `推荐使用${harmfulCheck.info.tool}进行防治，可在淘宝搜索"${harmfulCheck.info.keyword}"购买相关产品。`
        console.log(`使用预设链接: ${taobaoLink}`)
      } else {
        const keyword = `${harmfulCheck.matchedName} 防治`
        taobaoLink = `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}`
        preventionTip = `建议搜索"${keyword}"查看相关防治工具。`
        console.log(`生成通用链接: ${taobaoLink}`)
      }

      if (!taobaoLink || taobaoLink.trim() === '') {
        taobaoLink = 'https://s.taobao.com/search?q=%E5%AE%B3%E8%99%AB%20%E9%98%B2%E6%B2%BB'
        preventionTip = preventionTip || '建议搜索"害虫 防治"购买相关产品。'
        console.log('使用默认链接')
      }

      if (!preventionTip || preventionTip.trim() === '') {
        preventionTip = `对于${harmfulCheck.matchedName}，建议采取适当的防治措施，可参考相关防治产品。`
      }

      // 以检查结果中的名称为准
      insectName = harmfulCheck.matchedName || insectName
    } else {
      // 非害虫时，保留益虫识别逻辑（可选）
      for (const name of beneficialInsects) {
        if (reply.includes(name) || insectName.includes(name)) {
          insectName = name
          break
        }
      }
    }

    // 提取百科全书内容
    const encyclopediaMatch = reply.match(/【百科全书】[：:]?\s*([\s\S]+)/)
    if (encyclopediaMatch) {
      encyclopedia = encyclopediaMatch[1].trim()
    } else {
      // 如果没有明确标记，使用整个回复作为百科全书
      encyclopedia = reply.replace(/【昆虫名称】[：:][^\n]+\n?/g, '')
                        .replace(/【类型】[：:][^\n]+\n?/g, '')
                        .replace(/【百科全书】[：:]?\s*/g, '')
                        .trim()
    }

    // 确保百科全书内容足够详细
    if (encyclopedia.length < 500) {
      encyclopedia = `# ${insectName}百科全书\n\n${insectName}是一种${isHarmful ? '常见的害虫' : '有益的昆虫'}。\n\n${encyclopedia}\n\n以上是关于${insectName}的基本介绍，如需更详细的信息，建议查阅专业的昆虫图鉴或咨询相关专家。`
    }

    return {
      success: true,
      data: {
        insectName,
        isHarmful,
        encyclopedia,
        taobaoLink,
        preventionTip
      }
    }
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      '识别失败，请稍后重试'
    console.error('昆虫识别错误:', message)
    return { success: false, message }
  }
}

