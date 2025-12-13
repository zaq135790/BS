-- ============================================
-- 轮播图表初始化SQL
-- 来源：content-service（示例数据）
-- ============================================

-- 清空表（可选）
-- TRUNCATE TABLE banners;

-- 插入轮播图数据（示例）
INSERT INTO banners (title, image_url, link_url, status, sort, created_at) VALUES
('欢迎来到虫虫世界', 
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj1.png',
 '/pages/index/index', 
 'published', 1, NOW(3)),

('探索昆虫的奥秘', 
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj1.png',
 '/pages/knowledge/knowledge', 
 'published', 2, NOW(3)),

('虫虫小剧场', 
 'cloud://cloud1-5g6ssvupb26437e4.636c-cloud1-5g6ssvupb26437e4-1382475723/images/bj1.png',
 '/pages/theater/theater', 
 'published', 3, NOW(3));

-- 注意：请根据实际轮播图资源更新image_url和link_url

