# 登录 API 问题报告

**日期**: 2026-01-29
**严重程度**: 🔴 高 - 阻塞集成测试
**状态**: ⏳ 等待修复

---

## 问题描述

**端点**: `POST /api/allinone/auth/login`

**测试结果**: ❌ 登录失败

### 测试 1: 使用 allinoneUserId/allinoneUsername

```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}'
```

**返回**:
```json
{
  "success": false,
  "message": "操作失败"
}
```

### 测试 2: 使用 userId/username

```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","username":"testuser"}'
```

**返回**:
```json
{
  "success": false,
  "message": "登录失败"
}
```

### 测试 3: 使用 playerId/playerName

```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"test-user-123","playerName":"testuser"}'
```

**返回**:
```json
{
  "success": false,
  "message": "登录失败"
}
```

---

## 预期响应格式

根据 `NEW_DAY_API_FIXED_SUMMARY.md` 文档：

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "userId": "allinone-user-id",
    "playerId": "new-day-player-id"
  }
}
```

---

## 可能的原因

### 1. 端点未完全实现 ⭐ 最可能

`/api/allinone/auth/login` 端点可能只返回了"登录失败"，没有真正实现登录逻辑。

### 2. 参数解析错误

端点可能期望不同的参数格式，但文档中未明确说明。

### 3. 数据库问题

登录逻辑可能依赖数据库操作，但数据库连接或查询失败。

### 4. 用户不存在

端点可能要求用户必须预先存在于数据库中。

---

## 需要的修复

### 方案 1: 完善登录端点实现 ⭐ 推荐

**文件**: `src/app/api/allinone/auth/login/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支持多种参数格式
    const userId = body.allinoneUserId || body.userId || body.playerId;
    const username = body.allinoneUsername || body.username || body.playerName;

    if (!userId || !username) {
      return Response.json({
        success: false,
        message: '缺少必要参数'
      }, { status: 400 });
    }

    // 1. 查找或创建用户
    const user = await findOrCreateUser(userId, username);

    // 2. 生成 JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const token = await new SignJWT({
      userId: user.id,
      username: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // 3. 返回正确的响应格式
    return Response.json({
      success: true,
      data: {
        token,
        userId: user.id,
        username: user.name,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).getTime()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({
      success: false,
      message: '登录失败: ' + error.message
    }, { status: 500 });
  }
}

async function findOrCreateUser(userId: string, username: string) {
  // 这里实现查找或创建用户的逻辑
  // 可以使用 Drizzle ORM
  const existingUser = await db.select()
    .from(players)
    .where(eq(players.id, userId));

  if (existingUser && existingUser.length > 0) {
    return existingUser[0];
  }

  // 如果用户不存在，创建新用户
  const newUsers = await db.insert(players)
    .values({
      id: userId,
      nickname: username,
      totalAdventures: 0,
      memoryFragmentsCollected: 0
    })
    .returning();

  return newUsers[0];
}
```

### 方案 2: 返回更详细的错误信息

修改端点，返回详细的错误信息，帮助诊断问题：

```typescript
catch (error) {
  console.error('Login error:', error);

  return Response.json({
    success: false,
    message: '登录失败',
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }, { status: 500 });
}
```

### 方案 3: 先创建测试用户

在测试前，先通过其他端点创建测试用户：

```bash
# 创建用户（如果有这样的端点）
curl -X POST "https://yxp6y2qgnh.coze.site/api/players/create" \
  -H "Content-Type: application/json" \
  -d '{"id":"test-user-123","nickname":"testuser"}'
```

---

## 测试验证

### 修复后的测试步骤

1. **测试用户创建和登录**
   ```bash
   curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}'
   ```

   **预期返回**:
   ```json
   {
     "success": true,
     "data": {
       "token": "jwt-token-here",
       "userId": "test-user-123",
       "username": "testuser",
       "expiresAt": 1234567890123
     }
   }
   ```

2. **使用 token 访问需要认证的端点**
   ```bash
   curl "https://yxp6y2qgnh.coze.site/api/allinone/wallet/balance" \
     -H "Authorization: Bearer <token>"
   ```

3. **运行完整集成测试**
   - 打开 `test-newday-integration.html`
   - 点击"开始测试"
   - 所有测试应显示为绿色 ✅

---

## 给 New Day 团队的请求

### 立即需要做的事情

1. **检查 `/api/allinone/auth/login` 端点实现**
   - 文件位置: `src/app/api/allinone/auth/login/route.ts`
   - 确认是否正确实现了登录逻辑

2. **添加日志输出**
   - 记录请求参数
   - 记录错误详情
   - 帮助诊断问题

3. **确保响应格式正确**
   - 必须包含 `success: true`
   - 必须包含 `data.token`
   - 必须包含 `data.userId`

4. **测试并验证**
   - 在本地测试登录功能
   - 部署到生产环境
   - 验证 AllinONE 集成测试通过

---

## 影响范围

### 受影响的端点

所有需要认证的 AllinONE API 端点：

- ❌ `GET /api/allinone/wallet/balance`
- ❌ `GET /api/allinone/inventory`
- ❌ `GET /api/allinone/market/list`
- ❌ `POST /api/allinone/market/purchase`
- ❌ `POST /api/allinone/market/transfer`

### 不受影响的端点

- ✅ `GET /api/shared/marketplace` - 共享市场，无需认证
- ✅ `GET /api/shared/wallet/{userId}` - 共享钱包，但需要先解决外键约束

---

## 执行清单

- [ ] 检查 `/api/allinone/auth/login` 端点实现
- [ ] 添加详细的错误日志
- [ ] 确保响应格式符合文档要求
- [ ] 在本地测试登录功能
- [ ] 部署到生产环境
- [ ] 验证生产环境登录功能
- [ ] 运行完整集成测试

---

## 联系方式

如有问题，请联系：
- **AllinONE 集成团队**
- **New Day 开发团队**

---

**最后更新**: 2026-01-29
**优先级**: 🔴 高 - 阻塞所有集成测试
