/**
 * AllinONE Skill 系统 - 向后兼容层
 * 
 * 这个模块提供与原有服务的完全兼容接口，
 * 使现有代码无需修改即可继续使用，
 * 同时内部使用新的 Skill 系统实现。
 * 
 * 迁移建议：
 * 1. 新代码直接使用 @/skills 中的 Skill 接口
 * 2. 旧代码可以继续使用本兼容层
 * 3. 逐步将旧代码迁移到 Skill 接口
 */

// Wallet 服务兼容层
export { 
  walletService,
  WalletServiceCompat 
} from './walletCompat';

// Inventory 服务兼容层
export { 
  inventoryApiService,
  InventoryApiServiceCompat,
  InventoryItemLegacy,
  SyncResultLegacy,
} from './inventoryCompat';

/**
 * 兼容性导出 - 保持原有导入路径
 * 
 * 原有代码：
 * ```typescript
 * import { walletService } from '@/services/walletService';
 * import { inventoryApiService } from '@/services/inventoryApiService';
 * ```
 * 
 * 可以继续使用，或者改为：
 * ```typescript
 * import { walletService, inventoryApiService } from '@/skills/compat';
 * ```
 */
