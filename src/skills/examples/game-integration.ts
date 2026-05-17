/**
 * AllinONE Skill 系统 - 游戏接入示例
 * 
 * 展示外部游戏如何使用 Skill SDK 接入 AllinONE 平台
 */

import { createSDK, SkillSDK } from '../sdk/SkillSDK';

/**
 * 游戏 SDK 封装
 * 为特定游戏提供封装好的接口
 */
export class AllinONEGameSDK {
  private sdk: SkillSDK;
  private gameId: string;

  constructor(gameId: string, appId: string) {
    this.gameId = gameId;
    this.sdk = createSDK({ appId });
  }

  /**
   * 初始化游戏 SDK
   */
  async initialize(): Promise<void> {
    await this.sdk.initialize({
      appId: this.sdk['config']?.appId || '',
      gatewayUrl: 'https://api.allinone.game/skills',
    });
    console.log(`[GameSDK] 游戏 ${this.gameId} 初始化完成`);
  }

  /**
   * 游戏登录
   */
  async login(username: string, password: string): Promise<any> {
    const user = await this.sdk.login(username, password);
    console.log(`[GameSDK] 用户 ${username} 登录成功`);
    return user;
  }

  /**
   * 获取玩家钱包
   */
  async getPlayerWallet(): Promise<any> {
    return this.sdk.call('wallet', 'getBalance');
  }

  /**
   * 发放游戏奖励
   */
  async giveReward(computingPower: number, gameCoins: number): Promise<void> {
    await this.sdk.call('wallet', 'reward', {
      computingPower,
      gameCoins,
      gameId: this.gameId,
    });
    console.log(`[GameSDK] 发放奖励: 算力+${computingPower}, 游戏币+${gameCoins}`);
  }

  /**
   * 同步游戏道具到 AllinONE 库存
   */
  async syncInventory(items: Array<{ itemId: string; name: string; quantity: number }>): Promise<any> {
    return this.sdk.call('inventory', 'sync', {
      gameSource: this.gameId,
      items,
    });
  }

  /**
   * 打开商店购买
   */
  async openStore(): Promise<any> {
    return this.sdk.call('store', 'getProducts', {
      category: 'item',
      limit: 20,
    });
  }

  /**
   * 购买道具
   */
  async purchaseItem(productId: string, quantity: number = 1): Promise<any> {
    return this.sdk.call('store', 'purchase', {
      productId,
      quantity,
    });
  }

  /**
   * 使用道具
   */
  async useItem(itemId: string, quantity: number = 1): Promise<any> {
    return this.sdk.call('inventory', 'useItem', {
      itemId,
      quantity,
      context: { gameId: this.gameId },
    });
  }

  /**
   * 监听平台事件
   */
  onBalanceChange(callback: (data: any) => void): void {
    this.sdk.on('wallet.balance.changed', callback);
  }

  onItemAdded(callback: (data: any) => void): void {
    this.sdk.on('inventory.item.added', callback);
  }
}

/**
 * Unity 游戏接入示例
 */
export async function unityGameIntegrationExample() {
  console.log('🎮 Unity 游戏接入示例\n');

  const gameSDK = new AllinONEGameSDK('unity_adventure', 'unity-game-client');
  await gameSDK.initialize();

  // 登录
  await gameSDK.login('unity_player', 'password');

  // 获取钱包
  const wallet = await gameSDK.getPlayerWallet();
  console.log('玩家钱包:', wallet);

  // 发放通关奖励
  await gameSDK.giveReward(100, 500);

  // 同步获得的道具
  await gameSDK.syncInventory([
    { itemId: 'unity_sword_001', name: '勇者之剑', quantity: 1 },
    { itemId: 'unity_potion_001', name: '生命药水', quantity: 5 },
  ]);

  // 打开商店
  const store = await gameSDK.openStore();
  console.log('商店商品:', store);

  // 监听余额变化（Unity 中可以通过 WebView 桥接）
  gameSDK.onBalanceChange((data) => {
    console.log('余额变化:', data);
    // Unity.call('OnBalanceChanged', JSON.stringify(data));
  });
}

/**
 * Cocos 游戏接入示例
 */
