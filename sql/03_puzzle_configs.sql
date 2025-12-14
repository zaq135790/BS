-- ============================================
-- 拼图配置表初始化SQL
-- 来源：cloudfunctions/game-service/index.js
-- ============================================

-- 删除已存在的puzzle_configs表（如果表结构不匹配）
DROP TABLE IF EXISTS puzzle_configs;

-- 创建puzzle_configs表
CREATE TABLE puzzle_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NULL COMMENT '拼图名称',
  difficulty VARCHAR(32) NOT NULL COMMENT '难度：简单/困难',
  pieces_count INT NOT NULL DEFAULT 4 COMMENT '拼图片数',
  base_image_url TEXT NOT NULL COMMENT '基础图片URL',
  full_image_url TEXT NULL COMMENT '完整图片URL',
  slice_urls JSON NULL COMMENT '拼图切片URL数组',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拼图配置表';

-- 插入拼图配置数据
INSERT INTO puzzle_configs (name, difficulty, pieces_count, base_image_url, full_image_url, slice_urls, created_at) VALUES
-- 简单难度（4片）
('蜜蜂拼图', '简单', 4, 
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/mf.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mf蜜蜂/4.jpg'
 ),
 NOW()),

('米象拼图', '简单', 4,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/mx.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/mx.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/mx米象/4.jpg'
 ),
 NOW()),

('蜻蜓拼图', '简单', 4,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/qt.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/qt.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qt蜻蜓/4.jpg'
 ),
 NOW()),

('七星瓢虫拼图', '简单', 4,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/qxpc.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/qxpc.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qxpc七星瓢虫/4.jpg'
 ),
 NOW()),

('蚯蚓拼图', '简单', 4,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/qy.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/qy.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/qy蚯蚓/4.jpg'
 ),
 NOW()),

-- 困难难度（9片）
('蚊子拼图', '困难', 9,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/wz.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/wz.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/4.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/5.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/6.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/7.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/8.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/wz蚊子/9.jpg'
 ),
 NOW()),

('蟑螂拼图', '困难', 9,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/zl.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/zl.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/4.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/5.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/6.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/7.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/8.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/zl蟑螂/9.jpg'
 ),
 NOW()),

('蚜虫拼图', '困难', 9,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/yc.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/yc.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/4.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/5.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/6.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/7.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/8.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/yc蚜虫/9.jpg'
 ),
 NOW()),

('跳蚤拼图', '困难', 9,
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/tz.jpg',
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/tz.jpg',
 JSON_ARRAY(
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/1.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/2.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/3.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/4.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/5.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/6.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/7.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/8.jpg',
   'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/child_pt _by/tz跳蚤/9.jpg'
 ),
 NOW());

