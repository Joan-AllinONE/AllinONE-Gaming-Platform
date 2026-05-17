# 凭证系统与游戏平台集成指南

## 集成目标
将凭证规则引擎接入真实游戏环境，玩家完成游戏后自动获得凭证奖励。

## 重要更新：A币系统已迁移至凭证系统

> **原 A币系统（`aCoinService.ts`、`ACoinData.tsx` 等）已于 2026年5月 正式废弃。**
> 所有 A币功能已由凭证系统的**计算分配型凭证（Algorithm Voucher）** 替代。

### 迁移要点

| 原A币概念 | 凭证系统对应 |
|---|---|
| A币日结（三步计算模型） | 算法模板 `settlementCycle='daily'` + 贡献度算法 |
| 50%/30%/20% 权重 | `ContributionAlgorithm.weights` 可配置 |
| 平台净收入 40% 发放池 | `DistributionPoolConfig.ratio = 0.4` |
| 10亿总量 | `AlgorithmVoucherTemplate.totalSupply` |
| 手动结算 / 自动结算 | `settlementScheduler` + 手动 `triggerSettlement()` |
| `walletService.distributeACoins()` | `platformBindingService.distributeSimpleReward()` |
| A币钱包余额 | `voucherService.getUserVouchers().filter(active)` |

### 测试模板
已创建 **TestAcoin** 算法模板（总量 500，固定发放），用于验证凭证系统的核心流程。
详见 `TEST_ACOIN_GUIDE.md`。

---

## 集成方式

### 方式一：PlatformBindingService（推荐，已有预制绑定）

```typescript
import { platformBindingService } from '@/voucher-system';

// 在游戏完成时调用
const result = await platformBindingService.distributeSimpleReward(
  bindingId,
  userId,
  userName,
  {
    event: 'GAME_COMPLETE',
    gameId: 'match3',
    score: player.score,
    duration: playTime,
  }
);

if (result.success) {
  showRewardToast(`获得 ${result.record.amount} 凭证奖励！`);
  loadVoucherBalance(); // 刷新凭证余额
}
```

### 方式二：事件监听
在游戏完成逻辑中触发事件，规则引擎自动处理。

```typescript
// 在游戏完成时调用
import { voucherRuleEngine, VoucherEventType } from '@/voucher-system';

// 通过事件总线（自动匹配规则）
voucherRuleEngine.triggerEvent(VoucherEventType.GAME_COMPLETE, {
  userId: player.id,
  userName: player.name,
  timestamp: Date.now(),
  data: {
    gameId: game.id,
    gameName: game.name,
    score: player.score,
    difficulty: game.difficulty,
    baseReward: 100,
    bonusMultiplier: player.rank > 3 ? 2 : 1,
    level: player.level,
    duration: playTime,
  }
});
```

### 方式三：直接调用引擎（精确控制）
适用于需要自定义逻辑的场景。

```typescript
import { voucherRuleEngine } from '@/voucher-system';

const result = await voucherRuleEngine.executeDistributionRule(
  customRule,
  {
    userId: player.id,
    userName: player.name,
    eventType: 'game_complete',
    eventData: { score: 1500, difficulty: 'hard' },
    timestamp: Date.now(),
  }
);

if (result.success) {
  showRewardNotification(player, result.amount);
}
```

## 集成步骤

### 1. 在游戏中心页面初始化引擎
```typescript
// GameCenter.tsx 或 App.tsx
import { voucherRuleEngine } from '@/voucher-system';

useEffect(() => {
  const engine = voucherRuleEngine;
  console.log('[GameCenter] 凭证规则引擎已就绪');
}, []);
```

### 2. 在游戏完成回调中触发事件
```typescript
const handleGameComplete = async (gameResult: GameResult) => {
  // 1. 保存游戏记录（原有逻辑）
  await saveGameRecord(gameResult);
  
  // 2. 触发凭证奖励事件（使用 PlatformBindingService）
  const bindings = platformBindingService.getActiveBindingsForGame(gameResult.gameId);
  for (const binding of bindings) {
    await platformBindingService.distributeSimpleReward(
      binding.id,
      currentUser.userId,
      currentUser.username,
      { event: 'GAME_COMPLETE', gameId: gameResult.gameId, score: gameResult.score }
    );
  }
  
  // 3. 刷新凭证余额
  loadVoucherBalance();
};
```

### 3. 添加奖励通知
```typescript
useEffect(() => {
  const unsubscribe = EventBus.getInstance().on(
    VoucherEventType.VOUCHER_RECEIVED, 
    (payload) => {
      toast.success(`获得 ${payload.data.amount} 凭证奖励！`);
    }
  );
  return unsubscribe;
}, []);
```

## 数据字段说明

| 字段 | 类型 | 说明 | 用途 |
|------|------|------|------|
| gameId | string | 游戏唯一标识 | 记录来源 |
| gameName | string | 游戏名称 | 显示用 |
| score | number | 玩家得分 | 公式计算 |
| difficulty | string | 难度等级 | 公式计算 |
| baseReward | number | 基础奖励值 | 公式计算 |
| bonusMultiplier | number | 奖励倍数 | 公式计算 |
| level | number | 玩家等级 | 公式计算 |
| duration | number | 游戏时长(秒) | 公式计算 |

## 公式示例

模板中使用的公式：`baseReward * difficulty * 0.01 * bonusMultiplier`

- easy (1): 100 * 1 * 0.01 * 1 = 1
- normal (2): 100 * 2 * 0.01 * 1 = 2  
- hard (3): 100 * 3 * 0.01 * 1.5 = 4.5 → 取整 4
- expert (4): 100 * 4 * 0.01 * 2 = 8

## 奖池管理

在真实环境中，需要确保持有平台奖池凭证：

```typescript
const ensurePoolBalance = () => {
  const systemVouchers = voucherService.getUserVouchers('SYSTEM');
  const totalPool = systemVouchers.reduce((sum, v) => sum + v.denomination, 0);
  
  if (totalPool < MIN_POOL_BALANCE) {
    console.warn('奖池余额不足，请及时补充');
  }
};
```

## 注意事项

1. **异步执行**：规则引擎是异步执行的，触发事件后不会立即获得凭证
2. **错误处理**：如果奖池不足，引擎会记录错误但不会中断游戏流程
3. **重复触发**：同一事件可能匹配多个规则（如基础奖励+首通奖励）
4. **性能考虑**：事件处理是轻量的，不会影响游戏性能
5. **不再使用 walletService.distributeACoins**：所有新开发请使用 `platformBindingService.distributeSimpleReward()`
