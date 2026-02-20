# New Day 跨平台集成指南

## 📋 概述

本文档说明如何将 New Day 游戏集成到 AllinONE 平台，实现道具在平台上的自由交易。

## 🎯 集成目标

实现 New Day 游戏道具在 AllinONE 平台的以下功能：

1. ✅ **游戏中心入口** - 在 AllinONE 游戏中心添加 New Day 入口
2. ✅ **官方商店购买** - 在 AllinONE 官方商店可以购买 New Day 道具
3. ✅ **跨游戏库存** - 在个人中心查看和管理来自不同游戏的道具
4. ✅ **市场交易** - New Day 道具可以在 AllinONE 市场上自由交易
5. ✅ **道具转移** - 支持道具在 AllinONE 和 New Day 之间转移

## 🏗️ 架构设计

### 核心服务层

```
AllinONE 平台
│
├── 跨平台认证服务 (crossPlatformAuthService.ts)
│   ├── 生成跨平台令牌
│   ├── 验证跨平台令牌
│   └── 刷新令牌
│
├── 跨平台市场服务 (crossPlatformMarketService.ts)
│   ├── 获取跨平台市场列表
│   ├── 上架道具
│   ├── 购买道具
│   └── 转移道具
│
├── 跨平台钱包服务 (crossPlatformWalletService.ts)
│   ├── 获取用户余额
│   └── 货币兑换
│
└── AllinONE 市场适配器 (allinone_marketplaceService.ts)
    ├── 整合跨平台服务
    ├── 数据格式转换
    └── 统一 API 接口
```

### 数据流

```
New Day 游戏
    ↓ (通过 API)
跨平台服务
    ↓ (数据转换)
AllinONE 市场服务
    ↓
用户界面（市场、个人中心）
```

## 📁 文件结构

### 核心服务文件

```
src/services/
├── crossPlatformAuthService.ts       # 跨平台认证服务
├── crossPlatformMarketService.ts    # 跨平台市场服务
├── crossPlatformWalletService.ts    # 跨平台钱包服务
└── allinone_marketplaceService.ts  # AllinONE 市场适配器（主服务）
```

### 前端组件文件

```
src/pages/
├── Marketplace.tsx                 # 主市场页面（已整合跨平台功能）
├── OfficialStore.tsx               # 官方商店（包含 New Day 商店）
└── GameCenter.tsx                 # 游戏中心（包含 New Day 入口）

src/components/
├── CrossGameInventory.tsx          # 跨游戏道具展示组件
└── NewDayStore.tsx                # New Day 商店组件
```

### 类型定义文件

```
src/types/
├── newDay.ts                     # New Day 游戏类型定义
└── marketplace.ts                 # 市场类型定义
```

## 🔧 核心功能实现

### 1. 跨平台市场数据获取

```typescript
// 从跨平台市场获取道具列表
const items = await allinone_marketplaceService.getCrossPlatformMarketItems(
  'newday',  // 指定平台
  'weapon'    // 可选：指定道具类型
);

// 获取跨平台库存
const inventory = await allinone_marketplaceService.getCrossPlatformInventory(
  'newday'
);
```

### 2. 购买跨平台道具

```typescript
// 购买 New Day 道具
const result = await allinone_marketplaceService.purchaseFromCrossPlatform(
  itemId,
  'computingPower'  // 支付货币类型
);
```

### 3. 上架跨平台道具

```typescript
// 上架 New Day 道具到市场
const listedItem = await allinone_marketplaceService.listItemToCrossPlatform({
  name: '黎明之剑',
  description: 'New Day 世界的传说武器',
  itemType: 'weapon',
  price: {
    computingPower: 5000,
    gameCoins: 20000
  }
});
```

### 4. 货币兑换

```typescript
// 在不同货币之间兑换
const exchangeResult = await allinone_marketplaceService.exchangeCurrency(
  'computingPower',  // 从
  'newDayCoins',      // 到
  1000                // 数量
);
```

## 🎮 New Day 道具类型

### 道具分类

| 类型 | 英文 ID | 说明 |
|------|---------|------|
| 武器 | WEAPON | 攻击类道具 |
| 护甲 | ARMOR | 防御类道具 |
| 饰品 | ACCESSORY | 特殊饰品 |
| 消耗品 | CONSUMABLE | 药水、卷轴等 |
| 材料 | MATERIAL | 打造材料 |
| 特殊 | SPECIAL | 限时稀有道具 |
| 皮肤 | SKIN | 角色皮肤 |
| 宠物 | PET | 宠物伙伴 |

### 稀有度等级

| 等级 | 英文 ID | 颜色标识 |
|------|---------|----------|
| 普通 | COMMON | 灰色 |
| 稀有 | UNCOMMON | 绿色 |
| 史诗 | RARE | 蓝色 |
| 传说 | EPIC | 紫色 |
| 神话 | LEGENDARY | 橙色 |

## 💰 支持的货币

AllinONE 平台支持以下货币进行交易：

| 货币 | 符号 | 说明 |
|------|------|------|
| 游戏币 | 🪙 | 通用游戏货币 |
| 算力 | ⚡ | AllinONE 独特货币 |
| 现金 | 💵 | 真实货币 |
| A币 | 🔷 | AllinONE 平台代币 |
| O币 | ⭕ | 算力相关代币 |
| ND币 | 🐉 | New Day 游戏货币 |

