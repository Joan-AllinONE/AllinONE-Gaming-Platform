/**
 * AllinONE 数据库初始化脚本
 * 用于在没有 psql 命令的情况下初始化数据库
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'allinone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function initDatabase() {
  console.log('🔧 开始初始化数据库...\n');

  try {
    // 连接测试
    const client = await pool.connect();
    console.log('✅ 数据库连接成功\n');

    try {
      // 创建跨游戏库存表
      await client.query(`
        CREATE TABLE IF NOT EXISTS cross_game_inventory (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          game_source VARCHAR(50) NOT NULL,
          game_name VARCHAR(100) NOT NULL,
          category VARCHAR(100),
          rarity VARCHAR(50),
          icon VARCHAR(255),
          stats JSONB,
          uses INTEGER,
          max_uses INTEGER,
          quantity INTEGER DEFAULT 1,
          obtained_at TIMESTAMP NOT NULL DEFAULT NOW(),
          obtained_from VARCHAR(100),
          original_item_id VARCHAR(255),
          is_tradable BOOLEAN DEFAULT false,
          market_price DECIMAL(18, 2),
          listed_at TIMESTAMP,
          sync_status VARCHAR(50) DEFAULT 'not_synced',
          last_sync_at TIMESTAMP,
          sync_error TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_user_item UNIQUE (user_id, item_id, game_source)
        )
      `);
      console.log('✅ cross_game_inventory 表创建成功');

      // 创建索引
      const indexes = [
        'idx_cgi_user_id ON cross_game_inventory(user_id)',
        'idx_cgi_game_source ON cross_game_inventory(game_source)',
        'idx_cgi_item_id ON cross_game_inventory(item_id)',
        'idx_cgi_category ON cross_game_inventory(category)',
        'idx_cgi_rarity ON cross_game_inventory(rarity)',
        'idx_cgi_obtained_at ON cross_game_inventory(obtained_at DESC)',
        'idx_cgi_sync_status ON cross_game_inventory(sync_status)',
        'idx_cgi_user_game ON cross_game_inventory(user_id, game_source)'
      ];

      for (const idx of indexes) {
        await client.query(`CREATE INDEX IF NOT EXISTS ${idx}`);
      }
      console.log('✅ 索引创建成功');

      // 创建库存同步日志表
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_sync_log (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          game_source VARCHAR(50) NOT NULL,
          sync_type VARCHAR(50) NOT NULL,
          items_synced INTEGER DEFAULT 0,
          items_added INTEGER DEFAULT 0,
          items_updated INTEGER DEFAULT 0,
          items_removed INTEGER DEFAULT 0,
          sync_status VARCHAR(50) DEFAULT 'success',
          error_message TEXT,
          started_at TIMESTAMP NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP,
          duration_ms INTEGER
        )
      `);
      console.log('✅ inventory_sync_log 表创建成功');

      // 创建同步日志索引
      const syncIndexes = [
        'idx_isl_user_id ON inventory_sync_log(user_id)',
        'idx_isl_game_source ON inventory_sync_log(game_source)',
        'idx_isl_started_at ON inventory_sync_log(started_at DESC)'
      ];

      for (const idx of syncIndexes) {
        await client.query(`CREATE INDEX IF NOT EXISTS ${idx}`);
      }

      // 创建触发器函数
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);
      console.log('✅ 触发器函数创建成功');

      // 添加触发器
      await client.query(`
        DROP TRIGGER IF EXISTS update_cgi_updated_at ON cross_game_inventory;
        CREATE TRIGGER update_cgi_updated_at
          BEFORE UPDATE ON cross_game_inventory
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);
      console.log('✅ 触发器添加成功');

      // 创建视图
      await client.query(`
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
        GROUP BY user_id, game_source
      `);
      console.log('✅ 视图创建成功');

      // 验证表
      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('cross_game_inventory', 'inventory_sync_log')
        ORDER BY table_name
      `);

      console.log('\n📊 数据库表列表:');
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });

      console.log('\n✅ 数据库初始化完成!\n');

    } catch (err) {
      console.error('❌ 数据库初始化失败:', err.message);
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('\n❌ 数据库连接失败:');
    console.error('错误信息:', err.message);
    console.error('\n请检查:');
    console.error('1. PostgreSQL 服务是否已启动');
    console.error('2. .env 文件中的数据库配置是否正确');
    console.error('3. 数据库用户名和密码是否正确');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 执行初始化
initDatabase()
  .then(() => {
    console.log('🎉 所有步骤完成!');
    process.exit(0);
  })
  .catch(err => {
    console.error('初始化失败:', err);
    process.exit(1);
  });
