# 虫虫小侦探 - 后台管理系统

## 项目结构

```
BS/
├── admin-web/              # 前端项目（Vue 3 + Element Plus）
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── views/         # 页面组件
│   │   ├── layout/        # 布局组件
│   │   ├── router/        # 路由配置
│   │   └── stores/        # 状态管理
│   └── package.json
│
└── cloudfunctions/
    └── admin-service/      # 后台管理云函数
        ├── index.js
        └── package.json
```

## 技术栈

### 前端
- Vue 3
- Element Plus
- Pinia
- Vue Router
- Axios
- ECharts
- Vite

### 后端
- 腾讯云云函数
- MySQL
- JWT Token认证
- bcryptjs密码加密

## 快速开始

### 1. 前端开发

```bash
cd admin-web
npm install
npm run dev
```

访问 http://localhost:3000

### 2. 后端部署

```bash
cd cloudfunctions/admin-service
npm install

# 部署云函数
cd ..
npm run deploy:admin
```

### 3. 配置

1. **前端配置**：修改 `admin-web/src/api/request.js` 中的云函数地址
   ```javascript
   const CLOUD_FUNCTION_URL = 'https://your-env-id.ap-shanghai.app.tcloudbase.com/admin-service'
   ```

2. **数据库配置**：云函数中的数据库连接配置已在 `admin-service/index.js` 中设置

## 默认账号

- 用户名：`admin`
- 密码：`admin123456`

**首次登录后请立即修改密码！**

## 功能模块

### 已实现
- ✅ 登录/登出
- ✅ 仪表盘（基础统计）
- ✅ 昆虫管理（列表、删除）
- ✅ 基础布局和路由

### 待实现
- ⏳ 昆虫管理（添加、编辑）
- ⏳ 视频管理
- ⏳ 文章管理
- ⏳ 轮播图管理
- ⏳ 用户管理
- ⏳ 帖子管理
- ⏳ 系统设置

## 部署

### 前端部署（腾讯云静态网站托管）

1. 构建项目
   ```bash
   cd admin-web
   npm run build
   ```

2. 上传 `dist` 目录到腾讯云静态网站托管

3. 配置自定义域名（可选）

### 后端部署（腾讯云云函数）

```bash
cd cloudfunctions
npm run deploy:admin
```

详细部署说明请参考 `admin-web/DEPLOY.md`

## 开发计划

按照方案文档，后续开发计划：

1. **第一阶段**：基础框架 ✅
2. **第二阶段**：内容管理（进行中）
3. **第三阶段**：用户和社区管理
4. **第四阶段**：统计和优化

## 注意事项

1. 确保数据库连接配置正确
2. 确保云函数有访问数据库的权限
3. 前端需要配置正确的云函数地址
4. 建议在生产环境使用HTTPS
5. 定期备份数据库

