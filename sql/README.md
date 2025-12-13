# 数据库初始化SQL文件说明

本目录包含用于初始化小程序数据库的SQL文件。

## 文件列表

### 1. `01_insects.sql` - 昆虫数据
- **来源**: `miniprogram/data/insects.js`
- **内容**: 
  - 6种益虫：蜜蜂、七星瓢虫、螳螂、蜻蜓、蚯蚓、食蚜蝇
  - 6种害虫：蚊子、蟑螂、蚜虫、菜青虫、跳蚤、米象
- **注意**: 当前只包含基本字段，如需存储详细图片和描述信息，需要扩展表结构

### 2. `02_videos.sql` - 视频数据
- **来源**: `miniprogram/pages/theater/theater.js`
- **内容**: 14个视频记录
  - 4个益虫视频
  - 5个害虫视频
  - 5个其他类别视频
- **注意**: 包含创建videos表的SQL语句

### 3. `03_puzzle_configs.sql` - 拼图配置
- **来源**: `cloudfunctions/game-service/index.js`
- **内容**: 2个拼图配置
  - 蜜蜂拼图（简单，4片）
  - 蚊子拼图（困难，9片）

### 4. `04_banners.sql` - 轮播图数据
- **来源**: content-service（示例数据）
- **内容**: 3条轮播图示例数据
- **注意**: 请根据实际资源更新图片URL和链接

### 5. `05_articles.sql` - 文章数据
- **来源**: content-service（示例数据）
- **内容**: 5篇示例文章
  - 科普类：认识益虫和害虫、如何保护益虫、如何防治害虫
  - 指南类：昆虫观察指南
  - 安全类：儿童昆虫安全教育
- **注意**: 请根据实际需求更新文章内容

## 使用方法

### 方式一：按顺序执行所有SQL文件

```bash
# 在MySQL客户端中按顺序执行
mysql -h sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com -P 22809 -u root123456 -p cloud1-5g6ssvupb26437e4 < sql/01_insects.sql
mysql -h sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com -P 22809 -u root123456 -p cloud1-5g6ssvupb26437e4 < sql/02_videos.sql
mysql -h sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com -P 22809 -u root123456 -p cloud1-5g6ssvupb26437e4 < sql/03_puzzle_configs.sql
mysql -h sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com -P 22809 -u root123456 -p cloud1-5g6ssvupb26437e4 < sql/04_banners.sql
mysql -h sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com -P 22809 -u root123456 -p cloud1-5g6ssvupb26437e4 < sql/05_articles.sql
```

### 方式二：在数据库控制台执行

1. 登录腾讯云数据库控制台
2. 进入数据库实例
3. 打开SQL查询窗口
4. 按顺序复制粘贴每个SQL文件的内容并执行

### 方式三：使用数据库管理工具

使用Navicat、DBeaver等工具，按顺序导入执行SQL文件。

## 注意事项

1. **执行顺序**: 建议按照文件编号顺序执行（01 → 02 → 03 → 04 → 05）
2. **数据备份**: 执行前请备份现有数据（如果表已有数据）
3. **表结构**: 确保表结构已创建（云函数会自动创建，但也可以手动执行CREATE TABLE语句）
4. **数据更新**: 
   - 如果表已有数据，SQL中的`TRUNCATE TABLE`语句（已注释）可以取消注释来清空表
   - 或者使用`INSERT IGNORE`或`REPLACE INTO`来避免重复插入
5. **字段扩展**: 
   - `insects`表当前只包含基本字段，如需存储图片URL、详细描述等，需要扩展表结构
   - 可以考虑添加JSON字段存储完整的昆虫信息

## 表结构参考

各表的完整结构定义请参考：
- `DATABASE_SETUP.md` - 游戏相关表结构
- `CLOUDFUNCTIONS_DATABASE_CHECK.md` - 所有表结构说明
- 云函数代码中的`ensureTables()`函数

## 数据来源

- **insects**: `miniprogram/data/insects.js`
- **videos**: `miniprogram/pages/theater/theater.js`
- **puzzle_configs**: `cloudfunctions/game-service/index.js`
- **banners**: 示例数据（需根据实际情况更新）
- **articles**: 示例数据（需根据实际情况更新）

