# AllinONE 库存数据流说明

## 架构概述

```
┌─────────────────────────────────────────────────────────────────┐
│                         数据源（以数据源为准）                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐          ┌─────────────────┐                   │
│  │  New Day    │          │   AllinONE      │                   │
│  │  游戏服务器  │          │   后端数据库     │                   │
│  └──────┬──────┘          └────────┬────────┘                   │
│         │                          │                            │
│         │ 实时 API 获取             │ API 查询                    │
│         ▼                          ▼                            │
│  ┌─────────────────────────────────────────────────┐           │
│  │           AllinONE 前端（合并展示）               │           │
│  │  - New Day 道具：实时显示，不存储到 AllinONE     │           │
│  │  - AllinONE 道具：从数据库存储读取               │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 数据流详细说明

### 1. New Day 道具

**数据来源**: New Day 游戏服务器 (https://yxp6y2qgnh.coze.site)

**获取方式**: 实时 API 调用
- API 端点: `GET /api/allinone/inventory`
- 调用时机: 
  - 页面加载时
  - 用户手动刷新时
  - 定时同步（每 30 秒）

**数据特点**:
- ✅ **以 New Day 数据为准** - AllinONE 只读取，不修改 New Day 数据
- ✅ **实时同步** - 每次显示都获取最新数据
- ❌ **不存储到 AllinONE 数据库** - 避免数据不一致

**使用场景**:
- 在个人中心显示用户拥有的 New Day 道具
- 上架到 AllinONE 交易市场时，调用 New Day API 扣除道具

### 2. AllinONE 道具

**数据来源**: AllinONE 后端数据库 (PostgreSQL)

**数据表**: `cross_game_inventory`

**获取方式**: 后端 API 查询
- API 端点: `GET /api/inventory`
- 调用时机:
  - 页面加载时
  - 用户手动刷新时

**数据特点**:
- ✅ **持久化存储** - 存储在 AllinONE 数据库中
- ✅ **支持交易** - 可以在 AllinONE 市场买卖
- ✅ **跨游戏转移** - 可以转移到其他游戏

**使用场景**:
- 在 AllinONE 平台获得/购买的道具
- 从其他游戏转移到 AllinONE 的道具

## 关键服务

### newDayInventorySync.ts
负责 New Day 库存同步
- `fetchFromNewDay()`: 从 New Day API 获取实时库存
- `fetchLocalInventory()`: 从 AllinONE 数据库获取库存
- `getMergedInventory()`: 合并两个数据源

### inventoryApiService.ts
负责与 AllinONE 后端数据库交互
- `getInventory()`: 获取用户库存列表
- `addItem()`: 添加道具到数据库
- `getInventorySummary()`: 获取库存统计

### newDayApiService.ts
负责与 New Day 游戏服务器通信
- `getInventory()`: 获取 New Day 库存
- `transferItem()`: 转移道具（扣除/发放）
- `getBalance()`: 获取 New Day 余额

## 上架流程

### New Day 道具上架到 AllinONE 市场

```
用户点击"上架"
    │
    ▼
确认上架信息
    │
    ▼
crossPlatformMarketService.listItem()
    │
    ├──► 检测到 platform === 'newday'
    │      │
    │      ▼
    │    newDayApiService.transferItem()
    │      (调用 New Day API 扣除道具)
    │      │
    │      ▼
    │    扣除成功 ✅
    │
    ▼
保存上架记录到 AllinONE 本地存储
    │
    ▼
道具显示在 AllinONE 交易市场
```

**注意**: 上架时必须先扣除 New Day 道具，确保数据一致性。

## 数据一致性保证

### 1. New Day 道具
- **实时获取**: 每次显示都从 New Day API 获取最新数据
- **不上架不扣除**: 只有在用户主动上架时才扣除
- **错误处理**: 扣除失败时不上架，保证数据一致性

### 2. AllinONE 道具
- **数据库事务**: 使用数据库事务保证操作原子性
- **状态同步**: 上架/购买后立即更新数据库状态

## 常见问题

### Q: 为什么 New Day 道具不存储到 AllinONE 数据库？
A: 为了保证数据一致性。如果存储到 AllinONE 数据库，可能出现：
- New Day 道具已使用/消耗，但 AllinONE 仍显示有
- New Day 新增道具，AllinONE 未及时同步

### Q: 如果 New Day API 不可用怎么办？
A: 会显示错误信息，并允许用户重试。New Day 道具显示为空，AllinONE 道具正常显示。

### Q: 上架 New Day 道具后，New Day 游戏中还有吗？
A: 没有了。上架时会调用 New Day API 扣除道具，确保数据一致性。

## 监控和日志

所有库存操作都有详细日志：
```
🔍 从 New Day API 获取库存...
✅ New Day 库存: X 个道具
🔍 从 AllinONE 数据库获取库存...
✅ AllinONE 库存: X 个道具
📊 库存加载完成: { newDay: X, allinone: Y }
```

上架操作日志：
```
🔔 上架 New Day 道具，先扣除 New Day 库存: [itemId]
📤 调用 New Day transferItem API: { itemId, targetPlatform, quantity }
📥 New Day API 响应状态: 200 OK
✅ New Day 道具已扣除: [itemId]
✅ 物品上架成功: [item]
```
