# 凭证系统平台集成指南

## 概述

本文档介绍如何将 A币凭证系统与 AllinONE 游戏平台集成，实现自动化的游戏奖励分发。

## 核心功能

### 1. 三阶段工作流

凭证系统现在包含三个主要 Tab：

1. **凭证管理** - 创建、编辑、查看凭证
2. **规则测试** - 模拟事件触发，验证规则正确性
3. **应用到平台** 🆕 - 将规则绑定到具体游戏，启用生产分发

### 2. 三种游戏类型支持

| 类型 | 示例 | 触发方式 |
|------|------|----------|
| 平台自有游戏 | 消消乐、贪吃蛇 | 游戏完成时自动触发 |
| 外部链接游戏 | New Day、火柴人保卫战 | 点击"游玩"按钮时立即触发 |
| 发布游戏（iframe） | ming 等 | 通过 postMessage 接收游戏内事件 |

### 3. 商店货币打通

GameStore 现在支持两种支付方式：
- **钱包支付** - 使用传统的 wallet Skill 余额
- **凭证支付** - 使用 A币凭证直接支付，支持自动找零

## 快速开始

### 步骤 1：创建凭证规则

1. 进入 **凭证管理** Tab
2. 点击"创建凭证"
3. 配置分发规则：
   - 选择规则类型（如：游戏奖励）
   - 设置分配逻辑（固定金额、分档奖励等）
   - 配置限制条件（冷却时间、每日上限等）

### 步骤 2：测试规则

1. 进入 **规则测试** Tab
2. 选择刚才创建的规则
3. 模拟游戏完成事件
4. 验证奖励是否正确计算和发放

### 步骤 3：应用到平台

1. 进入 **应用到平台** Tab
2. 点击"新建绑定"
3. 按步骤配置：
   - **选择游戏** - 从列表中选择要绑定的游戏
   - **选择规则** - 选择已测试的规则
   - **触发方式** - 根据游戏类型自动推荐
   - **限制条件** - 设置冷却时间和上限
4. 启用绑定

## 游戏类型详细说明

### 类型 1：平台自有游戏

**特点**：
- 代码在平台内部（如消消乐）
- 可直接调用 API 触发奖励

**触发时机**：
- 游戏通关/完成
- 达成特定成就
- 每日首次完成

**实现方式**：
游戏组件内直接调用：
```typescript
import { platformBindingService, GameType } from '@/voucher-system';

// 游戏完成时
await platformBindingService.distributeSimpleReward(
  bindingId,
  userId,
  userName,
  {
    score: 1000,
    difficulty: 'hard',
    level: 5,
  }
);
```

### 类型 2：外部链接游戏

**特点**：
- 第三方托管，通过 URL 跳转访问
- 无法验证游戏内行为

**触发时机**：
- 玩家点击"开始游戏"按钮时

**实现方式**：
平台已自动实现，无需额外代码：
```typescript
// GameCenter.tsx 中已集成
const handleExternalGameClick = async (game) => {
  // 1. 先触发奖励
  await triggerGameReward(game.id, game.name, GameType.EXTERNAL);
  
  // 2. 然后跳转
  window.open(game.externalUrl, '_blank');
};
```

**建议配置**：
- 冷却时间：1440 分钟（24小时）
- 防止玩家频繁点击刷奖励

### 类型 3：发布的游戏（iframe）

**特点**：
- 嵌入 iframe 中运行
- 可通过 postMessage 双向通信
- 有独立的 Skill 系统

**触发时机**：
- 游戏内事件（通关、成就解锁等）

**游戏端集成**：
游戏开发者需要在游戏中添加以下代码：

```javascript
// 游戏通关时
parent.postMessage({
  type: 'GAME_COMPLETE',
  data: {
    score: 1500,
    level: 10,
    difficulty: 'normal'
  }
}, '*');

// 成就解锁时
parent.postMessage({
  type: 'ACHIEVEMENT_UNLOCK',
  data: {
    achievementId: 'first_win',
    achievementName: '首胜'
  }
}, '*');
```

