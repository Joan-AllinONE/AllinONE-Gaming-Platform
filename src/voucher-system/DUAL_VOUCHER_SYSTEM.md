# 双轨凭证系统 (Dual Voucher System)

## 概述

双轨凭证系统是 ALLINONE 平台的下一代凭证管理架构，支持两种并列但本质不同的凭证流程：

1. **即时发放型 (Instant Voucher)** - 适用于活动/游戏奖励
2. **计算分配型 (Algorithm Voucher)** - 适用于 A币日结/分红等基于贡献度的分配

## 核心概念

### 即时发放型凭证

**发放时机**: 事件触发即时发放  
**价值确定**: 创建时即确定  
**面值特性**: 固定面额（如 10, 50, 100）  
**价值来源**: 预存奖池/平台预算  
**使用场景**: 游戏奖励、活动、签到  

### 计算分配型凭证

**发放时机**: 结算周期后统一计算发放  
**价值确定**: 结算时根据算法动态计算  
**面值特性**: 极小单位（最小 0.0001），数量控制  
**价值来源**: 平台净收入的 40%（自动模式）或预设总量（固定模式）  
**使用场景**: A币日结、分红、收益分配

#### 发放池计算模式

**1. 自动计算模式（推荐）**
- 发放池 = 平台净收入 × 发放比例
- 适用于平台收入波动较大的场景
- 每期的发放金额根据实际收入动态调整

**2. 固定总量模式**
- 发放池 = 凭证总量 × 最小面值
- 适用于需要精确控制凭证数量和便于追溯的场景
- 总量 = 总价值 ÷ 最小面值
- 例如：总价值 100 ACOIN，最小面值 0.0001，则总量 = 1,000,000 个  

## 计算公式

### 个人贡献分数

```
个人贡献分数 = (个人游戏币 / 全网游戏币) × 0.5 + 
               (个人算力 / 全网算力) × 0.3 + 
               (个人交易额 / 全网交易额) × 0.2
```

### 个人A币奖励

```
用户A币奖励 = (个人贡献分数 / 全网总贡献分数) × 当期A币发放池
```

## 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    双轨凭证系统 (Dual Voucher System)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐  │
│  │     即时发放型凭证        │    │      计算分配型凭证           │  │
│  │   (Instant Voucher)      │    │    (Algorithm Voucher)       │  │
│  ├──────────────────────────┤    ├──────────────────────────────┤  │
│  │ • 活动奖励               │    │ • 基于贡献度计算             │  │
│  │ • 游戏奖励               │    │ • 每日/每周/每月结算         │  │
│  │ • 签到奖励               │    │ • 最小面值 0.0001            │  │
│  │ • 固定面值               │    │ • 数量控制价值               │  │
│  └──────────────────────────┘    └──────────────────────────────┘  │
│              │                                │                     │
│              └──────────────┬─────────────────┘                     │
│                             │                                       │
│              ┌──────────────▼─────────────────┐                     │
│              │      统一的凭证流转系统          │                     │
│              │   • 转账/交易/兑换/销毁         │                     │
│              └────────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 文件结构

```
src/voucher-system/
├── types/
│   ├── index.ts              # 基础凭证类型（已更新支持双轨）
│   ├── algorithm.ts          # 算法凭证类型定义（新增）
│   ├── pool.ts               # 用户奖池类型
│   └── platform.ts           # 平台集成类型
├── services/
│   ├── VoucherService.ts     # 即时发放型凭证服务（已更新）
│   ├── AlgorithmVoucherService.ts  # 算法凭证服务（新增）
│   ├── PlatformBindingService.ts
│   └── UserPoolService.ts
├── settlement/               # 结算系统（新增模块）
│   ├── SettlementScheduler.ts    # 结算调度器
│   └── PlatformDataCollector.ts  # 平台数据收集器
├── init.ts                   # 双轨系统初始化（新增）
└── index.ts                  # 统一导出（已更新）
```

## 使用方法

### 1. 初始化双轨凭证系统

```typescript
import { initializeDualVoucherSystem } from '@/voucher-system';

// 初始化
await initializeDualVoucherSystem({
  enableAlgorithmVouchers: true,
  enableAutoSettlement: true,
  dataCollectorConfig: {
    useMockData: false, // 生产环境设为 false
  },
});
```

### 2. 创建算法凭证模板

```typescript
import { algorithmVoucherService } from '@/voucher-system';

const template = algorithmVoucherService.createTemplate(
  {
    name: 'A币日结凭证',
    description: '基于每日贡献度的A币分配凭证',
    minDenomination: 0.0001,
    denominationUnit: 'ACOIN',
    settlementCycle: 'daily',
    settlementTime: '00:00',
    algorithm: {
      weights: {
        gameCoins: 0.5,
        computingPower: 0.3,
        transactionVolume: 0.2,
      },
    },
    poolConfig: {
      source: 'platform_net_income',
      ratio: 0.4, // 平台净收入的40%
    },
  },
  'admin_user_id',
  '管理员'
);
```

