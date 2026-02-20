-- =====================================================
-- 修复 sync_status 默认值问题
-- 将默认值从 'synced' 改为 'not_synced'
-- =====================================================

-- 1. 修改默认值
ALTER TABLE cross_game_inventory 
ALTER COLUMN sync_status SET DEFAULT 'not_synced';

-- 2. 更新注释
COMMENT ON COLUMN cross_game_inventory.sync_status IS '同步状态: not_synced(未同步), syncing(同步中), synced(已同步), failed(失败)';

-- 3. 可选：更新现有的 New Day 道具为未同步状态（如果之前错误地标记为已同步）
-- 注意：这会重置所有 New Day 道具的同步状态，请谨慎使用
-- UPDATE cross_game_inventory 
-- SET sync_status = 'not_synced' 
-- WHERE game_source = 'newday' AND sync_status = 'synced';

-- 4. 查看当前的 sync_status 分布
SELECT 
    game_source,
    sync_status,
    COUNT(*) as count
FROM cross_game_inventory
GROUP BY game_source, sync_status
ORDER BY game_source, sync_status;
