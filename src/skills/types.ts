/**
 * AllinONE Skill 系统 - 核心类型定义
 * 借鉴：微信小程序插件系统 + Roblox Services + Discord Bot 架构
 */

// ==================== 基础类型 ====================

export interface SkillContext {
  /** 当前用户ID */
  userId: string;
  /** 会话ID */
  sessionId: string;
  /** 认证令牌 */
  authToken?: string;
  /** 用户权限列表 */
  permissions?: string[];
  /** 客户端信息 */
  clientInfo?: {
    platform: 'web' | 'unity' | 'cocos' | 'wechat' | 'unknown';
    version: string;
    deviceId?: string;
  };
  /** 请求来源 */
  source?: string;
  /** 扩展字段 */
  [key: string]: any;
}

export interface SkillRequest<T = any> {
  /** 动作名称 */
  action: string;
  /** 请求参数 */
  params: T;
  /** 请求上下文 */
  context: SkillContext;
  /** 请求ID（用于追踪） */
  requestId: string;
  /** 请求时间戳 */
  timestamp: number;
}

export interface SkillResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: SkillError;
  /** 请求ID */
  requestId: string;
  /** 响应时间戳 */
  timestamp: number;
  /** 元数据 */
  meta?: {
    /** 执行耗时(ms) */
    executionTime?: number;
    /** 缓存命中 */
    cached?: boolean;
    /** 版本信息 */
    version?: string;
  };
}

export interface SkillError {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 详细错误信息（调试用） */
  details?: any;
  /** 建议的修复操作 */
  suggestion?: string;
}

// ==================== Skill 定义 ====================

export interface SkillDefinition {
  /** Skill 唯一标识 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 版本号（语义化版本） */
  version: string;
  /** 描述 */
  description: string;
  /** 作者 */
  author?: string;
  /** 权限要求 */
  requiredPermissions: string[];
  /** 依赖的其他 Skills */
  dependencies?: string[];
  /** 暴露的动作列表 */
  actions: ActionDefinition[];
  /** 事件列表 */
  events?: string[];
  /** 配置Schema */
  configSchema?: JSONSchema;
}

export interface ActionDefinition {
  /** 动作名称 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 描述 */
  description: string;
  /** 参数Schema */
  paramsSchema: JSONSchema;
  /** 返回值Schema */
  returnsSchema: JSONSchema;
  /** 所需权限 */
  requiredPermissions: string[];
  /** 是否只读（不改变状态） */
  readonly: boolean;
  /** 是否幂等 */
  idempotent: boolean;
  /** 限流配置 */
  rateLimit?: {
    /** 时间窗口(ms) */
    window: number;
    /** 最大请求数 */
    maxRequests: number;
  };
}

// ==================== Skill 接口 ====================

export interface Skill {
  /** Skill 定义 */
  readonly definition: SkillDefinition;
  
  /** Skill 配置 */
  readonly config?: any;
  
  /**
   * 初始化 Skill
   * @param gateway Skill网关实例
   * @param config Skill配置
   */
  initialize(gateway: SkillGatewayInterface, config?: any): Promise<void>;
  
  /**
   * 执行动作
   * @param request 请求对象
   */
  execute<T = any>(request: SkillRequest): Promise<SkillResponse<T>>;
  
  /**
   * 检查是否支持某个动作
   * @param action 动作名称
   */
  supportsAction(action: string): boolean;
  
  /**
   * 获取动作定义
   * @param action 动作名称
   */
  getActionDefinition(action: string): ActionDefinition | undefined;
  
  /**
   * 销毁 Skill（清理资源）
   */
  destroy?(): Promise<void>;
}

// ==================== Skill 网关接口 ====================

export interface SkillGatewayInterface {
  /**
   * 获取 Skill 实例
   * @param name Skill名称
   */
  getSkill<T extends Skill>(name: string): T | undefined;
  