### 3. 手动触发结算

```typescript
// 触发特定模板的结算
await algorithmVoucherService.triggerSettlement(
  templateId,
  undefined, // 使用当前日期
  {
    autoIssue: true,
    minThreshold: 0.0001,
    sendNotification: true,
  },
  'admin_user_id'
);
```

### 4. 获取用户算法凭证

```typescript
// 获取用户的所有算法型凭证
const algorithmVouchers = algorithmVoucherService.getUserAlgorithmVouchers(userId);

// 获取统计信息
const stats = algorithmVoucherService.getUserAlgorithmVoucherStats(userId);
console.log(stats.totalCount);    // 凭证数量
console.log(stats.totalValue);    // 总价值
```

### 5. 预估用户收益

```typescript
const estimate = await algorithmVoucherService.estimateUserReward(
  userId,
  templateId
);

console.log(estimate.estimatedAmount);     // 预估金额
console.log(estimate.contributionScore);   // 贡献分数
console.log(estimate.rank);                // 排名
```

### 6. 获取贡献度排行榜

```typescript
const leaderboard = await algorithmVoucherService.getContributionLeaderboard(
  templateId,
  undefined, // 使用最新周期
  100        // 前100名
);
```

## 钱包整合

双轨凭证系统已与钱包系统深度整合：

```typescript
// 获取余额（自动包含两种凭证）
const balance = await walletService.getBalance();

console.log(balance.instantVouchers);      // 即时型凭证价值
console.log(balance.instantVoucherCount);  // 即时型凭证数量
console.log(balance.algorithmVouchers);    // 算法型凭证价值
console.log(balance.algorithmVoucherCount);// 算法型凭证数量
console.log(balance.vouchers);             // 总凭证价值（向后兼容）
```

## 结算流程

```
1. 创建凭证模板
   └── 设置最小面值、结算周期、算法权重

2. 自动/手动触发结算
   └── SettlementScheduler 自动调度
   └── 或 algorithmVoucherService.triggerSettlement() 手动触发

3. 数据收集
   └── PlatformDataCollector 收集全网数据
   └── 游戏币总量、算力总量、交易额、平台收入

4. 贡献度计算
   └── 计算每个用户的贡献分数
   └── 计算全网总贡献分数

5. 发放池计算
   └── 平台净收入 × 发放比例
   └── 加入上一期结转金额

6. 收益分配
   └── 按贡献比例计算每人应得
   └── 确定凭证数量（按最小面值取整）

7. 凭证发行
   └── 为每个用户生成微额凭证
   └── 记录结算快照

8. 交易流转
   └── 凭证进入流通
   └── 支持转让/兑换/销毁
```

## 数据结构

### Voucher（凭证）

```typescript
interface Voucher {
  id: string;
  serialNumber: string;
  denomination: number;
  currentHolderId: string;
  status: VoucherStatus;
  
  // 双轨系统核心字段
  sourceType: VoucherSourceType; // 'instant' | 'algorithm'
  algorithmInfo?: AlgorithmVoucherInfo; // 算法型凭证特有信息
  
  // ... 其他字段
}
```

### AlgorithmVoucherInfo（算法凭证信息）

```typescript
interface AlgorithmVoucherInfo {
  templateId: string;
  settlementCycleId: string;
  cycleNumber: number;
  settlementDate: string;
  
  contributionScore: number;    // 贡献分数
  contributionRatio: number;    // 贡献比例
  
  calculatedAmount: number;     // 计算金额
  actualAmount: number;         // 实际发放金额
  
  personalDataSnapshot: {
    gameCoins: number;
    computingPower: number;
    transactionVolume: number;
  };
}
```

## 事件监听

```typescript
import { eventBus } from '@/voucher-system';

// 监听结算完成事件
eventBus.subscribe('SETTLEMENT_COMPLETED', (event) => {
  console.log('结算完成:', event.templateName);
  console.log('周期:', event.cycleNumber);
  console.log('总发放:', event.totalDistributed);
});

// 监听模板创建事件
eventBus.subscribe('TEMPLATE_CREATED', (event) => {
  console.log('新模板创建:', event.templateName);
});
```

## 配置选项

### 数据收集器配置

```typescript
{
  useMockData: false,      // 是否使用模拟数据
  mockUserCount: 100,      // 模拟用户数量
  cacheDuration: 60000,    // 数据缓存时间（毫秒）
}
```

### 调度器配置

```typescript
{
  enabled: true,              // 是否启用自动调度
  checkInterval: 60000,       // 检查间隔（毫秒）
  allowManualTrigger: true,   // 是否允许手动触发
  preExecutionDelay: 5000,    // 执行前等待时间
}
```

