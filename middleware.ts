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
