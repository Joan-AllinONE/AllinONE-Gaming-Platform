# Skill 配置生成器

通过简单的配置（Markdown/YAML）快速生成完整的 Skill 代码，实现"一键开店"的傻瓜式接入体验。

## 核心理念

```
传统方式                    配置驱动方式
─────────────────          ─────────────────
写 1000+ 行代码      →     填 50 行配置
理解 Skill 架构       →     勾选功能开关
手动调试测试         →     自动生成+验证
```

## 快速开始

### 1. 创建配置文件

```markdown
<!-- my-game.skill.md -->
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

### 2. 生成 Skill 代码

```typescript
import { generateSkill } from '@/skills/generator';

const config = `# 上面 markdown 内容...`;

const result = await generateSkill(config, {
  outputDir: './src/skills/generated',
  generateTypes: true,
  generateTests: false,
});

console.log('生成文件:', result.files.map(f => f.path));
```

### 3. 使用生成的 Skill

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

## 配置模板

### 极简版（1分钟上手）

适合：快速接入、简单游戏

```markdown
# Skill 配置 - 极简版

## 基础信息
- **游戏ID**: my-game
- **游戏名称**: 我的游戏

## 功能开关（勾选即启用）
- [x] 钱包系统
- [x] 商店系统
- [ ] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 1000 |

## 商品列表
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item_001 | 新手礼包 | 0 |
```

### 标准版（推荐）

适合：大多数游戏场景

```markdown
# Skill 配置 - 标准版

## 基础信息
- **游戏ID**: rpg-adventure
- **游戏名称**: 勇者传说
- **接入类型**: 标准接入

## 功能模块
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 500 |
| 算力 | ✅ | 0 |

## 商品列表
| 商品ID | 名称 | 价格(游戏币) | 库存 | 类型 |
|--------|------|-------------:|-----:|------|
| sword_001 | 铁剑 | 100 | 999 | 武器 |
| hp_potion | 生命药水 | 10 | 9999 | 消耗品 |

## 商店分类
| 分类ID | 分类名称 | 图标 |
|--------|---------|------|
| weapons | 武器装备 | ⚔️ |
| consumables | 消耗品 | 🧪 |
```

### 完整版（YAML）

适合：复杂游戏、精细控制

```yaml
game:
  id: mmorpg-world
  name: 魔法世界
  version: 2.0.0

features:
  - wallet
  - store
  - inventory
  - leaderboard
  - achievements

wallet:
  currencies:
    - id: gold
      name: 金币
      initialBalance: 100
  
  rewards:
    - trigger: daily_login
      reward: { gold: 10 }

store:
  categories:
    - id: weapons
      name: 武器
  
  products:
    - id: sword
      name: 铁剑
      category: weapons
      price: { gold: 50 }
      stock: 100

hooks:
  onPlayerLogin: |
    console.log("欢迎回来！");
```

## API 参考

### 核心函数

```typescript
// 生成 Skill
function generateSkill(
  configContent: string,
  options?: GeneratorOptions
): Promise<GenerationResult & { validation: ValidationResult }>

// 验证配置
function validateConfig(configContent: string): ValidationResult

// 批量生成
function batchGenerateSkills(
  configs: string[],
  options?: GeneratorOptions
): Promise<(GenerationResult & { validation: ValidationResult })[]>
```

### 生成选项

```typescript
interface GeneratorOptions {
  // 输出目录
  outputDir?: string;
  // 是否生成类型定义文件
  generateTypes?: boolean;
  // 是否生成测试文件
  generateTests?: boolean;
  // 是否自动修复配置错误
  autoFix?: boolean;
  // 验证级别: strict | normal | loose
  validationLevel?: 'strict' | 'normal' | 'loose';
}
```

### 配置解析器

```typescript
import { SkillConfigParser } from '@/skills/generator';

// 解析 Markdown
const config = SkillConfigParser.parseMarkdown(markdownContent);

// 解析 YAML
const config = SkillConfigParser.parseYAML(yamlContent);
```

### 配置验证器

```typescript
import { ConfigValidator } from '@/skills/generator';