export async function cocosGameIntegrationExample() {
  console.log('🎮 Cocos 游戏接入示例\n');

  const gameSDK = new AllinONEGameSDK('cocos_strategy', 'cocos-game-client');
  await gameSDK.initialize();

  // 登录
  await gameSDK.login('cocos_player', 'password');

  // 战斗胜利奖励
  const winBattle = async (difficulty: 'easy' | 'normal' | 'hard') => {
    const rewards = {
      easy: { computingPower: 50, gameCoins: 200 },
      normal: { computingPower: 100, gameCoins: 500 },
      hard: { computingPower: 200, gameCoins: 1000 },
    };

    const reward = rewards[difficulty];
    await gameSDK.giveReward(reward.computingPower, reward.gameCoins);
    console.log(`战斗胜利(${difficulty}):`, reward);
  };

  await winBattle('normal');

  // 使用道具
  await gameSDK.useItem('cocos_card_001', 1);
}

/**
 * H5 小游戏接入示例
 */
export async function h5GameIntegrationExample() {
  console.log('🎮 H5 小游戏接入示例\n');

  // H5 游戏可以直接使用 SDK
  const sdk = createSDK({ appId: 'h5-minigame-client' });

  // 匿名登录（小游戏常用）
  const user = await sdk.call('auth', 'login', {
    username: `h5_guest_${Date.now()}`,
    password: 'guest',
  });
  console.log('H5 游客登录:', user);

  // 每日签到奖励
  const checkIn = async () => {
    await sdk.call('wallet', 'reward', {
      gameCoins: 100,
      description: '每日签到奖励',
    });
    console.log('签到成功，获得 100 游戏币');
  };

  await checkIn();

  // 分享奖励
  const shareReward = async () => {
    await sdk.call('wallet', 'reward', {
      gameCoins: 50,
      description: '分享奖励',
    });
    console.log('分享成功，获得 50 游戏币');
  };

  await shareReward();
}

/**
 * 完整游戏场景示例
 */
export async function fullGameScenario() {
  console.log('🎮 完整游戏场景示例\n');

  const gameSDK = new AllinONEGameSDK('rpg_quest', 'rpg-game-v1');
  await gameSDK.initialize();

  // 1. 玩家登录
  console.log('=== 1. 玩家登录 ===');
  const player = await gameSDK.login('hero_001', 'password');
  console.log('玩家信息:', player);

  // 2. 加载玩家数据
  console.log('\n=== 2. 加载玩家数据 ===');
  const wallet = await gameSDK.getPlayerWallet();
  console.log('钱包余额:', wallet);

  const inventory = await gameSDK.sdk.call('inventory', 'getItems', { limit: 50 });
  console.log('库存道具:', inventory);

  // 3. 开始游戏任务
  console.log('\n=== 3. 开始游戏任务 ===');
  console.log('玩家开始执行任务: 击败史莱姆王');

  // 4. 任务完成，发放奖励
  console.log('\n=== 4. 任务完成奖励 ===');
  await gameSDK.giveReward(150, 800);

  // 5. 获得战利品道具
  console.log('\n=== 5. 获得战利品 ===');
  await gameSDK.syncInventory([
    { itemId: 'slime_crown', name: '史莱姆王冠', quantity: 1 },
    { itemId: 'slime_gel', name: '史莱姆凝胶', quantity: 10 },
    { itemId: 'gold_coin', name: '金币', quantity: 500 },
  ]);

  // 6. 玩家使用生命药水
  console.log('\n=== 6. 使用道具 ===');
  await gameSDK.useItem('health_potion', 2);

  // 7. 玩家打开商店
  console.log('\n=== 7. 打开商店 ===');
  const store = await gameSDK.openStore();
  console.log('商店商品数量:', store.products?.length || 0);

  // 8. 购买强化道具
  console.log('\n=== 8. 购买道具 ===');
  if (store.products && store.products.length > 0) {
    const product = store.products[0];
    console.log(`购买: ${product.name}`);
    
    try {
      const purchase = await gameSDK.purchaseItem(product.id, 1);
      console.log('购买成功:', purchase);
    } catch (error) {
      console.log('购买失败:', error);
    }
  }

  // 9. 兑换货币
  console.log('\n=== 9. 货币兑换 ===');
  const exchangeResult = await gameSDK.sdk.call('wallet', 'exchange', {
    fromCurrency: 'gameCoins',
    toCurrency: 'cash',
    amount: 1000,
  });
  console.log('兑换结果:', exchangeResult);

  // 10. 查看交易记录
  console.log('\n=== 10. 交易记录 ===');
  const transactions = await gameSDK.sdk.call('wallet', 'getTransactions', { limit: 10 });
  console.log('最近交易:', transactions);

  console.log('\n✅ 游戏场景示例完成');
}
