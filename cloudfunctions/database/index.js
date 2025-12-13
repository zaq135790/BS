// 简易占位云函数，避免 FUNCTION_NOT_FOUND
// 如需真实数据库操作，可在此按 action 路由到对应逻辑
exports.main = async (event) => {
  const { action } = event || {}
  return {
    success: false,
    message: `database 云函数未实现 action: ${action || 'unknown'}，请根据业务补全逻辑。`
  }
}

