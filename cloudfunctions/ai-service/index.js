// AI 助手云函数：调用 SiliconFlow Chat Completions
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 固定模型与密钥（由业务方提供）
// 聊天使用文本模型，识别使用视觉模型
const CHAT_MODEL = 'deepseek-ai/DeepSeek-V3.2'
const VISION_MODEL = 'zai-org/GLM-4.6V'  // 视觉模型用于昆虫识别
const API_KEY = 'sk-hglpylwsfbizzckehuwyrrylpnebxvjlcmhgjphfbsqgowjy'
const ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'
// axios 实例，统一超时 60s（视觉模型需要更长时间）
const client = axios.create({
  timeout: 60000
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
      model: CHAT_MODEL,
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
    // 构建识别提示词 - 要求AI生成简洁的百科全书
    const recognitionPrompt = `请仔细观察这张昆虫照片，识别昆虫并生成简洁的百科全书内容。

请按照以下要求回答：
1. 首先识别图片中的昆虫名称（中文名称）
2. 判断是益虫还是害虫
3. 生成一篇简洁的百科全书式介绍，必须包含以下内容：
   - 基本信息：分类、学名、形态特征（体长、颜色、特殊标记等）
   - 生活习性：栖息环境、活动时间、食性、繁殖方式
   - 生态作用：对自然环境的影响、与人类的关系
   - 识别要点：如何准确识别这种昆虫，与相似昆虫的区别
   - 防治或保护：如果是害虫，提供防治方法；如果是益虫，提供保护建议

要求：
- 内容专业但通俗易懂，适合家长阅读
- 字数严格控制在200-500字之间，要求简洁精炼，不要超过500字
- 使用分段清晰的格式，每段2-3句话，段落之间用空行分隔
- 每个要点用1-2句话概括即可，不要展开过多细节
- 确保每个段落都是完整的句子，不要在句子中间结束
- 如果无法准确识别，请说明可能是什么昆虫，并给出通用介绍

请直接开始回答，格式如下：
【昆虫名称】：XXX
【类型】：益虫/害虫
【百科全书】：
（这里写详细的百科全书内容，确保总字数在200-500字之间，每个段落完整）`

    // 对于视觉模型，使用支持图片的消息格式
    // GLM-4.6V 支持图片URL直接放在content中，或者使用数组格式
    const userMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: recognitionPrompt
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        }
      ]
    }

    const res = await client.post(ENDPOINT, {
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的昆虫识别专家和科普作家，擅长识别各种昆虫并撰写详细的百科全书式介绍。你的回答要专业、准确、通俗易懂。'
        },
        userMessage
      ],
      stream: false,
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 1200,  // 调整token数量以生成200-500字内容
      enable_thinking: false  // GLM-4.6V 支持 thinking 模式，但识别任务不需要
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000  // 视觉模型需要更长的处理时间
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

    // 智能截断函数：确保在完整段落或句子处截断
    function smartTruncate(text, maxLength = 500) {
      if (text.length <= maxLength) {
        return text
      }
      
      // 允许稍微超过限制（最多520字），以便找到更好的截断点
      const searchLength = Math.min(maxLength + 20, text.length)
      
      // 优先级1：在段落边界截断（\n\n）
      const paragraphIndex = text.lastIndexOf('\n\n', searchLength)
      if (paragraphIndex > maxLength * 0.6) { // 如果段落边界在60%位置之后，使用段落边界
        const truncated = text.substring(0, paragraphIndex).trim()
        // 确保截断后不会太短（至少保留80%的内容）
        if (truncated.length >= maxLength * 0.8) {
          return truncated
        }
      }
      
      // 优先级2：在句子边界截断（。！？）
      const sentenceEndings = ['。', '！', '？', '.', '!', '?']
      let bestSentenceIndex = -1
      
      for (const ending of sentenceEndings) {
        const index = text.lastIndexOf(ending, searchLength)
        if (index > bestSentenceIndex && index >= maxLength * 0.75) { // 句子边界在75%位置之后
          bestSentenceIndex = index
        }
      }
      
      if (bestSentenceIndex > 0) {
        const truncated = text.substring(0, bestSentenceIndex + 1).trim()
        // 确保截断后不会太短
        if (truncated.length >= maxLength * 0.75) {
          return truncated
        }
      }
      
      // 优先级3：在分句标点处截断（，；：）
      const punctuation = ['，', ',', '；', ';', '：', ':']
      for (const punc of punctuation) {
        const index = text.lastIndexOf(punc, searchLength)
        if (index >= maxLength * 0.85) {
          const truncated = text.substring(0, index).trim()
          if (truncated.length >= maxLength * 0.8) {
            return truncated + '...'
          }
        }
      }
      
      // 最后的选择：如果找不到合适的截断点，在字边界截断
      // 但尽量保留更多内容（允许稍微超过限制）
      if (text.length <= searchLength) {
        return text.trim()
      }
      
      return text.substring(0, maxLength - 3).trim() + '...'
    }

    // 确保百科全书内容在合理范围内（200-500字）
    if (encyclopedia.length < 200) {
      encyclopedia = `${insectName}是一种${isHarmful ? '常见的害虫' : '有益的昆虫'}。\n\n${encyclopedia}\n\n如需更详细的信息，建议查阅专业的昆虫图鉴或咨询相关专家。`
    }
    
    // 如果内容过长，使用智能截断，确保在完整段落或句子处截断
    if (encyclopedia.length > 500) {
      encyclopedia = smartTruncate(encyclopedia, 500)
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
    console.error('昆虫识别错误:', {
      message,
      error: error?.response?.data || error,
      imageUrl: imageUrl ? 'provided' : 'missing'
    })
    
    // 如果是格式错误，尝试使用备用格式
    if (message.includes('format') || message.includes('invalid') || message.includes('不支持')) {
      console.log('尝试使用备用图片格式...')
      // 可以在这里添加备用格式的尝试
    }
    
    return { success: false, message }
  }
}

