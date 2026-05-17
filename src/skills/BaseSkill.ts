/**
 * AllinONE Skill 系统 - 基础 Skill 类
 * 提供通用的 Skill 实现基础
 */

import {
  Skill,
  SkillDefinition,
  ActionDefinition,
  SkillRequest,
  SkillResponse,
  SkillContext,
  SkillGatewayInterface,
  JSONSchema,
  SkillErrorCode,
  ActionHandler,
} from './types';
import { SkillErrors, createError } from './errors';

/**
 * 动作注册信息
 */
interface RegisteredAction {
  definition: ActionDefinition;
  handler: ActionHandler;
}

/**
 * 基础 Skill 类
 * 提供常用的 Skill 实现模式，子类只需注册动作即可
 */
export abstract class BaseSkill implements Skill {
  readonly definition: SkillDefinition;
  protected gateway!: SkillGatewayInterface;
  protected config: any;
  
  private actions: Map<string, RegisteredAction> = new Map();
  private initialized = false;

  constructor(definition: SkillDefinition) {
    this.definition = definition;
  }

  /**
   * 初始化 Skill
   * 子类可以重写此方法进行自定义初始化
   */
  async initialize(gateway: SkillGatewayInterface, config?: any): Promise<void> {
    this.gateway = gateway;
    this.config = config;
    this.initialized = true;
    
    // 调用子类的自定义初始化
    await this.onInitialize();
  }

  /**
   * 子类自定义初始化钩子
   */
  protected async onInitialize(): Promise<void> {
    // 子类重写
  }

  /**
   * 销毁 Skill
   * 子类可以重写此方法进行资源清理
   */
  async destroy(): Promise<void> {
    await this.onDestroy();
    this.actions.clear();
    this.initialized = false;
  }

  /**
   * 子类自定义销毁钩子
   */
  protected async onDestroy(): Promise<void> {
    // 子类重写
  }

  /**
   * 注册动作
   * @param name 动作名称
   * @param handler 处理器函数
   * @param options 动作定义选项
   */
  protected registerAction<T = any, R = any>(
    name: string,
    handler: ActionHandler<T, R>,
    options: Partial<Omit<ActionDefinition, 'name' | 'handler'>> = {}
  ): void {
    const definition: ActionDefinition = {
      name,
      displayName: options.displayName || name,
      description: options.description || '',
      paramsSchema: options.paramsSchema || { type: 'object' },
      returnsSchema: options.returnsSchema || { type: 'object' },
      requiredPermissions: options.requiredPermissions || [],
      readonly: options.readonly ?? false,
      idempotent: options.idempotent ?? false,
      rateLimit: options.rateLimit,
    };

    this.actions.set(name, { definition, handler });
  }

  /**
   * 检查是否支持某个动作
   */
  supportsAction(action: string): boolean {
    return this.actions.has(action);
  }

  /**
   * 获取动作定义
   */
  getActionDefinition(action: string): ActionDefinition | undefined {
    return this.actions.get(action)?.definition;
  }

  /**
   * 执行动作
   */
  async execute<T = any>(request: SkillRequest): Promise<SkillResponse<T>> {
    const { action, params, context, requestId, timestamp } = request;

    // 检查初始化状态
    if (!this.initialized) {
      return {
        success: false,
        error: SkillErrors.skillNotInitialized(this.definition.name),
        requestId,
        timestamp: Date.now(),
      };
    }

    // 获取动作注册信息
    const registeredAction = this.actions.get(action);
    if (!registeredAction) {
      return {
        success: false,
        error: SkillErrors.actionNotFound(this.definition.name, action),
        requestId,
        timestamp: Date.now(),
      };
    }

    const { handler } = registeredAction;

    try {
      // 参数验证
      const validationError = this.validateParams(action, params);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          requestId,
          timestamp: Date.now(),
        };
      }

      // 执行动作
      const result = await handler(params, context);

      return {
        success: true,
        data: result as T,
        requestId,
        timestamp: Date.now(),
        meta: {
          version: this.definition.version,
        },
      };

    } catch (error) {
      console.error(`[${this.definition.name}] 动作执行失败: ${action}`, error);
      
      return {
        success: false,
        error: this.normalizeError(error),
        requestId,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 验证参数
   */
  private validateParams(action: string, params: any) {
    const actionDef = this.getActionDefinition(action);
    if (!actionDef || !actionDef.paramsSchema) return null;

    const schema = actionDef.paramsSchema;

    // 检查必需参数
    if (schema.required && Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (params[key] === undefined || params[key] === null) {
          return SkillErrors.missingRequiredParam(key);
        }
      }
    }

    // 类型检查（简化版，可根据需要扩展）
    if (schema.properties && typeof params === 'object') {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = params[key];
        if (value !== undefined && propSchema.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== propSchema.type) {
            return SkillErrors.invalidParamType(key, propSchema.type, actualType);
          }
        }
      }
    }

    return null;
  }

  /**
   * 标准化错误
   */
  private normalizeError(error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as ReturnType<typeof createError>;
    }
    
    if (error instanceof Error) {
      return createError(
        SkillErrorCode.UNKNOWN_ERROR,
        error.message,
        error.stack
      );
    }

    return SkillErrors.unknown(error);
  }

  /**
   * 辅助方法：创建成功响应
   */
  protected createSuccessResponse<T>(data: T, requestId: string): SkillResponse<T> {
    return {
      success: true,
      data,
      requestId,
      timestamp: Date.now(),
      meta: {
        version: this.definition.version,
      },
    };
  }

  /**
   * 辅助方法：创建失败响应
   */
  protected createErrorResponse(
    error: ReturnType<typeof createError>,
    requestId: string
  ): SkillResponse {
    return {
      success: false,
      error,
      requestId,
      timestamp: Date.now(),
    };
  }

  /**
   * 辅助方法：获取其他 Skill
   */
  protected getSkill<T extends Skill>(name: string): T | undefined {
    return this.gateway.getSkill<T>(name);
  }

  /**
   * 辅助方法：执行其他 Skill 的动作
   */
  protected async callSkill<T = any>(
    skillName: string,
    action: string,
    params?: any,
    context?: Partial<SkillContext>
  ): Promise<T> {
    const response = await this.gateway.execute<T>(skillName, action, params, context);
    if (!response.success) {
      throw new Error(response.error?.message || '调用 Skill 失败');
    }
    return response.data as T;
  }

  /**
   * 辅助方法：发布事件
   */
  protected emit(event: string, data: any, context?: SkillContext): void {
    this.gateway.emit(event, data, context);
  }

  /**
   * 辅助方法：生成唯一ID
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }
}

/**
 * 创建简单 Skill 的工厂函数
 */
export function createSimpleSkill(
  name: string,
  actions: Record<string, ActionHandler>,
  options: Partial<Omit<SkillDefinition, 'name' | 'actions'>> = {}
): Skill {
  const definition: SkillDefinition = {
    name,
    displayName: options.displayName || name,
    version: options.version || '1.0.0',
    description: options.description || '',
    requiredPermissions: options.requiredPermissions || [],
    actions: [],
  };

  const skill = new (class extends BaseSkill {
    constructor() {
      super(definition);
    }

    async onInitialize(): Promise<void> {
      // 注册所有动作
      for (const [actionName, handler] of Object.entries(actions)) {
        this.registerAction(actionName, handler);
      }
    }
  })();

  return skill;
}
