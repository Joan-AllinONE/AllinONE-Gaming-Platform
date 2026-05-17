/**
 * AllinONE Skill 系统 - 统一导出
 *
 * 这是 Skill 系统的主要入口，提供：
 * 1. 核心类型和接口
 * 2. Skill 网关
 * 3. 所有内置 Skills
 * 4. SDK
 *
 * 使用示例：
 * ```typescript
 * import { skillGateway, authSkill, walletSkill } from '@/skills';
 *
 * // 注册 Skills
 * await skillGateway.registerSkill(authSkill);
 * await skillGateway.registerSkill(walletSkill);
 *
 * // 调用 Skill
 * const response = await skillGateway.execute('wallet', 'getBalance');
 * if (response.success) {
 *   console.log('余额:', response.data);
 * }
 * ```
 */

// ==================== 核心类型 ====================
export * from './types';

// ==================== 错误处理 ====================
export * from './errors';

// ==================== 事件总线 ====================
export { EventBus, globalEventBus } from './EventBus';

// ==================== Skill 网关 ====================
export {
  SkillGateway,
  getDefaultGateway,
  resetDefaultGateway
} from './SkillGateway';

// ==================== 基础类 ====================
export {
  BaseSkill,
  createSimpleSkill
} from './BaseSkill';

// ==================== SDK ====================
export { 
  SkillSDK, 
  createSDK,
  skillSDK 
} from './sdk/SkillSDK';

// ==================== 配置生成器 ====================
export {
  generateSkill,
  generateSkillFromFile,
  batchGenerateSkills,
  validateConfig,
  getDefaultTemplate,
  getYAMLTemplate,
  SkillConfigParser,
  SkillCodeGenerator,
  ConfigValidator,
} from './generator';

export type {
  SkillConfig,
  GameFeature,
  CurrencyConfig,
  ProductConfig,
  GenerateOptions,
  GenerationResult,
  ValidationResult,
} from './generator';

// ==================== 内置 Skills ====================

export * from './auth/AuthSkill';
export * from './wallet/WalletSkill';
export * from './inventory/InventorySkill';
export * from './store/StoreSkill';

// ==================== 便捷初始化 ====================

import { SkillGateway } from './SkillGateway';
import { authSkill } from './auth/AuthSkill';
import { walletSkill } from './wallet/WalletSkill';
import { inventorySkill } from './inventory/InventorySkill';
import { storeSkill } from './store/StoreSkill';

/**
 * 默认 Skill 网关实例
 * 使用此实例进行所有 Skill 操作
 */
export const skillGateway = new SkillGateway({
  debug: process.env.NODE_ENV === 'development',
});

/**
 * 初始化所有内置 Skills
 * 应用启动时调用一次
 * 
 * @example
 * ```typescript
 * import { initializeSkills } from '@/skills';
 * 
 * async function bootstrap() {
 *   await initializeSkills();
 *   // 继续应用初始化...
 * }
 * ```
 */
export async function initializeSkills(): Promise<void> {
  // 按依赖顺序注册 Skills
  await skillGateway.registerSkill(authSkill);
  await skillGateway.registerSkill(walletSkill);
  await skillGateway.registerSkill(inventorySkill);
  await skillGateway.registerSkill(storeSkill);

  console.log('[Skills] 所有 Skills 已初始化');
}

/**
 * 销毁所有 Skills
 * 应用关闭时调用
 */
export async function destroySkills(): Promise<void> {
  await skillGateway.destroy();
  console.log('[Skills] 所有 Skills 已销毁');
}

// ==================== 类型导出（用于扩展） ====================

/**
 * 创建自定义 Skill 的示例：
 * 
 * ```typescript
 * import { BaseSkill, SkillDefinition, SkillContext } from '@/skills';
 * 
 * class MyCustomSkill extends BaseSkill {
 *   constructor() {
 *     super({
 *       name: 'myCustom',
 *       displayName: '我的自定义 Skill',
 *       version: '1.0.0',
 *       description: '这是一个示例 Skill',
 *       requiredPermissions: [],
 *       dependencies: ['auth'],
 *       actions: [],
 *     });
 *   }
 * 
 *   async onInitialize(): Promise<void> {
 *     this.registerAction('myAction', this.myAction.bind(this), {
 *       displayName: '我的动作',
 *       description: '执行某个操作',
 *       paramsSchema: { type: 'object' },
 *       returnsSchema: { type: 'object' },
 *       requiredPermissions: [],
 *       readonly: false,
 *       idempotent: true,
 *     });
 *   }
 * 
 *   private async myAction(params: any, context: SkillContext) {
 *     return { result: 'success' };
 *   }
 * }
 * 
 * // 注册使用
 * const mySkill = new MyCustomSkill();
 * await skillGateway.registerSkill(mySkill);
 * 
 * // 调用
 * const response = await skillGateway.execute('myCustom', 'myAction', { foo: 'bar' });
 * ```
 */
