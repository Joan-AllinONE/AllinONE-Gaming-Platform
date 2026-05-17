/**
 * AllinONE Skill 系统 - 错误处理
 */

import { SkillError, SkillErrorCode } from './types';

/**
 * Skill 基础错误类
 */
export class SkillException extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly suggestion?: string;

  constructor(error: SkillError) {
    super(error.message);
    this.name = 'SkillException';
    this.code = error.code;
    this.details = error.details;
    this.suggestion = error.suggestion;
  }

  toJSON(): SkillError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      suggestion: this.suggestion,
    };
  }
}

/**
 * 创建标准错误对象
 */
export function createError(
  code: SkillErrorCode | string,
  message: string,
  details?: any,
  suggestion?: string
): SkillError {
  return {
    code,
    message,
    details,
    suggestion,
  };
}

// ==================== 预定义错误工厂函数 ====================

export const SkillErrors = {
  // 通用错误
  unknown: (details?: any) =>
    createError(
      SkillErrorCode.UNKNOWN_ERROR,
      '发生未知错误',
      details,
      '请稍后重试或联系技术支持'
    ),

  invalidRequest: (details?: any) =>
    createError(
      SkillErrorCode.INVALID_REQUEST,
      '无效的请求',
      details,
      '请检查请求参数是否正确'
    ),

  unauthorized: (details?: any) =>
    createError(
      SkillErrorCode.UNAUTHORIZED,
      '未授权，请先登录',
      details,
      '请重新登录或刷新认证令牌'
    ),

  forbidden: (permission: string) =>
    createError(
      SkillErrorCode.FORBIDDEN,
      `缺少权限: ${permission}`,
      { requiredPermission: permission },
      '请联系管理员获取相应权限'
    ),

  notFound: (resource: string) =>
    createError(
      SkillErrorCode.NOT_FOUND,
      `资源不存在: ${resource}`,
      { resource },
      '请检查资源标识是否正确'
    ),

  timeout: (timeout: number) =>
    createError(
      SkillErrorCode.TIMEOUT,
      `请求超时 (${timeout}ms)`,
      { timeout },
      '请稍后重试，或检查网络连接'
    ),

  rateLimited: (retryAfter?: number) =>
    createError(
      SkillErrorCode.RATE_LIMITED,
      '请求过于频繁，请稍后再试',
      { retryAfter },
      retryAfter ? `请等待 ${Math.ceil(retryAfter / 1000)} 秒后重试` : '请降低请求频率'
    ),

  serviceUnavailable: (details?: any) =>
    createError(
      SkillErrorCode.SERVICE_UNAVAILABLE,
      '服务暂时不可用',
      details,
      '请稍后重试'
    ),

  // Skill 错误
  skillNotFound: (skillName: string) =>
    createError(
      SkillErrorCode.SKILL_NOT_FOUND,
      `Skill 不存在: ${skillName}`,
      { skillName },
      '请检查 Skill 名称是否正确，或确认 Skill 已注册'
    ),

  skillNotInitialized: (skillName: string) =>
    createError(
      SkillErrorCode.SKILL_NOT_INITIALIZED,
      `Skill 未初始化: ${skillName}`,
      { skillName },
      '请等待 Skill 初始化完成后再调用'
    ),

  actionNotFound: (skillName: string, action: string) =>
    createError(
      SkillErrorCode.ACTION_NOT_FOUND,
      `动作不存在: ${skillName}.${action}`,
      { skillName, action },
      '请检查动作名称是否正确'
    ),

  actionNotSupported: (skillName: string, action: string) =>
    createError(
      SkillErrorCode.ACTION_NOT_SUPPORTED,
      `Skill ${skillName} 不支持动作: ${action}`,
      { skillName, action },
      '请查阅 Skill 文档获取支持的动作列表'
    ),

  skillDependencyMissing: (skillName: string, dependency: string) =>
    createError(
      SkillErrorCode.SKILL_DEPENDENCY_MISSING,
      `Skill ${skillName} 缺少依赖: ${dependency}`,
      { skillName, dependency },
      `请先注册并初始化 ${dependency} Skill`
    ),

  // 验证错误
  validationError: (field: string, reason: string) =>
    createError(
      SkillErrorCode.VALIDATION_ERROR,
      `验证失败: ${field} - ${reason}`,
      { field, reason },
      '请检查输入数据格式'
    ),

  missingRequiredParam: (param: string) =>
    createError(
      SkillErrorCode.MISSING_REQUIRED_PARAM,
      `缺少必需参数: ${param}`,
      { param },
      `请提供必需的参数: ${param}`
    ),

  invalidParamType: (param: string, expected: string, actual: string) =>
    createError(
      SkillErrorCode.INVALID_PARAM_TYPE,
      `参数类型错误: ${param}，期望 ${expected}，实际 ${actual}`,
      { param, expected, actual },
      '请检查参数类型'
    ),

  invalidParamValue: (param: string, value: any, constraint?: string) =>
    createError(
      SkillErrorCode.INVALID_PARAM_VALUE,
      `参数值无效: ${param} = ${value}${constraint ? ` (${constraint})` : ''}`,
      { param, value, constraint },
      '请检查参数值是否在有效范围内'
    ),

  // 业务错误
  insufficientBalance: (currency: string, required: number, actual: number) =>
    createError(
      SkillErrorCode.INSUFFICIENT_BALANCE,
      `余额不足: 需要 ${required} ${currency}，实际 ${actual}`,
      { currency, required, actual },
      '请充值后再试'
    ),

  itemNotFound: (itemId: string) =>
    createError(
      SkillErrorCode.ITEM_NOT_FOUND,
      `道具不存在: ${itemId}`,
      { itemId },
      '请检查道具ID是否正确'
    ),

  transactionFailed: (reason: string) =>
    createError(
      SkillErrorCode.TRANSACTION_FAILED,
      `交易失败: ${reason}`,
      { reason },
      '请检查交易参数或联系客服'
    ),

  inventoryFull: (maxSlots: number) =>
    createError(
      SkillErrorCode.INVENTORY_FULL,
      `背包已满: ${maxSlots}/${maxSlots} 格`,
      { maxSlots },
      '请清理背包后再试'
    ),
};
