# AllinONE AI驱动发布中心

为独立游戏开发者提供一键发布游戏的智能化平台。

## 核心特性

- **AI智能分析**: 自动检测游戏框架、技术栈和功能特征
- **智能Skill推荐**: 基于代码分析推荐最合适的平台Skills
- **一键发布**: 四步完成游戏发布（上传→分析→配置→发布）
- **标准游戏体系**: 遵循标准的游戏享受极速发布和费用减免

## 快速开始

### 开发者使用CLI工具

```bash
# 安装CLI
npm install -g @allinone/cli

# 创建新项目
allinone create my-game --template=phaser

# 进入项目
cd my-game

# 开发
allinone dev

# 构建
allinone build

# 发布
allinone publish
```

### 在平台使用可视化发布中心

```tsx
import { PublishingCenter } from '@/publishing-center';

function PublishPage() {
  return (
    <PublishingCenter 
      onPublishComplete={(result) => {
        if (result.success) {
          console.log('发布成功:', result.url);
        }
      }}
    />
  );
}
```

### 在游戏中使用标准SDK

```typescript
import { AllinONEGame } from '@allinone/standard-sdk';

// 初始化游戏
const game = new AllinONEGame({
  gameId: 'my-awesome-game',
  skills: {
    auth: true,
    wallet: true,
    inventory: true,
    store: true,
    achievements: true,
    cloudSave: true,
  },
});

// 监听事件
game.on('init', async () => {
  console.log('游戏已初始化');
});

game.on('save', async () => {
  // 自动云存档
});

// 启动游戏
await game.start();

// 发放奖励
await game.wallet.reward({
  computingPower: 100,
  gameCoins: 500,
  reason: '任务完成奖励',
});

// 解锁成就
await game.achievements?.unlock('first_win');
```

## 项目结构

```
src/publishing-center/
├── ai/                      # AI引擎
│   ├── GameCodeAnalyzer.ts  # 代码分析器
│   └── SkillRecommender.ts  # Skill推荐引擎（含配置生成）
├── core/                    # 核心模块
│   ├── PublishingPipeline.ts # 发布流水线
│   └── SkillInitializer.ts  # Skill初始化 & 配置注入
├── validator/               # 验证器
│   └── StandardGameValidator.ts
├── ui/                      # UI组件
│   └── PublishingCenter.tsx # 发布中心组件
├── standard-sdk/            # 标准SDK
│   ├── index.ts            # SDK主入口
│   ├── apis/               # API实现
│   │   ├── AuthAPI.ts
│   │   ├── WalletAPI.ts
│   │   ├── InventoryAPI.ts
│   │   ├── StoreAPI.ts
│   │   ├── LeaderboardAPI.ts
│   │   ├── AchievementAPI.ts
│   │   ├── CloudSaveAPI.ts
│   │   └── AnalyticsAPI.ts
│   └── types/              # 类型定义
├── cli/                     # CLI工具
│   └── index.ts
├── templates/               # 项目模板
│   └── allinone.config.schema.json
├── types/                   # 核心类型
│   └── index.ts
└── index.ts                 # 统一导出
```

> **架构说明**: 原方案中的 `ConfigGenerator.ts` 和 `AutoIntegration.ts` 已合并到 `SkillInitializer.ts` 中，通过 `generateGameConfigFile()` 和 `injectConfigToGamePackage()` 方法实现配置生成和注入功能。这种设计避免了过多的小文件，将相关功能内聚在同一个模块中。

## 标准游戏 vs 通用游戏

| 特性 | 标准游戏 | 通用游戏 |
|------|----------|----------|
| **发布速度** | 30秒 | 5-10分钟 |
| **发布费用** | ¥49 (-50%) | ¥99 |
| **审核方式** | 自动通过 | 自动+人工审核 |
| **首页推荐** | 有 | 无 |
| **数据分析** | 完整 | 基础 |

### 标准游戏要求

1. **目录结构**
   - `src/` - 源代码目录
   - `public/` 或 `assets/` - 资源目录
   - `allinone.config.json` - 配置文件

2. **代码规范**
   - 使用 `@allinone/standard-sdk`
   - TypeScript 推荐
   - 代码质量分数 ≥60

3. **配置文件** (`allinone.config.json`)
   ```json
   {
     "game": {
       "id": "my-game",
       "name": "My Game",
       "version": "1.0.0"
     },
     "platform": {
       "type": "standard",
       "entryPoint": "src/main.ts"
     },
     "skills": {
       "auth": true,
       "wallet": true
     }
   }
   ```

## API参考

### GameCodeAnalyzer

```typescript
import { GameCodeAnalyzer } from '@/publishing-center';

const analyzer = new GameCodeAnalyzer();
const result = await analyzer.analyze(files);

console.log(result.framework.framework);  // 检测到的框架
console.log(result.framework.confidence); // 置信度 (0-100)
console.log(result.features);             // 检测到的功能
```

### SkillRecommender

```typescript
import { SkillRecommender } from '@/publishing-center';

const recommender = new SkillRecommender();
const result = recommender.recommend(analysis);

result.recommendations.forEach(rec => {
  console.log(`${rec.skillName}: ${rec.confidence}%`);
  console.log(`原因: ${rec.reason}`);
});
```

### PublishingPipeline

```typescript
import { PublishingPipeline } from '@/publishing-center';

const pipeline = new PublishingPipeline({
  onProgress: (progress, message) => {
    console.log(`${progress}%: ${message}`);
  },
  onComplete: (result) => {
    console.log('发布成功:', result.url);
  },
});

await pipeline.publish(config);
```

### SkillInitializer（含配置生成与注入）

```typescript
import { 
  SkillInitializer, 
  setupGameConfig,
  validateGameConfig 
} from '@/publishing-center';

// 方式1: 使用统一的 setupGameConfig（推荐）
// 一键完成 Skill 初始化 + 配置生成 + 配置注入
const { 
  initializationResult, 
  configFile, 
  injectionResult 
} = await setupGameConfig(
  'my-game',           // gameId
  'My Awesome Game',   // gameName
  'universal',         // gameType
  'phaser',            // framework
  'index.html',        // entryPoint
  uploadedFiles,       // 游戏文件
  recommendations,     // Skill 推荐结果
  customConfigs        // 可选：自定义配置
);

console.log('配置注入状态:', injectionResult.injected);
console.log('修改的文件:', injectionResult.modifiedFiles);

// 方式2: 分步使用（更灵活）
const initializer = new SkillInitializer('my-game');
const result = await initializer.initializeSkills(recommendations);

// 验证游戏包是否包含配置
const validation = validateGameConfig(files);
console.log('是否有配置文件:', validation.hasConfig);
console.log('是否有内联配置:', validation.hasInlineConfig);
```

## 支持的游戏框架

- HTML5 / Vanilla JavaScript
- TypeScript
- Phaser 3
- PixiJS
- Three.js
- Babylon.js
- Cocos Creator
- Unity WebGL
- Godot
- Construct 3
- RPG Maker
- React
- Vue

## License

MIT License
