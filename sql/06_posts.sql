-- ============================================
-- 帖子相关表初始化SQL
-- 来源：miniprogram/pages/posts/posts.js
-- 注意：需要先创建users表
-- ============================================

-- 删除已存在的表（如果表结构不匹配）
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS post_views;
DROP TABLE IF EXISTS posts;

-- 创建posts表
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '帖子内容',
  images JSON NULL COMMENT '图片URL数组（JSON格式）',
  location VARCHAR(255) NULL COMMENT '发现地点',
  insect_name VARCHAR(128) NULL COMMENT '昆虫名称',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  view_count INT DEFAULT 0 COMMENT '浏览数',
  status VARCHAR(32) DEFAULT 'published' COMMENT '状态：published/draft/deleted',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_like_count (like_count),
  INDEX idx_location (location),
  INDEX idx_insect_name (insect_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子表';

-- 创建帖子浏览记录表
CREATE TABLE post_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT '帖子ID',
  user_id INT NULL COMMENT '用户ID（可为空，表示匿名浏览）',
  view_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '浏览时间',
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_view_time (view_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子浏览记录表';

-- 创建帖子点赞表
CREATE TABLE post_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT '帖子ID',
  user_id INT NOT NULL COMMENT '用户ID',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '点赞时间',
  UNIQUE KEY uk_post_user (post_id, user_id) COMMENT '唯一索引：同一用户对同一帖子只能点赞一次',
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子点赞表';

-- 创建评论表
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT '帖子ID',
  user_id INT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '评论内容',
  reply_to INT NULL COMMENT '回复的评论ID（NULL表示直接评论帖子）',
  status VARCHAR(32) DEFAULT 'published' COMMENT '状态：published/deleted',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_reply_to (reply_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- 清空表（可选，如果表已有数据）
-- TRUNCATE TABLE comments;
-- TRUNCATE TABLE post_likes;
-- TRUNCATE TABLE post_views;
-- TRUNCATE TABLE posts;

-- ============================================
-- 插入测试数据
-- 注意：需要确保users表中存在对应的user_id（建议user_id从1开始）
-- ============================================


-- 插入帖子数据
INSERT INTO posts (user_id, content, images, location, insect_name, like_count, comment_count, view_count, status, created_at, updated_at) VALUES
-- 益虫类帖子
(1, '今天在院子里发现了一只七星瓢虫，它正在吃蚜虫，真是农民的好帮手！仔细观察发现它背上有七个黑点，非常漂亮。它的动作很敏捷，一会儿就吃掉好几只蚜虫。', 
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '后院花园', '七星瓢虫', 3, 3, 5, 'published', DATE_SUB(NOW(3), INTERVAL 2 HOUR), DATE_SUB(NOW(3), INTERVAL 2 HOUR)),

(3, '雨后看到很多蚯蚓从土里钻出来，它们真的能改良土壤吗？查了资料才知道，蚯蚓是土壤的好朋友，能帮助松土和分解有机物。今天观察了好久，发现它们真的很勤劳！',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '小区花园', '蚯蚓', 2, 2, 3, 'published', DATE_SUB(NOW(3), INTERVAL 5 HOUR), DATE_SUB(NOW(3), INTERVAL 5 HOUR)),

(2, '在公园里看到一只美丽的蜻蜓，它的翅膀像透明的玻璃，在阳光下闪闪发光。蜻蜓在水面上点水，妈妈说那是在产卵。蜻蜓是益虫，会吃蚊子，我们要保护它们！',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '城市公园', '蜻蜓', 5, 5, 7, 'published', DATE_SUB(NOW(3), INTERVAL 1 DAY), DATE_SUB(NOW(3), INTERVAL 1 DAY)),

(6, '晚上在路灯下发现了一只螳螂，它举着前爪好像在祈祷。妈妈说螳螂是益虫，会捕食害虫，我们要保护它。螳螂的绿色身体和周围的环境融为一体，不仔细看还真发现不了！',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '小区路灯下', '螳螂', 3, 4, 5, 'published', DATE_SUB(NOW(3), INTERVAL 3 HOUR), DATE_SUB(NOW(3), INTERVAL 3 HOUR)),

(5, '在菜园里发现了一只蜜蜂正在采蜜，它的小翅膀扇得飞快。蜜蜂不仅会采蜜，还能帮助花朵授粉，真是太厉害了！蜜蜂的嗡嗡声听起来很忙碌，它们真的很勤劳。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '菜园', '蜜蜂', 5, 6, 7, 'published', DATE_SUB(NOW(3), INTERVAL 6 HOUR), DATE_SUB(NOW(3), INTERVAL 6 HOUR)),

-- 害虫类帖子
(7, '在厨房里发现了一只蟑螂，赶紧告诉了妈妈。妈妈说蟑螂是害虫，会传播细菌，要保持厨房卫生。我们用了杀虫剂，但妈妈说最好的方法是保持清洁，不让它们有食物。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '厨房', '蟑螂', 1, 0, 3, 'published', DATE_SUB(NOW(3), INTERVAL 4 HOUR), DATE_SUB(NOW(3), INTERVAL 4 HOUR)),

(9, '晚上被蚊子叮了好几个包，痒死了！妈妈说蚊子是害虫，会传播疾病。我们要用蚊香和蚊帐来防蚊，还要保持环境清洁，不要让水积在花盆里，因为那是蚊子产卵的地方。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '卧室', '蚊子', 2, 2, 4, 'published', DATE_SUB(NOW(3), INTERVAL 8 HOUR), DATE_SUB(NOW(3), INTERVAL 8 HOUR)),

(3, '在菜叶上发现了很多蚜虫，它们密密麻麻地粘在叶子上。妈妈说蚜虫是害虫，会吸食植物的汁液，让植物长不好。不过好消息是，七星瓢虫会来吃它们，这就是大自然的平衡！',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '菜园', '蚜虫', 1, 0, 2, 'published', DATE_SUB(NOW(3), INTERVAL 12 HOUR), DATE_SUB(NOW(3), INTERVAL 12 HOUR)),

(8, '在米袋里发现了米象，它们会啃食大米。妈妈说这是害虫，要赶紧处理。我们把米放在太阳下晒，妈妈说高温可以杀死它们。以后要把米放在密封的容器里保存。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '米袋', '米象', 0, 0, 1, 'published', DATE_SUB(NOW(3), INTERVAL 1 DAY), DATE_SUB(NOW(3), INTERVAL 1 DAY)),

(2, '在宠物身上发现了跳蚤，它们跳来跳去很难抓。妈妈说跳蚤是害虫，会咬人和宠物，还会传播疾病。我们给宠物用了驱虫药，还要经常给宠物洗澡，保持清洁。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '宠物身上', '跳蚤', 0, 0, 2, 'published', DATE_SUB(NOW(3), INTERVAL 2 DAY), DATE_SUB(NOW(3), INTERVAL 2 DAY)),

-- 其他类帖子
(7, '晚上在院子里看到了萤火虫，它们像小星星一样闪烁。萤火虫的光是生物发光，非常神奇！妈妈说萤火虫是益虫，会吃蜗牛和蚯蚓。我们要保护环境，让萤火虫有家可住。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '院子', '萤火虫', 4, 4, 6, 'published', DATE_SUB(NOW(3), INTERVAL 3 DAY), DATE_SUB(NOW(3), INTERVAL 3 DAY)),

(10, '夏天听到蝉在树上叫，声音很大。妈妈说蝉是昆虫，它们在地下生活好几年，然后爬到树上蜕皮变成成虫。蝉的叫声是雄蝉在求偶，虽然有点吵，但也是大自然的声音。',
 JSON_ARRAY('cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/post-images/1765600924902-ttojv4qgfp.png'),
 '树上', '蝉', 0, 0, 3, 'published', DATE_SUB(NOW(3), INTERVAL 4 DAY), DATE_SUB(NOW(3), INTERVAL 4 DAY));

-- 插入帖子点赞数据（用户1-10对不同的帖子点赞）
INSERT INTO post_likes (post_id, user_id, created_at) VALUES
-- 帖子1（七星瓢虫）的点赞
(1, 1, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(1, 2, DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(1, 3, DATE_SUB(NOW(3), INTERVAL 30 MINUTE)),
-- 帖子2（蚯蚓）的点赞
(2, 1, DATE_SUB(NOW(3), INTERVAL 5 HOUR)),
(2, 2, DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(2, 6, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
-- 帖子3（蜻蜓）的点赞
(3, 1, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(3, 2, DATE_SUB(NOW(3), INTERVAL 23 HOUR)),
(3, 3, DATE_SUB(NOW(3), INTERVAL 22 HOUR)),
(3, 4, DATE_SUB(NOW(3), INTERVAL 21 HOUR)),
(3, 5, DATE_SUB(NOW(3), INTERVAL 20 HOUR)),
-- 帖子4（螳螂）的点赞
(4, 1, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
(4, 2, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(4, 3, DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(4, 7, DATE_SUB(NOW(3), INTERVAL 50 MINUTE)),
-- 帖子5（蜜蜂）的点赞
(5, 1, DATE_SUB(NOW(3), INTERVAL 6 HOUR)),
(5, 2, DATE_SUB(NOW(3), INTERVAL 5 HOUR)),
(5, 3, DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(5, 4, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
(5, 5, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
-- 帖子6（蟑螂）的点赞
(6, 1, DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(6, 8, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
-- 帖子7（蚊子）的点赞
(7, 1, DATE_SUB(NOW(3), INTERVAL 8 HOUR)),
(7, 2, DATE_SUB(NOW(3), INTERVAL 7 HOUR)),
(7, 9, DATE_SUB(NOW(3), INTERVAL 6 HOUR)),
-- 帖子8（蚜虫）的点赞
(8, 1, DATE_SUB(NOW(3), INTERVAL 12 HOUR)),
(8, 10, DATE_SUB(NOW(3), INTERVAL 11 HOUR)),
-- 帖子9（米象）的点赞
(9, 2, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(9, 6, DATE_SUB(NOW(3), INTERVAL 23 HOUR)),
-- 帖子10（跳蚤）的点赞
(10, 3, DATE_SUB(NOW(3), INTERVAL 2 DAY)),
(10, 7, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
-- 帖子11（萤火虫）的点赞
(11, 1, DATE_SUB(NOW(3), INTERVAL 3 DAY)),
(11, 2, DATE_SUB(NOW(3), INTERVAL 2 DAY)),
(11, 3, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(11, 4, DATE_SUB(NOW(3), INTERVAL 20 HOUR)),
(11, 8, DATE_SUB(NOW(3), INTERVAL 18 HOUR)),
-- 帖子12（蝉）的点赞
(12, 5, DATE_SUB(NOW(3), INTERVAL 4 DAY)),
(12, 9, DATE_SUB(NOW(3), INTERVAL 3 DAY)),
(12, 10, DATE_SUB(NOW(3), INTERVAL 2 DAY));

-- 插入帖子浏览记录数据
INSERT INTO post_views (post_id, user_id, view_time) VALUES
-- 帖子1的浏览记录（5条）
(1, 1, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(1, 2, DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(1, NULL, DATE_SUB(NOW(3), INTERVAL 30 MINUTE)),
(1, 3, DATE_SUB(NOW(3), INTERVAL 20 MINUTE)),
(1, NULL, DATE_SUB(NOW(3), INTERVAL 10 MINUTE)),
-- 帖子2的浏览记录（3条）
(2, 1, DATE_SUB(NOW(3), INTERVAL 5 HOUR)),
(2, 2, DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(2, NULL, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
-- 帖子3的浏览记录（7条）
(3, 1, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(3, 2, DATE_SUB(NOW(3), INTERVAL 23 HOUR)),
(3, 3, DATE_SUB(NOW(3), INTERVAL 22 HOUR)),
(3, NULL, DATE_SUB(NOW(3), INTERVAL 21 HOUR)),
(3, 4, DATE_SUB(NOW(3), INTERVAL 20 HOUR)),
(3, 5, DATE_SUB(NOW(3), INTERVAL 19 HOUR)),
(3, NULL, DATE_SUB(NOW(3), INTERVAL 18 HOUR)),
-- 帖子4的浏览记录（5条）
(4, 1, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
(4, 2, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(4, 3, DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(4, NULL, DATE_SUB(NOW(3), INTERVAL 50 MINUTE)),
(4, 4, DATE_SUB(NOW(3), INTERVAL 40 MINUTE)),
-- 帖子5的浏览记录（7条）
(5, 1, DATE_SUB(NOW(3), INTERVAL 6 HOUR)),
(5, 2, DATE_SUB(NOW(3), INTERVAL 5 HOUR)),
(5, 3, DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(5, NULL, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
(5, 4, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(5, 5, DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(5, 6, DATE_SUB(NOW(3), INTERVAL 30 MINUTE)),
-- 帖子6的浏览记录（3条）
(6, 1, DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(6, 2, DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
(6, NULL, DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
-- 帖子7的浏览记录（4条）
(7, 1, DATE_SUB(NOW(3), INTERVAL 8 HOUR)),
(7, 2, DATE_SUB(NOW(3), INTERVAL 7 HOUR)),
(7, 3, DATE_SUB(NOW(3), INTERVAL 6 HOUR)),
(7, 9, DATE_SUB(NOW(3), INTERVAL 5 HOUR)),
-- 帖子8的浏览记录（2条）
(8, 1, DATE_SUB(NOW(3), INTERVAL 12 HOUR)),
(8, 10, DATE_SUB(NOW(3), INTERVAL 11 HOUR)),
-- 帖子9的浏览记录（2条）
(9, 1, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(9, 8, DATE_SUB(NOW(3), INTERVAL 23 HOUR)),
-- 帖子10的浏览记录（2条）
(10, 1, DATE_SUB(NOW(3), INTERVAL 2 DAY)),
(10, 7, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
-- 帖子11的浏览记录（6条）
(11, 1, DATE_SUB(NOW(3), INTERVAL 3 DAY)),
(11, 2, DATE_SUB(NOW(3), INTERVAL 2 DAY)),
(11, 3, DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(11, 8, DATE_SUB(NOW(3), INTERVAL 20 HOUR)),
(11, 4, DATE_SUB(NOW(3), INTERVAL 18 HOUR)),
(11, 5, DATE_SUB(NOW(3), INTERVAL 16 HOUR)),
-- 帖子12的浏览记录（3条）
(12, 1, DATE_SUB(NOW(3), INTERVAL 4 DAY)),
(12, 2, DATE_SUB(NOW(3), INTERVAL 3 DAY)),
(12, 10, DATE_SUB(NOW(3), INTERVAL 2 DAY));

-- 插入评论数据
INSERT INTO comments (post_id, user_id, content, reply_to, status, created_at) VALUES
-- 帖子1（七星瓢虫）的评论
(1, 2, '我也见过七星瓢虫！它们真的很可爱，而且对植物很有帮助。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(1, 3, '七星瓢虫是益虫，我们要保护它们。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 50 MINUTE)),
(1, 4, '我家的花园里也有很多七星瓢虫，它们帮我消灭了蚜虫。', 1, 'published', DATE_SUB(NOW(3), INTERVAL 40 MINUTE)),
-- 帖子2（蚯蚓）的评论
(2, 2, '蚯蚓确实能改良土壤，它们是土壤的好朋友。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(2, 3, '我家的菜园里也有很多蚯蚓，土壤很肥沃。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
-- 帖子3（蜻蜓）的评论
(3, 2, '蜻蜓真的很漂亮，它们的翅膀是透明的。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 23 HOUR)),
(3, 3, '蜻蜓会吃蚊子，是益虫。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 22 HOUR)),
(3, 4, '我也见过蜻蜓点水，原来是在产卵啊！', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 21 HOUR)),
(3, 5, '蜻蜓的复眼很神奇，能看到360度。', 2, 'published', DATE_SUB(NOW(3), INTERVAL 20 HOUR)),
(3, 1, '是的，蜻蜓是很好的益虫。', 3, 'published', DATE_SUB(NOW(3), INTERVAL 19 HOUR)),
-- 帖子4（螳螂）的评论
(4, 2, '螳螂的前爪像两把大刀，很威武。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(4, 3, '螳螂是益虫，会捕食害虫。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(4, 4, '我也见过螳螂，它们的伪装能力很强。', 1, 'published', DATE_SUB(NOW(3), INTERVAL 50 MINUTE)),
(4, 5, '螳螂捕蝉，黄雀在后，这个成语说的就是螳螂。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 40 MINUTE)),
-- 帖子5（蜜蜂）的评论
(5, 2, '蜜蜂真的很勤劳，它们会采蜜和授粉。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 5 HOUR)),
(5, 3, '没有蜜蜂，很多植物都无法授粉。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 4 HOUR)),
(5, 4, '蜜蜂的蜂蜜也很好吃！', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 3 HOUR)),
(5, 5, '我们要保护蜜蜂，它们对生态很重要。', 2, 'published', DATE_SUB(NOW(3), INTERVAL 2 HOUR)),
(5, 1, '是的，蜜蜂是生态系统中非常重要的角色。', 3, 'published', DATE_SUB(NOW(3), INTERVAL 1 HOUR)),
(5, 6, '我家的花园里也养了蜜蜂。', 4, 'published', DATE_SUB(NOW(3), INTERVAL 30 MINUTE)),
-- 帖子7（蚊子）的评论
(7, 2, '蚊子真的很讨厌，被叮了很痒。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 7 HOUR)),
(7, 9, '我们要保持环境清洁，不要让水积在花盆里。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 6 HOUR)),
-- 帖子11（萤火虫）的评论
(11, 2, '萤火虫真的很美，像小星星一样。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 2 DAY)),
(11, 3, '萤火虫的光是生物发光，很神奇。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 1 DAY)),
(11, 4, '我们要保护环境，让萤火虫有家可住。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 20 HOUR)),
(11, 8, '我也见过萤火虫，它们的光一闪一闪的。', 1, 'published', DATE_SUB(NOW(3), INTERVAL 18 HOUR)),
-- 帖子12（蝉）的评论
(12, 6, '蝉的叫声虽然有点吵，但也是夏天的标志。', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 3 DAY)),
(12, 10, '蝉在地下生活好几年才出来，真的很神奇！', NULL, 'published', DATE_SUB(NOW(3), INTERVAL 2 DAY));

-- 更新帖子的点赞数、评论数、浏览数（根据实际插入的数据自动计算）
-- 使用触发器或手动更新确保数据一致性
UPDATE posts SET 
  like_count = (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id),
  comment_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.status = 'published'),
  view_count = (SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id)
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);

-- ============================================
-- 确保用户头像数据存在
-- ============================================
-- 如果users表中已有用户但缺少头像，可以使用以下SQL更新用户头像
-- UPDATE users SET avatar_url = 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/image/tx1.jpg' 
-- WHERE avatar_url IS NULL OR avatar_url = '';

-- 如果users表中已有用户但缺少昵称，可以使用以下SQL更新用户昵称
-- UPDATE users SET nickname = CONCAT('用户', id) WHERE nickname IS NULL OR nickname = '';

