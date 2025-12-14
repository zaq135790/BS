-- ============================================
-- 用户名片背景字段添加SQL
-- 用途：为users表添加名片背景相关字段
-- 执行时机：在users表已存在后执行
-- 注意：如果字段已存在，执行会报错，可以忽略
-- ============================================

-- 添加 profile_background 字段（存储背景值：颜色渐变或图片URL）
-- 如果字段已存在，会报错，可以忽略
ALTER TABLE users 
ADD COLUMN profile_background VARCHAR(500) NULL 
COMMENT '名片背景：颜色渐变（如linear-gradient(...)）或图片URL' 
AFTER avatar_url;

-- 添加 profile_background_type 字段（存储背景类型）
-- 如果字段已存在，会报错，可以忽略
ALTER TABLE users 
ADD COLUMN profile_background_type VARCHAR(32) DEFAULT 'color' 
COMMENT '名片背景类型：color（颜色）或image（图片）' 
AFTER profile_background;

-- 为现有用户设置默认背景（可选）
UPDATE users 
SET profile_background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    profile_background_type = 'color'
WHERE profile_background IS NULL;

-- 查看表结构确认
-- DESCRIBE users;