**支持的消息类型**：
- `GAME_COMPLETE` - 游戏完成
- `GAME_WIN` - 游戏胜利
- `LEVEL_COMPLETE` - 关卡完成
- `ACHIEVEMENT_UNLOCK` - 成就解锁
- `SCORE_MILESTONE` - 分数里程碑

## 商店货币打通

### 玩家视角

1. 玩家通过游戏获得 A币凭证
2. 进入游戏商店
3. 选择商品，选择支付方式：
   - **钱包** - 使用传统 A币余额
   - **凭证** - 使用 A币凭证（如可用会显示"可用"标签）
4. 使用凭证支付时：
   - 自动选择面额最接近的凭证
   - 如有需要，组合多个小额凭证
   - 如有找零，自动创建新凭证返还

### 开发者视角

商品配置示例：
```typescript
const product = {
  id: 'item_001',
  name: '生命药水',
  price: 10,
  currency: 'gameCoins',
  // 允许凭证支付
  acceptVoucher: true,
  // 可选：设置凭证支付价格（默认与 price 相同）
  voucherPrice: 10,
};
```

## API 参考

### PlatformBindingService

```typescript
// 获取单例
const service = PlatformBindingService.getInstance();

// 创建绑定
service.createBinding(request, operatorId, operatorName);

// 获取游戏的绑定
service.getActiveBindingsForGame(gameId, triggerMode);

// 发放奖励
service.distributeSimpleReward(bindingId, userId, userName, triggerData);

// 检查用户是否可以领取
service.canUserReceiveReward(userId, bindingId);
```

### 类型定义

```typescript
enum GameType {
  NATIVE = 'native',       // 平台自有游戏
  EXTERNAL = 'external',   // 外部链接游戏
  PUBLISHED = 'published', // iframe 游戏
}

enum TriggerMode {
  ON_GAME_COMPLETE = 'on_game_complete',   // 游戏完成时
  ON_CLICK = 'on_click',                    // 点击时
  ON_ACHIEVEMENT = 'on_achievement',        // 成就解锁时
  MANUAL = 'manual',                        // 手动触发
}

interface PlatformBindingConfig {
  id: string;
  gameId: string;
  gameName: string;
  gameType: GameType;
  ruleId: string;
  triggerMode: TriggerMode;
  limits: {
    cooldownMinutes: number;
    maxDaily: number;
    maxPerUser: number;
  };
  enabled: boolean;
}
```

## 最佳实践

### 1. 规则设计

- **小额多次**：比大额少次更能激励玩家
- **冷却时间**：防止刷奖励，建议 24 小时
- **分档奖励**：根据游戏表现（分数、难度）给予不同奖励

### 2. 奖池管理

- 预留足够的凭证在 SYSTEM 账户作为奖池
- 使用"从奖池转移"模式可以更好地控制总量
- 定期监控奖池余额

### 3. 游戏集成

- 自有游戏：在关键节点（通关、成就）触发奖励
- 外部游戏：点击即发奖，但设置较长冷却
- iframe 游戏：使用 postMessage 实现精确触发

### 4. 商店定价

- 凭证支付适合大额商品
- 钱包支付适合小额频繁交易
- 可以给凭证支付设置折扣，鼓励使用凭证

## 故障排查

### 奖励未发放

1. 检查绑定配置是否启用
2. 检查用户是否满足限制条件（冷却、上限）
3. 检查奖池是否有足够凭证
4. 查看浏览器控制台日志

### 凭证支付失败

1. 检查用户是否有足够的凭证余额
2. 检查凭证状态是否为 active
3. 确认商品设置了 `acceptVoucher: true`

### iframe 游戏无响应

1. 检查 postMessage 的目标 origin
2. 确认消息格式正确（必须包含 type 和 data）
3. 检查浏览器跨域限制

## 更新日志

### v2.0.0
- ✅ 新增"应用到平台" Tab
- ✅ 支持三种游戏类型
- ✅ 商店支持凭证支付
- ✅ iframe 游戏 postMessage 集成
- ✅ 自动找零功能
