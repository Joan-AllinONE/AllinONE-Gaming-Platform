/**
 * AllinONE Skill 系统 - 认证 Skill
 * 统一认证、权限管理和会话管理
 */

import { BaseSkill } from '../BaseSkill';
import {
  SkillDefinition,
  SkillContext,
  JSONSchema,
  SkillErrorCode,
} from '../types';
import { SkillErrors } from '../errors';

// ==================== 类型定义 ====================

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, any>;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  username: string;
  password: string;
  platform?: string;
  deviceId?: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  inviteCode?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  platform: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
  lastActiveAt: number;
}

// ==================== Skill 定义 ====================

const authSkillDefinition: SkillDefinition = {
  name: 'auth',
  displayName: '认证服务',
  version: '1.0.0',
  description: '统一认证、权限管理和会话管理 Skill',
  requiredPermissions: [],
  dependencies: [],
  actions: [],
  events: [
    'auth.login',      // 用户登录
    'auth.logout',     // 用户登出
    'auth.token.refresh', // Token 刷新
    'auth.session.expired', // 会话过期
  ],
};

// ==================== Auth Skill 实现 ====================

export class AuthSkill extends BaseSkill {
  private tokenKey = 'allinone_auth_token';
  private userKey = 'allinone_auth_user';
  private sessionKey = 'allinone_auth_session';
  private currentUser: User | null = null;
  private currentToken: AuthToken | null = null;
  private sessions: Map<string, SessionInfo> = new Map();

  constructor() {
    super(authSkillDefinition);
  }

  async onInitialize(): Promise<void> {
    // 从 localStorage 恢复会话
    this.restoreSession();
    
    // 注册所有动作
    this.registerActions();
  }

