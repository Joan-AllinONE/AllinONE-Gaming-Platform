/**
 * AllinONE 钱包服务
 * 
 * ⚠️ 注意：此文件现在作为兼容层存在
 * 内部实现已迁移到 Skill 系统
 * 
 * 推荐使用方式（新代码）：
 * ```typescript
 * import { skillGateway } from '@/skills';
 * 
 * const response = await skillGateway.execute('wallet', 'getBalance');
 * if (response.success) {
 *   console.log(response.data);
 * }
 * ```
 * 
 * 向后兼容方式（旧代码）：
 * ```typescript
 * import { walletService } from '@/services/walletService';
 * 
 * const balance = await walletService.getBalance();
 * ```
 */

// 从兼容层重新导出
export { walletService } from '@/skills/compat/walletCompat';
export { walletService as default } from '@/skills/compat/walletCompat';
