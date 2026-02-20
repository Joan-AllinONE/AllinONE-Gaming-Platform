/**
 * 数据库初始化脚本
 * 自动创建库存相关表
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'allinone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function setupDatabase() {
  console.log('🚀 开始初始化数据库...\n');

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '..', 'database-schema-inventory.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 读取 SQL 脚本...');
    
    // 执行 SQL
    console.log('⚙️  执行数据库脚本...\n');
    await pool.query(sql);

    console.log('✅ 数据库初始化完成！\n');
    
    // 验证表创建
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cross_game_inventory', 'inventory_sync_log')
    `);

    console.log('📊 已创建的表：');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 数据库准备就绪！');
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败：\n', error.message);
    console.log('\n💡 常见问题：');
    console.log('   1. PostgreSQL 服务是否启动？');
    console.log('   2. 数据库密码是否正确？');
    console.log('   3. 数据库是否存在？');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行
setupDatabase();