  private registerActions(): void {
    // 登录
    this.registerAction(
      'login',
      this.login.bind(this),
      {
        displayName: '用户登录',
        description: '使用用户名和密码登录',
        paramsSchema: {
          type: 'object',
          properties: {
            username: { type: 'string', description: '用户名' },
            password: { type: 'string', description: '密码' },
            platform: { type: 'string', description: '平台标识' },
            deviceId: { type: 'string', description: '设备ID' },
          },
          required: ['username', 'password'],
        },
        returnsSchema: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            token: { type: 'object' },
            sessionId: { type: 'string' },
          },
        },
        requiredPermissions: [],
        readonly: false,
        idempotent: false,
      }
    );

    // 登出
    this.registerAction(
      'logout',
      this.logout.bind(this),
      {
        displayName: '用户登出',
        description: '注销当前用户会话',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
        requiredPermissions: [],
        readonly: false,
        idempotent: true,
      }
    );

    // 获取当前用户
    this.registerAction(
      'getCurrentUser',
      this.getCurrentUser.bind(this),
      {
        displayName: '获取当前用户',
        description: '获取当前登录用户信息',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object' },
        requiredPermissions: [],
        readonly: true,
        idempotent: true,
      }
    );

    // 刷新 Token
    this.registerAction(
      'refreshToken',
      this.refreshToken.bind(this),
      {
        displayName: '刷新令牌',
        description: '刷新访问令牌',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object' },
        requiredPermissions: [],
        readonly: false,
        idempotent: false,
      }
    );

    // 验证 Token
    this.registerAction(
      'verifyToken',
      this.verifyToken.bind(this),
      {
        displayName: '验证令牌',
        description: '验证访问令牌是否有效',
        paramsSchema: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
        returnsSchema: { type: 'object', properties: { valid: { type: 'boolean' } } },
        requiredPermissions: [],
        readonly: true,
        idempotent: true,
      }
    );

    // 检查权限
    this.registerAction(
      'checkPermission',
      this.checkPermission.bind(this),
      {
        displayName: '检查权限',
        description: '检查当前用户是否拥有指定权限',
        paramsSchema: {
          type: 'object',
          properties: {
            permission: { type: 'string' },
          },
          required: ['permission'],
        },
        returnsSchema: { type: 'object', properties: { hasPermission: { type: 'boolean' } } },
        requiredPermissions: [],
        readonly: true,
        idempotent: true,
      }
    );

    // 注册新用户
    this.registerAction(
      'register',
      this.register.bind(this),
      {
        displayName: '用户注册',
        description: '注册新用户账号',
        paramsSchema: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
            email: { type: 'string' },
            inviteCode: { type: 'string' },
          },
          required: ['username', 'password'],
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: [],
        readonly: false,
        idempotent: false,
      }
    );

    // 获取所有会话
    this.registerAction(
      'getSessions',
      this.getSessions.bind(this),
      {
        displayName: '获取会话列表',
        description: '获取当前用户的所有活跃会话',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'array' },
        requiredPermissions: ['auth:read:sessions'],
        readonly: true,
        idempotent: true,
      }
    );

    // 终止会话
    this.registerAction(
      'terminateSession',
      this.terminateSession.bind(this),
      {
        displayName: '终止会话',
        description: '终止指定会话',
        paramsSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
          required: ['sessionId'],
        },
        returnsSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
        requiredPermissions: ['auth:write:sessions'],
        readonly: false,
        idempotent: true,
      }
    );
  }

  // ==================== 动作实现 ====================

  private async login(credentials: LoginCredentials, context: SkillContext) {
    const { username, password, platform = 'web', deviceId } = credentials;

    try {
      // 调用后端 API 进行认证
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '登录失败');
      }

      const data = await response.json();
      
      // 构建用户信息
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        avatar: data.user.avatar,
        roles: data.user.roles || ['user'],
        permissions: data.user.permissions || [],
        metadata: data.user.metadata,
      };

      // 构建 Token
      const token: AuthToken = {
        accessToken: data.token.accessToken,
        refreshToken: data.token.refreshToken,
        expiresAt: Date.now() + (data.token.expiresIn || 3600) * 1000,
        tokenType: 'Bearer',
      };

      // 创建会话
      const session: SessionInfo = {
        sessionId: this.generateId(),
        userId: user.id,
        platform,
        deviceId,
        createdAt: Date.now(),
        expiresAt: token.expiresAt,
        lastActiveAt: Date.now(),
      };

      // 保存状态
      this.currentUser = user;
      this.currentToken = token;
      this.sessions.set(session.sessionId, session);
      this.persistSession();

      // 发布登录事件
      this.emit('auth.login', { user, session, platform }, context);

      return {
        user: this.sanitizeUser(user),
        token: {
          accessToken: token.accessToken,
          expiresAt: token.expiresAt,
        },
        sessionId: session.sessionId,
      };

    } catch (error) {
      console.error('登录失败:', error);
      throw SkillErrors.unauthorized(error instanceof Error ? error.message : undefined);
    }
  }

  private async logout(_params: any, context: SkillContext) {
    if (!this.currentUser) {
      return { success: true, message: '用户未登录' };
    }

    // 调用后端登出 API
    try {
      if (this.currentToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentToken.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.warn('后端登出调用失败:', error);
    }

    // 发布登出事件
    this.emit('auth.logout', { userId: this.currentUser.id }, context);

    // 清除本地状态
    this.currentUser = null;
    this.currentToken = null;
    this.sessions.clear();
    this.clearSession();

    return { success: true };
  }

  private async getCurrentUser(_params: any, _context: SkillContext) {
    if (!this.currentUser) {
      return null;
    }
    return this.sanitizeUser(this.currentUser);
  }

  private async refreshToken(_params: any, context: SkillContext) {
    if (!this.currentToken?.refreshToken) {
      throw SkillErrors.unauthorized('没有刷新令牌');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.currentToken.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('刷新令牌失败');
      }

      const data = await response.json();

      this.currentToken = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || this.currentToken.refreshToken,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
        tokenType: 'Bearer',
      };

      this.persistSession();

      // 发布 Token 刷新事件
      this.emit('auth.token.refresh', { userId: this.currentUser?.id }, context);

      return {
        accessToken: this.currentToken.accessToken,
        expiresAt: this.currentToken.expiresAt,
      };
    } catch (error) {
      // 刷新失败，清除会话
      this.currentUser = null;
      this.currentToken = null;
      this.clearSession();
      
      throw SkillErrors.unauthorized('令牌已过期，请重新登录');
    }
  }

  private async verifyToken(params: { token?: string }) {
    const token = params.token || this.currentToken?.accessToken;
    
    if (!token) {
      return { valid: false, reason: 'no_token' };
    }

    // 检查本地 Token 是否过期
    if (this.currentToken && Date.now() > this.currentToken.expiresAt) {
      return { valid: false, reason: 'expired' };
    }

    // 可选：调用后端验证
    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return { valid: response.ok };
    } catch {
      return { valid: false, reason: 'network_error' };
    }
  }

  private async checkPermission(params: { permission: string }) {
    if (!this.currentUser) {
      return { hasPermission: false };
    }

    const hasPermission = this.currentUser.permissions.includes(params.permission) ||
                         this.currentUser.roles.includes('admin');

    return { hasPermission };
  }

  private async register(data: RegisterData, context: SkillContext) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '注册失败');
      }

      const result = await response.json();

      // 注册成功后自动登录
      if (result.autoLogin) {
        return this.login(
          { username: data.username, password: data.password },
          context
        );
      }

      return {
        success: true,
        userId: result.userId,
        message: '注册成功',
      };
    } catch (error) {
      throw SkillErrors.validationError('registration', error instanceof Error ? error.message : '注册失败');
    }
  }

  private async getSessions(_params: any, _context: SkillContext) {
    if (!this.currentUser) {
      return [];
    }

    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.sessionId,
      platform: session.platform,
      deviceId: session.deviceId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActiveAt: session.lastActiveAt,
    }));
  }

  private async terminateSession(params: { sessionId: string }, context: SkillContext) {
    const { sessionId } = params;
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: '会话不存在' };
    }

    this.sessions.delete(sessionId);

    // 如果终止的是当前会话，执行登出
    if (sessionId === context.sessionId) {
      return this.logout({}, context);
    }

    return { success: true };
  }

  // ==================== 辅助方法 ====================

  private restoreSession(): void {
    try {
      const tokenStr = localStorage.getItem(this.tokenKey);
      const userStr = localStorage.getItem(this.userKey);

      if (tokenStr && userStr) {
        this.currentToken = JSON.parse(tokenStr);
        this.currentUser = JSON.parse(userStr);

        // 检查 Token 是否过期
        if (this.currentToken && Date.now() > this.currentToken.expiresAt) {
          this.currentToken = null;
          this.currentUser = null;
        }
      }
    } catch (error) {
      console.error('恢复会话失败:', error);
      this.currentToken = null;
      this.currentUser = null;
    }
  }

  private persistSession(): void {
    if (this.currentToken) {
      localStorage.setItem(this.tokenKey, JSON.stringify(this.currentToken));
    }
    if (this.currentUser) {
      localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.sessionKey);
  }

  private sanitizeUser(user: User): Partial<User> {
    // 返回安全的用户信息（不包含敏感数据）
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  // ==================== 公共方法 ====================

  /**
   * 获取当前认证令牌（供其他 Skills 使用）
   */
  getAuthToken(): string | null {
    return this.currentToken?.accessToken || null;
  }

  /**
   * 检查用户是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.currentToken && Date.now() < this.currentToken.expiresAt;
  }

  /**
   * 获取认证头（供 API 调用使用）
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

// 导出单例
export const authSkill = new AuthSkill();
