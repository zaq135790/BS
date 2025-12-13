-- ============================================
-- 拼图配置表初始化SQL
-- 来源：cloudfunctions/game-service/index.js
-- ============================================

-- 清空表（可选）
-- TRUNCATE TABLE puzzle_configs;

-- 插入拼图配置数据
INSERT INTO puzzle_configs (name, difficulty, pieces_count, base_image_url, full_image_url, slice_urls, created_at) VALUES
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
 NOW());

