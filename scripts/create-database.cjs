/**
 * 创建 AllinONE 数据库
 */

const { Pool } = require('pg');
require('dotenv').config();

// 先连接到默认的 postgres 数据库
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // 连接到默认数据库
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createDatabase() {
  console.log('🔧 开始创建数据库...\n');

  try {
    const client = await pool.connect();
    console.log('✅ 已连接到 PostgreSQL\n');

    try {
      // 检查数据库是否已存在
      const checkResult = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        ['allinone_db']
      );

      if (checkResult.rows.length > 0) {
        console.log('ℹ️ 数据库 allinone_db 已存在\n');
        return;
      }

      // 创建数据库
      await client.query('CREATE DATABASE allinone_db');
      console.log('✅ 数据库 allinone_db 创建成功!\n');

    } catch (err) {
      console.error('❌ 创建数据库失败:', err.message);
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('\n❌ 连接 PostgreSQL 失败:');
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

createDatabase()
  .then(() => {
    console.log('🎉 完成! 现在可以运行数据库初始化脚本');
    console.log('命令: node scripts/init-database.cjs\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('失败:', err);
    process.exit(1);
  });
