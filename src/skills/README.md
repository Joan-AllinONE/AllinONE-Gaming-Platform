# AllinONE Skill 系统

AllinONE 平台功能 Skill 化架构，为外部游戏提供标准化的接入接口。

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    外部游戏 / 客户端                          │
└────────────────────┬────────────────────────────────────────┘
                     │ 使用 Skill SDK
┌────────────────────▼────────────────────────────────────────┐
│                   Skill Gateway                             │
│              (统一接入层：路由、认证、限流)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Auth    │ │  Wallet  │ │ Inventory│ │  Store   │       │
│  │  Skill   │ │  Skill   │ │  Skill   │ │  Skill   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 安装

Skill 系统已内置于 AllinONE 平台，无需额外安装。

## 🚀 快速开始

### 方式1：使用 SDK（推荐）

```typescript
import { createSDK } from '@/skills';

// 创建 SDK 实例
const sdk = createSDK({ appId: 'your-game-id' });

// 登录
await sdk.login('username', 'password');

// 获取钱包余额
const balance = await sdk.call('wallet', 'getBalance');
console.log('余额:', balance);

// 使用代理对象
const wallet = sdk.getSkillProxy('wallet');
const transactions = await wallet.getTransactions({ limit: 10 });
```

### 方式2：使用 SkillGateway

```typescript
import { skillGateway, initializeSkills } from '@/skills';

// 初始化
await initializeSkills();

// 调用 Skill
const response = await skillGateway.execute('wallet', 'getBalance');
if (response.success) {
  console.log('余额:', response.data);
}
```

### 方式3：向后兼容（旧代码）

```typescript
import { walletService, inventoryApiService } from '@/services';

// 原有 API 完全兼容
const balance = await walletService.getBalance();
const { items } = await inventoryApiService.getInventory();
```

## 📚 Skills 列表

### Auth Skill - 认证服务

```typescript
// 登录
await skillGateway.execute('auth', 'login', {
  username: 'player',
  password: 'password',
});

// 获取当前用户
const user = await skillGateway.execute('auth', 'getCurrentUser');

// 检查权限
const { hasPermission } = await skillGateway.execute('auth', 'checkPermission', {
  permission: 'wallet:write:transfer',
});
```

### Wallet Skill - 钱包服务

```typescript
// 获取余额
const balance = await skillGateway.execute('wallet', 'getBalance');

// 获取交易记录
const transactions = await skillGateway.execute('wallet', 'getTransactions', {
  limit: 50,
  currency: 'gameCoins',
});

// 货币兑换
const result = await skillGateway.execute('wallet', 'exchange', {
  fromCurrency: 'gameCoins',
  toCurrency: 'cash',
  amount: 1000,
});

// 发放奖励
await skillGateway.execute('wallet', 'reward', {
  computingPower: 100,
  gameCoins: 500,
  gameId: 'my-game',
});
```

### Inventory Skill - 库存服务

```typescript
// 获取道具列表
const { items } = await skillGateway.execute('inventory', 'getItems', {
  gameSource: 'my-game',
  limit: 20,
});

// 添加道具
await skillGateway.execute('inventory', 'addItem', {
  itemId: 'sword_001',
  name: '铁剑',
  gameSource: 'my-game',
  gameName: 'My RPG Game',
  category: 'weapon',
  quantity: 1,
});

// 同步道具
await skillGateway.execute('inventory', 'sync', {
  gameSource: 'my-game',
  items: [
    { itemId: 'item1', name: '药水', quantity: 5 },
    { itemId: 'item2', name: '钥匙', quantity: 1 },
  ],
});

// 使用道具
await skillGateway.execute('inventory', 'useItem', {
  itemId: 'potion_001',
  quantity: 1,
});
```

### Store Skill - 商店服务

```typescript
// 获取商品列表
const { products } = await skillGateway.execute('store', 'getProducts', {
  category: 'item',
  sortBy: 'price',
});

// 购买商品
const order = await skillGateway.execute('store', 'purchase', {
  productId: 'product_001',
  quantity: 2,
});

// 检查可购买性
const { available } = await skillGateway.execute('store', 'checkAvailability', {
  productId: 'product_001',
  quantity: 1,
});
```

## 🎮 游戏接入指南

### 步骤1：创建 SDK 实例

```typescript
import { AllinONEGameSDK } from '@/skills/examples/game-integration';

const gameSDK = new AllinONEGameSDK('your-game-id', 'your-app-id');
await gameSDK.initialize();
```

### 步骤2：玩家登录

```typescript
await gameSDK.login('player-name', 'password');
```

### 步骤3：发放奖励

```typescript
// 任务完成奖励
await gameSDK.giveReward(100, 500); // 算力, 游戏币
```

### 步骤4：同步道具

```typescript
await gameSDK.syncInventory([
  { itemId: 'sword_001', name: '勇者之剑', quantity: 1 },
  { itemId: 'shield_001', name: '骑士盾', quantity: 1 },
]);
```

### 步骤5：打开商店

```typescript
const store = await gameSDK.openStore();
// 显示商店 UI...
```

## 📖 事件系统