  /**
   * 执行 Skill 动作
   * @param skillName Skill名称
   * @param action 动作名称
   * @param params 参数
   * @param context 上下文
   */
  execute<T = any>(
    skillName: string,
    action: string,
    params?: any,
    context?: Partial<SkillContext>
  ): Promise<SkillResponse<T>>;
  
  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   * @param context 上下文
   */
  emit(event: string, data: any, context?: SkillContext): void;
  
  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  on(event: string, handler: EventHandler): void;
  
  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off(event: string, handler: EventHandler): void;
}

// ==================== 事件系统 ====================

export type EventHandler = (data: any, context: SkillContext) => void | Promise<void>;

// ==================== 处理器类型 ====================

/**
 * 动作处理器类型
 */
export type ActionHandler<T = any, R = any> = (
  params: T,
  context: SkillContext
) => Promise<R> | R;

export interface SkillEvent {
  /** 事件名称 */
  name: string;
  /** 事件数据 */
  data: any;
  /** 上下文 */
  context: SkillContext;
  /** 时间戳 */
  timestamp: number;
  /** 来源 Skill */
  source?: string;
}

// ==================== 中间件 ====================

export type SkillMiddleware = (
  request: SkillRequest,
  next: () => Promise<SkillResponse>
) => Promise<SkillResponse>;

// ==================== JSON Schema 类型 ====================

export interface JSONSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: any;
  description?: string;
  [key: string]: any;
}

// ==================== 错误码定义 ====================

export enum SkillErrorCode {
  // 通用错误 (1000-1099)
  UNKNOWN_ERROR = '1000',
  INVALID_REQUEST = '1001',
  UNAUTHORIZED = '1002',
  FORBIDDEN = '1003',
  NOT_FOUND = '1004',
  TIMEOUT = '1005',
  RATE_LIMITED = '1006',
  SERVICE_UNAVAILABLE = '1007',
  
  // Skill 错误 (2000-2099)
  SKILL_NOT_FOUND = '2000',
  SKILL_NOT_INITIALIZED = '2001',
  ACTION_NOT_FOUND = '2002',
  ACTION_NOT_SUPPORTED = '2003',
  SKILL_DEPENDENCY_MISSING = '2004',
  
  // 验证错误 (3000-3099)
  VALIDATION_ERROR = '3000',
  MISSING_REQUIRED_PARAM = '3001',
  INVALID_PARAM_TYPE = '3002',
  INVALID_PARAM_VALUE = '3003',
  
  // 业务错误 (4000-4999) - 各 Skill 可自定义
  INSUFFICIENT_BALANCE = '4000',
  ITEM_NOT_FOUND = '4001',
  TRANSACTION_FAILED = '4002',
  INVENTORY_FULL = '4003',
}

// ==================== SDK 类型 ====================

export interface SkillSDKConfig {
  /** 网关地址 */
  gatewayUrl: string;
  /** 应用ID */
  appId: string;
  /** 应用密钥 */
  appSecret?: string;
  /** 超时时间(ms) */
  timeout?: number;
  /** 自动重试次数 */
  retries?: number;
  /** 环境 */
  environment?: 'development' | 'staging' | 'production';
  /** 调试模式 */
  debug?: boolean;
}

/**
 * Skill 网关配置
 */
export interface SkillGatewayConfig {
  /** 默认超时时间(ms) */
  defaultTimeout?: number;
  /** 是否启用调试日志 */
  debug?: boolean;
  /** 认证处理器 */
  authHandler?: (context: Partial<SkillContext>) => Promise<SkillContext>;
  /** 权限检查器 */
  permissionChecker?: (context: SkillContext, permission: string) => boolean;
}

export interface SkillSDK {
  /** 初始化 SDK */
  initialize(config: SkillSDKConfig): Promise<void>;
  
  /** 调用 Skill */
  call<T = any>(skillName: string, action: string, params?: any): Promise<T>;
  
  /** 获取 Skill 代理对象 */
  getSkillProxy(skillName: string): SkillProxy;
  
  /** 监听事件 */
  on(event: string, handler: EventHandler): void;
  
  /** 取消监听 */
  off(event: string, handler: EventHandler): void;
  
  /** 销毁 SDK */
  destroy(): void;
}

export interface SkillProxy {
  [action: string]: (params?: any) => Promise<any>;
}
