/**
 * AllinONE 后端服务器
 * 包含库存 API 端点
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { memoryDB } from './dist/server/memoryDatabase.js';

const { Pool } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 判断是否使用内存数据库（CloudStudio 或无数据库环境）
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || process.env.CLOUDSTUDIO === 'true';

// 数据库连接（仅非内存模式使用）
let pool = null;
if (!USE_MEMORY_DB) {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'allinone_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });
}

// 中间件
app.use(cors());
app.use(express.json());

// 模拟认证中间件（简化版，你需要替换为实际的认证逻辑）
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`[${req.method}] ${req.path} - Auth:`, authHeader ? 'Present' : 'Missing');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userId = extractUserIdFromToken(token);
    req.user = { userId };
    console.log('  -> UserID:', userId);
  } else {
    console.log('  -> No token provided');
  }
  next();
});

function extractUserIdFromToken(token) {
  // 支持多种 token 格式
  // 格式1: user-{id}_{token}
  if (token.includes('user-')) {
    const match = token.match(/user-(\d+)/);
    if (match) return match[1];
  }
  // 格式2: nd_token_{timestamp}_{random}
  if (token.startsWith('nd_token_')) {
    // 从 localStorage 获取用户ID 或返回默认值
    return '1'; // 默认用户ID
  }
  // 格式3: 其他格式，返回默认用户ID
  return '1';
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: USE_MEMORY_DB ? 'memory_db' : (pool ? 'connected' : 'disconnected'),
    mode: USE_MEMORY_DB ? 'memory' : 'postgresql'
  });
});

// ============================================
// 库存 API 端点
// ============================================

/**
 * GET /api/inventory - 获取库存列表
 */
app.get('/api/inventory', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { gameSource, page = 1, limit = 50 } = req.query;

    // 必须登录才能访问
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录'
      });
    }

    let items, total;

    if (USE_MEMORY_DB) {
      // 使用内存数据库
      const result = await memoryDB.queryInventory(userId, {
        gameSource,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      items = result.items;
      total = result.total;
    } else {
      // 使用 PostgreSQL
      let query = `SELECT * FROM cross_game_inventory WHERE user_id = $1`;
      const params = [userId];

      if (gameSource) {
        query += ` AND game_source = $2`;
        params.push(gameSource);
      }

      query += ` ORDER BY obtained_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await pool.query(query, params);
      items = result.rows;

      // 获取总数
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM cross_game_inventory WHERE user_id = $1`,
        [userId]
      );
      total = parseInt(countResult.rows[0].count);
    }

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      },
      message: '获取库存成功'
    });
  } catch (error) {
    console.error('获取库存失败:', error);
    res.status(500).json({
      success: false,
      error: '获取库存失败'
    });
  }
});

/**
 * GET /api/inventory/summary - 库存汇总
 */
app.get('/api/inventory/summary', async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    let rows;
    if (USE_MEMORY_DB) {
      rows = await memoryDB.getInventorySummary(userId);
    } else {
      const result = await pool.query(
        `SELECT * FROM user_inventory_summary WHERE user_id = $1`,
        [userId]
      );
      rows = result.rows;
    }

    res.json({
      success: true,
      data: { byGame: rows },
      message: '获取汇总成功'
    });
  } catch (error) {
    console.error('获取汇总失败:', error);
    res.status(500).json({
      success: false,
      error: '获取汇总失败'
    });
  }
});

/**
 * POST /api/inventory - 添加道具
 */