### 结算选项

```typescript
{
  autoIssue: true,            // 是否自动发行凭证
  minThreshold: 0.0001,       // 最小发放阈值
  sendNotification: true,     // 是否发送通知
  detailedLogging: true,      // 是否记录详细日志
}
```

## 平台收入接入指南

### 问题一：凭证发放池是否自动计算？

**答**：是的，但需要接入平台实际收入数据。

系统通过 `DataCollector` 接口收集平台数据，默认实现返回模拟数据（0）。要使用真实数据，需要实现自定义数据收集器：

```typescript
import { algorithmVoucherService, type DataCollector } from './voucher-system';

// 自定义数据收集器
class MyDataCollector implements DataCollector {
  async collectTotalGameCoins(): Promise<number> {
    // 从游戏系统获取全网游戏币总量
    const response = await fetch('/api/game/total-coins');
    const data = await response.json();
    return data.total;
  }
  
  async collectTotalComputingPower(): Promise<number> {
    // 从算力系统获取全网算力
    const response = await fetch('/api/computing/total-power');
    const data = await response.json();
    return data.totalPower;
  }
  
  async collectTotalTransactionVolume(startDate: string, endDate: string): Promise<number> {
    // 从交易系统获取交易额
    const response = await fetch(`/api/transactions/volume?start=${startDate}&end=${endDate}`);
    const data = await response.json();
    return data.volume;
  }
  
  async collectPlatformNetIncome(startDate: string, endDate: string): Promise<number> {
    // ⚠️ 关键：从财务系统获取平台净收入
    // 这是发放池计算的基础数据
    const response = await fetch(`/api/finance/net-income?start=${startDate}&end=${endDate}`);
    const data = await response.json();
    return data.netIncome;  // 返回实际的平台净收入
  }
  
  async collectActiveUserCount(): Promise<number> {
    const response = await fetch('/api/users/active-count');
    const data = await response.json();
    return data.count;
  }
  
  async collectAllUserData(startDate: string, endDate: string): Promise<UserPersonalData[]> {
    // 获取所有用户的个人数据
    const response = await fetch(`/api/users/data?start=${startDate}&end=${endDate}`);
    return await response.json();
  }
}

// 初始化时注入自定义数据收集器
const myCollector = new MyDataCollector();
algorithmVoucherService.setDataCollector(myCollector);

// 或者通过 initialize 方法注入
await algorithmVoucherService.initialize(myCollector);
```

### 问题二：如何实现总量控制？

**答**：使用固定总量模式。

在创建算法凭证模板时，选择"固定总量模式"：

```typescript
// 创建固定总量的算法凭证模板
const template = algorithmVoucherService.createTemplate({
  name: 'A币分红凭证',
  description: '每日分红凭证，总量固定便于追溯',
  minDenomination: 0.0001,
  denominationUnit: 'ACOIN',
  settlementCycle: 'daily',
  settlementTime: '00:00',
  algorithm: {
    weights: {
      gameCoins: 0.5,
      computingPower: 0.3,
      transactionVolume: 0.2,
    },
  },
  poolConfig: {
    source: 'platform_net_income',
    ratio: 0.4,
    minDistributionAmount: 0.0001,
    carryOverEnabled: true,
    calculationMode: 'fixed',        // 使用固定总量模式
    fixedTotalSupply: 1000000,       // 凭证总量：100万个
  },
  // 总量配置（可选，用于显示和追溯）
  totalSupply: 1000000,              // 总量 = 总价值 / 最小面值
  totalValue: 100,                   // 总价值：100 ACOIN
}, 'admin', '管理员');
```

**总量计算公式**：
```
凭证总量 = 总价值 ÷ 最小面值

例如：
- 总价值：100 ACOIN
- 最小面值：0.0001 ACOIN
- 凭证总量 = 100 ÷ 0.0001 = 1,000,000 个
```

**两种模式对比**：

| 特性 | 自动计算模式 | 固定总量模式 |
|------|-------------|-------------|
| 发放池来源 | 平台净收入 × 比例 | 预设总量 × 面值 |
| 每期金额 | 根据收入波动 | 固定不变 |
| 凭证数量 | 动态计算 | 预先确定 |
| 追溯管理 | 较难 | 容易（每个凭证可编号）|
| 适用场景 | 收入波动大的平台 | 需要精确控制的场景 |

## 注意事项

1. **数据收集器**: 当前使用默认实现，生产环境需要接入真实的业务系统
2. **并发处理**: 结算过程中建议避免大量并发操作
3. **数据备份**: 结算快照会自动保存，可用于审计和查询
4. **向后兼容**: 原有即时发放型凭证系统完全不受影响

## 版本历史

- **v2.1.0** - 引入双轨凭证系统，支持算法分配型凭证
- **v2.0.0** - 原始凭证系统，支持即时发放型凭证
