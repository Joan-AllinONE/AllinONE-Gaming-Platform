-- =====================================================
-- 修复 Wallet 外键约束 - New Day 数据库
-- =====================================================
-- 用途: 移除外键约束以支持 AllinONE 跨平台集成
-- 日期: 2026-01-29
-- 风险: 低 - 仅移除约束，不删除数据
-- =====================================================

-- 步骤 1: 查看当前外键约束（可选，用于确认）
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'wallets';

-- 预期结果:
-- constraint_name                  | table_name | column_name | foreign_table_name | foreign_column_name
-- ----------------------------------|------------|-------------|-------------------|--------------------
-- wallets_user_id_players_id_fk     | wallets    | user_id     | players           | id


-- 步骤 2: 移除外键约束
ALTER TABLE wallets DROP CONSTRAINT wallets_user_id_players_id_fk;


-- 步骤 3: 验证修复 - 确认外键约束已移除
SELECT
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_name = 'wallets'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 预期结果: 无记录返回（说明外键约束已移除）


-- 步骤 4: 测试 - 创建 AllinONE 用户钱包（可选）
-- INSERT INTO wallets (user_id, game_coins, cash_balance, computing_power)
-- VALUES ('allinone-test-123', 1000, 0, 0);

-- 步骤 5: 验证 - 查询刚创建的钱包（可选）
-- SELECT * FROM wallets WHERE user_id = 'allinone-test-123';


-- =====================================================
-- 回滚方案（仅在需要时使用）
-- =====================================================
-- 如果移除外键约束后出现问题，可以重新添加:

-- ALTER TABLE wallets
-- ADD CONSTRAINT wallets_user_id_players_id_fk
-- FOREIGN KEY (user_id) REFERENCES players(id)
-- ON DELETE CASCADE;

-- =====================================================
-- 执行完毕
-- =====================================================