```typescript
import { skillGateway } from '@/skills';

// 监听钱包余额变化
skillGateway.on('wallet.balance.changed', (data, context) => {
  console.log('余额变化:', data);
});

// 监听道具添加
skillGateway.on('inventory.item.added', (data, context) => {
  console.log('获得道具:', data.item);
  // 播放获得动画
});

// 监听购买完成
skillGateway.on('store.product.purchased', (data, context) => {
  console.log('购买成功:', data.orderId);
  // 显示成功提示
});
```

## 🔌 创建自定义 Skill

```typescript
import { BaseSkill, SkillDefinition, SkillContext } from '@/skills';

class MyCustomSkill extends BaseSkill {
  constructor() {
    super({
      name: 'myCustom',
      displayName: '我的自定义 Skill',
      version: '1.0.0',
      description: '这是一个示例 Skill',
      requiredPermissions: [],
      dependencies: ['auth'],
      actions: [],
    });
  }

  async onInitialize(): Promise<void> {
    this.registerAction('myAction', this.myAction.bind(this), {
      displayName: '我的动作',
      description: '执行某个操作',
      paramsSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
        },
        required: ['param1'],
      },
      returnsSchema: { type: 'object' },
      requiredPermissions: [],
      readonly: false,
      idempotent: true,
    });
  }

  private async myAction(params: { param1: string }, context: SkillContext) {
    return { result: `Hello ${params.param1}` };
  }
}

// 注册使用
const mySkill = new MyCustomSkill();
await skillGateway.registerSkill(mySkill);

// 调用
const response = await skillGateway.execute('myCustom', 'myAction', {
  param1: 'World',
});
```

## 🛡️ 错误处理

```typescript
import { SkillErrors, SkillErrorCode } from '@/skills';

const response = await skillGateway.execute('wallet', 'spend', {
  amount: 1000,
  currency: 'gameCoins',
});

if (!response.success) {
  switch (response.error?.code) {
    case SkillErrorCode.INSUFFICIENT_BALANCE:
      console.error('余额不足');
      break;
    case SkillErrorCode.UNAUTHORIZED:
      console.error('请先登录');
      break;
    default:
      console.error('操作失败:', response.error?.message);
  }
}
```

## 📁 项目结构

```
src/skills/
├── index.ts                 # 主入口，导出所有功能
├── types.ts                 # 核心类型定义
├── errors.ts                # 错误处理
├── EventBus.ts              # 事件总线
├── SkillGateway.ts          # Skill 网关
├── BaseSkill.ts             # Skill 基类
├── auth/
│   └── AuthSkill.ts         # 认证 Skill
├── wallet/
│   └── WalletSkill.ts       # 钱包 Skill
├── inventory/
│   └── InventorySkill.ts    # 库存 Skill
├── store/
│   └── StoreSkill.ts        # 商店 Skill
├── sdk/
│   └── SkillSDK.ts          # JavaScript SDK
├── compat/                  # 向后兼容层
│   ├── walletCompat.ts
│   └── inventoryCompat.ts
└── examples/                # 示例代码
    ├── basic-usage.ts
    └── game-integration.ts
```

## 🚀 配置驱动生成（推荐）

### 快速创建游戏 Skill

通过简单的配置（Markdown/YAML）快速生成完整的 Skill 代码：

```typescript
import { generateSkill } from '@/skills';

const config = `
# Skill 配置

## 基础信息
- **游戏ID**: my-rpg-game
- **游戏名称**: 勇者传说

## 功能开关
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 1000 |
| 金币 | ✅ | 100 |

## 商品列表
| 商品ID | 名称 | 价格 | 类型 |
|--------|------|-----:|------|
| sword_001 | 铁剑 | 100 | 武器 |
| hp_potion | 生命药水 | 10 | 消耗品 |
`;

// 生成 Skill 代码
const result = await generateSkill(config, {
  outputDir: './src/skills/generated',
  generateTypes: true,
});

console.log('生成文件:', result.files.map(f => f.path));
```

### 使用生成的 Skill

```typescript
import { MyRpgGameSkill } from '@/skills/generated/MyRpgGameSkill';
import { skillGateway } from '@/skills';

// 注册 Skill
const skill = new MyRpgGameSkill();
await skillGateway.registerSkill(skill);

// 调用功能
const balance = await skill.execute('getBalance', { currency: 'game_coin' });
const products = await skill.execute('getProducts', { category: 'weapons' });
const result = await skill.execute('purchase', { productId: 'sword_001' });
```

### 可视化配置向导

```tsx
import { SkillConfigWizard } from '@/publishing-center';

function ConfigPage() {
  return (
    <SkillConfigWizard
      onGenerate={(result) => {
        console.log('生成结果:', result);
      }}
    />
  );
}
```

## 🔗 相关文档

- [基础使用示例](./examples/basic-usage.ts)
- [游戏接入示例](./examples/game-integration.ts)
- [配置生成器文档](./generator/README.md)
- [生成器使用指南](../publishing-center/SKILL_GENERATOR_GUIDE.md)
- [向后兼容层](./compat/)
- [配置模板](./templates/)

## 📄 许可证

MIT License
