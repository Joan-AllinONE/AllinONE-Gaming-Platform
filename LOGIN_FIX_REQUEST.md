# 登录 API 修复请求 - 紧急

**日期**: 2026-01-29
**严重程度**: 🔴 严重 - 阻塞所有集成测试
**状态**: ⏳ 等待修复

---

## 问题描述

**端点**: `POST https://yxp6y2qgnh.coze.site/api/allinone/auth/login`

**当前状态**: ❌ 返回 HTTP 500 错误

---

## 测试结果

### 测试命令

```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}'
```

### 实际返回

```json
{
  "success": false,
  "message": "登录失败"
}
```

**HTTP 状态码**: 500
**响应时间**: 0.2 秒（响应很快，但返回错误）

---

## 预期返回格式

根据集成文档，应该返回：

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

**必须包含的字段**:
- `success: true`
- `data.token` - JWT 认证令牌
- `data.userId` - 用户 ID
- `data.username` - 用户名（可选）

---

## 需要修复的内容

### 文件位置

`src/app/api/allinone/auth/login/route.ts`

### 修复要点

#### 1. 实现用户查找/创建逻辑

```typescript
async function findOrCreateUser(userId: string, username: string) {
  // 查找现有用户
  const existingUser = await db.select()
    .from(players)
    .where(eq(players.id, userId));

  if (existingUser && existingUser.length > 0) {
    return existingUser[0];
  }

  // 创建新用户
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

#### 2. 实现生成 JWT token

```typescript
import { SignJWT } from 'jose';

async function generateToken(userId: string, username: string): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key'
  );

  const token = await new SignJWT({
    userId,
    username
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
}
```

#### 3. 实现完整的登录端点

```typescript
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支持多种参数格式
    const userId = body.allinoneUserId || body.userId || body.playerId;
    const username = body.allinoneUsername || body.username || body.playerName;

    if (!userId || !username) {
      return Response.json({
        success: false,
        message: '缺少必要参数：userId 和 username'
      }, { status: 400 });
    }

    // 1. 查找或创建用户
    const user = await findOrCreateUser(userId, username);

    // 2. 生成 token
    const token = await generateToken(user.id, user.nickname);

    // 3. 返回正确格式
    return Response.json({
      success: true,
      data: {
        token,
        userId: user.id,
        username: user.nickname,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
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
```

---

## 验证步骤

修复后，请按照以下步骤验证：

### 步骤 1: 本地测试

```bash
curl -X POST "http://localhost:5000/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}'
```

**预期返回**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "test-user-123",
    "username": "testuser",
    "expiresAt": 1770336614189
  }
}
```

### 步骤 2: 部署到生产环境

将修复后的代码部署到生产环境。

### 步骤 3: 生产环境测试

```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}'
```

### 步骤 4: 运行完整集成测试

使用新创建的诊断工具：
- 打开 `test-newday-api-diagnosis.html`
- 点击"开始诊断"按钮
- 所有测试应显示为绿色 ✅

---

## 影响范围

### 🔴 阻塞的功能

由于登录 API 失败，以下功能都无法测试：

- ❌ 获取 AllinONE 钱包余额
- ❌ 获取 AllinONE 库存
- ❌ 获取 AllinONE 市场列表
- ❌ 购买道具
- ❌ 转移道具

### ✅ 正常工作的功能

- ✅ 共享市场 API（无需认证）
- ✅ 共享钱包 API（无需认证，外键约束已修复）

---

## 紧急程度

🔴 **紧急** - 阻塞 AllinONE 集成测试

**预计修复时间**: 30 分钟
**预计测试时间**: 10 分钟

---

## 联系方式

修复完成后，请立即通知 AllinONE 团队进行测试。

如有问题，请联系：
- **AllinONE 集成团队**

---

**最后更新**: 2026-01-29
**文档版本**: 1.0
