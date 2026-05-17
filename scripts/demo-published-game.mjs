/**
 * 演示数据生成脚本
 * 创建一个示例已发布游戏，方便测试
 */

import { savePublishedGame } from '../src/services/publishedGameService.ts';

// 创建演示游戏
const demoGame = {
  id: 'demo-rpg-game',
  name: '勇者传说 Demo',
  description: '这是一个通过 Publishing Center 发布的示例 RPG 游戏。体验完整的游戏发布流程，包括 Wallet、Inventory、Store Skills 的集成。',
  framework: 'phaser',
  version: '1.0.0',
  skills: ['auth', 'wallet', 'inventory', 'store'],
  skillConfigs: {
    wallet: {
      gameId: 'demo-rpg-game',
      defaultCurrency: 'gameCoins',
      initialBalance: {
        gameCoins: 1000,
        aCoins: 100,
      },
    },
    inventory: {
      gameId: 'demo-rpg-game',
      maxSlots: 50,
    },
    store: {
      gameId: 'demo-rpg-game',
      currency: 'gameCoins',
    },
  },
  entryPoint: 'index.html',
  fileCount: 15,
  size: 1024 * 1024 * 5, // 5MB
  cdnUrl: 'https://example.com/demo-game',
  externalUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

console.log('🎮 创建演示游戏...');
const saved = savePublishedGame(demoGame);
console.log('✅ 演示游戏创建成功:', saved);

console.log('\n📋 现在你可以：');
console.log('1. 访问 /game-center 查看游戏');
console.log('2. 点击"游玩"进入游戏页面');
console.log('3. 点击"商店"进入游戏商店');
console.log('4. 使用 1000 游戏币购买道具');
