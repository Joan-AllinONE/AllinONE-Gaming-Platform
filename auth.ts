/**
 * New Day 游戏认证 API
 * 用于处理 AllinONE 平台的跨平台认证
 */

import { getDb } from "coze-coding-dev-sdk";
import { players } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

interface User {
  id: string;
  username: string;
  platform: 'allinone' | 'newday' | 'direct';
  createdAt: number;
}

interface AuthToken {
  token: string;
  userId: string;
  username: string;
  platform: string;
  expiresAt: number;
}

// 模拟 token 存储（实际项目中可以使用 Redis）
const tokens = new Map<string, AuthToken>();

// 生成令牌
function generateToken(): string {
  return 'nd_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
}

// 处理登录请求
export async function handleLogin(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // 支持多种参数格式以兼容不同平台
    const userId = body.allinoneUserId || body.userId || body.playerId;
    const username = body.allinoneUsername || body.username || body.playerName || 'Player';
    const platform = body.platform || 'allinone';
    const existingToken = body.token; // 从 AllinONE 传来的 token

    if (!userId) {
      return Response.json(
        { success: false, message: '缺少必要参数 userId/allinoneUserId' },
        { status: 400 }
      );
    }

    // 如果提供了已有 token，验证它是否有效
    if (existingToken) {
      const storedToken = tokens.get(existingToken);
      if (storedToken && storedToken.userId === userId && storedToken.expiresAt > Date.now()) {
        console.log(`用户自动登录: ${username} (${platform}), ID: ${userId}`);
        return Response.json({
          success: true,
          token: existingToken,
          userId: storedToken.userId,
          username: storedToken.username,
          expiresAt: storedToken.expiresAt,
          autoLogin: true, // 标记为自动登录
        });
      }
    }

    // 使用数据库查找或创建用户
    const db = await getDb();
    
    // 查找用户
    const existingUsers = await db
      .select()
      .from(players)
      .where(eq(players.id, userId));

    let user;

    if (existingUsers && existingUsers.length > 0) {
      // 用户已存在
      user = existingUsers[0];
      console.log(`用户登录: ${username} (${platform}), ID: ${user.id}`);
    } else {
      // 创建新用户
      const newUsers = await db.insert(players)
        .values({
          id: userId,
          nickname: username,
          preferences: { platform },
          totalAdventures: 0,
          memoryFragmentsCollected: 0,
        })
        .returning();
      
      user = newUsers[0];
      console.log(`新用户注册: ${username} (${platform}), ID: ${user.id}`);
    }

    // 生成令牌（7天有效期）
    const token: AuthToken = {
      token: generateToken(),
      userId: user.id,
      username: user.nickname,
      platform: platform,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天
    };

    tokens.set(token.token, token);

    return Response.json({
      success: true,
      token: token.token,
      userId: user.id,
      username: user.nickname,
      expiresAt: token.expiresAt,
    });
  } catch (error) {
    console.error('登录错误:', error);
    return Response.json(
      { success: false, message: '登录失败' },
      { status: 500 }
    );
  }
}

// 验证令牌中间件
export function verifyToken(request: Request): AuthToken | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const authToken = tokens.get(token);

  if (!authToken || authToken.expiresAt < Date.now()) {
    return null;
  }

  return authToken;
}

// 验证 token 的 API 端点（用于自动登录）
export async function handleVerifyToken(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return Response.json(
        { success: false, message: '缺少 token 参数' },
        { status: 400 }
      );
    }

    const authToken = tokens.get(token);

    if (!authToken) {
      return Response.json(
        { success: false, message: 'Token 不存在' },
        { status: 401 }
      );
    }

    if (authToken.expiresAt < Date.now()) {
      return Response.json(
        { success: false, message: 'Token 已过期' },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      userId: authToken.userId,
      username: authToken.username,
      platform: authToken.platform,
      expiresAt: authToken.expiresAt,
    });
  } catch (error) {
    console.error('验证 token 错误:', error);
    return Response.json(
      { success: false, message: '验证失败' },
      { status: 500 }
    );
  }
}

// 导出类型供其他模块使用
export type { User, AuthToken };
