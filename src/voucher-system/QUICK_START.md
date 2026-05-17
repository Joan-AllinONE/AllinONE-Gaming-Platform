# 双轨凭证系统快速开始指南

## 1. 系统初始化

在应用启动时初始化双轨凭证系统：

```typescript
// src/main.tsx 或应用入口文件
import { initializeDualVoucherSystem } from '@/voucher-system';

async function initApp() {
  // 初始化双轨凭证系统
  const result = await initializeDualVoucherSystem({
    enableAlgorithmVouchers: true,
    enableAutoSettlement: true,
  });
  
  if (result.success) {
    console.log('双轨凭证系统初始化成功');
  } else {
    console.error('初始化失败:', result.message);
  }
}

initApp();
```

## 2. 在钱包页面显示双轨凭证

```tsx
// 在个人中心/钱包页面使用
import { useEffect, useState } from 'react';
import { walletService } from '@/services/walletService';
import type { WalletBalance } from '@/types/wallet';

function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const data = await walletService.getBalance();
    setBalance(data);
  };

  if (!balance) return <div>加载中...</div>;

  return (
    <div className="wallet-page">
      {/* 原有资产显示 */}
      <div className="asset-section">
        <h3>💰 我的资产</h3>
        <div>现金: ¥{balance.cash}</div>
        <div>游戏币: {balance.gameCoins}</div>
        <div>算力: {balance.computingPower}</div>
        <div>A币: {balance.aCoins}</div>
      </div>

      {/* 双轨凭证显示 */}
      <div className="voucher-section">
        <h3>🎫 凭证资产</h3>
        
        {/* 即时发放型凭证 */}
        <div className="voucher-card">
          <h4>即时发放型</h4>
          <div>价值: {balance.instantVouchers}</div>
          <div>数量: {balance.instantVoucherCount} 张</div>
          <small>来源: 游戏奖励、活动奖励</small>
        </div>

        {/* 计算分配型凭证 */}
        <div className="voucher-card">
          <h4>计算分配型 (A币日结)</h4>
          <div>价值: {balance.algorithmVouchers}</div>
          <div>数量: {balance.algorithmVoucherCount} 张</div>
          <small>来源: A币日结、分红</small>
        </div>
      </div>
    </div>
  );
}
```

## 3. 管理后台使用

```tsx
// 管理员后台页面
import { AlgorithmVoucherManager } from '@/voucher-system';

function AdminPage() {
  return (
    <div className="admin-page">
      <h1>凭证系统管理</h1>
      
      {/* 算法凭证管理 */}
      <AlgorithmVoucherManager 
        userId="admin_001"
        userName="管理员"
        isAdmin={true}
      />
    </div>
  );
}
```

## 4. 查看预估收益

```tsx
// 用户查看预估收益
import { algorithmVoucherService } from '@/voucher-system';

function EstimatedRewards() {
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    loadEstimate();
  }, []);

  const loadEstimate = async () => {
    // 假设默认模板ID为第一个模板
    const templates = algorithmVoucherService.getTemplates();
    if (templates.length > 0) {
      const data = await algorithmVoucherService.estimateUserReward(
        'current_user_id',
        templates[0].id
      );
      setEstimate(data);
    }
  };

  if (!estimate) return null;

  return (
    <div className="estimate-card">
      <h4>📊 本期预估收益</h4>
      <div>预估金额: {estimate.estimatedAmount.toFixed(4)} A币</div>
      <div>贡献分数: {estimate.contributionScore.toFixed(4)}</div>
      <div>全网排名: 第 {estimate.rank} 名</div>
      <div>超过 {100 - estimate.percentile}% 的用户</div>
    </div>
  );
}
```

## 5. 用户结算历史

```tsx
// 查看用户结算历史
import { algorithmVoucherService } from '@/voucher-system';

function SettlementHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const data = algorithmVoucherService.getUserSettlementHistory('user_id');
    setHistory(data);
  }, []);

  return (
    <div className="history-list">
      <h4>📜 结算历史</h4>
      {history.map((record, index) => (
        <div key={index} className="history-item">
          <div>获得: {record.actualTotalValue.toFixed(4)} A币</div>
          <div>凭证: {record.actualVoucherCount} 张</div>
          <div>贡献度: {(record.contributionRatio * 100).toFixed(2)}%</div>
          <div>时间: {new Date(record.issuedAt).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}
```

## 6. 事件监听

```tsx
// 监听结算事件
import { useEffect } from 'react';
import { eventBus } from '@/voucher-system';

function useSettlementEvents() {
  useEffect(() => {
    // 监听结算完成
    const unsubscribe = eventBus.subscribe('SETTLEMENT_COMPLETED', (event) => {
      console.log('结算完成:', event.templateName);
      
      // 可以在这里发送用户通知
      notification.success({
        message: 'A币结算完成',
        description: `${event.templateName} 已发放 ${event.totalDistributed} A币`,
      });
    });

    return () => unsubscribe();
  }, []);
}
```

## 7. 开发测试

在开发环境中使用模拟数据：

```typescript
import { initializeDualVoucherSystem } from '@/voucher-system';

await initializeDualVoucherSystem({
  enableAlgorithmVouchers: true,
  enableAutoSettlement: false, // 开发环境关闭自动结算
  dataCollectorConfig: {
    useMockData: true,        // 使用模拟数据
    mockUserCount: 50,        // 50个模拟用户
  },
});

// 手动触发结算测试
const templates = algorithmVoucherService.getTemplates();
if (templates.length > 0) {
  await algorithmVoucherService.triggerSettlement(
    templates[0].id,
    undefined,
    {
      autoIssue: true,
      minThreshold: 0.0001,
      sendNotification: false,
    },
    'test_user'
  );
}
```

## 8. 常见问题

### Q: 如何迁移旧A币数据到凭证系统？

A: 数据会自动迁移，无需手动操作。首次初始化时会检查并升级数据格式。

### Q: 结算失败了怎么办？

A: 检查结算周期详情中的错误信息，修复问题后可以重新触发结算。

### Q: 如何调整贡献度权重？

A: 在管理后台编辑模板，调整游戏币、算力、交易额的权重比例。

### Q: 可以暂停自动结算吗？

A: 可以，停用模板或停止调度器：
```typescript
import { settlementScheduler } from '@/voucher-system';
settlementScheduler.stop();
```

## 9. 关键配置

### 默认模板配置
- **最小面值**: 0.0001 A币
- **结算周期**: 每日 00:00
- **发放比例**: 平台净收入的 40%
- **权重**: 游戏币 50% / 算力 30% / 交易额 20%

### 系统限制
- 单次结算最大用户数: 无限制（分批处理）
- 凭证总量上限: 10亿张
- 数据缓存时间: 1分钟

## 10. 支持

如有问题，请参考：
- [双轨凭证系统详细文档](./DUAL_VOUCHER_SYSTEM.md)
- [API 类型定义](./types/algorithm.ts)
- [服务实现](./services/AlgorithmVoucherService.ts)
