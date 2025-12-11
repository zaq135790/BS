# 数据库设置说明

## 数据库类型

本项目使用 **MySQL 数据库**（腾讯云 CynosDB），而不是云开发的 NoSQL 数据库。

## 数据库连接配置

数据库连接配置在 `cloudfunctions/game-service/index.js` 和 `cloudfunctions/user-service/index.js` 中：

```javascript
const dbConfig = {
  host: 'sh-cynosdbmysql-grp-3yetvb6m.sql.tencentcdb.com',
  port: 22809,
  user: 'root123456',
  password: 'Zz123456',
  database: 'cloud1-5g6ssvupb26437e4',
  waitForConnections: true,
  connectionLimit: 5,
  timezone: 'Z',
  connectTimeout: 1500,
  acquireTimeout: 2000
}
```

## 自动创建表结构

代码会在首次调用时自动创建所需的表结构，无需手动创建。表结构包括：

### 1. game_records 表（游戏记录）

```sql
CREATE TABLE IF NOT EXISTS game_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game_type VARCHAR(64) NOT NULL,
  game_id VARCHAR(64) NULL,
  score INT DEFAULT 0,
  duration INT DEFAULT 0,
  details JSON NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_user_id (user_id),
  INDEX idx_game_type (game_type),
  INDEX idx_score (score),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明：**
- `id`: 记录ID（自增主键）
- `user_id`: 用户ID（关联users表）
- `game_type`: 游戏类型（如：益害判官、虫虫拼图）
- `game_id`: 游戏ID（可选）
- `score`: 分数
- `duration`: 游戏时长（秒）
- `details`: 详细信息（JSON格式）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. user_game_stats 表（用户游戏统计）

```sql
CREATE TABLE IF NOT EXISTS user_game_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game_type VARCHAR(64) NOT NULL,
  play_count INT DEFAULT 0,
  best_score INT DEFAULT 0,
  total_score INT DEFAULT 0,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_user_game (user_id, game_type),
  INDEX idx_user_id (user_id),
  INDEX idx_game_type (game_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明：**
- `id`: 统计ID（自增主键）
- `user_id`: 用户ID（关联users表）
- `game_type`: 游戏类型
- `play_count`: 游戏次数
- `best_score`: 最高分
- `total_score`: 总分数
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3. users 表（用户信息）

由 `user-service` 管理，表结构：

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(128),
  avatar_url VARCHAR(255),
  user_type VARCHAR(32) DEFAULT 'child',
  gender INT NULL,
  country VARCHAR(64),
  province VARCHAR(64),
  city VARCHAR(64),
  login_count INT DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 数据库管理

### 访问数据库控制台

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 **云数据库 MySQL** 或 **CynosDB**
3. 找到对应的数据库实例
4. 可以通过控制台查看表结构、执行SQL查询等

### 查看表数据

在数据库控制台执行SQL查询：

```sql
-- 查看游戏记录
SELECT * FROM game_records ORDER BY created_at DESC LIMIT 10;

-- 查看用户游戏统计
SELECT * FROM user_game_stats;

-- 查看用户信息
SELECT * FROM users;
```

## 代码中的错误处理

代码已经添加了完善的错误处理：

- **获取记录**：如果表不存在，会自动创建表后返回空数组
- **保存记录**：如果表不存在，会自动创建表后保存记录
- **获取排行榜**：如果表不存在，会自动创建表后返回空排行榜

## 验证表是否创建成功

1. 在数据库控制台查看表列表，确认 `game_records` 和 `user_game_stats` 表已创建
2. 尝试保存一条游戏记录，如果成功则说明表创建成功
3. 查看云函数日志，确认没有表不存在的错误

## 注意事项

1. **数据库连接**：确保云函数可以访问MySQL数据库（外网地址）
2. **表结构**：代码会自动创建表结构，无需手动创建
3. **索引**：表创建时会自动创建必要的索引，提升查询性能
4. **JSON字段**：`details` 字段使用JSON类型，MySQL 5.7+ 支持
5. **时区**：数据库连接配置中设置了 `timezone: 'Z'`，使用UTC时区

## 依赖包

确保 `cloudfunctions/game-service/package.json` 中包含：

```json
{
  "dependencies": {
    "wx-server-sdk": "2.6.3",
    "mysql2": "3.9.7"
  }
}
```

## 相关文件

- `cloudfunctions/game-service/index.js` - 游戏服务云函数（MySQL版本）
- `cloudfunctions/user-service/index.js` - 用户服务云函数（MySQL版本）