// 验证配置
const result = ConfigValidator.validate(config);
console.log(result.valid);      // true/false
console.log(result.errors);     // 错误列表
console.log(result.warnings);   // 警告列表

// 自动修复
const fixed = ConfigValidator.autoFix(config);

// 生成报告
const report = ConfigValidator.generateReport(result);
console.log(report);
```

## 生成文件结构

```
src/skills/generated/
├── MyGameSkill.ts          # 主 Skill 类（核心代码）
├── MyGameTypes.ts          # TypeScript 类型定义
├── MyGameSkill.test.ts     # 测试文件（可选）
└── my-game.config.ts       # JSON 配置导出
```

### 生成的 Skill 功能

根据配置自动生成的功能：

| 功能 | 生成的动作 | 说明 |
|------|-----------|------|
| 钱包 | `getBalance` | 获取货币余额 |
| 钱包 | `addBalance` | 增加余额 |
| 钱包 | `deductBalance` | 扣除余额 |
| 商店 | `getProducts` | 获取商品列表 |
| 商店 | `purchase` | 购买商品 |
| 库存 | `getInventory` | 获取库存列表 |
| 库存 | `useItem` | 使用物品 |
| 通用 | `getGameData` | 获取完整游戏数据 |

## 大模型集成

### Prompt 模板

将以下 Prompt 提供给大模型，即可自动生成配置：

```markdown
你是一个 AllinONE 游戏平台配置助手。

请根据用户的游戏需求，生成标准化的 Skill 配置。

## 输出格式
使用 Markdown 格式，包含以下部分：
1. 基础信息（游戏ID、名称）
2. 功能开关（钱包/商店/库存）
3. 货币设置（表格形式）
4. 商品列表（表格形式）

## 规则
1. 游戏ID使用小写字母+下划线格式
2. 货币初始值合理（0-10000）
3. 商品价格与货币体系匹配
4. 商品ID格式: {类型}_{序号}

## 用户输入
用户说："我想做一个魔法学院主题的游戏，有金币和魔法石两种货币，
需要商店卖魔法书、法杖和药水"

请生成对应的配置。
```

### 完整工作流

```
用户描述需求
    ↓
大模型理解并生成配置
    ↓
配置解析器 (SkillConfigParser)
    ↓
配置验证器 (ConfigValidator)
    ↓
代码生成器 (SkillCodeGenerator)
    ↓
生成 TypeScript Skill 文件
    ↓
开发者审核并部署
```

## 最佳实践

### 1. 配置命名规范

```yaml
# ✅ 正确
game:
  id: magic_academy        # 小写下划线
  name: 魔法学院           # 中文可读

# ❌ 错误  
game:
  id: MagicAcademy-Game    # 大写和连字符
  name: magic academy      # 英文无意义
```

### 2. 货币设计建议

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

# 复杂游戏：多层货币体系
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
  stock: 9999             # 充足库存
  
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

## 示例

### 示例 1：RPG 游戏

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

### 示例 2：休闲游戏

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
| hammer | 锤子道具 | 50 | 消除单个 |
| bomb | 炸弹道具 | 100 | 消除3x3 |
| rainbow | 彩虹糖 | 200 | 消除同色 |
```

## 故障排除

### 配置验证失败

```typescript
const result = await generateSkill(config, { autoFix: true });
// 自动修复常见错误
```

### 生成代码有警告

```typescript
// 查看详细报告
console.log(ConfigValidator.generateReport(result.validation));
```

### 自定义生成路径

```typescript
const result = await generateSkill(config, {
  outputDir: './my-custom-path',
  generateTypes: false,  // 不需要类型文件
});
```

## 更新日志

### v1.0.0
- ✅ Markdown 配置解析
- ✅ YAML 配置解析
- ✅ 自动生成 TypeScript Skill 代码
- ✅ 配置验证和自动修复
- ✅ 支持钱包/商店/库存功能
- ✅ 生成类型定义文件

### 计划功能
- 🚧 可视化配置编辑器
- 🚧 在线代码生成器
- 🚧 更多游戏功能模板（排行榜、成就）
- 🚧 AI 配置推荐
