// AI 助手云函数：调用 SiliconFlow Chat Completions
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 固定模型与密钥（由业务方提供）
const MODEL = 'deepseek-ai/DeepSeek-V3.2'
const API_KEY = 'sk-hglpylwsfbizzckehuwyrrylpnebxvjlcmhgjphfbsqgowjy'
const ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'

// 构造系统提示，确保回答贴合虫虫科普与儿童友好场景
const SYSTEM_PROMPT = [
  '你是虫虫小侦探小程序里的AI知识助手，面向儿童和家长，语气友好、简洁。',
  '请用通俗的中文回答昆虫、生物与自然探索类问题，可给出安全、环保的建议。',
  '若问题超出安全或隐私范围，请委婉拒绝并引导用户提出与虫虫相关的问题。',
].join('\n')

exports.main = async (event) => {
  const { action, data = {} } = event || {}

  if (action !== 'chat') {
    return { success: false, message: 'Invalid action' }
  }

  return await handleChat(data)
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
    const res = await axios.post(
      ENDPOINT,
      {
        model: MODEL,
        messages,
        stream: false,
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 400
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 6000
      }
    )

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
    return { success: false, message }
  }
}

