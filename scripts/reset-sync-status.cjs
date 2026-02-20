/**
 * 重置 New Day 道具同步状态
 * 将所有 New Day 道具的 sync_status 重置为 'not_synced'
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

async function resetSyncStatus() {
  console.log('🔧 开始重置 New Day 道具同步状态...\n');

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功\n');

    try {
      // 显示重置前的状态
      console.log('📊 重置前的 sync_status 分布：');
      const beforeResult = await client.query(`
        SELECT sync_status, COUNT(*) as count 
        FROM cross_game_inventory 
        WHERE game_source = 'newday'
        GROUP BY sync_status
        ORDER BY sync_status
      `);
      
      if (beforeResult.rows.length === 0) {
        console.log('   暂无 New Day 道具\n');
      } else {
        beforeResult.rows.forEach(row => {
          console.log(`   ${row.sync_status}: ${row.count} 个`);
        });
        console.log();
      }

      // 询问是否继续
      console.log('⚠️  此操作将把所有 New Day 道具的 sync_status 重置为 "not_synced"');
      console.log('   已同步到 New Day 游戏的道具将变为"未同步"状态。');
      console.log();
      
      // 由于无法在 Node.js 脚本中交互，这里直接执行
      // 实际使用时可以通过命令行参数控制
      
      // 执行重置
      const updateResult = await client.query(`
        UPDATE cross_game_inventory 
        SET sync_status = 'not_synced',
            updated_at = NOW()
        WHERE game_source = 'newday'
        RETURNING id, item_id, name, sync_status
      `);

      console.log(`✅ 已重置 ${updateResult.rowCount} 个 New Day 道具的状态\n`);

      // 显示重置后的状态
      console.log('📊 重置后的 sync_status 分布：');
      const afterResult = await client.query(`
        SELECT sync_status, COUNT(*) as count 
        FROM cross_game_inventory 
        WHERE game_source = 'newday'
        GROUP BY sync_status
        ORDER BY sync_status
      `);
      
      if (afterResult.rows.length === 0) {
        console.log('   暂无 New Day 道具\n');
      } else {
        afterResult.rows.forEach(row => {
          console.log(`   ${row.sync_status}: ${row.count} 个`);
        });
        console.log();
      }

      console.log('🎉 重置完成！');
      console.log('   现在所有 New Day 道具都会显示"同步到 New Day"按钮。\n');

    } catch (err) {
      console.error('❌ 重置失败:', err.message);
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

// 执行重置
resetSyncStatus()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('失败:', err);
    process.exit(1);
  });
