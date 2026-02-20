-- =====================================================
-- AllinONE 跨游戏库存数据库方案
-- 支持 AllinONE 和 New Day 游戏道具统一存储
-- =====================================================

-- =====================================================
-- 步骤 1: 创建跨游戏库存表
-- =====================================================

-- 如果表已存在，先删除（开发环境使用，生产环境请使用 ALTER）
-- DROP TABLE IF EXISTS cross_game_inventory;

-- 创建跨游戏库存表
CREATE TABLE IF NOT EXISTS cross_game_inventory (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(255) NOT NULL,              -- 道具唯一ID
    user_id VARCHAR(255) NOT NULL,              -- 用户ID
    name VARCHAR(255) NOT NULL,                 -- 道具名称
    description TEXT,                           -- 道具描述
    game_source VARCHAR(50) NOT NULL,           -- 来源游戏: 'allinone' | 'newday'
    game_name VARCHAR(100) NOT NULL,            -- 游戏显示名称
    category VARCHAR(100),                      -- 道具类型/分类
    rarity VARCHAR(50),                         -- 稀有度: common, rare, epic, legendary
    icon VARCHAR(255),                          -- 图标URL或类名
    
    -- 道具属性（JSON格式，灵活存储各种属性）
    stats JSONB,                                -- {"attack": 10, "defense": 5, ...}
    
    -- 使用次数相关
    uses INTEGER,                               -- 当前剩余使用次数
    max_uses INTEGER,                           -- 最大使用次数
    quantity INTEGER DEFAULT 1,                 -- 数量（可堆叠道具）
    
    -- 来源追踪
    obtained_at TIMESTAMP NOT NULL DEFAULT NOW(), -- 获得时间
    obtained_from VARCHAR(100),                 -- 获得来源: purchase, drop, gift, sync
    original_item_id VARCHAR(255),              -- 原始道具ID（用于追溯）
    
    -- 市场相关（如果可交易）
    is_tradable BOOLEAN DEFAULT false,          -- 是否可交易
    market_price DECIMAL(18, 2),                -- 市场价格
    listed_at TIMESTAMP,                        -- 上架时间
    
    -- 同步状态
    sync_status VARCHAR(50) DEFAULT 'not_synced',   -- not_synced, syncing, synced, failed
    last_sync_at TIMESTAMP,                     -- 最后同步时间
    sync_error TEXT,                            -- 同步错误信息
    
    -- 元数据
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT unique_user_item UNIQUE (user_id, item_id, game_source)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cgi_user_id ON cross_game_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_cgi_game_source ON cross_game_inventory(game_source);
CREATE INDEX IF NOT EXISTS idx_cgi_item_id ON cross_game_inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_cgi_category ON cross_game_inventory(category);
CREATE INDEX IF NOT EXISTS idx_cgi_rarity ON cross_game_inventory(rarity);
CREATE INDEX IF NOT EXISTS idx_cgi_obtained_at ON cross_game_inventory(obtained_at DESC);
CREATE INDEX IF NOT EXISTS idx_cgi_sync_status ON cross_game_inventory(sync_status);

-- 复合索引：用户+游戏来源（最常用的查询）
CREATE INDEX IF NOT EXISTS idx_cgi_user_game ON cross_game_inventory(user_id, game_source);

-- =====================================================
-- 步骤 2: 创建库存同步日志表（用于追踪同步历史）
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_sync_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    game_source VARCHAR(50) NOT NULL,           -- 同步来源游戏
    sync_type VARCHAR(50) NOT NULL,             -- full, incremental, purchase
    items_synced INTEGER DEFAULT 0,             -- 同步的道具数量
    items_added INTEGER DEFAULT 0,              -- 新增的道具数量
    items_updated INTEGER DEFAULT 0,            -- 更新的道具数量
    items_removed INTEGER DEFAULT 0,            -- 移除的道具数量
    sync_status VARCHAR(50) DEFAULT 'success',  -- success, partial, failed
    error_message TEXT,                         -- 错误信息
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_ms INTEGER                         -- 同步耗时（毫秒）
);

CREATE INDEX IF NOT EXISTS idx_isl_user_id ON inventory_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_isl_game_source ON inventory_sync_log(game_source);
CREATE INDEX IF NOT EXISTS idx_isl_started_at ON inventory_sync_log(started_at DESC);

-- =====================================================
-- 步骤 3: 创建触发器函数（自动更新 updated_at）
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为库存表添加触发器
DROP TRIGGER IF EXISTS update_cgi_updated_at ON cross_game_inventory;
CREATE TRIGGER update_cgi_updated_at
    BEFORE UPDATE ON cross_game_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 步骤 4: 创建视图（方便查询）
-- =====================================================

-- 用户库存汇总视图
CREATE OR REPLACE VIEW user_inventory_summary AS
SELECT 
    user_id,
    game_source,
    COUNT(*) as total_items,
    SUM(quantity) as total_quantity,
    COUNT(CASE WHEN rarity = 'legendary' THEN 1 END) as legendary_count,
    COUNT(CASE WHEN rarity = 'epic' THEN 1 END) as epic_count,
    COUNT(CASE WHEN rarity = 'rare' THEN 1 END) as rare_count,
    MAX(obtained_at) as last_obtained_at
FROM cross_game_inventory
GROUP BY user_id, game_source;

-- =====================================================
-- 步骤 5: 插入测试数据（可选）
-- =====================================================

-- 为测试用户插入示例道具
-- INSERT INTO cross_game_inventory (
--     item_id, user_id, name, description, game_source, game_name, 
--     category, rarity, quantity, obtained_from
-- ) VALUES 
-- ('item-001', 'user-001', '新手剑', '一把普通的剑', 'allinone', 'AllinONE', 'weapon', 'common', 1, 'gift'),
-- ('item-002', 'user-001', '魔法药水', '恢复生命值', 'newday', 'New Day', 'consumable', 'common', 5, 'purchase');

-- =====================================================
-- 步骤 6: 验证表创建
-- =====================================================

-- 检查表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('cross_game_inventory', 'inventory_sync_log')
ORDER BY table_name, ordinal_position;

-- 检查索引
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('cross_game_inventory', 'inventory_sync_log')
ORDER BY tablename, indexname;

-- =====================================================
-- 执行完毕
-- =====================================================
