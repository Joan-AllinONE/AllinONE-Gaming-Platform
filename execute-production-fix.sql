-- =====================================================
-- 生产环境数据库修复脚本
-- =====================================================
-- 用途: 移除外键约束并创建系统用户
-- 日期: 2026-01-29
-- 风险: 低 - 仅移除约束和创建系统用户
-- =====================================================

-- 步骤 1: 移除外键约束

-- 1.1 移除 wallets 表的外键约束
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_players_id_fk;

-- 1.2 移除 transactions 表的外键约束
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_seller_id_players_id_fk;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_item_id_market_items_id_fk;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_buyer_id_players_id_fk;

-- 1.3 移除 user_inventories 表的外键约束
ALTER TABLE user_inventories DROP CONSTRAINT IF EXISTS user_inventories_item_id_market_items_id_fk;

-- 步骤 2: 创建系统用户
INSERT INTO players (id, nickname, total_adventures, created_at)
VALUES ('system', 'System', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 步骤 3: 验证修复

-- 3.1 检查外键约束是否已移除
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_name IN ('wallets', 'transactions', 'user_inventories')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 预期结果: 无记录（所有外键约束已移除）

-- 3.2 检查系统用户是否已创建
SELECT id, nickname, total_adventures, created_at
FROM players
WHERE id = 'system';

-- 预期结果: 系统用户已存在

-- =====================================================
-- 执行完毕
-- =====================================================
