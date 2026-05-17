/**
 * AllinONE Skill 系统 - JavaScript/TypeScript SDK
 * 为外部游戏提供简洁的 Skill 调用接口
 */

import {
  SkillSDK as ISkillSDK,
  SkillSDKConfig,
  SkillProxy,
  SkillResponse,
  SkillContext,
  EventHandler,
} from '../types';
import { SkillErrors } from '../errors';

/**
 * AllinONE Skill SDK
 * 
 * 使用示例：
 * ```typescript
 * const sdk = new SkillSDK();
 * await sdk.initialize({
 *   gatewayUrl: 'https://api.allinone.game/skills',
 *   appId: 'your-app-id',
 * });
 * 
 * // 方式1：直接调用
 * const balance = await sdk.call('wallet', 'getBalance');
 * 
 * // 方式2：使用代理对象
 * const wallet = sdk.getSkillProxy('wallet');
 * const balance = await wallet.getBalance();
 * 
 * // 方式3：类型安全调用
 * const inventory = sdk.getSkill<InventorySkill>('inventory');
 * const items = await inventory.getItems({ limit: 10 });
 * ```
 */
export class SkillSDK implements ISkillSDK {
  private config: SkillSDKConfig | null = null;
  private authToken: string | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: any) => any> = [];

  /**
   * 初始化 SDK
   */
  async initialize(config: SkillSDKConfig): Promise<void> {
    this.config = {
      timeout: 30000,
      retries: 3,
      environment: 'production',
      debug: false,
      ...config,
    };

    if (this.config.debug) {
      console.log('[SkillSDK] 已初始化', { appId: config.appId, environment: this.config.environment });
    }
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * 清除认证令牌
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * 调用 Skill
   * @param skillName Skill 名称
   * @param action 动作名称
   * @param params 参数
   */
  async call<T = any>(skillName: string, action: string, params?: any): Promise<T> {
    if (!this.config) {
      throw new Error('SDK 未初始化，请先调用 initialize()');
    }

    const url = `${this.config.gatewayUrl}/${skillName}/${action}`;
    const requestId = this.generateRequestId();

    const requestConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.config.appId,
        'X-Request-Id': requestId,
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
      body: JSON.stringify(params || {}),
    };

    // 应用请求拦截器
    const finalConfig = this.requestInterceptors.reduce(
      (config, interceptor) => interceptor(config),
      requestConfig
    );

    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 0; attempt < (this.config.retries || 1); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config!.timeout);

        const response = await fetch(url, {
          ...finalConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result: SkillResponse<T> = await response.json();

        // 应用响应拦截器
        const finalResult = this.responseInterceptors.reduce(
          (res, interceptor) => interceptor(res),
          result
        );

        if (!finalResult.success) {
          throw SkillErrors.unknown(finalResult.error);
        }

        return finalResult.data as T;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (this.config.debug) {
          console.warn(`[SkillSDK] 请求失败 (尝试 ${attempt + 1}/${this.config.retries}):`, lastError.message);
        }

        // 如果不是最后一次尝试，等待后重试
        if (attempt < (this.config.retries || 1) - 1) {
          await this.delay(Math.pow(2, attempt) * 1000); // 指数退避
        }
      }
    }

    throw lastError || new Error('请求失败');
  }

  /**
   * 获取 Skill 代理对象
   * 提供简洁的调用方式：skill.action(params)
   */
  getSkillProxy(skillName: string): SkillProxy {
    return new Proxy({}, {
      get: (_, action: string) => {
        return (params?: any) => this.call(skillName, action, params);
      },
    }) as SkillProxy;
  }

  /**
   * 获取类型化的 Skill 接口
   * 需要配合 TypeScript 类型定义使用
   */
  getSkill<T>(skillName: string): T {
    // 这里返回一个类型化的代理对象
    // 实际类型由调用者通过泛型参数提供
    return this.getSkillProxy(skillName) as unknown as T;
  }

  /**
   * 监听事件
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // 如果支持 WebSocket，这里可以订阅服务器事件
    this.subscribeToServerEvent(event);
  }

  /**
   * 取消监听事件
   */
  off(event: string, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: (config: any) => any): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: (response: any) => any): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 销毁 SDK
   */
  destroy(): void {
    this.eventHandlers.clear();
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.config = null;
    this.authToken = null;
  }

  // ==================== 便捷方法 ====================

  /**
   * 登录
   */
  async login(username: string, password: string): Promise<{ user: any; token: string }> {
    const result = await this.call('auth', 'login', { username, password });
    if (result.token?.accessToken) {
      this.setAuthToken(result.token.accessToken);
    }
    return result;
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await this.call('auth', 'logout');
    this.clearAuthToken();
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<any> {
    return this.call('auth', 'getCurrentUser');
  }

  // ==================== 私有方法 ====================

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private subscribeToServerEvent(event: string): void {
    // 实际实现中，这里应该建立 WebSocket 连接并订阅事件
    if (this.config?.debug) {
      console.log(`[SkillSDK] 订阅事件: ${event}`);
    }
  }
}

/**
 * 创建预配置的 SDK 实例（用于快速接入）
 */
export function createSDK(config: Partial<SkillSDKConfig> & { appId: string }): SkillSDK {
  const sdk = new SkillSDK();
  
  // 自动检测环境
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  sdk.initialize({
    gatewayUrl: isDev ? 'http://localhost:3000/api/skills' : 'https://api.allinone.game/skills',
    environment: isDev ? 'development' : 'production',
    debug: isDev,
    ...config,
  });

  return sdk;
}

// 导出默认实例
export const skillSDK = new SkillSDK();
