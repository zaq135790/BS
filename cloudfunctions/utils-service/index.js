// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const crypto = require('crypto')

exports.main = async (event, context) => {
  const { action, data = {} } = event
  
  try {
    switch (action) {
      case 'getOpenId':
        return await getOpenId(data)
      case 'uploadFile':
        return await uploadFile(data)
      case 'getTempFileURL':
        return await getTempFileURL(data)
      case 'sendTemplateMessage':
        return await sendTemplateMessage(data)
      case 'getAccessToken':
        return await getAccessToken()
      case 'decryptData':
        return await decryptData(data)
      default:
        return { success: false, message: 'Invalid action' }
    }
  } catch (error) {
    console.error('Utils service error:', error)
    return { success: false, message: error.message }
  }
}

// 获取 openid 和 session_key
async function getOpenId({ code }) {
  const { OPENID, APPID, APPSECRET } = cloud.getWXContext()
  
  // 使用 code 换取 openid 和 session_key
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APPSECRET}&js_code=${code}&grant_type=authorization_code`
  
  const res = await cloud.callFunction({
    name: 'http',
    data: {
      url,
      method: 'GET'
    }
  })
  
  if (res.result.errcode) {
    throw new Error(res.result.errmsg || '获取 openid 失败')
  }
  
  return { 
    success: true, 
    data: {
      openid: res.result.openid,
      session_key: res.result.session_key
    }
  }
}

// 上传文件
async function uploadFile({ cloudPath, fileContent }) {
  const result = await cloud.uploadFile({
    cloudPath,
    fileContent: Buffer.from(fileContent, 'base64')
  })
  
  return { 
    success: true, 
    data: { 
      fileID: result.fileID 
    } 
  }
}

// 获取临时文件链接
async function getTempFileURL({ fileList }) {
  const result = await cloud.getTempFileURL({ fileList })
  return { success: true, data: result.fileList }
}

// 发送模板消息
async function sendTemplateMessage({ toUser, templateId, page, data }) {
  const accessToken = await getAccessToken()
  
  const result = await cloud.callFunction({
    name: 'http',
    data: {
      url: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      method: 'POST',
      data: {
        touser: toUser,
        template_id: templateId,
        page,
        data
      }
    }
  })
  
  if (result.result.errcode !== 0) {
    throw new Error(result.result.errmsg || '发送模板消息失败')
  }
  
  return { success: true }
}

// 获取 access_token
let accessTokenCache = null
let accessTokenExpireTime = 0

async function getAccessToken() {
  const now = Date.now()
  
  // 检查缓存是否有效
  if (accessTokenCache && now < accessTokenExpireTime) {
    return accessTokenCache
  }
  
  // 从微信服务器获取 access_token
  const { APPID, APPSECRET } = cloud.getWXContext()
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
  
  const res = await cloud.callFunction({
    name: 'http',
    data: {
      url,
      method: 'GET'
    }
  })
  
  if (res.result.errcode) {
    throw new Error(res.result.errmsg || '获取 access_token 失败')
  }
  
  // 更新缓存
  accessTokenCache = res.result.access_token
  accessTokenExpireTime = now + (res.result.expires_in - 300) * 1000 // 提前5分钟过期
  
  return accessTokenCache
}

// 解密数据
async function decryptData({ sessionKey, encryptedData, iv }) {
  try {
    // 使用 crypto 解密数据
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64')
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64')
    const ivBuffer = Buffer.from(iv, 'base64')
    
    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer)
    decipher.setAutoPadding(true)
    
    let decoded = decipher.update(encryptedDataBuffer, 'binary', 'utf8')
    decoded += decipher.final('utf8')
    
    return { 
      success: true, 
      data: JSON.parse(decoded) 
    }
  } catch (error) {
    console.error('Decrypt data error:', error)
    return { 
      success: false, 
      message: '解密数据失败',
      error: error.message
    }
  }
}