app.post('/api/inventory', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      itemId, name, description, gameSource, gameName,
      category, rarity, stats, quantity = 1
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    const syncStatus = req.body.syncStatus || 'not_synced';

    if (USE_MEMORY_DB) {
      // 使用内存数据库
      const existing = await memoryDB.findInventoryItem(userId, itemId, gameSource);
      
      if (existing) {
        // 更新数量
        const newQty = existing.quantity + quantity;
        await memoryDB.updateInventoryQuantity(existing.id, newQty);
        
        res.json({
          success: true,
          data: { id: existing.id, quantity: newQty, syncStatus: existing.sync_status },
          message: '道具数量已更新'
        });
      } else {
        // 添加新道具
        const newItem = await memoryDB.addInventoryItem({
          item_id: itemId,
          user_id: userId,
          name,
          description,
          game_source: gameSource,
          game_name: gameName || gameSource,
          category,
          rarity,
          stats: stats || null,
          quantity,
          obtained_from: 'sync',
          sync_status: syncStatus,
          obtained_at: new Date()
        });
        
        res.json({
          success: true,
          data: newItem,
          message: '道具添加成功'
        });
      }
    } else {
      // 使用 PostgreSQL
      // 检查是否已存在
      const existing = await pool.query(
        `SELECT id, quantity, sync_status FROM cross_game_inventory
         WHERE user_id = $1 AND item_id = $2 AND game_source = $3`,
        [userId, itemId, gameSource]
      );

      if (existing.rows.length > 0) {
        // 更新数量，保留原有的 sync_status（不覆盖）
        const newQty = existing.rows[0].quantity + quantity;
        await pool.query(
          `UPDATE cross_game_inventory SET quantity = $1, updated_at = NOW() WHERE id = $2`,
          [newQty, existing.rows[0].id]
        );

        res.json({
          success: true,
          data: { id: existing.rows[0].id, quantity: newQty, syncStatus: existing.rows[0].sync_status },
          message: '道具数量已更新'
        });
      } else {
        // 插入新道具
        const result = await pool.query(
          `INSERT INTO cross_game_inventory
           (item_id, user_id, name, description, game_source, game_name,
            category, rarity, stats, quantity, obtained_from, sync_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sync', $11)
           RETURNING *`,
          [
            itemId, userId, name, description,
            gameSource, gameName || gameSource,
            category, rarity,
            stats ? JSON.stringify(stats) : null,
            quantity,
            syncStatus
          ]
        );

        res.json({
          success: true,
          data: result.rows[0],
          message: '道具添加成功'
        });
      }
    }
  } catch (error) {
    console.error('添加道具失败:', error);
    res.status(500).json({
      success: false,
      error: '添加道具失败'
    });
  }
});

/**
 * POST /api/inventory/sync - 全量同步
 */
app.post('/api/inventory/sync', async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = req.user?.userId;
    const { gameSource, items } = req.body;

    // 必须登录才能访问
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录'
      });
    }

    console.log(`🔄 同步 ${gameSource} 库存，用户: ${userId}，道具数: ${items?.length || 0}`);

    let added = 0;
    let updated = 0;

    if (USE_MEMORY_DB) {
      // 使用内存数据库
      for (const item of items) {
        const existing = await memoryDB.findInventoryItem(userId, item.id, gameSource);
        
        if (existing) {
          // 更新现有道具
          existing.name = item.name;
          existing.description = item.description;
          existing.category = item.type || item.category;
          existing.rarity = item.rarity;
          existing.stats = item.stats || null;
          existing.quantity = item.quantity || 1;
          existing.sync_status = 'synced';
          existing.updated_at = new Date();
          updated++;
        } else {
          // 添加新道具
          await memoryDB.addInventoryItem({
            item_id: item.id,
            user_id: userId,
            name: item.name,
            description: item.description,
            game_source: gameSource,
            game_name: gameSource === 'newday' ? 'New Day' : 'AllinONE',
            category: item.type || item.category,
            rarity: item.rarity,
            stats: item.stats || null,
            quantity: item.quantity || 1,
            obtained_from: 'sync',
            sync_status: 'synced',
            obtained_at: new Date()
          });
          added++;
        }
      }
    } else {
      // 使用 PostgreSQL
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (const item of items) {
          const existing = await client.query(
            `SELECT id FROM cross_game_inventory
             WHERE user_id = $1 AND item_id = $2 AND game_source = $3`,
            [userId, item.id, gameSource]
          );

          if (existing.rows.length > 0) {
            await client.query(
              `UPDATE cross_game_inventory
               SET name = $1, description = $2, category = $3, rarity = $4,
                   stats = $5, quantity = $6, updated_at = NOW(),
                   sync_status = 'synced', last_sync_at = NOW()
               WHERE id = $7`,
              [
                item.name, item.description, item.type || item.category,
                item.rarity, item.stats ? JSON.stringify(item.stats) : null,
                item.quantity || 1, existing.rows[0].id
              ]
            );
            updated++;
          } else {
            await client.query(
              `INSERT INTO cross_game_inventory
               (item_id, user_id, name, description, game_source, game_name,
                category, rarity, stats, quantity, obtained_from,
                sync_status, last_sync_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sync', 'synced', NOW())`,
              [
                item.id, userId, item.name, item.description,
                gameSource, gameSource === 'newday' ? 'New Day' : 'AllinONE',
                item.type || item.category, item.rarity,
                item.stats ? JSON.stringify(item.stats) : null,
                item.quantity || 1
              ]
            );
            added++;
          }
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const duration = Date.now() - startTime;

    console.log(`✅ 同步完成: 新增 ${added} 个, 更新 ${updated} 个, 耗时 ${duration}ms`);

    res.json({
      success: true,
      data: {
        synced: items.length,
        added,
        updated,
        duration: `${duration}ms`
      },
      message: `成功同步 ${added} 个新道具`
    });
  } catch (error) {
    console.error('同步失败:', error);
    res.status(500).json({
      success: false,
      error: '同步失败'
    });
  }
});

