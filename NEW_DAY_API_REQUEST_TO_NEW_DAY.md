# 给 New Day 团队的 API 修复请求

**紧急**: AllinONE 集成受阻，需要 New Day 团队协助修复以下问题

---

## 🚨 阻塞集成的问题

### 1. ❌ CORS 配置缺失（优先级：Critical）

**问题**: 共享 API 无法从浏览器访问

**受影响的端点**:
```
GET /api/shared/marketplace
GET /api/shared/wallet/{userId}
```

**错误**: `No 'Access-Control-Allow-Origin' header is present`

**需要添加的配置**:
```typescript
// 在 src/app/api/shared/[any]/route.ts
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 在其他方法中也添加
export async function GET(request: Request) {
  // ... 你的代码
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

---

### 2. ❌ AllinONE 登录端点未实现（优先级：Critical）

**问题**: `/api/allinone/auth/login` 返回 400 错误

**需要实现**: `POST /api/allinone/auth/login`

**建议的实现**:
```typescript
// src/app/api/allinone/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 方案 1: 接受 AllinONE 用户 ID
    const { allinoneUserId, allinoneUsername } = body;

    if (!allinoneUserId) {
      return NextResponse.json(
        { success: false, error: '缺少 allinoneUserId' },
        { status: 400 }
      );
    }

    // 检查是否已有对应的玩家
    // 如果没有，创建新玩家
    // 如果有，获取现有玩家

    // 生成 JWT token
    const token = generateJWT(allinoneUserId, playerId);

    return NextResponse.json({
      success: true,
      data: {
        token: token,
        playerId: playerId,
        userId: allinoneUserId
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**接受的参数**:
```json
{
  "allinoneUserId": "uuid-from-allinone",
  "allinoneUsername": "username",
  "allinoneEmail": "user@example.com"
}
```

**返回格式**:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "playerId": "new-day-player-id",
    "userId": "allinone-user-id"
  }
}
```

---

### 3. ⚠️ 市场 API 方法错误（优先级：High）

**问题**: `GET /api/allinone/market/list` 返回 405 Method Not Allowed

**需要确认**:
- 端点路径是否正确？
- 应该使用 GET 还是 POST？
- 需要什么参数？

**建议**: 如果是获取列表，应该是 GET 方法；如果是查询特定条件，可以是 POST

---

### 4. ⚠️ AllinONE API 认证问题（优先级：High）

**受影响的端点**:
```
GET /api/allinone/inventory (401 Unauthorized)
GET /api/allinone/wallet/balance (401 Unauthorized)
```

**需要确认**:
- 这些端点是否存在？
- 认证方式是什么？Bearer token?
- token 格式是什么？

---

## ✅ 验证这些修复的步骤

### 1. 测试 CORS 配置
```bash
curl -i -X OPTIONS "https://yxp6y2qgnh.coze.site/api/shared/marketplace" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
```

应该看到响应头包含：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### 2. 测试登录端点
```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "allinoneUserId": "test-user-123",
    "allinoneUsername": "testuser"
  }'
```

应该返回：
```json
{
  "success": true,
  "data": {
    "token": "some-jwt-token",
    "playerId": "some-player-id",
    "userId": "test-user-123"
  }
}
```

### 3. 测试库存 API
```bash
curl "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 完整的 AllinONE 端点列表

根据集成文档，需要实现的端点：

### 认证
- ✅ `POST /api/allinone/auth/login` - **需要实现**

### 库存
- ✅ `GET /api/allinone/inventory` - **需要修复认证**

### 市场
- ⚠️ `GET /api/allinone/market/list` - **需要确认方法**
- ❌ `POST /api/allinone/market/purchase` - **需要实现**
- ❌ `POST /api/allinone/market/transfer` - **需要实现**

### 钱包
- ✅ `GET /api/allinone/wallet/balance` - **需要修复认证**

---

## 🎯 预期结果

修复完成后，AllinONE 应该能够：

1. ✅ 从浏览器访问共享 API（市场、钱包）
2. ✅ 使用 AllinONE 用户 ID 登录获取 token
3. ✅ 使用 token 调用 AllinONE 专用 API
4. ✅ 同步 New Day 的库存和钱包数据
5. ✅ 实现跨平台市场功能

---

## 📞 联系方式

如有问题，请联系 AllinONE 开发团队：
- 请确认哪个端点已修复
- 提供端点的正确参数格式
- 提供测试用的用户凭证

---

**请求日期**: 2026-01-29
**紧急程度**: 高（阻塞集成）
**期望解决时间**: 1-2 个工作日
