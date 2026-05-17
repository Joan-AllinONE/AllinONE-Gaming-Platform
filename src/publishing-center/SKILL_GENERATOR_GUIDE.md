# Skill 配置生成器使用指南

为游戏开发者提供"一键开店"式的傻瓜化 Skill 接入体验。

## 概述

传统接入方式需要开发者：
1. 理解 Skill 架构
2. 编写 1000+ 行 TypeScript 代码
3. 调试和测试

**新的配置驱动方式**：
1. 填写 Markdown/YAML 配置（50行）
2. 自动生成完整 Skill 代码
3. 直接部署使用

```
传统方式                    配置驱动方式
─────────────────          ─────────────────
理解 Skill 架构       →     勾选功能开关
编写 1000+ 行代码     →     填写 50 行配置
手动调试测试         →     自动生成+验证
```

## 快速开始

### 方式一：可视化配置（推荐）

在发布中心使用图形界面配置：

```tsx
import { PublishingCenter } from '@/publishing-center';

function App() {
  return (
    <PublishingCenter
      mode="skill-config"
      onConfigComplete={(config) => {
        // 配置自动生成 Skill 代码
        console.log('生成的配置:', config);
      }}
    />
  );
}
```

### 方式二：Markdown 配置

```markdown
<!-- game.skill.md -->
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
```

### 方式三：YAML 配置

```yaml
# game.skill.yaml
game:
  id: my-rpg-game
  name: 勇者传说

features:
  - wallet
  - store
  - inventory

wallet:
  currencies:
    - id: game_coin
      name: 游戏币
      initialBalance: 1000

store:
  products:
    - id: sword_001
      name: 铁剑
      price: { game_coin: 100 }
      stock: 999
```

### 方式四：AI 对话生成

```
用户: 我想做一个魔法学院游戏
      需要金币和魔法石两种货币
      商店要卖魔法书、法杖、药水

AI: 已为您生成配置！

[自动生成标准配置...]

请确认或修改以下配置：
- 游戏ID: magic-academy-xx
- 货币: 金币(初始1000) + 魔法石(初始10)
- 商品: 5本魔法书 + 3种法杖 + 4种药水
```

## 生成代码示例

输入配置后，自动生成以下代码：

### 1. 主 Skill 类

```typescript
// MyRpgGameSkill.ts
export class MyRpgGameSkill extends BaseSkill {
  private data: GameData = {
    wallet: {},
    inventory: [],
    stats: { createdAt: Date.now() },
  };

  constructor() {
    super({
      name: 'my-rpg-game',
      displayName: '勇者传说',
      version: '1.0.0',
    });
  }

  protected async onInitialize(): Promise<void> {
    // 初始化钱包
    this.registerAction('getBalance', this.handleGetBalance.bind(this));
    this.registerAction('addBalance', this.handleAddBalance.bind(this));
    this.registerAction('deductBalance', this.handleDeductBalance.bind(this));
    
    // 初始化商店
    this.registerAction('getProducts', this.handleGetProducts.bind(this));
    this.registerAction('purchase', this.handlePurchase.bind(this));
    
    // 初始化库存
    this.registerAction('getInventory', this.handleGetInventory.bind(this));
    this.registerAction('useItem', this.handleUseItem.bind(this));
  }

  // ... 完整实现
}
```

### 2. 类型定义

```typescript
// MyRpgGameTypes.ts
export interface Currency {
  game_coin: { name: '游戏币'; initialBalance: 1000 };
  gold: { name: '金币'; initialBalance: 100 };
}

export interface Product {
  sword_001: { name: '铁剑'; category: 'weapon'; price: { game_coin: 100 } };
  hp_potion: { name: '生命药水'; category: 'consumable'; price: { game_coin: 10 } };
}
```

### 3. 配置文件

```typescript
// my-rpg-game.config.ts
export default {
  gameId: 'my-rpg-game',
  gameName: '勇者传说',
  features: ['wallet', 'store', 'inventory'],
  currencies: [...],
  products: [...],
  inventory: { enabled: true, maxSlots: 50 },
};
```

