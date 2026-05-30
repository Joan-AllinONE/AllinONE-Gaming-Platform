/**
 * CloudBase 数据库初始化脚本
 * 
 * 创建所有 8 个集合 + 安全规则 + 索引
 * 
 * 环境变量:
 *   TCB_ENV_ID   = allinonegaming-d4gmsmrzz573264f6
 *   TCB_SECRET_ID  = 腾讯云 SecretId
 *   TCB_SECRET_KEY = 腾讯云 SecretKey
 * 
 * 运行: node cloudfunctions/db_init/init.js
 */

const cloudbase = require('@cloudbase/node-sdk');

const ENV_ID = process.env.TCB_ENV_ID || 'allinonegaming-d4gmsmrzz573264f6';
const SECRET_ID = process.env.TCB_SECRET_ID;
const SECRET_KEY = process.env.TCB_SECRET_KEY;

if (!SECRET_ID || !SECRET_KEY) {
  console.error('❌ 请设置环境变量: TCB_SECRET_ID 和 TCB_SECRET_KEY');
  console.error('   可从 https://console.cloud.tencent.com/cam/capi 获取');
  process.exit(1);
}

// 初始化 CloudBase Admin SDK
const app = cloudbase.init({
  env: ENV_ID,
  secretId: SECRET_ID,
  secretKey: SECRET_KEY,
});

const db = app.database();

// ==================== 集合定义 ====================

const collections = [
  {
    name: 'users',
    description: '用户资料（余额 + 角色）',
    indexes: [
      { keys: { _openid: 1 }, unique: true },
      { keys: { email: 1 }, unique: true },
    ],
  },
  {
    name: 'transactions',
    description: '交易流水',
    indexes: [
      { keys: { userId: 1, timestamp: -1 } },
      { keys: { currency: 1 } },
    ],
  },
  {
    name: 'voucher_templates',
    description: '凭证模板',
    indexes: [
      { keys: { gameId: 1 } },
      { keys: { isActive: 1 } },
    ],
  },
  {
    name: 'vouchers',
    description: '凭证实例',
    indexes: [
      { keys: { templateId: 1 } },
      { keys: { holderId: 1 } },
      { keys: { status: 1 } },
    ],
  },
  {
    name: 'purchases',
    description: '购买记录',
    indexes: [
      { keys: { userId: 1, paidAt: -1 } },
      { keys: { redeemCode: 1 }, unique: true },
    ],
  },
  {
    name: 'proposals',
    description: '治理提案',
    indexes: [
      { keys: { gameId: 1, status: 1 } },
      { keys: { status: 1, votingEndAt: 1 } },
    ],
  },
  {
    name: 'inventories',
    description: '道具库存',
    indexes: [
      { keys: { userId: 1, gameId: 1 } },
      { keys: { syncStatus: 1 } },
    ],
  },
  {
    name: 'game_connectors',
    description: '游戏连接器配置',
    indexes: [
      { keys: { gameId: 1 }, unique: true },
      { keys: { isActive: 1 } },
    ],
  },
];

// ==================== 主流程 ====================

async function main() {
  console.log(`\n🏰 AllinONE CloudBase 数据库初始化`);
  console.log(`   环境 ID: ${ENV_ID}`);
  console.log(`   集合数量: ${collections.length}\n`);

  const results: { name: string; status: string; message: string }[] = [];

  for (const col of collections) {
    const icon = '📦';
    try {
      // 检查集合是否已存在
      try {
        const check = await db.collection(col.name).limit(1).get();
        results.push({ name: col.name, status: 'skip', message: '已存在' });
        console.log(`${icon} ${col.name}: 已存在，跳过`);
        continue;
      } catch {
        // 不存在，继续创建
      }

      // 创建集合
      await db.createCollection(col.name);
      console.log(`${icon} ${col.name}: ✅ 创建成功 - ${col.description}`);

      // 创建索引
      for (const idx of col.indexes) {
        try {
          await db.collection(col.name).createIndex(idx.keys, { unique: idx.unique || false });
          console.log(`   🔍 索引: ${JSON.stringify(idx.keys)} ${idx.unique ? '(unique)' : ''}`);
        } catch (idxErr: any) {
          if (idxErr.message?.includes('already exists')) {
            console.log(`   🔍 索引已存在: ${JSON.stringify(idx.keys)}`);
          } else {
            console.warn(`   ⚠️  索引失败: ${idxErr.message}`);
          }
        }
      }

      results.push({ name: col.name, status: 'created', message: '创建成功' });
    } catch (err: any) {
      results.push({ name: col.name, status: 'error', message: err.message });
      console.error(`❌ ${col.name}: ${err.message}`);
    }
  }

  // ==================== 安全规则 ====================
  console.log('\n🛡️  安全规则建议（请在 CloudBase 控制台手动设置）:');
  console.log('─────────────────────────────────────────────');
  console.log(`
users: {
  "read": "auth.uid == doc._openid",
  "write": "auth.uid == doc._openid"
}

transactions: {
  "read": "auth.uid == doc.userId",
  "write": false
}

voucher_templates: {
  "read": true,
  "write": "auth.role in ['developer', 'admin']"
}

vouchers: {
  "read": "auth.uid == doc.holderId",
  "write": false
}

purchases: {
  "read": "auth.uid == doc.userId",
  "write": false
}

proposals: {
  "read": true,
  "write": "auth.uid != null"
}

inventories: {
  "read": "auth.uid == doc.userId",
  "write": false
}

game_connectors: {
  "read": true,
  "write": "auth.role in ['admin']"
}
`.trim());

  // ==================== 结果汇总 ====================
  console.log('\n📊 结果汇总:');
  const created = results.filter(r => r.status === 'created').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const errors = results.filter(r => r.status === 'error').length;
  console.log(`   创建: ${created} | 跳过: ${skipped} | 失败: ${errors}`);

  if (errors > 0) {
    console.log('\n⚠️  部分集合创建失败，请检查 SecretId/SecretKey 是否有权限');
    process.exit(1);
  }

  console.log('\n✅ 数据库初始化完成！\n');
}

main().catch(err => {
  console.error('初始化失败:', err.message);
  process.exit(1);
});
