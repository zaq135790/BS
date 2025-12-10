 // 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data = {} } = event
  
  try {
    switch (action) {
      case 'getInsectList':
        return await getInsectList(data)
      case 'getInsectDetail':
        return await getInsectDetail(data)
      case 'searchInsects':
        return await searchInsects(data)
      case 'getBannerList':
        return await getBannerList(data)
      case 'getArticleList':
        return await getArticleList(data)
      case 'getArticleDetail':
        return await getArticleDetail(data)
      default:
        return { success: false, message: 'Invalid action' }
    }
  } catch (error) {
    console.error('Content service error:', error)
    return { success: false, message: error.message }
  }
}

// 获取昆虫列表
async function getInsectList({ type, page = 1, pageSize = 10 }) {
  const query = { status: 'published' }
  if (type) query.type = type
  
  const countResult = await db.collection('insects').where(query).count()
  const result = await db.collection('insects')
    .where(query)
    .orderBy('sort', 'asc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: {
      list: result.data,
      pagination: {
        total: countResult.total,
        page,
        pageSize,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
  }
}

// 获取昆虫详情
async function getInsectDetail({ insectId }) {
  // 增加浏览记录
  await db.collection('insect_views').add({
    data: {
      insectId,
      viewTime: db.serverDate()
    }
  })
  
  const insect = await db.collection('insects').doc(insectId).get()
  return { success: true, data: insect.data }
}

// 搜索昆虫
async function searchInsects({ keyword, page = 1, pageSize = 10 }) {
  const result = await db.collection('insects')
    .where({
      status: 'published',
      $or: [
        { name: db.RegExp({ regexp: keyword, options: 'i' }) },
        { alias: db.RegExp({ regexp: keyword, options: 'i' }) },
        { description: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return { success: true, data: result.data }
}

// 获取轮播图列表
async function getBannerList() {
  const result = await db.collection('banners')
    .where({ status: 'published' })
    .orderBy('sort', 'asc')
    .get()
  
  return { success: true, data: result.data }
}

// 获取文章列表
async function getArticleList({ category, page = 1, pageSize = 10 }) {
  const query = { status: 'published' }
  if (category) query.category = category
  
  const countResult = await db.collection('articles').where(query).count()
  const result = await db.collection('articles')
    .where(query)
    .orderBy('createTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: {
      list: result.data,
      pagination: {
        total: countResult.total,
        page,
        pageSize,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
  }
}

// 获取文章详情
async function getArticleDetail({ articleId }) {
  const article = await db.collection('articles').doc(articleId).get()
  
  // 增加阅读量
  await db.collection('articles').doc(articleId).update({
    data: {
      viewCount: db.command.inc(1)
    }
  })
  
  return { success: true, data: article.data }
}
