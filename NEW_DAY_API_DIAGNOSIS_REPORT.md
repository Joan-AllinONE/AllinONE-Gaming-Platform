# New Day API 集成诊断报告

**日期**: 2026-01-29
**测试人员**: AllinONE 开发团队
**API 基础 URL**: `https://yxp6y2qgnh.coze.site`

---

## 📊 测试结果摘要

| 测试项 | 状态 | 错误代码 | 说明 |
|--------|------|----------|------|
| 共享市场 API | ❌ | CORS 错误 | `/api/shared/marketplace` CORS 未配置 |
| 共享钱包 API | ❌ | CORS 错误 | `/api/shared/wallet/{userId}` CORS 未配置 |
| AllinONE 端点连接 | ✅ | 401 | 端点存在但需要认证 |
| AllinONE 登录 | ❌ | 400 | 登录端点未实现或参数错误 |
| AllinONE 库存 API | ❌ | 401 | 需要认证 |
| AllinONE 市场 API | ❌ | 405 | 方法不允许（GET → POST?） |
| AllinONE 钱包 API | ❌ | 401 | 需要认证 |

---

## 🔴 关键问题

### 1. ❌ CORS 配置不完整

**问题**: 共享 API 端点的 CORS 配置缺失

**受影响端点**:
- `GET /api/shared/marketplace`
- `GET /api/shared/wallet/{userId}`

**错误信息**:
```
Access to fetch at 'https://yxp6y2qgnh.coze.site/api/shared/marketplace'
from origin 'null' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**要求的 CORS 配置**:
```typescript
// 在所有 API 路由中添加
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

---

### 2. ❌ AllinONE 登录端点未实现

**问题**: `/api/allinone/auth/login` 返回 400 错误

**测试的参数格式**:
1. `{ username: 'test', password: 'test' }`
2. `{ playerId: 'test-player-id' }`
3. `{ userId: 'test-user-id' }`
4. `{ email: 'test@example.com', password: 'test' }`

**全部失败**: 400 Bad Request

**需求**:
需要实现一个登录端点，接受 AllinONE 的用户信息，并返回：
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "playerId": "uuid-here",
    "userId": "uuid-here"
  }
}
```

**建议的参数格式**:
```typescript
// 选项 1: 使用 AllinONE 用户 ID
{
  "allinoneUserId": "uuid",
  "allinoneUsername": "username"
}

// 选项 2: 使用 New Day playerId（如果已存在）
{
  "playerId": "uuid"
}
```

---

### 3. ⚠️ AllinONE 市场 API 方法错误

**问题**: `GET /api/allinone/market/list` 返回 405 Method Not Allowed

**说明**: 该端点可能只支持 POST 请求，或不存在

**需要确认**:
- 端点是否存在？正确路径是什么？
- 支持的 HTTP 方法是什么？（GET / POST）
- 需要什么参数？

---

### 4. ⚠️ AllinONE API 需要认证

**受影响端点**:
- `GET /api/allinone/inventory` → 401
- `GET /api/allinone/wallet/balance` → 401

**说明**: 这些端点需要有效的 token，但由于登录端点失败，无法获取 token

---

## 📋 要求 New Day 团队完成的任务

### 优先级 1 (Critical - 阻塞集成)

1. **修复共享 API 的 CORS 配置**
   - 文件: `src/app/api/shared/[route]/route.ts`
   - 添加 CORS 响应头到所有共享 API 端点
   - 确保支持 OPTIONS 预检请求

2. **实现 AllinONE 登录端点**
   - 路径: `POST /api/allinone/auth/login`
   - 接受 AllinONE 用户信息（userId, username, email 等）
   - 返回 JWT token 和 playerId
   - 关联 AllinONE 用户和 New Day 玩家

### 优先级 2 (High - 重要功能)

3. **确认并修复 AllinONE 市场 API**
   - 确认端点路径是否正确：`/api/allinone/market/list` 或 `/api/allinone/market/items`
   - 确认支持的 HTTP 方法（GET 或 POST）
   - 添加正确的 CORS 配置

4. **实现 AllinONE 库存 API**
   - 路径: `GET /api/allinone/inventory`
   - 接受 Authorization 头（Bearer token）
   - 返回玩家的道具列表

5. **实现 AllinONE 钱包 API**
   - 路径: `GET /api/allinone/wallet/balance`
   - 接受 Authorization 头（Bearer token）
   - 返回玩家的钱包余额

### 优先级 3 (Medium - 增强功能)

6. **实现道具购买 API**
   - 路径: `POST /api/allinone/market/purchase`
   - 参数: `{ itemId, currencyType, quantity }`
   - 扣除钱包余额，添加道具到库存

7. **实现道具转移 API**
   - 路径: `POST /api/allinone/market/transfer`
   - 参数: `{ itemId, targetPlatform, quantity }`
   - 在平台间转移道具

---

## 🔧 临时解决方案

在 New Day 团队修复上述问题之前，可以采取以下临时方案：

### 方案 1: 使用命令行测试（绕过 CORS）
使用 PowerShell 或 cURL 直接测试 API，验证端点功能

### 方案 2: 使用 New Day 原生认证
暂时使用 New Day 原生的 `playerId` 认证方式：
1. 从 New Day 前端获取 `playerId`（localStorage）
2. 直接使用 `playerId` 调用 New Day API
3. 不通过 AllinONE 登录端点

### 方案 3: 禁用浏览器安全限制（仅开发环境）
在开发时启动 Chrome 时禁用 CORS：
```bash
chrome.exe --disable-web-security --user-data-dir="C:/chrome_dev"
```

---

## 📝 AllinONE 端点列表

根据文档，需要实现的端点：

### 认证相关
- ✅ `POST /api/allinone/auth/login` - **需要实现**

### 库存相关
- ✅ `GET /api/allinone/inventory` - **需要修复认证**
- ❓ `POST /api/allinone/inventory/add` - 未在文档中

### 市场相关
- ✅ `GET /api/allinone/market/list` - **需要修复方法错误**
- ❌ `POST /api/allinone/market/purchase` - 需要实现
- ❌ `POST /api/allinone/market/transfer` - 需要实现
- ❌ `POST /api/allinone/market/list` - ？？可能应该是 GET

### 钱包相关
- ✅ `GET /api/allinone/wallet/balance` - **需要修复认证**

---

## 🎯 下一步行动

### 给 New Day 团队的请求：

1. **立即修复** CORS 配置问题（所有共享 API）
2. **实现** `/api/allinone/auth/login` 端点
3. **确认** 并修复 `/api/allinone/market/list` 端点
4. **提供** 所有 AllinONE 端点的正确参数格式和示例

### 给 AllinONE 开发团队的建议：

1. **等待** New Day 团队修复上述问题
2. **准备** 调整认证流程（如果需要）
3. **测试** 修复后的端点
4. **完成** 深度集成功能实现

---

## 📞 联系方式

如有疑问，请联系：
- **New Day 开发团队**: [联系方式]
- **AllinONE 开发团队**: [联系方式]

---

**报告生成时间**: 2026-01-29
**版本**: 1.0
**状态**: 等待 New Day 团队修复
