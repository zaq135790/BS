-- ============================================
-- 视频数据表初始化SQL
-- 来源：miniprogram/pages/theater/theater.js
-- 注意：需要先创建videos表
-- ============================================

-- 创建videos表（如果不存在）
CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL UNIQUE COMMENT '视频ID（如qt, qxpc等）',
  category VARCHAR(32) NOT NULL COMMENT '分类：益虫/害虫/其他',
  insect_name VARCHAR(128) NOT NULL COMMENT '昆虫名称',
  title VARCHAR(255) NOT NULL COMMENT '视频标题',
  description TEXT COMMENT '视频描述',
  video_url VARCHAR(500) NOT NULL COMMENT '视频URL',
  thumbnail_url VARCHAR(500) COMMENT '缩略图URL',
  duration VARCHAR(32) COMMENT '时长（如02:34）',
  duration_seconds INT COMMENT '时长（秒）',
  view_count INT DEFAULT 0 COMMENT '观看次数',
  status VARCHAR(32) DEFAULT 'published' COMMENT '状态',
  sort INT DEFAULT 0 COMMENT '排序',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_sort (sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小剧场视频数据表';

-- 清空表（可选）
-- TRUNCATE TABLE videos;

-- 插入视频数据
INSERT INTO videos (video_id, category, insect_name, title, description, video_url, thumbnail_url, duration, duration_seconds, view_count, status, sort, created_at, updated_at) VALUES
-- 益虫视频
('qt', '益虫', '蜻蜓', '了不起的小虫——蜻蜓', '近距离观察蜻蜓的盘旋与捕食。', 
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/qt_蜻蜓/qt.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/qt_蜻蜓/qt.jpg',
 '02:34', 154, 1000, 'published', 1, NOW(3), NOW(3)),

('qxpc', '益虫', '七星瓢虫', '了不起的小虫——七星瓢虫', '小甲虫如何消灭蚜虫，保护庄稼。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/qxpc_七星瓢虫/qxpc.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/qxpc_七星瓢虫/qxpc.jpg',
 '02:18', 138, 1000, 'published', 2, NOW(3), NOW(3)),

('qy', '益虫', '蚯蚓', '了不起的小虫——蚯蚓', '看看蚯蚓如何疏松土壤、帮助植物生长。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/qy_蚯蚓/qy.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/qy_蚯蚓/qy.jpg',
 '02:23', 143, 1000, 'published', 3, NOW(3), NOW(3)),

('tl', '益虫', '螳螂', '了不起的小虫——螳螂', '捕食高手螳螂如何耐心等待猎物。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/tl_螳螂/tl.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/tl_螳螂/tl.jpg',
 '01:59', 119, 1000, 'published', 4, NOW(3), NOW(3)),

-- 害虫视频
('zl', '害虫', '蟑螂', '了不起的小虫——蟑螂', '认识蟑螂的习性与危害，保持环境卫生。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/zl_蟑螂/zl.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/zl_蟑螂/zl.jpg',
 '02:17', 137, 1000, 'published', 5, NOW(3), NOW(3)),

('tz', '害虫', '跳蚤', '了不起的小虫——跳蚤', '显微镜下的跳蚤，惊人的跳跃与防护建议。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/tz_跳蚤/tz.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/tz_跳蚤/tz.jpg',
 '02:01', 121, 1000, 'published', 6, NOW(3), NOW(3)),

('wz', '害虫', '蚊子', '了不起的小虫——蚊子', '了解蚊子的吸血过程与防蚊小妙招。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/wz_蚊子/wz.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/wz_蚊子/wz.jpg',
 '02:19', 139, 1000, 'published', 7, NOW(3), NOW(3)),

('xbc', '害虫', '象鼻虫', '了不起的小虫——象鼻虫', '农作物克星象鼻虫，如何防治？',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/xbc_象鼻虫/xbc.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/xbc_象鼻虫/xbc.jpg',
 '02:18', 138, 1000, 'published', 8, NOW(3), NOW(3)),

('yc', '害虫', '蚜虫', '了不起的小虫——蚜虫', '蚜虫吸汁危害与瓢虫天敌的故事。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/yc_蚜虫/yc.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/yc_蚜虫/yc.jpg',
 '02:27', 147, 1000, 'published', 9, NOW(3), NOW(3)),

-- 其他视频
('fe', '其他', '飞蛾', '了不起的小虫——飞蛾', '飞蛾扑火的原因与夜行习性。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/fe_飞蛾/fe.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/fe_飞蛾/fe.jpg',
 '02:04', 124, 1000, 'published', 10, NOW(3), NOW(3)),

('c', '其他', '蝉', '了不起的小虫——蝉', '聆听蝉鸣，了解它们的蜕变与成长。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/c_蝉/c.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/c_蝉/c.jpg',
 '02:11', 131, 1000, 'published', 11, NOW(3), NOW(3)),

('yhc', '其他', '萤火虫', '了不起的小虫——萤火虫', '夜空下的微光，萤火虫如何发光？',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/yhc_萤火虫/yhc.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/yhc_萤火虫/yhc.jpg',
 '02:06', 126, 1000, 'published', 12, NOW(3), NOW(3)),

('dbmf', '其他', '豆包蜜蜂', '蜜蜂嗡嗡的小趣事', '跟随豆包蜜蜂采蜜、酿蜜的旅程。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/DB_豆包AL/DBmf.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/DB_豆包AL/mf.jpg',
 '01:13', 73, 1000, 'published', 13, NOW(3), NOW(3)),

('dbyhc', '其他', '豆包萤火虫', '萤火虫点点', '豆包主题的萤火虫短片，感受夜色闪烁。',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/DB_豆包AL/DByhc.mp4',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/vidoes/DB_豆包AL/yhc.png',
 '01:21', 81, 1000, 'published', 14, NOW(3), NOW(3));

