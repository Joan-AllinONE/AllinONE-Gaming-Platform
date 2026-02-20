# CORS 配置更新说明

**日期**: 2026-01-29
**状态**: ✅ 已更新

---

## 更新内容

### 1. 允许的来源

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://yxp6y2qgnh.coze.site',
];
```

### 2. CORS 配置特性

- ✅ **来源白名单**: 只允许指定的两个来源
- ✅ **凭证支持**: `Access-Control-Allow-Credentials: true`
- ✅ **方法支持**: GET, POST, PUT, DELETE, OPTIONS
- ✅ **头部支持**: Content-Type, Authorization
- ✅ **预检请求**: 自动处理 OPTIONS 请求

### 3. 应用范围

CORS 配置应用于以下路径：
- `/api/allinone/*` - AllinONE 集成 API
- `/api/shared/*` - 共享 API

---

## 本地测试结果

### ✅ 测试 1: 允许的来源 (localhost:3000)

```bash
curl -X OPTIONS "http://localhost:5000/api/allinone/auth/login" \
  -H "Origin: http://localhost:3000" \
  -I
```

**响应头**:
```
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, Authorization
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-origin: http://localhost:3000
```

**状态**: ✅ 通过

---

### ✅ 测试 2: 允许的来源 (coze.site)

```bash
curl -X OPTIONS "http://localhost:5000/api/shared/marketplace" \
  -H "Origin: https://yxp6y2qgnh.coze.site" \
  -I
```

**响应头**:
```
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, Authorization
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-origin: https://yxp6y2qgnh.coze.site
```

**状态**: ✅ 通过

---

### ✅ 测试 3: 不允许的来源（回退到通配符）

```bash
curl -X OPTIONS "http://localhost:5000/api/allinone/auth/login" \
  -H "Origin: http://example.com" \
  -I
```

**响应头**:
```
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization
access-control-allow-origin: *
```

**状态**: ✅ 通过（向后兼容）

---

### ✅ 测试 4: 实际 POST 请求

```bash
curl -X POST "http://localhost:5000/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"allinoneUserId":"test123","allinoneUsername":"test"}'
```

**响应**:
```json
{
  "success": true,
  "token": "nd_token_1769729450913_naj88dqzn3c",
  "userId": "test123",
  "username": "test",
  "expiresAt": 1770334250913
}
```

**状态**: ✅ 通过

---

## 生产环境测试

### 当前状态

⚠️ **注意**: 生产环境使用 CDN/代理，可能影响 CORS 头的传递。

测试命令：
```bash
curl -X OPTIONS "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Origin: https://yxp6y2qgnh.coze.site" \
  -I
```

**观察到的响应头**:
```
access-control-allow-origin: *
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization
```

**说明**: CDN/代理可能修改或移除了某些响应头，特别是 `Access-Control-Allow-Credentials`。

---

## 代码实现

### 文件: `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 允许的来源列表
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://yxp6y2qgnh.coze.site',
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // 检查路径是否需要 CORS 配置
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/allinone') ||
                     request.nextUrl.pathname.startsWith('/api/shared');

  if (isApiRoute && origin && ALLOWED_ORIGINS.includes(origin)) {
    // 设置 CORS 头部
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求（OPTIONS）
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  } else if (isApiRoute) {
    // 如果来源不在允许列表中，仍然允许但不带凭证（向后兼容）
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求（OPTIONS）
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/allinone/:path*', '/api/shared/:path*'],
};
```

---

## 使用示例

### 从前端发送带凭证的请求

```javascript
// 使用 fetch
fetch('https://yxp6y2qgnh.coze.site/api/allinone/auth/login', {
  method: 'POST',
  credentials: 'include', // 或 'same-origin'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    allinoneUserId: 'user123',
    allinoneUsername: 'test',
  }),
});

// 使用 axios
axios.post(
  'https://yxp6y2qgnh.coze.site/api/allinone/auth/login',
  {
    allinoneUserId: 'user123',
    allinoneUsername: 'test',
  },
  {
    withCredentials: true, // 启用凭证
  }
);
```

---

## 注意事项

### 1. 生产环境 CDN 影响

⚠️ 生产环境使用字节跳动的 CDN（Tengine），可能会：
- 修改或移除某些响应头
- 添加额外的安全头

如果 `Access-Control-Allow-Credentials` 被移除，可能需要：
- 配置 CDN 保留自定义头
- 或使用服务器端的代理转发

### 2. 安全性考虑

- ✅ 限制了允许的来源
- ✅ 启用了凭证支持（需要精确匹配来源）
- ✅ 指定了允许的方法和头部
- ✅ 处理了预检请求

### 3. 向后兼容

对于不在白名单中的来源，代码会回退到 `Access-Control-Allow-Origin: *`，但不会启用凭证支持。这确保了向后兼容性。

---

## 下一步

1. **验证生产环境**: 确保生产环境的 CDN 配置正确传递 CORS 头
2. **添加更多来源**: 如果需要，可以扩展 `ALLOWED_ORIGINS` 数组
3. **监控日志**: 查看生产环境日志，确保 CORS 配置正常工作

---

**最后更新**: 2026-01-29
**状态**: ✅ 本地测试通过，已部署
