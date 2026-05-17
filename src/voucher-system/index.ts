/**
 * A币电子凭证系统 - 独立模块
 * 
 * 提供可追溯、可流转的安全数字资产凭证管理功能
 * 
 * @module voucher-system
 */

// 类型定义 - 基础类型
export type {
  Voucher,
  VoucherStatus,
  Transaction,
  TransactionType,
  VoucherMetadata,
  CreateVoucherRequest,
  TransferRequest,
  BatchCreateRequest,
  VoucherFilter,
  VoucherHistory,
  VoucherSystemStats,
  UserVoucherStats,
  PaginatedResult,
  TransferGraph,
  TransferNode,
  // 双轨系统核心类型
  AlgorithmVoucherInfo,
} from './types';

// 道具凭证类型
export type {
  ItemVoucherTemplate,
} from './types';

export {
  ItemSupplyPolicy,
} from './types';

// 类型定义 - 增强类型（规则相关）
export type {
  VoucherRules,
  DistributionRule,
  RecycleRule,
  PermissionConfig,
  TransferPermission,
  ExchangePermission,
  FreezePermission,
  DestroyPermission,
  ExchangeRate,
  DistributionType,
  RecycleType,
  ScheduleConfig,
  IssuancePhase,
  TieredAmount,
  SlidingScale,
  EnhancedCreateVoucherRequest,
  VoucherTemplate,
  PresetTemplateId,
} from './types';

// 枚举
export { 
  VoucherStatus as VoucherStatusEnum, 
  TransactionType as TransactionTypeEnum,
  VoucherSourceType,
  VoucherSourceType as VoucherSourceTypeEnum,
} from './types';

// 服务层
export { VoucherService, voucherService } from './services/VoucherService';
export { PlatformBindingService, platformBindingService } from './services/PlatformBindingService';
export { UserPoolService, userPoolService } from './services/UserPoolService';
export { 
  AlgorithmVoucherService, 
  algorithmVoucherService,
  type DataCollector,
} from './services/AlgorithmVoucherService';

// 存储层
export { voucherDB } from './storage/VoucherDatabase';

// 组件
export { VoucherCard } from './components/VoucherCard';
export { VoucherManager } from './components/VoucherManager';
export { EnhancedVoucherCreator } from './components/EnhancedVoucherCreator';
export { PlatformIntegrationTab } from './components/PlatformIntegrationTab';
export { UserPoolManager } from './components/UserPoolManager';
export { AlgorithmVoucherManager } from './components/AlgorithmVoucherManager';
export { VoucherManagementDashboard } from './components/VoucherManagementDashboard';
export { PoolFundPanel } from './components/PoolFundPanel';
export { default as ItemVoucherManager } from './components/ItemVoucherManager';

// 引擎
export { VoucherRuleEngine, voucherRuleEngine } from './engine/RuleEngine';
export type { RuleExecutionContext, RuleExecutionResult, RuleEngineConfig } from './engine/RuleEngine';

// 事件总线
export { EventBus, eventBus, VoucherEventType } from './engine/EventBus';
export type { VoucherEventPayload } from './engine/EventBus';

// 结算调度器
export { 
  SettlementScheduler, 
  settlementScheduler,
  DEFAULT_SCHEDULER_CONFIG,
} from './settlement/SettlementScheduler';
export type { SchedulerConfig } from './settlement/SettlementScheduler';

// 数据收集器
export { 
  PlatformDataCollector, 
  platformDataCollector,
  DEFAULT_COLLECTOR_CONFIG,
} from './settlement/PlatformDataCollector';
export type { PlatformDataCollectorConfig } from './settlement/PlatformDataCollector';

// Hooks
export {
  useGameIntegration,
  initializeVoucherEngine,
  simulateGameComplete,
  simulateDailyCheckin,
} from './hooks/useGameIntegration';
export type { GameCompleteData, AchievementData, TaskData } from './hooks/useGameIntegration';

// 测试组件
export { RuleEngineTester } from './components/RuleEngineTester';

// 模板
export {
  ALL_TEMPLATES,
  PLATFORM_CURRENCY_TEMPLATE,
  GAME_REWARD_TEMPLATE,
  STABLE_VALUE_TEMPLATE,
  DEFLATIONARY_TEMPLATE,
  POINTS_SYSTEM_TEMPLATE,
  EVENT_TICKET_TEMPLATE,
  MEMBERSHIP_TEMPLATE,
  CUSTOM_TEMPLATE,
  getTemplateById,
  getDefaultTemplate,
  getTemplateCategories,
  getTemplateIconName,
  cloneTemplate,
  mergeRules,
} from './templates';

// 常量
export const VOUCHER_SYSTEM_VERSION = '2.1.0'; // 升级为双轨系统
export const MAX_VOUCHER_VALUE = 1000000000; // 10亿总量控制
export const STORAGE_KEYS = {
  VOUCHERS: 'voucher_system_vouchers',
  TRANSACTIONS: 'voucher_system_transactions',
  STATS: 'voucher_system_stats',
  TEMPLATES: 'voucher_system_templates',
} as const;

// ========== 双轨系统初始化 ==========
export {
  initializeDualVoucherSystem,
  shutdownDualVoucherSystem,
  getDualVoucherSystemStatus,
  DEFAULT_DUAL_VOUCHER_CONFIG,
} from './init';
export type { DualVoucherSystemConfig } from './init';

// 预设模板ID
export { PresetTemplateId } from './types';

// 平台集成类型
export type {
  PlatformBindingConfig,
  GameDefinition,
  RewardDistributionRecord,
  UserRewardLimit,
  PlatformIntegrationStats,
  CreateBindingRequest,
  UpdateBindingRequest,
  PoolSource,
} from './types/platform';
export {
  GameType,
  TriggerMode,
  PRESET_GAMES,
  TRIGGER_MODE_OPTIONS,
} from './types/platform';

// 奖池类型
export type {
  UserRewardPool,
  PoolVoucherConfig,
  DepositToPoolRequest,
  DepositToPoolResult,
  DistributeFromPoolResult,
  CreatePoolRequest,
  ExtendedPlatformBindingConfig,
  UserPoolOverview,
  PoolStatistics,
} from './types/pool';

// ========== 算法分配型凭证系统（双轨系统）==========

// 算法凭证类型
export type {
  AlgorithmVoucherTemplate,
  SettlementCycle,
  SettlementResult,
  UserSettlementResult,
  NetworkSnapshot,
  UserPersonalData,
  ContributionAlgorithm,
  DistributionPoolConfig,
  UserEstimatedReward,
  ContributionLeaderboardItem,
  SettlementHistoryQuery,
  SettlementHistoryResult,
  CreateAlgorithmTemplateRequest,
  UpdateAlgorithmTemplateRequest,
  SettlementOptions,
  AlgorithmVoucherInfo as AlgorithmVoucherInfoType,
} from './types/algorithm';

// 算法凭证枚举
export {
  SettlementCycleType,
  SettlementStatus,
  DEFAULT_CONTRIBUTION_ALGORITHM,
  DEFAULT_POOL_CONFIG,
  DEFAULT_SETTLEMENT_OPTIONS,
} from './types/algorithm';

// 测试工具
export {
  testMockDataCollection,
  testSettlementFlow,
  runAllTests,
} from './test-mock-data';
