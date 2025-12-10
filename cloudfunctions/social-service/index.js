 // 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data = {} } = event
  
  try {
    switch (action) {
      case 'createPost':
        return await createPost(data)
      case 'getPostList':
        return await getPostList(data)
      case 'getPostDetail':
        return await getPostDetail(data)
      case 'createComment':
        return await createComment(data)
      case 'likePost':
        return await likePost(data)
      case 'getUserPosts':
        return await getUserPosts(data)
      default:
        return { success: false, message: 'Invalid action' }
    }
  } catch (error) {
    console.error('Social service error:', error)
    return { success: false, message: error.message }
  }
}

// 创建帖子
async function createPost({ userId, content, images = [] }) {
  const post = {
    userId,
    content,
    images,
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    status: 'published',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
  
  const result = await db.collection('posts').add({ data: post })
  return { success: true, data: { postId: result._id } }
}

// 获取帖子列表
async function getPostList({ page = 1, pageSize = 10, sort = 'latest' }) {
  let orderBy = { field: 'createTime', sort: 'desc' }
  
  if (sort === 'hottest') {
    orderBy = { field: 'likeCount', sort: 'desc' }
  }
  
  const countResult = await db.collection('posts')
    .where({ status: 'published' })
    .count()
  
  const posts = await db.collection('posts')
    .where({ status: 'published' })
    .orderBy(orderBy.field, orderBy.sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 获取用户信息
  const userIds = [...new Set(posts.data.map(p => p.userId))]
  const users = await db.collection('users')
    .where({ _openid: db.command.in(userIds) })
    .get()
  
  const userMap = users.data.reduce((map, user) => {
    map[user._openid] = user
    return map
  }, {})
  
  // 组合数据
  const postList = posts.data.map(post => ({
    ...post,
    user: userMap[post.userId] || { nickName: '未知用户' }
  }))
  
  return {
    success: true,
    data: {
      list: postList,
      pagination: {
        total: countResult.total,
        page,
        pageSize,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
  }
}

// 获取帖子详情
async function getPostDetail({ postId, userId }) {
  // 增加浏览记录
  await db.collection('post_views').add({
    data: {
      postId,
      userId,
      viewTime: db.serverDate()
    }
  })
  
  // 更新浏览数
  await db.collection('posts').doc(postId).update({
    data: {
      viewCount: db.command.inc(1)
    }
  })
  
  // 获取帖子详情
  const post = await db.collection('posts').doc(postId).get()
  
  // 获取用户信息
  const user = await db.collection('users').doc(post.data.userId).get()
  
  // 获取评论
  const comments = await db.collection('comments')
    .where({ postId, status: 'published' })
    .orderBy('createTime', 'desc')
    .limit(50)
    .get()
  
  // 获取评论用户信息
  const commentUserIds = [...new Set(comments.data.map(c => c.userId))]
  const commentUsers = await db.collection('users')
    .where({ _openid: db.command.in(commentUserIds) })
    .get()
  
  const commentUserMap = commentUsers.data.reduce((map, user) => {
    map[user._openid] = user
    return map
  }, {})
  
  // 组合评论数据
  const commentList = comments.data.map(comment => ({
    ...comment,
    user: commentUserMap[comment.userId] || { nickName: '未知用户' }
  }))
  
  // 检查当前用户是否点赞
  let isLiked = false
  if (userId) {
    const like = await db.collection('post_likes')
      .where({ postId, userId })
      .get()
    isLiked = like.data.length > 0
  }
  
  return {
    success: true,
    data: {
      ...post.data,
      user: user.data,
      comments: commentList,
      isLiked
    }
  }
}

// 创建评论
async function createComment({ userId, postId, content, replyTo = null }) {
  const comment = {
    userId,
    postId,
    content,
    replyTo,
    status: 'published',
    createTime: db.serverDate()
  }
  
  const result = await db.collection('comments').add({ data: comment })
  
  // 更新帖子评论数
  await db.collection('posts').doc(postId).update({
    commentCount: db.command.inc(1)
  })
  
  return { success: true, data: { commentId: result._id } }
}

// 点赞/取消点赞
async function likePost({ userId, postId }) {
  // 检查是否已点赞
  const like = await db.collection('post_likes')
    .where({ userId, postId })
    .get()
  
  if (like.data.length > 0) {
    // 取消点赞
    await db.collection('post_likes').doc(like.data[0]._id).remove()
    await db.collection('posts').doc(postId).update({
      likeCount: db.command.inc(-1)
    })
    return { success: true, data: { isLiked: false } }
  } else {
    // 点赞
    await db.collection('post_likes').add({
      data: { userId, postId, createTime: db.serverDate() }
    })
    await db.collection('posts').doc(postId).update({
      likeCount: db.command.inc(1)
    })
    return { success: true, data: { isLiked: true } }
  }
}

// 获取用户帖子
async function getUserPosts({ userId, page = 1, pageSize = 10 }) {
  const countResult = await db.collection('posts')
    .where({ userId, status: 'published' })
    .count()
  
  const posts = await db.collection('posts')
    .where({ userId, status: 'published' })
    .orderBy('createTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: {
      list: posts.data,
      pagination: {
        total: countResult.total,
        page,
        pageSize,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
  }
}
