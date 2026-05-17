/**
 * AllinONE 库存 API 服务
 *
 * ⚠️ 注意：此文件现在作为兼容层存在
 * 内部实现已迁移到 Skill 系统
 *
 * 推荐使用方式（新代码）：
 * ```typescript
 * import { skillGateway } from '@/skills';
 *
 * const response = await skillGateway.execute('inventory', 'getItems', { limit: 10 });
 * if (response.success) {
 *   console.log(response.data.items);
 * }
 * ```
 *
 * 向后兼容方式（旧代码）：
 * ```typescript
 * import { inventoryApiService } from '@/services/inventoryApiService';
 *
 * const { items } = await inventoryApiService.getInventory();
 * ```
 */

// 从兼容层重新导出
export { inventoryApiService, inventoryApiService as default } from '@/skills/compat/inventoryCompat';
export * from '@/skills/compat/inventoryCompat';
