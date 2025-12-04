# 虫虫小侦探数据库配置说明

## 数据库连接配置

### 1. 云函数配置
在以下云函数文件中，需要修改数据库连接配置：

- `cloudfunctions/quickstartFunctions/database/index.js`
- `cloudfunctions/quickstartFunctions/login/index.js`

### 2. 配置参数
```javascript
const dbConfig = {
  host: 'localhost',        // 数据库主机地址
  port: 3306,              // 数据库端口
  user: 'root',            // 数据库用户名
  password: 'your_password', // 数据库密码（请替换为实际密码）
  database: 'insect_detective_db', // 数据库名称
  charset: 'utf8mb4'       // 字符集
};
```

### 3. 部署步骤

1. **安装依赖**
   ```bash
   cd cloudfunctions/quickstartFunctions/database
   npm install
   
   cd ../login
   npm install
   ```

2. **修改数据库配置**
   - 将 `your_password` 替换为实际的数据库密码
   - 确保数据库主机地址正确

3. **上传云函数**
   ```bash
   # 在微信开发者工具中右键云函数文件夹，选择"上传并部署"
   ```

### 4. 数据库表结构

数据库包含以下主要表：

- `users` - 用户信息表
- `insects` - 昆虫图鉴表
- `videos` - 视频资源表
- `game_records` - 游戏记录表
- `observation_records` - 观察记录表
- `comments` - 评论表
- `learning_progress` - 学习进度表
- `judge_records` - 判断记录表
- `puzzle_configs` - 拼图配置表

### 5. 注意事项

- 确保MySQL服务正在运行
- 确保数据库 `insect_detective_db` 已创建
- 确保所有表已按照SQL文件创建
- 云函数需要部署到微信云开发环境
- 小程序需要配置云环境ID

### 6. 测试连接

部署完成后，可以通过以下方式测试：

1. 在小程序中触发登录功能
2. 查看云函数日志确认连接状态
3. 检查数据库是否有新用户记录

### 7. 故障排除

如果遇到连接问题：

1. 检查数据库服务是否运行
2. 验证用户名密码是否正确
3. 确认网络连接正常
4. 查看云函数错误日志
5. 检查数据库权限设置


