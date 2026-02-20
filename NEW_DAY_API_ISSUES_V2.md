# New Day API 问题报告 V2

**日期**: 2026-01-29
**状态**: 需要修复

---

## 发现的问题

### 问题 1: 共享钱包 API 数据库错误 (HTTP 500)

**端点**: `GET /api/shared/wallet/{userId}`

**错误信息**:
```
HTTP 500 - Failed query: insert into "wallets" ("id", "user_id", "game_coins", "cash_balance", "computing_power", "created_at", "updated_at")
values (default, $1, $2, $3, $4, default, default)
returning "id", "user_id", "game_coins", "cash_balance", "computing_power", "created_at", "updated_at"
params: test-user-id,1000,0,0
```

**原因分析**:
1. 使用 `default` 作为 ID 值插入 `wallets` 表
2. 数据库可能不支持自动生成 UUID，或没有正确配置 `DEFAULT gen_random_uuid()`

**解决方案**:
在 `wallets` 表的 schema 中为 `id` 字段添加默认值：

```sql
-- 正确的 schema 定义
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 添加 DEFAULT
  user_id UUID NOT NULL,
  game_coins INTEGER DEFAULT 1000,
  cash_balance INTEGER DEFAULT 0,
  computing_power INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

或者在代码中显式生成 UUID：
```typescript
import { randomUUID } from 'crypto';

const newWallet = {
  id: randomUUID(),  // 显式生成 UUID
  userId,
  gameCoins: 1000,
  cashBalance: 0,
  computingPower: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

---

### 问题 2: AllinONE 登录 API 响应格式不正确

**端点**: `POST /api/allinone/auth/login`

**请求格式**:
```json
{
  "allinoneUserId": "test-user-123",
  "allinoneUsername": "testuser"
}
```

**当前响应**: ❌ 格式不符合预期

**预期的响应格式**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "player-uuid-here",
    "username": "testuser",
    "expiresAt": "2026-01-30T00:00:00Z"
  }
}
```

**解决方案**:
在 `/api/allinone/auth/login` 端点返回正确的格式：

```typescript
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  const body = await request.json();
  const { allinoneUserId, allinoneUsername } = body;

  // 1. 验证或创建用户
  const user = await findOrCreateUser(allinoneUserId, allinoneUsername);

  // 2. 生成 JWT token
  const token = await new SignJWT({ userId: user.id, username: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  // 3. 返回正确的响应格式
  return Response.json({
    success: true,
    data: {
      token,
      userId: user.id,
      username: user.name,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  });
}
```

---

## 修复优先级

1. **高优先级** - 问题 1 (钱包 API 数据库错误)
   - 影响所有钱包操作
   - 阻塞集成测试

2. **高优先级** - 问题 2 (登录 API 响应格式)
   - 阻塞所有需要认证的 API 测试
   - 影响完整功能验证

---

## 验证步骤

修复后，请按以下步骤验证：

### 步骤 1: 修复钱包 API

1. 更新 `wallets` 表 schema
2. 或者修改插入逻辑显式生成 UUID
3. 测试共享钱包端点：

```bash
curl "https://yxp6y2qgnh.coze.site/api/shared/wallet/test-user-id"
```

**预期响应**:
```json
{
  "userId": "test-user-id",
  "gameCoins": 1000,
  "cashBalance": 0,
  "computingPower": 0
}
```

### 步骤 2: 修复登录 API

1. 更新 `/api/allinone/auth/login` 端点
2. 确保响应格式符合预期
3. 测试登录端点：

```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "allinoneUserId": "test-user-123",
    "allinoneUsername": "testuser"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "uuid-here",
    "username": "testuser",
    "expiresAt": "2026-01-30T00:00:00Z"
  }
}
```

### 步骤 3: 运行完整测试

修复完成后，请通知 AllinONE 团队重新运行测试：
1. 在浏览器中打开 `test-newday-integration.html`
2. 点击"开始测试"按钮
3. 所有测试应显示为绿色成功状态

---

## 需要修改的文件

### 文件 1: 数据库 Schema
- 路径: `src/storage/database/shared/schema.ts`
- 修改: `wallets` 表的 `id` 字段定义

### 文件 2: 钱包 API 端点
- 路径: `src/app/api/shared/wallet/[userId]/route.ts`
- 修改: 确保插入逻辑正确生成 UUID

### 文件 3: 登录 API 端点
- 路径: `src/app/api/allinone/auth/login/route.ts`
- 修改: 返回正确的响应格式

---

## 联系方式

如有问题，请联系 AllinONE 团队进行技术支持。

---

**最后更新**: 2026-01-29