## 🔌 API 集成配置

### 环境变量配置

在 `.env` 文件中添加：

```bash
# New Day 游戏配置
VITE_NEWDAY_API_URL=https://newday.example.com/api
VITE_NEWDAY_API_KEY=your_api_key_here

# 跨平台服务配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_CROSS_PLATFORM_ENABLED=true
```

### 跨平台认证流程

1. **用户登录 AllinONE**
   ```typescript
   await authContext.login(email, password);
   ```

2. **生成跨平台令牌**
   ```typescript
   const token = await crossPlatformAuthService.generateCrossPlatformToken({
     userId: currentUser.id,
     email: currentUser.email,
     username: currentUser.name,
     platform: 'allinone'
   });
   ```

3. **令牌自动附加到请求**
   - 跨平台服务会自动在请求头中添加 `Authorization: Bearer {token}`

4. **令牌刷新**
   - 令牌过期时自动刷新
   - 或手动调用：`await crossPlatformAuthService.refreshToken()`

## 📊 数据同步机制

### 自动同步

跨平台服务会自动执行以下同步操作：

1. **库存同步** - 每 10 秒自动刷新跨平台库存
2. **市场列表** - 每 10 秒自动更新市场道具列表
3. **余额更新** - 购买/出售后自动更新钱包余额

### 手动同步

```typescript
// 刷新跨平台数据
await allinone_marketplaceService.getCrossPlatformInventory();

// 获取最新市场数据
await allinone_marketplaceService.getAllMarketItems();
```

## 🧪 测试功能

### 1. 测试跨平台购买

访问市场页面：`http://localhost:3000/marketplace`

1. 选择 "New Day" 游戏筛选
2. 选择要购买的道具
3. 选择支付货币（算力/游戏币等）
4. 点击"立即购买"

### 2. 测试跨平台上架

访问个人中心：`http://localhost:3000/computing-power`

1. 进入"库存"标签
2. 筛选显示 "New Day" 道具
3. 点击道具的"上架到市场"按钮
4. 设置价格并确认上架

### 3. 测试道具转移

在市场中购买道具后，道具会自动：

- 添加到个人中心库存
- 显示游戏来源标识（New Day / AllinONE）
- 可以再次上架出售

## 🚀 使用流程

### 玩家视角

```
1. 在 AllinONE 游戏中心点击 "New Day"
   ↓
2. 外部打开 New Day 游戏
   ↓
3. 在游戏中获得道具
   ↓
4. 道具同步到 AllinONE 库存
   ↓
5. 在 AllinONE 市场上架道具
   ↓
6. 其他玩家购买道具
   ↓
7. 道具转移到买家库存
```

### 商家视角（从官方商店购买）

```
1. 在 AllinONE 官方商店选择 "New Day 道具商店"
   ↓
2. 浏览 New Day 道具
   ↓
3. 购买心仪道具
   ↓
4. 道具添加到库存
   ↓
5. 可选择保留使用或转手出售
```

## ⚙️ 高级配置

### 佣金费率配置

在 `allinone_marketplaceService.ts` 中调整：

```typescript
private commissionRates = {
  player_market: 0.01,    // 玩家交易市场 1%
  official_store: 0.15,   // 官方商店 15%
  game_store: 0.30        // 游戏电商 30%
};
```

### 添加 New Day 道具

编辑 `newDayService.ts` 的 `initializeStoreItems()` 方法：

```typescript
{
  id: 'nd_custom_001',
  name: '自定义道具',
  description: '道具描述',
  type: NewDayItemType.WEAPON,
  rarity: NewDayRarity.LEGENDARY,
  icon: 'fa-sword',
  prices: {
    cash: 29.99,
    gameCoins: 30000,
    computingPower: 7000
  },
  stock: 100,
  tags: ['自定义', '热门']
}
```

## 🔍 故障排查

### 问题：跨平台道具不显示

**解决方案：**

1. 检查跨平台认证状态
   ```typescript
   console.log(crossPlatformAuthService.isTokenValid());
   ```

2. 刷新跨平台令牌
   ```typescript
   await crossPlatformAuthService.refreshToken();
   ```

3. 检查 API 配置
   - 确认 `VITE_API_BASE_URL` 正确
   - 确认跨平台服务已启动

### 问题：购买失败

**解决方案：**

1. 检查用户余额是否足够
2. 确认道具库存充足
3. 查看浏览器控制台错误信息
4. 检查网络连接

### 问题：上架后道具不显示

**解决方案：**

1. 刷新市场页面
2. 等待 10 秒自动刷新
3. 检查道具分类筛选
4. 确认游戏来源筛选

## 📝 总结

通过本集成方案，New Day 游戏实现了与 AllinONE 平台的深度集成：

- ✅ **完整的市场交易功能** - 买卖道具自由进行
- ✅ **跨游戏库存管理** - 统一查看所有道具
- ✅ **多货币支持** - 灵活的支付方式
- ✅ **自动数据同步** - 实时更新道具状态
- ✅ **安全的认证机制** - 保护用户资产

## 📞 技术支持

如遇到集成问题，请检查：

1. 控制台错误日志
2. 网络请求状态
3. 本地存储数据（Application → Local Storage）
4. 跨平台服务状态

---

**最后更新**: 2025-01-23
**版本**: 1.0.0
