/**
 * AllinONE 跨游戏库存 API
 * 后端 API 端点 - 处理库存的增删改查
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../database';

const router = Router();

// =====================================================
// 辅助函数
// =====================================================

/**
 * 标准化响应格式
 */
function createResponse<T>(success: boolean, data?: T, message?: string, error?: string) {
    return {
        success,
        data,
        message,
        error,
        timestamp: new Date().toISOString()
    };
}

/**
 * 记录同步日志
 */
async function logSync(
    userId: string,
    gameSource: string,
    syncType: string,
    result: {
        itemsSynced: number;
        itemsAdded: number;
        itemsUpdated: number;
        itemsRemoved?: number;
        status: string;
        error?: string;
        durationMs: number;
    }
): Promise<void> {
    try {
        await pool.query(
            `INSERT INTO inventory_sync_log 
             (user_id, game_source, sync_type, items_synced, items_added, 
              items_updated, items_removed, sync_status, error_message, duration_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                userId,
                gameSource,
                syncType,
                result.itemsSynced,
                result.itemsAdded,
                result.itemsUpdated,
                result.itemsRemoved || 0,
                result.status,
                result.error || null,
                result.durationMs
            ]
        );
    } catch (err) {
        console.error('记录同步日志失败:', err);
    }
}

// =====================================================
// API 端点
// =====================================================

/**
 * GET /api/inventory
 * 获取当前用户的库存列表
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { gameSource, category, rarity, page = 1, limit = 50 } = req.query;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        let query = `
            SELECT * FROM cross_game_inventory 
            WHERE user_id = $1
        `;
        const params: any[] = [userId];
        let paramIndex = 2;

        // 添加筛选条件
        if (gameSource) {
            query += ` AND game_source = $${paramIndex++}`;
            params.push(gameSource);
        }
        if (category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(category);
        }
        if (rarity) {
            query += ` AND rarity = $${paramIndex++}`;
            params.push(rarity);
        }

        // 添加排序和分页
        query += ` ORDER BY obtained_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

        const result = await pool.query(query, params);

        // 获取总数
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM cross_game_inventory WHERE user_id = $1`,
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        res.json(createResponse(true, {
            items: result.rows,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        }, '获取库存成功'));
    } catch (error) {
        console.error('获取库存失败:', error);
        res.status(500).json(createResponse(false, null, null, '获取库存失败'));
    }
});

/**
 * GET /api/inventory/summary
 * 获取库存汇总统计
 */
router.get('/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        const result = await pool.query(
            `SELECT * FROM user_inventory_summary WHERE user_id = $1`,
            [userId]
        );

        // 计算总计
        const totalResult = await pool.query(
            `SELECT 
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                COUNT(DISTINCT game_source) as game_count
             FROM cross_game_inventory 
             WHERE user_id = $1`,
            [userId]
        );

        res.json(createResponse(true, {
            byGame: result.rows,
            total: totalResult.rows[0]
        }, '获取库存汇总成功'));
    } catch (error) {
        console.error('获取库存汇总失败:', error);
        res.status(500).json(createResponse(false, null, null, '获取库存汇总失败'));
    }
});

/**
 * POST /api/inventory
 * 添加道具到库存
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const {
            itemId,
            name,
            description,
            gameSource,
            gameName,
            category,
            rarity,
            icon,
            stats,
            quantity = 1,
            obtainedFrom = 'purchase',
            originalItemId
        } = req.body;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        if (!itemId || !name || !gameSource) {
            return res.status(400).json(createResponse(false, null, null, '缺少必要参数'));
        }

        // 检查是否已存在
        const existingResult = await pool.query(
            `SELECT id, quantity, sync_status FROM cross_game_inventory 
             WHERE user_id = $1 AND item_id = $2 AND game_source = $3`,
            [userId, itemId, gameSource]
        );

        if (existingResult.rows.length > 0) {
            // 更新数量，保留原有的 sync_status（不覆盖为 synced）
            const newQuantity = existingResult.rows[0].quantity + quantity;
            await pool.query(
                `UPDATE cross_game_inventory 
                 SET quantity = $1, updated_at = NOW()
                 WHERE id = $2`,
                [newQuantity, existingResult.rows[0].id]
            );

            res.json(createResponse(true, { id: existingResult.rows[0].id, quantity: newQuantity, syncStatus: existingResult.rows[0].sync_status }, '道具数量已更新'));
        } else {
            // 插入新道具
            const syncStatus = (req.body as any).syncStatus || 'not_synced';
            const result = await pool.query(
                `INSERT INTO cross_game_inventory 
                 (item_id, user_id, name, description, game_source, game_name, 
                  category, rarity, icon, stats, quantity, obtained_from, original_item_id, sync_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                 RETURNING *`,
                [
                    itemId, userId, name, description, gameSource, gameName || gameSource,
                    category, rarity, icon, stats ? JSON.stringify(stats) : null,
                    quantity, obtainedFrom, originalItemId || itemId, syncStatus
                ]
            );

            res.json(createResponse(true, result.rows[0], '道具添加成功'));
        }
    } catch (error) {
        console.error('添加道具失败:', error);
        res.status(500).json(createResponse(false, null, null, '添加道具失败'));
    }
});

/**
 * POST /api/inventory/sync
 * 全量同步库存（从 New Day 等外部游戏）
 */
router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        const userId = req.user?.userId;
        const { gameSource, items } = req.body;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        if (!gameSource || !Array.isArray(items)) {
            return res.status(400).json(createResponse(false, null, null, '缺少必要参数'));
        }

        console.log(`🔄 开始同步 ${gameSource} 库存到用户 ${userId}，共 ${items.length} 个道具`);

        let added = 0;
        let updated = 0;
        const itemIds = items.map((item: any) => item.id);

        // 使用事务处理
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const item of items) {
                // 检查是否已存在
                const existingResult = await client.query(
                    `SELECT id FROM cross_game_inventory 
                     WHERE user_id = $1 AND item_id = $2 AND game_source = $3`,
                    [userId, item.id, gameSource]
                );

                if (existingResult.rows.length > 0) {
                    // 更新现有道具
                    await client.query(
                        `UPDATE cross_game_inventory 
                         SET name = $1, description = $2, category = $3, rarity = $4,
                             stats = $5, quantity = $6, updated_at = NOW(), 
                             sync_status = 'synced', last_sync_at = NOW()
                         WHERE id = $7`,
                        [
                            item.name, item.description, item.type || item.category,
                            item.rarity, item.stats ? JSON.stringify(item.stats) : null,
                            item.quantity || 1, existingResult.rows[0].id
                        ]
                    );
                    updated++;
                } else {
                    // 插入新道具
                    await client.query(
                        `INSERT INTO cross_game_inventory 
                         (item_id, user_id, name, description, game_source, game_name,
                          category, rarity, stats, quantity, obtained_from, original_item_id,
                          sync_status, last_sync_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'synced', NOW())`,
                        [
                            item.id, userId, item.name, item.description,
                            gameSource, gameSource === 'newday' ? 'New Day' : 'AllinONE',
                            item.type || item.category, item.rarity,
                            item.stats ? JSON.stringify(item.stats) : null,
                            item.quantity || 1, 'sync', item.id
                        ]
                    );
                    added++;
                }
            }

            // 标记未同步的道具（可选：软删除或标记为已移除）
            await client.query(
                `UPDATE cross_game_inventory 
                 SET sync_status = 'removed', updated_at = NOW()
                 WHERE user_id = $1 AND game_source = $2 AND item_id NOT IN ($3)`,
                [userId, gameSource, itemIds.length > 0 ? itemIds : ['']]
            );

            await client.query('COMMIT');

            const duration = Date.now() - startTime;

            // 记录同步日志
            await logSync(userId, gameSource, 'full', {
                itemsSynced: items.length,
                itemsAdded: added,
                itemsUpdated: updated,
                itemsRemoved: 0,
                status: 'success',
                durationMs: duration
            });

            console.log(`✅ 同步完成: 新增 ${added} 个, 更新 ${updated} 个, 耗时 ${duration}ms`);

            res.json(createResponse(true, {
                synced: items.length,
                added,
                updated,
                duration: `${duration}ms`
            }, '同步成功'));

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('同步库存失败:', error);

        // 记录失败日志
        await logSync(req.user?.userId || 'unknown', req.body?.gameSource || 'unknown', 'full', {
            itemsSynced: 0,
            itemsAdded: 0,
            itemsUpdated: 0,
            itemsRemoved: 0,
            status: 'failed',
            error: String(error),
            durationMs: Date.now() - startTime
        });

        res.status(500).json(createResponse(false, null, null, '同步库存失败'));
    }
});

/**
 * DELETE /api/inventory/:itemId
 * 从库存中移除道具
 */
router.delete('/:itemId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { gameSource, quantity = 1 } = req.body;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        // 获取当前道具
        const existingResult = await pool.query(
            `SELECT id, quantity FROM cross_game_inventory 
             WHERE user_id = $1 AND item_id = $2 AND game_source = $3`,
            [userId, itemId, gameSource]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json(createResponse(false, null, null, '道具不存在'));
        }

        const currentQuantity = existingResult.rows[0].quantity;

        if (currentQuantity <= quantity) {
            // 完全删除
            await pool.query(
                `DELETE FROM cross_game_inventory WHERE id = $1`,
                [existingResult.rows[0].id]
            );
            res.json(createResponse(true, null, '道具已删除'));
        } else {
            // 减少数量
            const newQuantity = currentQuantity - quantity;
            await pool.query(
                `UPDATE cross_game_inventory 
                 SET quantity = $1, updated_at = NOW()
                 WHERE id = $2`,
                [newQuantity, existingResult.rows[0].id]
            );
            res.json(createResponse(true, { quantity: newQuantity }, '道具数量已更新'));
        }
    } catch (error) {
        console.error('删除道具失败:', error);
        res.status(500).json(createResponse(false, null, null, '删除道具失败'));
    }
});

/**
 * GET /api/inventory/:itemId/sync-status
 * 获取道具的同步状态
 */
router.get('/:itemId/sync-status', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        const result = await pool.query(
            `SELECT sync_status, last_sync_at FROM cross_game_inventory 
             WHERE user_id = $1 AND item_id = $2`,
            [userId, itemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(createResponse(false, null, null, '道具不存在'));
        }

        res.json(createResponse(true, {
            syncStatus: result.rows[0].sync_status,
            syncedAt: result.rows[0].last_sync_at
        }, '获取同步状态成功'));
    } catch (error) {
        console.error('获取同步状态失败:', error);
        res.status(500).json(createResponse(false, null, null, '获取同步状态失败'));
    }
});

/**
 * PATCH /api/inventory/:itemId/sync-status
 * 更新道具的同步状态
 */
router.patch('/:itemId/sync-status', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { syncStatus, syncedAt } = req.body;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        if (!syncStatus || !['not_synced', 'syncing', 'synced', 'failed'].includes(syncStatus)) {
            return res.status(400).json(createResponse(false, null, null, '无效的同步状态'));
        }

        // 构建更新语句
        let updateQuery = `UPDATE cross_game_inventory SET sync_status = $1, updated_at = NOW()`;
        const params: any[] = [syncStatus, userId, itemId];

        if (syncedAt) {
            updateQuery += `, last_sync_at = $2`;
            params.splice(1, 0, syncedAt);
        }

        updateQuery += ` WHERE user_id = $${params.length - 1} AND item_id = $${params.length}`;

        const result = await pool.query(updateQuery, params);

        if (result.rowCount === 0) {
            return res.status(404).json(createResponse(false, null, null, '道具不存在'));
        }

        res.json(createResponse(true, { syncStatus, syncedAt }, '同步状态更新成功'));
    } catch (error) {
        console.error('更新同步状态失败:', error);
        res.status(500).json(createResponse(false, null, null, '更新同步状态失败'));
    }
});

/**
 * GET /api/inventory/sync-history
 * 获取同步历史记录
 */
router.get('/sync-history', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { gameSource, limit = 10 } = req.query;

        if (!userId) {
            return res.status(401).json(createResponse(false, null, null, '未授权'));
        }

        let query = `
            SELECT * FROM inventory_sync_log 
            WHERE user_id = $1
        `;
        const params: any[] = [userId];

        if (gameSource) {
            query += ` AND game_source = $2`;
            params.push(gameSource);
        }

        query += ` ORDER BY started_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit as string));

        const result = await pool.query(query, params);

        res.json(createResponse(true, result.rows, '获取同步历史成功'));
    } catch (error) {
        console.error('获取同步历史失败:', error);
        res.status(500).json(createResponse(false, null, null, '获取同步历史失败'));
    }
});

export default router;
