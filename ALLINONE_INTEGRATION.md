# New Day × AllinONE 深度集成文档

## 概述

New Day游戏已与AllinONE平台实现**真正的深度集成**，玩家可以在游戏界面中实时查看和使用AllinONE的数据。

## 集成功能

### 1. 钱包系统

#### 游戏内实时显示
- **位置**: 游戏页面顶部导航栏
- **显示内容**:
  - 💰 游戏币 (Game Coins)
  - ⚡ 算力 (Computing Power)
  - 💵 现金 (Cash)

#### 功能特性
- ✅ 实时更新（每30秒自动刷新）
- ✅ 点击查看详细信息
- ✅ 多货币支持
- ✅ 统计数据展示
- ✅ 充值和交易记录入口

#### 技术实现
- **组件**: `src/components/ui/WalletDisplay.tsx`
- **API**: `/api/shared/wallet/{playerId}`
- **刷新策略**: 自动轮询 + 手动刷新

---

### 2. 道具库存系统

#### 页面访问
- **路由**: `/inventory`
- **入口**: 游戏页面导航栏"🎒 道具"按钮

#### 功能特性
- ✅ 查看所有拥有道具
- ✅ 按类型筛选（全部/武器/防具/消耗品）
- ✅ 稀有度标识（普通/稀有/史诗/传说）
- ✅ 道具属性展示
- ✅ 使用和上架市场功能
- ✅ 统计数据（总道具数、稀有道具数等）

#### 技术实现
- **页面**: `src/app/inventory/page.tsx`
- **API**: `/api/adventures/items`
- **UI库**: lucide-react 图标

---

### 3. 市场交易系统

#### 页面访问
- **路由**: `/marketplace`
- **入口**: 游戏页面导航栏"🏪 市场"按钮

#### 功能特性
- ✅ 浏览在售商品
- ✅ 排序选项（最新上架/价格最低）
- ✅ 商品详情查看
- ✅ 购买功能
- ✅ 跨平台商品（AllinONE + New Day）
- ✅ 多货币定价
- ✅ 卖家信息展示
- ✅ 市场统计（在售商品数、交易额等）

#### 技术实现
- **页面**: `src/app/marketplace/page.tsx`
- **API**: 
  - `/api/shared/marketplace` - 获取市场列表
  - `/api/adventures/{playerId}/items/{itemId}/purchase` - 购买道具

---

## 导航结构

```
游戏页面 (/game)
├── 钱包余额显示 (实时更新)
├── 🎭 更换身份按钮
├── 🎒 道具按钮 → 跳转到 /inventory
└── 🏪 市场按钮 → 跳转到 /marketplace

道具页面 (/inventory)
├── 道具列表展示
├── 筛选功能
├── 道具详情弹窗
└── 返回游戏按钮

市场页面 (/marketplace)
├── 商品列表展示
├── 排序选项
├── 商品详情弹窗
└── 返回游戏按钮
```

## UI/UX 设计

### 设计原则
1. **一致性**: 所有页面使用统一的紫色渐变背景
2. **响应式**: 支持移动端和桌面端
3. **直观**: 使用图标和颜色区分不同类型
4. **流畅**: 添加过渡动画和悬停效果

### 颜色方案
- 💰 游戏币: 黄色 (yellow-300)
- ⚡ 算力: 蓝色 (blue-300)
- 💵 现金: 绿色 (green-300)
- 稀有度渐变: 
  - 传说: 黄橙色渐变
  - 史诗: 紫粉色渐变
  - 稀有: 蓝青色渐变

---

## API 集成

### AllinONE API 基础路径
```
https://yxp6y2qgnh.coze.site/api/allinone
```

### 已集成的API端点
- `POST /auth/login` - 用户认证
- `GET /wallet/balance` - 获取钱包余额
- `GET /inventory` - 获取库存
- `GET /market/items` - 获取市场列表
- `POST /market/list` - 上架道具
- `POST /market/purchase` - 购买道具
- `POST /market/transfer` - 转移道具

### New Day 内部API
- `GET /api/shared/wallet/{playerId}` - 钱包查询
- `GET /api/adventures/items` - 道具列表
- `GET /api/shared/marketplace` - 市场列表
- `POST /api/adventures/{playerId}/items/{itemId}/purchase` - 购买道具

---

## 使用指南

### 玩家视角

#### 1. 查看钱包
1. 登录游戏后，顶部导航栏显示钱包余额
2. 点击余额可查看详细信息
3. 数据每30秒自动更新

#### 2. 管理道具
1. 点击导航栏"🎒 道具"按钮
2. 查看所有拥有道具
3. 使用筛选器查找特定类型
4. 点击道具查看详情
5. 可以使用或上架到市场

#### 3. 市场交易
1. 点击导航栏"🏪 市场"按钮
2. 浏览在售商品
3. 使用排序功能
4. 点击商品查看详情
5. 购买心仪道具

### 开发者视角

#### 添加新的道具类型
1. 修改 `src/app/inventory/page.tsx` 中的筛选选项
2. 更新 `getTypeIcon` 函数添加新图标
3. 确保后端API支持新类型

#### 扩展货币系统
1. 修改 `WalletDisplay` 组件添加新货币
2. 更新后端钱包API支持新货币
3. 在市场页面添加新货币定价选项

---

## 未来计划

### 短期优化
- [ ] 添加道具图片上传功能
- [ ] 实现道具装备系统
- [ ] 添加交易记录查询
- [ ] 优化加载性能

### 长期计划
- [ ] 玩家间交易功能
- [ ] 拍卖系统
- [ ] 道具合成系统
- [ ] 全服排行榜

---

## 故障排除

### 常见问题

**Q: 钱包余额不更新？**
A: 检查网络连接，系统每30秒自动刷新，也可以手动刷新页面。

**Q: 无法购买道具？**
A: 确认钱包余额充足，检查货币类型是否匹配。

**Q: 道具列表为空？**
A: 在冒险中完成任务可获得道具，或从市场购买。

**Q: 页面加载缓慢？**
A: 检查网络连接，必要时清理浏览器缓存。

---

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: Tailwind CSS 4
- **图标**: lucide-react
- **状态管理**: React Hooks
- **API**: Fetch API
- **数据库**: PostgreSQL (Drizzle ORM)

---

## 贡献

欢迎提交Issue和Pull Request来改进这个集成系统！

---

## 许可证

MIT License
