/**
 * 跨平台身份认证服务
 * 用于 AllinONE 与外部游戏(如 New Day) 之间的身份验证
 */

interface AuthToken {
  token: string;
  userId: string;
  email: string;
  username: string;
  expiresAt: number;
}

interface PlatformUserInfo {
  userId: string;
  email: string;
  username: string;
  platform: 'allinone' | 'newday';
  role?: string;
}

class CrossPlatformAuthService {
  private readonly TOKEN_KEY = 'cross_platform_token';
  private readonly NEWDAY_TOKEN_KEY = 'newday_token'; // New Day 独立的 token key
  private readonly USER_KEY = 'cross_platform_user';
  private readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  private readonly NEWDAY_API_BASE = 'https://yxp6y2qgnh.coze.site/api'; // New Day API 地址
  private token: AuthToken | null = null;
  private newdayToken: AuthToken | null = null; // New Day token 缓存

  /**
   * 生成并存储跨平台令牌
   */
  async generateCrossPlatformToken(userInfo: PlatformUserInfo): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/cross-platform-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      });

      if (!response.ok) {
        console.warn('Cross-platform auth API not available, using local token');
        // 即使 API 不可用，也创建本地 token 以支持自动登录
        const localToken: AuthToken = {
          token: `local_${userInfo.userId}_${Date.now()}`,
          userId: userInfo.userId,
          email: userInfo.email,
          username: userInfo.username,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天有效期
        };
        this.token = localToken;
        this.storeToken(localToken);
        console.log('✅ 本地 cross_platform_token 已创建');
        return localToken.token;
      }

      const data = await response.json();
      const token: AuthToken = {
        token: data.token,
        userId: data.userId,
        email: data.email,
        username: data.username,
        expiresAt: data.expiresAt,
      };

      this.token = token;
      this.storeToken(token);

      return token.token;
    } catch (error) {
      console.warn('Error generating cross-platform token, using local token:', error);
      // 即使出错，也创建本地 token 以支持自动登录
      const localToken: AuthToken = {
        token: `local_${userInfo.userId}_${Date.now()}`,
        userId: userInfo.userId,
        email: userInfo.email,
        username: userInfo.username,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天有效期
      };
      this.token = localToken;
      this.storeToken(localToken);
      console.log('✅ 本地 cross_platform_token 已创建（错误恢复）');
      return localToken.token;
    }
  }

  /**
   * 验证跨平台令牌
   */
  async validateCrossPlatformToken(token: string): Promise<PlatformUserInfo | null> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/validate-cross-platform-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error validating cross-platform token:', error);
      return null;
    }
  }

  /**
   * 获取当前令牌
   */
  getToken(): string | null {
    if (!this.token) {
      this.token = this.loadToken();
    }
    const token = this.token?.token || null;
    console.log('🔑 crossPlatformAuthService.getToken():', token ? `${token.substring(0, 30)}...` : 'null');
    return token;
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): PlatformUserInfo | null {
    if (!this.token) {
      this.token = this.loadToken();
    }

    if (!this.token) {
      return null;
    }

    return {
      userId: this.token.userId,
      email: this.token.email,
      username: this.token.username,
      platform: 'allinone',
    };
  }

  /**
   * 检查令牌是否有效
   */
  isTokenValid(): boolean {
    if (!this.token) {
      this.token = this.loadToken();
    }

    if (!this.token) {
      return false;
    }

    return this.token.expiresAt > Date.now();
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<string | null> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE}/auth/refresh-cross-platform-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newToken: AuthToken = {
        token: data.token,
        userId: data.userId,
        email: data.email,
        username: data.username,
        expiresAt: data.expiresAt,
      };

      this.token = newToken;
      this.storeToken(newToken);

      return newToken.token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearToken();
      return null;
    }
  }

  /**
   * 清除令牌
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * 存储令牌到本地
   */
  private storeToken(token: AuthToken): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(token));
  }

  /**
   * 存储 New Day 令牌到本地
   */
  private storeNewDayToken(token: AuthToken): void {
    this.newdayToken = token;
    localStorage.setItem(this.NEWDAY_TOKEN_KEY, JSON.stringify(token));
  }

  /**
   * 从本地加载 New Day 令牌
   */
  private loadNewDayToken(): AuthToken | null {
    const tokenStr = localStorage.getItem(this.NEWDAY_TOKEN_KEY);
    if (!tokenStr) {
      console.log('📭 No New Day token found in localStorage');
      return null;
    }

    try {
      const token = JSON.parse(tokenStr) as AuthToken;
      console.log('📋 Loaded New Day token from localStorage:', {
        userId: token.userId,
        username: token.username,
        expiresAt: new Date(token.expiresAt).toISOString(),
        isExpired: token.expiresAt <= Date.now()
      });
      if (token.expiresAt <= Date.now()) {
        console.warn('⚠️ New Day token expired, clearing...');
        this.clearNewDayToken();
        return null;
      }
      return token;
    } catch (e) {
      console.error('❌ Error parsing New Day token:', e);
      this.clearNewDayToken();
      return null;
    }
  }

  /**
   * 获取 New Day 令牌
   */
  getNewDayToken(): string | null {
    if (!this.newdayToken) {
      this.newdayToken = this.loadNewDayToken();
    }
    const token = this.newdayToken?.token || null;
    console.log('🔑 crossPlatformAuthService.getNewDayToken():', token ? `${token.substring(0, 30)}...` : 'null');
    return token;
  }

  /**
   * 清除 New Day 令牌
   */
  clearNewDayToken(): void {
    this.newdayToken = null;
    localStorage.removeItem(this.NEWDAY_TOKEN_KEY);
  }

  /**
   * 从本地加载令牌
   */
  private loadToken(): AuthToken | null {
    const tokenStr = localStorage.getItem(this.TOKEN_KEY);
    if (!tokenStr) {
      console.log('📭 No token found in localStorage');
      return null;
    }

    try {
      const token = JSON.parse(tokenStr) as AuthToken;
      console.log('📋 Loaded token from localStorage:', {
        userId: token.userId,
        username: token.username,
        expiresAt: new Date(token.expiresAt).toISOString(),
        isExpired: token.expiresAt <= Date.now()
      });
      if (token.expiresAt <= Date.now()) {
        console.warn('⚠️ Token expired, clearing...');
        this.clearToken();
        return null;
      }
      return token;
    } catch (e) {
      console.error('❌ Error parsing token:', e);
      this.clearToken();
      return null;
    }
  }

  /**
   * 获取认证头
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * 生成 New Day 游戏的认证令牌
   * 使用 AllinONE 用户信息登录 New Day 游戏
   */
  async generateNewDayToken(userInfo: PlatformUserInfo): Promise<string> {
    try {
      const requestBody = {
        allinoneUserId: userInfo.userId,
        allinoneUsername: userInfo.username,
      };
      console.log('📤 Sending login request to New Day:', requestBody);

      const response = await fetch(`${this.NEWDAY_API_BASE}/allinone/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 New Day login response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('New Day auth API not available, status:', response.status, 'error:', errorText);
        return '';
      }

      const data = await response.json();
      console.log('📥 New Day login response data:', { ...data, token: data.token ? `${data.token.substring(0, 30)}...` : undefined });

      // 存储返回的 token (使用独立的 New Day token key)
      if (data.token) {
        const authToken: AuthToken = {
          token: data.token,
          userId: data.userId || userInfo.userId,
          email: userInfo.email,
          username: data.username || userInfo.username,
          expiresAt: data.expiresAt || (Date.now() + 24 * 60 * 60 * 1000), // 默认24小时
        };
        this.storeNewDayToken(authToken);
        console.log('✅ New Day token stored successfully');
      } else {
        console.warn('⚠️ New Day login response missing token');
      }

      return data.token || '';
    } catch (error) {
      console.warn('Error generating New Day token:', error);
      return '';
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.API_BASE}/auth/cross-platform-logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearToken();
      this.clearNewDayToken();
    }
  }
}

// 导出单例
export const crossPlatformAuthService = new CrossPlatformAuthService();
