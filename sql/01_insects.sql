-- ============================================
-- 昆虫数据表初始化SQL（基础版本）
-- 来源：miniprogram/data/insects.js
-- ============================================

-- 注意：此文件为基础版本，只包含基本字段
-- 如需完整信息（图片URL、详细描述等），请先扩展表结构或使用 01_insects_extended.sql

-- 清空表（可选，如果表已有数据）
-- TRUNCATE TABLE insects;

-- 插入益虫数据
INSERT INTO insects (name, alias, type, description, status, sort, created_at, updated_at) VALUES
('蜜蜂', NULL, 'beneficial', '黄黑条纹衫，传粉小专家', 'published', 1, NOW(3), NOW(3)),
('七星瓢虫', NULL, 'beneficial', '红袍带黑点，一天吃百蚜', 'published', 2, NOW(3), NOW(3)),
('螳螂', NULL, 'beneficial', '举着大刀臂，专吃小害虫', 'published', 3, NOW(3), NOW(3)),
('蜻蜓', NULL, 'beneficial', '薄翅像飞机，水面点水忙', 'published', 4, NOW(3), NOW(3)),
('蚯蚓', NULL, 'beneficial', '土里钻呀钻，松土又施肥', 'published', 5, NOW(3), NOW(3)),
('食蚜蝇', NULL, 'beneficial', '长得像蜜蜂，专吃蚜虫卵', 'published', 6, NOW(3), NOW(3));

-- 插入害虫数据
INSERT INTO insects (name, alias, type, description, status, sort, created_at, updated_at) VALUES
('蚊子', NULL, 'harmful', '小细腿尖尖嘴，叮人起红包', 'published', 7, NOW(3), NOW(3)),
('蟑螂', '德国小蠊', 'harmful', '黑褐色小虫子，夜里偷吃东西', 'published', 8, NOW(3), NOW(3)),
('蚜虫', NULL, 'harmful', '黏在菜叶上，吸汁长不快', 'published', 9, NOW(3), NOW(3)),
('菜青虫', NULL, 'harmful', '绿身子胖嘟嘟，啃食青菜叶', 'published', 10, NOW(3), NOW(3)),
('跳蚤', NULL, 'harmful', '小小黑虫子，跳着咬宠物', 'published', 11, NOW(3), NOW(3)),
('米象', NULL, 'harmful', '钻到米袋里，啃食白米粒', 'published', 12, NOW(3), NOW(3));

