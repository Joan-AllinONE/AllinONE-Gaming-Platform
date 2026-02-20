# New Day 自动登录集成指南

## 问题描述
用户在 AllinONE 登录后，进入 New Day 还需要手动填写用户名登录。如果填写的用户名和 AllinONE 不一致，就无法同步道具。

## 解决方案
通过 URL 参数自动传递登录信息，实现无缝单点登录（SSO）。

---

## 实施步骤

### 1. AllinONE 端修改（已完成）

修改了 `src/pages/GameCenter.tsx`：
- 点击 New Day 游戏时，自动生成带登录参数的 URL
- URL 格式：`https://yxp6y2qgnh.coze.site/?autoLogin=true&token=xxx&userId=xxx&username=xxx`

### 2. New Day 端修改

#### 2.1 添加 Token 验证 API

创建文件：`app/api/allinone/auth/verify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleVerifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const response = await handleVerifyToken(request);
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[API] 验证 token 错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

#### 2.2 修改登录页面

在你的 New Day 登录页面（通常是 `app/login/page.tsx` 或 `pages/login.tsx`）添加自动登录逻辑：

```typescript
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  useEffect(() => {
    // 检查是否有 AllinONE 的自动登录参数
    const autoLogin = searchParams.get('autoLogin');
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (autoLogin === 'true' && token && userId && username) {
      handleAutoLogin(token, userId, username);
    }
  }, [searchParams]);

  async function handleAutoLogin(token: string, userId: string, username: string) {
    setIsAutoLoggingIn(true);
    
    try {
      // 1. 验证 token 是否有效
      const verifyResponse = await fetch('/api/allinone/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!verifyResponse.ok) {
        console.warn('⚠️ Token 验证失败，显示登录界面');
        setIsAutoLoggingIn(false);
        return;
      }

      // 2. token 有效，调用登录 API（复用已有 token）
      const loginResponse = await fetch('/api/allinone/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allinoneUserId: userId,
          allinoneUsername: username,
          token: token, // 传递已有 token，避免重新生成
        }),
      });

      const data = await loginResponse.json();

      if (data.success) {
        console.log('✅ 自动登录成功:', data.username);
        
        // 3. 存储登录状态
        localStorage.setItem('newday_user', JSON.stringify({
          userId: data.userId,
          username: data.username,
          token: data.token,
        }));

        // 4. 跳转到游戏主页面
        router.replace('/game'); // 或你的游戏主页路径
      } else {
        console.error('❌ 自动登录失败:', data.message);
        setIsAutoLoggingIn(false);
      }
    } catch (error) {
      console.error('❌ 自动登录出错:', error);
      setIsAutoLoggingIn(false);
    }
  }

  // 显示自动登录中状态
  if (isAutoLoggingIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">正在从 AllinONE 同步登录状态...</p>
          <p className="text-sm text-gray-500 mt-2">请稍候</p>
        </div>
      </div>
    );
  }

  // 正常的登录表单
  return (
    <div className="login-form">
      {/* 你的原有登录表单代码 */}
    </div>
  );
}
```

#### 2.3 修改 auth.ts（已完成）

已添加 `handleVerifyToken` 函数和自动登录逻辑。

---

## 数据流向

```
┌─────────────────────────────────────────────────────────────────┐
│                          AllinONE 平台                           │
│  ┌─────────────┐                                               │
│  │ 用户登录    │                                               │
│  │ newbie2025  │                                               │
│  └──────┬──────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐     生成 token     ┌─────────────────────┐    │
│  │ 点击 New Day │ ─────────────────▶ │ New Day API 登录    │    │
│  │ 游戏按钮    │                    │ /api/allinone/auth/ │    │
│  └─────────────┘                    │ login               │    │
│                                     └─────────────────────┘    │
│                                                           │     │
│  ┌─────────────┐                                         │     │
│  │ 打开新窗口   │ ◀───────────────────────────────────────┘     │
│  │ 带登录参数  │                                                 │
│  │ ?autoLogin= │                                                 │
│  │ true&token= │                                                 │
│  │ xxx&userId= │                                                 │
│  │ xxx         │                                                 │
│  └──────┬──────┘                                                 │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ 新窗口打开
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         New Day 游戏                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 登录页面                                                  │   │
│  │                                                          │   │
│  │ 检测到 URL 参数 autoLogin=true                           │   │
│  │                                                          │   │
│  │ ┌─────────────────┐    ┌─────────────────┐              │   │
│  │ │ 验证 token      │───▶│ 调用登录 API    │              │   │
│  │ │ /api/allinone/  │    │ /api/allinone/  │              │   │
│  │ │ auth/verify     │    │ auth/login      │              │   │
│  │ └─────────────────┘    └─────────────────┘              │   │
│  │                                 │                        │   │
│  │                                 ▼                        │   │
│  │                        ┌─────────────────┐               │   │
│  │                        │ 登录成功        │               │   │
│  │                        │ 跳转到游戏      │               │   │
│  │                        └─────────────────┘               │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 注意事项

1. **Token 有效期**：默认 7 天，过期后需要重新登录
2. **用户名一致性**：确保 AllinONE 和 New Day 使用相同的用户名
3. **安全性**：Token 通过 URL 传递，建议使用 HTTPS
4. **用户体验**：添加自动登录加载状态，避免用户困惑

---

## 测试步骤

1. 在 AllinONE 登录账号（如 `newbie2025`）
2. 进入游戏中心，点击 New Day 游戏
3. 新窗口应该自动登录，**不需要手动输入用户名**
4. 在 New Day 购买道具，检查是否同步到 AllinONE

---

## 相关文件

- AllinONE 端：`src/pages/GameCenter.tsx`
- New Day 端：`auth.ts`（已修改）
- New Day 端：`app/api/allinone/auth/verify/route.ts`（需创建）
- New Day 端：登录页面（需修改）