## 使用生成的 Skill

```typescript
import { MyRpgGameSkill } from '@/skills/generated/MyRpgGameSkill';
import { skillGateway } from '@/skills';

// 1. 实例化并注册
const gameSkill = new MyRpgGameSkill();
await skillGateway.registerSkill(gameSkill);

// 2. 调用钱包功能
const balance = await gameSkill.execute('getBalance', { 
  currency: 'game_coin' 
});
console.log('游戏币余额:', balance.balance);

// 3. 调用商店功能
const products = await gameSkill.execute('getProducts', { 
  category: 'weapons' 
});

// 4. 购买商品
const result = await gameSkill.execute('purchase', {
  productId: 'sword_001',
  quantity: 1,
});

// 5. 查看库存
const inventory = await gameSkill.execute('getInventory', {});
console.log('库存物品:', inventory.items);
```

## 配置模板

### 极简版

适合：快速接入、简单游戏

```markdown
# Skill 配置 - 极简版

## 基础信息
- **游戏ID**: simple-game
- **游戏名称**: 简单游戏

## 功能
- [x] 钱包系统
- [x] 商店系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 游戏币 | 1000 |

## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item_1 | 道具 | 10 |
```

### 标准版

适合：大多数游戏场景

```markdown
# Skill 配置 - 标准版

## 基础信息
- **游戏ID**: rpg-game
- **游戏名称**: RPG游戏

## 功能
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币
| 货币 | 初始值 |
|------|-------:|
| 游戏币 | 500 |
| 金币 | 50 |

## 商品
| 商品ID | 名称 | 价格(游戏币) | 类型 |
|--------|------|-------------:|------|
| sword | 铁剑 | 100 | 武器 |
| armor | 皮甲 | 150 | 防具 |
| potion | 药水 | 10 | 消耗品 |

## 商店分类
| 分类ID | 名称 | 图标 |
|--------|------|------|
| weapons | 武器 | ⚔️ |
| armors | 防具 | 🛡️ |
| items | 道具 | 🎒 |
```

### 完整版（YAML）

适合：复杂游戏、精细控制

```yaml
game:
  id: mmorpg-game
  name: MMORPG游戏
  version: 2.0.0

features:
  - wallet
  - store
  - inventory
  - leaderboard
  - achievements

wallet:
  currencies:
    - id: copper
      name: 铜币
      initialBalance: 500
    - id: silver
      name: 银币
      initialBalance: 50
    - id: gold
      name: 金币
      initialBalance: 5

  rewards:
    - trigger: daily_login
      reward: { copper: 100 }
    - trigger: level_up
      reward: { silver: 10 }

store:
  categories:
    - id: weapons
      name: 武器
    - id: armors
      name: 防具
  
  products:
    - id: legendary_sword
      name: 传说之剑
      category: weapons
      price: { gold: 100 }
      stock: 1
      effects:
        damage: +999

inventory:
  maxSlots: 100
  syncMode: realtime

hooks:
  onPlayerLogin: |
    console.log("欢迎回来！");
    
  onPurchaseComplete: |
    analytics.track("purchase", item);
```

## API 接口

### 生成 Skill

```typescript
import { generateSkill } from '@/skills/generator';

const result = await generateSkill(markdownContent, {
  outputDir: './src/skills/generated',
  generateTypes: true,
  generateTests: false,
  autoFix: true,
});

if (result.success) {
  console.log('生成文件:', result.files.map(f => f.path));
} else {
  console.error('错误:', result.errors);
}
```

### 验证配置

```typescript
import { validateConfig } from '@/skills/generator';

const validation = validateConfig(configContent);

if (!validation.valid) {
  console.log('错误:', validation.errors);
  console.log('警告:', validation.warnings);
}
```

### 批量生成

```typescript
import { batchGenerateSkills } from '@/skills/generator';

const configs = [config1, config2, config3];
const results = await batchGenerateSkills(configs);
```

