/**
 * AllinONE Skill 系统 - 基础使用示例
 */

import { 
  skillGateway, 
  initializeSkills,
  SkillSDK,
  createSDK,
} from '../index';

/**
 * 示例1：初始化 Skills
 */
export async function example1Initialize() {
  // 方式1：使用便捷函数初始化所有内置 Skills
  await initializeSkills();
  console.log('✅ Skills 初始化完成');
}

/**
 * 示例2：使用 SkillGateway 调用（服务端/复杂场景）
 */
export async function example2GatewayUsage() {
  // 登录
  const loginResponse = await skillGateway.execute('auth', 'login', {
    username: 'player123',
    password: 'password',
  });

  if (loginResponse.success) {
    console.log('登录成功:', loginResponse.data);
  }

  // 获取钱包余额
  const balanceResponse = await skillGateway.execute('wallet', 'getBalance');
  if (balanceResponse.success) {
    console.log('余额:', balanceResponse.data);
  }

  // 获取库存列表
  const inventoryResponse = await skillGateway.execute('inventory', 'getItems', {
    limit: 10,
  });
  if (inventoryResponse.success) {
    console.log('库存:', inventoryResponse.data.items);
  }

  // 购买商品
  const purchaseResponse = await skillGateway.execute('store', 'purchase', {
    productId: 'product_001',
    quantity: 1,
  });
  if (purchaseResponse.success) {
    console.log('购买成功:', purchaseResponse.data);
  }
}

/**
 * 示例3：使用 SDK（客户端/简单场景）
 */
export async function example3SDKUsage() {
  // 方式1：创建新 SDK 实例
  const sdk = createSDK({
    appId: 'my-game-app',
    gatewayUrl: 'https://api.allinone.game/skills',
  });

  // 方式2：使用默认 SDK 实例
  // import { skillSDK } from '@/skills';
  // await skillSDK.initialize({ appId: 'my-game-app' });

  // 登录
  const user = await sdk.login('player123', 'password');
  console.log('登录成功:', user);

  // 直接调用 Skill
  const balance = await sdk.call('wallet', 'getBalance');
  console.log('余额:', balance);

  // 使用代理对象调用
  const wallet = sdk.getSkillProxy('wallet');
  const transactions = await wallet.getTransactions({ limit: 10 });
  console.log('交易记录:', transactions);

  // 链式调用多个 Skills
  const inventory = sdk.getSkillProxy('inventory');
  const store = sdk.getSkillProxy('store');

  const items = await inventory.getItems({ limit: 5 });
  const products = await store.getProducts({ category: 'currency' });
  
  console.log('道具:', items);
  console.log('商品:', products);
}

/**
 * 示例4：事件监听
 */
export function example4EventHandling() {
  // 监听钱包余额变化
  skillGateway.on('wallet.balance.changed', (data, context) => {
    console.log('余额变化:', data);
    // 可以在这里更新 UI
  });

  // 监听交易创建
  skillGateway.on('wallet.transaction.created', (transaction, context) => {
    console.log('新交易:', transaction);
    // 可以在这里显示通知
  });

  // 监听道具添加
  skillGateway.on('inventory.item.added', (data, context) => {
    console.log('获得道具:', data.item);
    // 可以在这里播放获得道具的动画
  });

  // 监听商品购买
  skillGateway.on('store.product.purchased', (data, context) => {
    console.log('购买完成:', data);
    // 可以在这里显示购买成功提示
  });
}

/**
 * 示例5：错误处理
 */
export async function example5ErrorHandling() {
  try {
    const response = await skillGateway.execute('wallet', 'spend', {
      amount: 1000,
      currency: 'gameCoins',
      description: '购买道具',
    });

    if (!response.success) {
      // 处理业务错误
      switch (response.error?.code) {
        case '4000': // INSUFFICIENT_BALANCE
          console.error('余额不足');
          break;
        case '1002': // UNAUTHORIZED
          console.error('请先登录');
          break;
        default:
          console.error('操作失败:', response.error?.message);
      }
    }
  } catch (error) {
    // 处理系统错误
    console.error('系统错误:', error);
  }
}

/**
 * 示例6：货币兑换
 */
export async function example6CurrencyExchange() {
  // 游戏币兑换现金
  const result1 = await skillGateway.execute('wallet', 'exchange', {
    fromCurrency: 'gameCoins',
    toCurrency: 'cash',
    amount: 1000,
  });

  if (result1.success) {
    console.log('兑换成功:', result1.data);
  }

  // 跨平台游戏币兑换
  const result2 = await skillGateway.execute('wallet', 'exchangeGameCoins', {
    fromType: 'gameCoins',
    toType: 'newDayGameCoins',
    amount: 500,
  });

  if (result2.success) {
    console.log('跨平台兑换:', result2.data);
  }
}

/**
 * 示例7：库存同步
 */
export async function example7InventorySync() {
  // 从外部游戏同步道具
  const syncResult = await skillGateway.execute('inventory', 'sync', {
    gameSource: 'newday',
    items: [
      { itemId: 'sword_001', name: '铁剑', quantity: 1 },
      { itemId: 'shield_001', name: '木盾', quantity: 1 },
    ],
    options: {
      forceUpdate: false,
      skipExisting: false,
    },
  });

  if (syncResult.success) {
    console.log('同步完成:', syncResult.data);
  }
}

/**
 * 示例8：商店操作
 */
export async function example8StoreOperations() {
  // 获取商品列表
  const productsResponse = await skillGateway.execute('store', 'getProducts', {
    category: 'currency',
    sortBy: 'price',
    sortOrder: 'asc',
    limit: 10,
  });

  if (productsResponse.success) {
    console.log('商品列表:', productsResponse.data.products);
  }

  // 检查商品可购买性
  const availability = await skillGateway.execute('store', 'checkAvailability', {
    productId: 'product_001',
    quantity: 2,
  });

  if (availability.success && availability.data?.available) {
    // 购买商品
    const purchase = await skillGateway.execute('store', 'purchase', {
      productId: 'product_001',
      quantity: 2,
    });
    console.log('购买结果:', purchase.data);
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🚀 运行 Skill 系统示例\n');

  await example1Initialize();
  
  example4EventHandling();
  
  await example2GatewayUsage();
  await example3SDKUsage();
  await example5ErrorHandling();
  await example6CurrencyExchange();
  await example7InventorySync();
  await example8StoreOperations();

  console.log('\n✅ 所有示例运行完成');
}
