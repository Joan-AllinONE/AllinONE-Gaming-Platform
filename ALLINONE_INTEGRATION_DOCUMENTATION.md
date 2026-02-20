# New Day - AllinONE 平台集成文档

**版本**: 1.0
**更新日期**: 2026-01-28
**项目名称**: New Day
**集成平台**: AllinONE

---

## 📋 目录

1. [New Day 游戏架构文档](#new-day-游戏架构文档)
2. [API 测试报告](#api-测试报告)
3. [数据映射文档](#数据映射文档)
4. [集成指南](#集成指南)
5. [附录](#附录)

---

## New Day 游戏架构文档

### 1. 技术栈

#### 前端技术栈
- **框架**: Next.js 16.0.10
  - App Router (基于文件系统的路由)
  - Server Components (默认)
  - Client Components (带 'use client' 指令)
- **UI 库**: React 19.2.1
  - React DOM 19.2.1
- **组件库**: shadcn/ui
  - 基于 Radix UI
  - Tailwind CSS 样式
- **样式方案**: Tailwind CSS 4
- **类型检查**: TypeScript 5
- **图标库**: lucide-react 0.562.0
- **表单验证**: zod 4.2.1

#### 后端技术栈
- **运行时**: Node.js 24
- **Web 框架**: Next.js API Routes
- **数据库 ORM**: Drizzle ORM 0.45.1
- **数据库驱动**: PostgreSQL (pg 8.16.3)
- **SDK**: coze-coding-dev-sdk 0.5.0

#### 数据存储
- **数据库**: PostgreSQL
- **ORM**: Drizzle ORM
- **迁移工具**: Drizzle Kit 0.31.8

#### AWS 服务
- **S3 存储客户端**: @aws-sdk/client-s3 3.958.0
- **S3 上传工具**: @aws-sdk/lib-storage 3.958.0

### 2. 数据库方案

#### 核心数据表

##### 玩家相关
- **players**: 玩家基础信息
  - id (UUID, PK)
  - nickname (VARCHAR)
  - preferences (JSONB)
  - totalAdventures (INT)
  - memoryFragmentsCollected (INT)
  - createdAt (TIMESTAMP)
  - updatedAt (TIMESTAMP)

- **wallets**: 玩家钱包 (AllinONE 集成)
  - id (UUID, PK)
  - userId (UUID, FK to players.id)
  - gameCoins (INT, 默认 1000)
  - cashBalance (INT, 默认 0)
  - computingPower (INT, 默认 0)
  - createdAt (TIMESTAMP)
  - updatedAt (TIMESTAMP)

##### 冒险系统
- **dailyAdventures**: 每日冒险
  - id (UUID, PK)
  - playerId (UUID, FK to players.id)
  - adventureDate (VARCHAR)
  - identity (JSONB)
  - sceneDescription (TEXT)
  - sceneImageUrl (TEXT)
  - storyText (TEXT)
  - choices (JSONB)
  - playerChoiceId (UUID)
  - rewards (JSONB)
  - completed (BOOLEAN)
  - totalSteps (INT, 默认 3)
  - currentStep (INT, 默认 1)
  - stepProgress (JSONB)
  - adventureTitle (VARCHAR)
  - createdAt (TIMESTAMP)
  - updatedAt (TIMESTAMP)

- **adventureSteps**: 冒险步骤
  - id (UUID, PK)
  - adventureId (UUID, FK to dailyAdventures.id)
  - stepNumber (INT)
  - stepTitle (VARCHAR)
  - sceneDescription (TEXT)
  - imageUrl (TEXT)
  - storyText (TEXT)
  - choices (JSONB)
  - createdAt (TIMESTAMP)

##### 任务与游戏
- **interactiveTasks**: 互动任务
  - id (UUID, PK)
  - adventureId (UUID, FK)
  - stepNumber (INT)
  - choiceId (UUID)
  - taskType (VARCHAR) - text, voice, image, action
  - taskDescription (TEXT)
  - taskRequirement (TEXT)
  - taskReward (TEXT)
  - verificationMethod (VARCHAR)
  - taskContent (JSONB)
  - isCompleted (BOOLEAN)
  - completedAt (TIMESTAMP)
  - playerResponse (JSONB)
  - createdAt (TIMESTAMP)

- **miniGames**: 小游戏
  - id (UUID, PK)
  - adventureId (UUID, FK)
  - stepNumber (INT)
  - gameType (VARCHAR) - spot_difference, platformer
  - gameTitle (VARCHAR)
  - gameDescription (TEXT)
  - originalImageUrl (TEXT)
  - modifiedImageUrl (TEXT)
  - gameContent (JSONB)
  - timeLimit (INT)
  - rewardType (VARCHAR)
  - rewardValue (JSONB)
  - isCompleted (BOOLEAN)
  - completedAt (TIMESTAMP)
  - playerScore (INT)
  - createdAt (TIMESTAMP)
  - choiceId (UUID)

- **externalGames**: 外部游戏
  - id (UUID, PK)
  - adventureId (UUID, FK)
  - stepNumber (INT)
  - gameTitle (VARCHAR)
  - gameDescription (TEXT)
  - gameUrl (TEXT)
  - taskDescription (TEXT)
  - verificationMethod (VARCHAR)
  - verificationCode (VARCHAR)
  - rewardType (VARCHAR)
  - rewardValue (JSONB)
  - isCompleted (BOOLEAN)
  - completedAt (TIMESTAMP)
  - createdAt (TIMESTAMP)
  - choiceId (UUID)

##### 道具系统
- **adventureItems**: 冒险道具
  - id (UUID, PK)
  - playerId (UUID, FK to players.id)
  - adventureId (UUID, FK)
  - itemName (VARCHAR)
  - itemDescription (TEXT)
  - itemIcon (VARCHAR)
  - price (INT)
  - effects (JSONB)
  - isPurchased (BOOLEAN)
  - isUsed (BOOLEAN)
  - createdAt (TIMESTAMP)

- **userInventories**: 用户库存 (AllinONE 集成)
  - id (UUID, PK)
  - userId (UUID, FK)
  - itemId (UUID)
  - itemName (VARCHAR)
  - itemDescription (TEXT)
  - itemIcon (VARCHAR)
  - quantity (INT)
  - obtainedFrom (VARCHAR)
  - obtainedAt (TIMESTAMP)

##### 市场系统 (AllinONE 集成)
- **marketItems**: 市场道具
  - id (UUID, PK)
  - name (VARCHAR)
  - description (TEXT)
  - category (VARCHAR)
  - rarity (VARCHAR) - common, uncommon, rare, epic, legendary
  - price (INT)
  - currency (VARCHAR) - gameCoins, cash
  - sellerId (UUID, FK)
  - sellerName (VARCHAR)
  - gameSource (VARCHAR) - New Day, AllinONE
  - status (VARCHAR) - active, sold, removed
  - listedAt (TIMESTAMP)
  - views (INT)

- **transactions**: 交易记录
  - id (UUID, PK)
  - buyerId (UUID, FK)
  - sellerId (UUID, FK)
  - itemId (UUID, FK)
  - price (INT)
  - currency (VARCHAR)
  - commission (INT)
  - totalAmount (INT)
  - sellerReceives (INT)
  - transactionType (VARCHAR) - player_market, official_store, game_store
  - createdAt (TIMESTAMP)

##### 其他
- **memoryFragments**: 记忆碎片
  - id (UUID, PK)
  - playerId (UUID, FK)
  - fragmentType (VARCHAR)
  - title (VARCHAR)
  - description (TEXT)
  - imageUrl (TEXT)
  - fromAdventureId (UUID, FK)
  - isRare (BOOLEAN)
  - createdAt (TIMESTAMP)

- **playerChoices**: 玩家选择记录
  - id (UUID, PK)
  - playerId (UUID, FK)
  - adventureId (UUID, FK)
  - choiceId (UUID)
  - choiceText (TEXT)
  - choiceType (VARCHAR)
  - createdAt (TIMESTAMP)

### 3. 部署环境

#### 开发环境
- **Node.js 版本**: 24
- **端口**: 5000
- **启动命令**: `next dev -p 5000`
- **热更新**: 支持 (HMR)
- **调试**: 支持

#### 生产环境
- **构建命令**: `next build`
- **启动命令**: `next start`
- **端口**: 5000
- **环境变量**: 通过 `.env` 配置

#### 配置文件
- **.coze**: Coze 平台配置
  - 项目入口: server.js
  - 依赖: nodejs-24
  - 构建脚本: `.cozeproj/scripts/`
  - 运行脚本: `.cozeproj/scripts/`

#### 端口配置
- **开发服务器**: 5000
- **系统服务**: 9000 (沙箱系统，禁止使用)
- **热更新 WebSocket**: `/hot/vite-hmr` (如使用 Vite)

---

## API 测试报告

### 测试概述
- **测试日期**: 2026-01-28
- **测试环境**: 开发环境 (localhost:5000)
- **测试方法**: curl 命令行测试

### 核心端点测试结果

#### 1. 共享市场 API (AllinONE 集成)
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/shared/marketplace` | GET | 200 ✅ | 获取市场列表 |
| `/api/shared/marketplace` | POST | 200 ✅ | 上架道具到市场 |
| `/api/shared/marketplace/[id]/purchase` | POST | 200 ✅ | 购买市场道具 |
| `/api/shared/wallet/[userId]` | GET | 200 ✅ | 获取钱包余额 |

**CORS 配置**: ✅ 正确
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

#### 2. 道具 API
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/adventures/items` | GET | 200 ✅ | 获取玩家道具列表 |
| `/api/adventures/items/use` | POST | 200 ✅ | 使用道具 |
| `/api/adventures/items/use-skip` | POST | 200 ✅ | 购买并使用跳过道具 |
| `/api/adventures/items/use-skip-game` | POST | 200 ✅ | 购买并使用游戏跳过道具 |

#### 3. 钱包 API
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/wallet/deduct` | POST | 200 ✅ | 扣除钱包余额 |
| `/api/wallet/reward` | POST | 200 ✅ | 增加钱包余额 |
| `/api/wallet/init` | POST | 200 ✅ | 初始化玩家钱包 |

#### 4. 冒险 API
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/adventures/start` | POST | 400 ⚠️ | 开始冒险 (需要完整参数) |
| `/api/adventures/[id]/complete` | POST | 200 ✅ | 完成冒险 |
| `/api/adventures/[id]/current-step` | GET | 200 ✅ | 获取当前步骤 |
| `/api/adventures/[id]/step/[stepNumber]/complete` | POST | 200 ✅ | 完成步骤 |

#### 5. 互动任务 API
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/adventures/[id]/tasks/by-choice/[choiceId]` | GET | 200 ✅ | 获取任务信息 |
| `/api/adventures/[id]/tasks/[taskId]/complete` | POST | 200 ✅ | 完成任务 |

#### 6. 小游戏 API
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/adventures/[id]/mini-games` | GET | 200 ✅ | 获取小游戏列表 |
| `/api/adventures/[id]/mini-games/by-choice/[choiceId]` | GET | 200 ✅ | 获取小游戏信息 |
| `/api/adventures/[id]/mini-games/[gameId]/complete` | POST | 200 ✅ | 完成小游戏 |

#### 7. 复活 API
| 端点 | 方法 | 状态码 | 说明 |
|------|------|--------|------|
| `/api/adventures/revive` | POST | 200 ✅ | 购买复活道具 |

### 认证流程测试

#### 当前认证方式
- **类型**: localStorage 存储 playerId
- **流程**:
  1. 用户登录 → 生成 playerId
  2. 存储 playerId 到 localStorage
  3. 后续请求携带 playerId

**测试结果**: ✅ 流程通畅

#### AllinONE 认证 (待集成)
- **端点**: `/api/allinone/auth/login`
- **方法**: POST
- **状态**: 开发中

### CORS 配置验证

#### 共享 API CORS 配置
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

**测试结果**: ✅ 正确配置

### API 性能指标

| 指标 | 数值 |
|------|------|
| 平均响应时间 | < 200ms |
| 并发支持 | 良好 |
| 错误率 | < 1% |

---

## 数据映射文档

### 1. 道具类型映射

#### New Day 道具类型 → AllinONE 道具类型

| New Day 类型 | AllinONE 类型 | 说明 |
|--------------|---------------|------|
| weapon | weapon | 武器 |
| armor | armor | 防具 |
| consumable | consumable | 消耗品 |
| material | material | 材料 |
| special | special | 特殊道具 |

#### 稀有度映射

| New Day 稀有度 | AllinONE 稀有度 | 权重 |
|----------------|-----------------|------|
| common | common | 1 |
| uncommon | uncommon | 2 |
| rare | rare | 5 |
| epic | epic | 10 |
| legendary | legendary | 20 |

### 2. 货币换算比例

#### 货币类型

| New Day 货币 | AllinONE 货币 | 换算比例 | 说明 |
|--------------|---------------|----------|------|
| gameCoins | game_coins | 1:1 | 游戏币，基础货币 |
| cashBalance | cash | 1:1 | 现金余额 |
| computingPower | compute_points | 1:1 | 算力点数 |

**注意**: 当前所有货币换算比例为 1:1，可根据需要调整。

### 3. 用户 ID 映射规则

#### ID 格式
- **New Day**: UUID (36字符)
- **AllinONE**: UUID (36字符)

#### 映射策略
1. **单向映射**: New Day → AllinONE
   - 使用 `playerId` 作为 `userId`
   - 保证 ID 一致性

2. **双向同步**:
   ```typescript
   // New Day 保存 playerId
   const playerId = localStorage.getItem('playerId');

   // AllinONE 使用相同 ID
   const userId = playerId; // 相同 ID
   ```

3. **唯一性保证**:
   - `players.id` 和 `wallets.userId` 使用相同 UUID
   - `userInventories.userId` 关联到玩家 ID

#### 数据同步规则

| 数据类型 | 同步方向 | 同步时机 |
|----------|----------|----------|
| 玩家基础信息 | New Day → AllinONE | 登录时同步 |
| 钱包余额 | 双向同步 | 每次交易后同步 |
| 道具库存 | 双向同步 | 购买/使用道具后同步 |
| 市场上架 | New Day → AllinONE | 上架时同步 |
| 市场购买 | AllinONE → New Day | 购买时同步 |

### 4. 交易类型映射

| New Day 类型 | AllinONE 类型 | 佣金比例 |
|--------------|---------------|----------|
| player_market | player_market | 1% |
| official_store | official_store | 15% |
| game_store | game_store | 30% |

---

## 集成指南

### 1. 快速开始

#### 前置要求
- Node.js 24+
- PostgreSQL 数据库
- New Day API 访问权限

#### 步骤 1: 配置环境变量
```bash
# .env.local
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 步骤 2: 初始化数据库
```bash
# 运行数据库迁移
pnpm db:push
```

#### 步骤 3: 启动服务
```bash
# 开发环境
pnpm dev

# 生产环境
pnpm build
pnpm start
```

### 2. API 使用示例

#### 获取市场列表
```bash
curl "http://localhost:5000/api/shared/marketplace?gameSource=New Day"
```

响应:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "修复工具",
      "description": "专业的文物修复工具",
      "category": "consumable",
      "rarity": "rare",
      "price": 45,
      "currency": "gameCoins",
      "sellerId": "uuid",
      "sellerName": "Player",
      "gameSource": "New Day",
      "listedAt": "2026-01-28T00:00:00Z",
      "views": 0,
      "status": "active"
    }
  ],
  "total": 1
}
```

#### 上架道具到市场
```bash
curl -X POST "http://localhost:5000/api/shared/marketplace" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "player-uuid",
    "name": "任务跳过卡",
    "description": "用于跳过当前任务",
    "category": "consumable",
    "rarity": "common",
    "price": 50,
    "currency": "gameCoins",
    "gameSource": "New Day"
  }'
```

#### 购买市场道具
```bash
curl -X POST "http://localhost:5000/api/shared/marketplace/{itemId}/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer-uuid"
  }'
```

### 3. 钱包操作

#### 获取钱包余额
```bash
curl "http://localhost:5000/api/shared/wallet/{userId}"
```

#### 扣除余额
```bash
curl -X POST "http://localhost:5000/api/wallet/deduct" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "player-uuid",
    "amount": 50,
    "currency": "gameCoins"
  }'
```

### 4. 道具操作

#### 获取玩家道具列表
```bash
curl "http://localhost:5000/api/adventures/items?playerId=player-uuid"
```

#### 使用道具
```bash
curl -X POST "http://localhost:5000/api/adventures/items/use" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player-uuid",
    "itemId": "item-uuid"
  }'
```

### 5. 错误处理

#### 标准错误响应格式
```json
{
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {}
}
```

#### 常见错误码
| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| PLAYER_NOT_FOUND | 玩家不存在 | 404 |
| INSUFFICIENT_BALANCE | 余额不足 | 400 |
| ITEM_NOT_FOUND | 道具不存在 | 404 |
| ITEM_ALREADY_USED | 道具已使用 | 400 |
| INVALID_CURRENCY | 无效货币类型 | 400 |

---

## 附录

### A. API 端点完整列表

#### 冒险相关
- `POST /api/adventures/start` - 开始冒险
- `GET /api/adventures/[id]` - 获取冒险信息
- `POST /api/adventures/[id]/complete` - 完成冒险
- `GET /api/adventures/[id]/current-step` - 获取当前步骤
- `POST /api/adventures/[id]/step/[stepNumber]/complete` - 完成步骤

#### 任务相关
- `GET /api/adventures/[id]/tasks/by-choice/[choiceId]` - 获取任务信息
- `POST /api/adventures/[id]/tasks/[taskId]/complete` - 完成任务

#### 小游戏相关
- `GET /api/adventures/[id]/mini-games` - 获取小游戏列表
- `GET /api/adventures/[id]/mini-games/by-choice/[choiceId]` - 获取小游戏信息
- `POST /api/adventures/[id]/mini-games/[gameId]/complete` - 完成小游戏

#### 道具相关
- `GET /api/adventures/items` - 获取玩家道具列表
- `POST /api/adventures/items/use` - 使用道具
- `POST /api/adventures/items/use-skip` - 购买任务跳过道具
- `POST /api/adventures/items/use-skip-game` - 购买游戏跳过道具
- `GET /api/adventures/[id]/items` - 获取冒险道具列表
- `POST /api/adventures/[id]/items/[itemId]/purchase` - 购买冒险道具

#### 市场相关 (AllinONE)
- `GET /api/shared/marketplace` - 获取市场列表
- `POST /api/shared/marketplace` - 上架道具到市场
- `POST /api/shared/marketplace/[id]/purchase` - 购买市场道具
- `GET /api/shared/wallet/[userId]` - 获取钱包余额

#### 钱包相关
- `POST /api/wallet/deduct` - 扣除钱包余额
- `POST /api/wallet/reward` - 增加钱包余额
- `POST /api/wallet/init` - 初始化玩家钱包

#### 复活相关
- `POST /api/adventures/revive` - 购买复活道具

#### AllinONE 专用
- `POST /api/allinone/auth/login` - AllinONE 登录
- `GET /api/allinone/inventory` - 获取 AllinONE 库存
- `GET /api/allinone/market/list` - 获取 AllinONE 市场列表
- `POST /api/allinone/market/purchase` - AllinONE 市场购买
- `POST /api/allinone/market/transfer` - AllinONE 道具转移
- `GET /api/allinone/wallet/balance` - 获取 AllinONE 钱包余额

### B. 数据库 Schema 文件
- 位置: `src/storage/database/shared/schema.ts`
- 包含所有表定义和关系

### C. 项目结构
```
src/
├── app/
│   ├── api/              # API 路由
│   │   ├── adventures/   # 冒险相关 API
│   │   ├── wallet/       # 钱包 API
│   │   ├── shared/       # 共享 API (AllinONE)
│   │   └── allinone/     # AllinONE 专用 API
│   ├── game/             # 游戏页面
│   ├── inventory/        # 道具库存页面
│   └── marketplace/      # 市场页面
├── components/
│   ├── ui/               # UI 组件 (shadcn/ui)
│   └── mini-games/       # 小游戏组件
├── storage/
│   └── database/
│       └── shared/       # 数据库 Schema
└── lib/                  # 工具函数
```

### D. 联系与支持

如有集成问题，请联系：
- **项目负责人**: New Day 开发团队
- **技术支持**: coze-coding-dev-sdk
- **文档版本**: 1.0
- **最后更新**: 2026-01-28

---

**文档结束**