## 最佳实践

### 1. 游戏 ID 规范

```yaml
# ✅ 正确
id: magic_academy      # 小写下划线
id: rpg_adventure_v2   # 带版本号

# ❌ 错误
id: MagicAcademy       # 大写
id: rpg-adventure      # 连字符
id: 123game            # 数字开头
```

### 2. 货币设计

```yaml
# 简单游戏：1种货币
wallet:
  currencies:
    - id: coin
      name: 游戏币
      initialBalance: 1000

# 标准游戏：2-3种货币
wallet:
  currencies:
    - id: coin         # 基础货币（打怪获得）
      name: 铜币
    - id: gem          # 高级货币（充值获得）
      name: 钻石
    - id: computing    # 系统货币
      name: 算力

# 复杂游戏：多层货币
wallet:
  currencies:
    - id: copper       # 铜币（基础）
    - id: silver       # 银币（100铜=1银）
    - id: gold         # 金币（100银=1金）
    - id: diamond      # 钻石（充值）
```

### 3. 商品定价策略

```yaml
# 新手商品：便宜、实用
- id: starter_pack
  name: 新手礼包
  price: { coin: 0 }      # 免费
  
# 消耗品：低价高频
- id: hp_potion
  name: 生命药水
  price: { coin: 10 }     # 便宜
  stock: 9999             # 充足
  
# 装备：中等价格
- id: iron_sword
  name: 铁剑
  price: { coin: 500 }    # 需要积累
  
# 稀有物品：高价限量
- id: legendary_weapon
  name: 传说武器
  price: { gem: 100 }     # 高级货币
  stock: 10               # 限量
```

## 常见问题

### Q: 配置验证失败怎么办？

```typescript
// 启用自动修复
const result = await generateSkill(config, {
  autoFix: true,
});
```

### Q: 如何自定义生成路径？

```typescript
const result = await generateSkill(config, {
  outputDir: './my/custom/path',
});
```

### Q: 能否只生成特定文件？

```typescript
const result = await generateSkill(config, {
  generateTypes: false,  // 不生成类型文件
  generateTests: false,  // 不生成测试文件
});
```

### Q: 如何与 AI 集成？

```typescript
// AI 生成配置
const aiConfig = await ai.generateConfig(userDescription);

// 验证并生成
const result = await generateSkill(aiConfig, {
  autoFix: true,
  validationLevel: 'normal',
});
```

## 示例游戏

### 示例 1: RPG 冒险游戏

```markdown
# Skill 配置

## 基础信息
- **游戏ID**: dragon_quest
- **游戏名称**: 龙之 quest

## 功能
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 500 |
| 钻石 | 0 |

## 商品
| 商品ID | 名称 | 金币 | 钻石 |
|--------|------|-----:|-----:|
| sword | 铁剑 | 100 | - |
| armor | 皮甲 | 150 | - |
| revive | 复活石 | - | 10 |
```

### 示例 2: 休闲消除游戏

```markdown
# Skill 配置

## 基础信息
- **游戏ID**: candy_match
- **游戏名称**: 糖果消消乐

## 功能
- [x] 钱包系统
- [x] 商店系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 1000 |
| 体力 | 100 |

## 商品
| 商品ID | 名称 | 金币 | 效果 |
|--------|------|-----:|------|
| hammer | 锤子 | 50 | 消除单个 |
| bomb | 炸弹 | 100 | 消除3x3 |
| rainbow | 彩虹糖 | 200 | 消除同色 |
```

## 更新日志

### v1.0.0
- ✅ Markdown 配置解析
- ✅ YAML 配置解析
- ✅ 自动生成 TypeScript Skill 代码
- ✅ 配置验证和自动修复
- ✅ 支持钱包/商店/库存功能

### 计划功能
- 🚧 可视化配置编辑器
- 🚧 在线代码生成器
- 🚧 更多游戏功能模板
- 🚧 AI 智能配置推荐
