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

  console.log('AI Service called with action:', action, 'data:', data)

  if (action === 'chat') {
    return await handleChat(data)
  } else if (action === 'recognizeInsect') {
    // 处理参数：data可能是嵌套的
    const recognitionData = data.data || data
    return await handleInsectRecognition(recognitionData)
  } else {
    return { success: false, message: `Invalid action: ${action || 'undefined'}` }
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
async function handleInsectRecognition(params) {
  // 处理参数，兼容不同的传递方式
  const { imageUrl, fileID } = params || {}
  
  console.log('handleInsectRecognition called with:', { imageUrl, fileID })
  
  if (!imageUrl) {
    return { success: false, message: '图片URL不能为空' }
  }

  // 害虫列表和对应的防治工具
  const harmfulInsects = {
    '蚊子': { 
      tool: '驱蚊水', 
      keyword: '驱蚊水 花露水',
      link: 'https://s.taobao.com/search?q=驱蚊水花露水'
    },
    '蟑螂': { 
      tool: '蟑螂药', 
      keyword: '蟑螂药 杀蟑胶饵',
      link: 'https://s.taobao.com/search?q=蟑螂药杀蟑胶饵'
    },
    '苍蝇': { 
      tool: '苍蝇拍', 
      keyword: '苍蝇拍 粘蝇纸',
      link: 'https://s.taobao.com/search?q=苍蝇拍粘蝇纸'
    },
    '蚂蚁': { 
      tool: '蚂蚁药', 
      keyword: '蚂蚁药 灭蚁',
      link: 'https://s.taobao.com/search?q=蚂蚁药灭蚁'
    },
    '跳蚤': { 
      tool: '跳蚤药', 
      keyword: '跳蚤药 除跳蚤',
      link: 'https://s.taobao.com/search?q=跳蚤药除跳蚤'
    },
    '虱子': { 
      tool: '除虱剂', 
      keyword: '除虱剂 去虱',
      link: 'https://s.taobao.com/search?q=除虱剂去虱'
    },
    '德国小蠊': { 
      tool: '蟑螂药', 
      keyword: '蟑螂药 杀蟑胶饵',
      link: 'https://s.taobao.com/search?q=蟑螂药杀蟑胶饵'
    }
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

    // 检查是否是害虫
    for (const [name, info] of Object.entries(harmfulInsects)) {
      if (reply.includes(name) || insectName.includes(name)) {
        insectName = name
        isHarmful = true
        taobaoLink = info.link
        preventionTip = `推荐使用${info.tool}进行防治，可在淘宝搜索"${info.keyword}"购买相关产品。`
        break
      }
    }

    // 如果没有匹配到，检查是否是益虫
    if (!isHarmful) {
      for (const name of beneficialInsects) {
        if (reply.includes(name) || insectName.includes(name)) {
          insectName = name
          break
        }
      }
    }

    // 检查回复中是否明确提到害虫
    if (reply.includes('害虫') || reply.includes('有害')) {
      isHarmful = true
    } else if (reply.includes('益虫') || reply.includes('有益')) {
      isHarmful = false
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

