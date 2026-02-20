# New Day × AllinONE 深度集成指南

**版本**: 2.0
**更新日期**: 2026-01-28
**集成状态**: ✅ 已完成

---

## 📋 目录

1. [集成概述](#集成概述)
2. [核心功能](#核心功能)
3. [使用指南](#使用指南)
4. [API 映射](#api-映射)
5. [测试方法](#测试方法)
6. [故障排除](#故障排除)

---

## 集成概述

### 已完成的功能

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| ✅ API 路径修复 | 完成 | `/api/allinone/*` 正确指向 New Day API |
| ✅ CORS 配置 | 完成 | New Day 已配置 CORS，支持浏览器直接调用 |
| ✅ 跨平台认证 | 完成 | AllinONE 用户可登录 New Day 获取 Token |
| ✅ 钱包同步 | 完成 | 自动同步 New Day 钱包余额到 AllinONE |
| ✅ 库存同步 | 完成 | 实时同步 New Day 库存道具 |
| ✅ 跨平台市场 | 完成 | AllinONE 可购买 New Day 市场道具 |
| ✅ 道具转移 | 完成 | 支持 AllinONE ↔ New Day 道具转移 |

---

## 核心功能

### 1. 钱包集成服务 (`newDayWalletIntegration.ts`)

**功能**:
- 获取 New Day 钱包余额
- 获取 AllinONE 本地钱包余额
- 合并显示跨平台钱包总额
- 支持 AllinONE ↔ New Day 货币转账

**货币映射**:
```typescript
New Day              →  AllinONE
───────────────────────────────────
gameCoins           →  gameCoins (1:1)
cash                 →  cash (1:1)
computingPower       →  computingPower (1:1)
newDayCoins          →  aCoins (1:1)
```

**使用示例**:
```typescript
import { newDayWalletIntegrationService } from '@/services/newDayWalletIntegration';

// 获取合并余额
const merged = await newDayWalletIntegrationService.getMergedBalance();
console.log('总余额:', merged.total);

// 从 New Day 转账到 AllinONE
await newDayWalletIntegrationService.transferFromNewDay({
  currencyType: 'gameCoins',
  amount: 100
});
```

---

### 2. 库存同步服务 (`newDayInventorySync.ts`)

**功能**:
- 从 New Day API 获取库存
- 获取 AllinONE 本地库存
- 合并并去重跨游戏库存
- 支持筛选（游戏来源、类型、稀有度、关键词）
- 自动同步（可配置间隔）

**使用示例**:
```typescript
import { newDayInventorySyncService } from '@/services/newDayInventorySync';

// 获取合并库存
const inventory = await newDayInventorySyncService.getMergedInventory();

// 筛选库存
const newDayItems = newDayInventorySyncService.filterInventory(inventory, {
  gameSource: 'newday',
  rarity: 'legendary'
});

// 启动自动同步（每 30 秒）
const stopSync = await newDayInventorySyncService.autoSync(30000);

// 停止自动同步
stopSync();
```

---

### 3. 跨平台市场集成

**修改文件**: `crossPlatformMarketService.ts`

**新增功能**:
- 请求 New Day 平台时，自动调用 New Day API
- 购买道具时优先使用 New Day API
- 降级机制：API 失败时使用本地数据

**使用示例**:
```typescript
import { crossPlatformMarketService } from '@/services/crossPlatformMarketService';

// 获取 New Day 市场道具
const result = await crossPlatformMarketService.getMarketItems({
  platform: 'newday',
  sortBy: 'price_asc',
  limit: 20
});

// 购买 New Day 道具
const purchase = await crossPlatformMarketService.purchaseItem({
  itemId: 'mk_xxx',
  currencyType: 'gameCoins',
  quantity: 1
});
```

---

### 4. 跨游戏库存组件

**修改文件**: `CrossGameInventory.tsx`

**新增功能**:
- 自动调用 New Day API 同步库存
- 实时显示 New Day 道具
- 支持游戏来源筛选
- 显示道具属性（攻击、防御、生命等）

**使用方法**:
```tsx
import CrossGameInventory from '@/components/CrossGameInventory';

<CrossGameInventory userId="user-001" />
```

---

## 使用指南

### 步骤 1: 启用集成

在应用入口处添加初始化组件:

```tsx
// src/App.tsx 或主入口文件
import NewDayIntegrationInit from '@/components/NewDayIntegrationInit';

function App() {
  return (
    <>
      {/* 初始化 New Day 集成 */}
      <NewDayIntegrationInit
        autoLogin={true}
        autoSyncInterval={30000} // 30 秒同步一次
      />

      {/* 你的应用内容 */}
      <MainApp />
    </>
  );
}
```

### 步骤 2: 访问测试页面

运行应用后,访问 `/newday-integration-test` 页面:

```bash
# 开发环境
npm run dev

# 访问
http://localhost:5173/newday-integration-test
```

### 步骤 3: 运行测试

点击"开始测试"按钮,等待所有测试完成。

---

## API 映射

### New Day API → AllinONE 服务

| New Day API | AllinONE 服务 | 说明 |
|-------------|---------------|------|
| `POST /auth/login` | `newDayApiService.getToken()` | 获取认证 Token |
| `GET /wallet/balance` | `newDayApiService.getBalance()` | 获取钱包余额 |
| `GET /inventory` | `newDayApiService.getInventory()` | 获取用户库存 |
| `GET /market/items` | `newDayApiService.getMarketItems()` | 获取市场列表 |
| `POST /market/list` | `newDayApiService.listItem()` | 上架道具 |
| `POST /market/purchase` | `newDayApiService.purchaseItem()` | 购买道具 |
| `POST /market/transfer` | `newDayApiService.transferItem()` | 转移道具 |

### 数据格式映射

**钱包余额**:
```typescript
// New Day API 返回格式
{
  "cash": 0,
  "gameCoins": 1000,
  "computingPower": 100,
  "newDayCoins": 100,
  "aCoins": 50
}

// AllinONE 内部格式
{
  "cash": 0,
  "gameCoins": 1000,
  "computingPower": 100,
  "aCoins": 150,  // 包含 newDayCoins
  "oCoins": 0
}
```

**库存道具**:
```typescript
// New Day API 返回格式
{
  "id": "uuid",
  "name": "道具名称",
  "description": "道具描述",
  "type": "weapon",
  "rarity": "legendary",
  "stats": {
    "attack": 150,
    "defense": 20,
    "health": 100
  },
  "obtainedAt": 1234567890,
  "quantity": 1
}

// AllinONE 内部格式
{
  id: "uuid",
  name: "道具名称",
  description: "道具描述",
  gameSource: "newday",
  gameName: "New Day",
  category: "weapon",
  rarity: "legendary",
  stats: { ... },
  uses: 1,
  maxUses: 1,
  obtainedAt: Date
}
```

---

## 测试方法

### 方法 1: 自动化测试页面

**位置**: `src/pages/NewDayIntegrationTest.tsx`

**测试内容**:
1. ✅ New Day API 连接
2. ✅ New Day 登录认证
3. ✅ 获取 New Day 钱包余额
4. ✅ 获取 New Day 库存
5. ✅ 获取 New Day 市场列表
6. ✅ 购买 New Day 市场道具
7. ✅ 上架道具到 New Day 市场
8. ✅ 同步钱包到 AllinONE
9. ✅ 同步库存到 AllinONE
10. ✅ 合并跨游戏库存

**运行方式**:
```bash
# 启动开发服务器
npm run dev

# 访问测试页面
http://localhost:5173/newday-integration-test
```

### 方法 2: 手动测试

**测试钱包同步**:
```typescript
import { newDayWalletIntegrationService } from '@/services/newDayWalletIntegration';

const balance = await newDayWalletIntegrationService.getNewDayBalance();
console.log('New Day 余额:', balance);
```

**测试库存同步**:
```typescript
import { newDayInventorySyncService } from '@/services/newDayInventorySync';

const inventory = await newDayInventorySyncService.getMergedInventory();
console.log('合并库存:', inventory.length, '个道具');
```

**测试市场集成**:
```typescript
import { crossPlatformMarketService } from '@/services/crossPlatformMarketService';

const market = await crossPlatformMarketService.getMarketItems({
  platform: 'newday'
});
console.log('New Day 市场:', market.total, '个道具');
```

### 方法 3: API 命令行测试

使用之前创建的测试脚本:

```bash
# 运行自动测试
test-newday-api-auto.bat

# 或使用 PowerShell
powershell -ExecutionPolicy Bypass -File diagnose-newday-api.ps1
```

---

## 故障排除

### 问题 1: CORS 错误

**错误信息**:
```
Access to fetch has been blocked by CORS policy
```

**解决方案**:
✅ 已解决 - New Day 团队已配置 CORS

---

### 问题 2: Token 获取失败

**错误信息**:
```
无法获取 New Day Token
```

**可能原因**:
- AllinONE 用户未登录
- New Day API 服务异常

**解决方案**:
1. 确认 AllinONE 用户已登录
2. 检查控制台日志
3. 使用命令行测试 New Day API 是否正常

---

### 问题 3: 库存同步失败

**错误信息**:
```
❌ 从 New Day 获取库存失败
```

**可能原因**:
- 网络连接问题
- New Day API 响应超时

**解决方案**:
1. 检查网络连接
2. 增加重试机制
3. 延长超时时间

---

### 问题 4: 购买失败

**错误信息**:
```
❌ 购买 New Day 市场道具失败
```

**可能原因**:
- 余额不足
- 道具已售出
- New Day 钱包数据未更新

**解决方案**:
1. 检查钱包余额是否充足
2. 刷新库存数据
3. 重新尝试购买

---

## 集成文件清单

### 新增文件

```
src/
├── services/
│   ├── newDayWalletIntegration.ts      ✅ 钱包集成服务
│   ├── newDayInventorySync.ts           ✅ 库存同步服务
│   └── newDayApiService.ts             ✅ New Day API 服务（已存在，已修改）
└── components/
    ├── NewDayIntegrationInit.tsx       ✅ 集成初始化组件
    ├── CrossGameInventory.tsx            ✅ 跨游戏库存组件（已修改）
    └── NewDayIntegrationTest.tsx       ✅ 集成测试页面
```

### 修改文件

```
src/
├── services/
│   ├── newDayService.ts                 ✅ 添加 API 同步方法
│   └── crossPlatformMarketService.ts      ✅ 集成 New Day API
```

---

## 下一步

### 可选优化

1. **性能优化**
   - 添加请求缓存
   - 实现批量 API 调用
   - 优化自动同步策略

2. **错误处理**
   - 添加统一错误处理
   - 实现离线模式
   - 添加重试机制

3. **用户体验**
   - 添加加载动画
   - 实现实时数据更新
   - 添加通知提醒

4. **安全加固**
   - 添加请求签名
   - 实现 Token 自动刷新
   - 添加数据加密

---

## 联系与支持

如有集成问题,请联系:

**集成负责人**: AllinONE 开发团队
**New Day 团队**: 见 New Day 官方文档
**文档位置**:
- `ALLINONE_INTEGRATION.md`
- `ALLINONE_API.md`
- `ALLINONE_INTEGRATION_DOCUMENTATION.md`
- `NEW_DAY_INTEGRATION_GUIDE.md` (本文档)

---

**文档版本**: 2.0
**最后更新**: 2026-01-28
**集成状态**: ✅ 生产就绪
