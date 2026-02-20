# New Day API CORS 配置请求

**日期**: 2026-01-28
**请求方**: AllinONE 团队
**目标方**: New Day 开发团队

---

## 📋 概述

AllinONE 平台在集成 New Day 游戏时,发现 `/api/allinone/*` 路径的 API 端点缺少 CORS (跨域资源共享) 配置,导致浏览器端无法直接调用这些 API。

**影响范围**: 所有使用 `/api/allinone/*` 前缀的 API 端点

---

## 🔍 问题描述

### 当前情况

✅ **命令行测试**: 成功
- 所有 API 端点在命令行环境下正常工作
- 功能完整,响应正确

❌ **浏览器测试**: 失败
- 浏览器前端无法直接调用 `/api/allinone/*` API
- 报错信息:
```
Access to fetch at 'https://yxp6y2qgnh.coze.site/api/allinone/auth/login'
from origin 'null' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 测试证据

#### 1. API 端点测试结果

| 端点 | 命令行测试 | 浏览器测试 |
|------|-----------|-----------|
| `POST /api/allinone/auth/login` | ✅ 成功 | ❌ CORS 错误 |
| `GET /api/allinone/wallet/balance` | ✅ 成功 | ❌ CORS 错误 |
| `GET /api/allinone/inventory` | ✅ 成功 | ❌ CORS 错误 |
| `GET /api/allinone/market/items` | ✅ 成功 | ❌ CORS 错误 |
| `POST /api/allinone/market/list` | ✅ 成功 | ❌ CORS 错误 |

#### 2. 对比分析

**已配置 CORS 的端点** (参考文档: ALLINONE_INTEGRATION_DOCUMENTATION.md 第 283-289 行):

```typescript
// /api/shared/marketplace - CORS 已正确配置
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

**未配置 CORS 的端点**:
- `/api/allinone/*` 下所有端点缺少 CORS 响应头

---

## 🎯 需要的配置

请在 `/api/allinone/*` 路径的所有 API 路由中添加以下 CORS 响应头:

### 推荐配置 (宽松模式)

```typescript
// Next.js API Route 示例
// 文件位置: src/app/api/allinone/.../route.ts

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// 在所有响应中添加 CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  // ... 业务逻辑 ...
  return NextResponse.json(data, { headers: corsHeaders });
}

export async function POST(request: Request) {
  // ... 业务逻辑 ...
  return NextResponse.json(data, { headers: corsHeaders });
}
```

### 更安全的配置 (推荐生产环境)

```typescript
// 只允许特定域名访问
const allowedOrigins = [
  'http://localhost:5173',
  'https://allinone.example.com',
  'https://your-production-domain.com'
];

function getCorsHeaders(origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  return {};
}
```

---

## 📁 需要修改的文件

基于 New Day 项目结构 (文档: ALLINONE_INTEGRATION_DOCUMENTATION.md 第 658-660 行):

```
src/app/api/allinone/
├── auth/
│   └── login/
│       └── route.ts          ← 需要添加 CORS
├── wallet/
│   └── balance/
│       └── route.ts          ← 需要添加 CORS
├── inventory/
│   └── route.ts             ← 需要添加 CORS
├── market/
│   ├── items/
│   │   └── route.ts         ← 需要添加 CORS
│   └── list/
│       └── route.ts         ← 需要添加 CORS
├── purchase/
│   └── route.ts            ← 需要添加 CORS
└── transfer/
    └── route.ts            ← 需要添加 CORS
```

---

## 🔧 实现方案

### 方案 1: 全局中间件 (推荐)

创建全局 CORS 中间件,统一处理所有请求:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 为所有 /api/allinone 路径添加 CORS
  if (request.nextUrl.pathname.startsWith('/api/allinone')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: '/api/allinone/:path*',
};
```

### 方案 2: 工具函数 (备选)

创建共享的 CORS 工具函数:

```typescript
// src/lib/cors.ts
export function setCorsHeaders(headers: Headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 在 API Route 中使用
import { setCorsHeaders } from '@/lib/cors';

export async function GET() {
  const headers = new Headers();
  setCorsHeaders(headers);
  // ... 业务逻辑 ...
  return new Response(JSON.stringify(data), { headers });
}
```

---

## ✅ 验证方法

配置完成后,可以使用以下方法验证:

### 1. 使用浏览器测试工具

打开项目中的 `test-newday-api.html`:
- 双击打开文件
- 尝试登录和获取余额
- 不应再出现 CORS 错误

### 2. 使用 curl 测试 OPTIONS 请求

```bash
curl -X OPTIONS \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -H "Origin: http://localhost:5173" \
  -v https://yxp6y2qgnh.coze.site/api/allinone/auth/login
```

期望响应中包含:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization
```

### 3. 浏览器控制台测试

```javascript
fetch('https://yxp6y2qgnh.coze.site/api/allinone/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'test_001',
    username: 'TestPlayer',
    platform: 'newday'
  })
})
.then(r => r.json())
.then(data => console.log('✅ 成功:', data))
.catch(err => console.error('❌ 失败:', err));
```

---

## 📞 联系方式

如有疑问,请联系:

**AllinONE 集成负责人**:
- 团队: AllinONE 开发团队
- 文档位置:
  - `ALLINONE_INTEGRATION.md` - 集成功能文档
  - `ALLINONE_API.md` - API 端点文档
  - `ALLINONE_INTEGRATION_DOCUMENTATION.md` - 完整集成文档

---

## 🙏 感谢

感谢 New Day 团队支持跨平台集成!配置完成后,我们将能够:
- ✅ 在 AllinONE 前端直接调用 New Day API
- ✅ 实现跨游戏道具交易
- ✅ 统一管理玩家钱包和库存
- ✅ 提供更好的用户体验

---

**文档版本**: 1.0
**最后更新**: 2026-01-28