/**
 * GET /api/inventory/:itemId/sync-status - 获取同步状态
 */
app.get('/api/inventory/:itemId/sync-status', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    let syncStatus, syncedAt;

    if (USE_MEMORY_DB) {
      // 查询所有匹配 user_id 和 item_id 的道具
      const { items } = await memoryDB.queryInventory(userId, { limit: 1000 });
      const item = items.find(i => i.item_id === itemId);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: '道具不存在'
        });
      }
      syncStatus = item.sync_status;
      syncedAt = item.last_sync_at;
    } else {
      const result = await pool.query(
        `SELECT sync_status, synced_at FROM cross_game_inventory
         WHERE user_id = $1 AND item_id = $2`,
        [userId, itemId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: '道具不存在'
        });
      }
      syncStatus = result.rows[0].sync_status;
      syncedAt = result.rows[0].synced_at;
    }

    res.json({
      success: true,
      data: { syncStatus, syncedAt },
      message: '获取同步状态成功'
    });
  } catch (error) {
    console.error('获取同步状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取同步状态失败'
    });
  }
});

/**
 * PATCH /api/inventory/:itemId/sync-status - 更新同步状态
 */
app.patch('/api/inventory/:itemId/sync-status', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;
    const { syncStatus, syncedAt } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    if (!syncStatus || !['not_synced', 'syncing', 'synced', 'failed'].includes(syncStatus)) {
      return res.status(400).json({
        success: false,
        error: '无效的同步状态'
      });
    }

    if (USE_MEMORY_DB) {
      // 使用内存数据库
      await memoryDB.updateSyncStatus(itemId, userId, syncStatus);
    } else {
      // 使用 PostgreSQL
      // 构建更新语句
      let updateQuery = `UPDATE cross_game_inventory SET sync_status = $1, updated_at = NOW()`;
      const params = [syncStatus, userId, itemId];

      if (syncedAt) {
        updateQuery += `, last_sync_at = $2`;
        params.splice(1, 0, syncedAt);
      }

      updateQuery += ` WHERE user_id = $${params.length - 1} AND item_id = $${params.length}`;

      const result = await pool.query(updateQuery, params);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: '道具不存在'
        });
      }
    }

    res.json({
      success: true,
      data: { syncStatus, syncedAt },
      message: '同步状态更新成功'
    });
  } catch (error) {
    console.error('更新同步状态失败:', error);
    console.error('错误详情:', error.message);
    console.error('请求参数:', { itemId, syncStatus, syncedAt });
    res.status(500).json({
      success: false,
      error: '更新同步状态失败: ' + error.message
    });
  }
});

// 静态文件服务 - 放在所有 API 路由之后
app.use(express.static(path.join(__dirname, 'dist/static')));

// 所有未匹配的请求返回 index.html（支持前端路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/static', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  const dbMode = USE_MEMORY_DB ? '内存数据库' : 'PostgreSQL';
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 AllinONE 服务器已启动！                    ║
║                                                ║
║   地址: http://localhost:${PORT}                   ║
║   API:  http://localhost:${PORT}/api/inventory     ║
║   数据库: ${dbMode.padEnd(36)} ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);

  // 测试数据库连接（仅非内存模式）
  if (!USE_MEMORY_DB && pool) {
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err.message);
      } else {
        console.log('✅ 数据库连接成功\n');
      }
    });
  } else {
    console.log('✅ 使用内存数据库（数据将在重启后丢失）\n');
  }
});

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
  // 不退出进程，保持服务器运行
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  // 不退出进程，保持服务器运行
});

// 正常关闭处理
process.on('SIGINT', async () => {
  console.log('\n👋 正在关闭服务器...');
  if (pool) await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 收到终止信号，正在关闭...');
  if (pool) await pool.end();
  process.exit(0);
});
