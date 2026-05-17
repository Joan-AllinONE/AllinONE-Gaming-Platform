/**
 * 用户奖池类型定义
 * 支持用户自主创建和管理奖池
 */

import type { PlatformBindingConfig } from './platform';

/**
 * 用户奖池配置
 */
export interface UserRewardPool {
  id: string;                    // 奖池ID
  ownerId: string;               // 奖池所有者ID
  ownerName: string;             // 所有者名称
  name: string;                  // 奖池名称（如"消消乐奖励池"）
  description?: string;          // 描述
  
  // 奖池中的凭证配置
  vouchers: PoolVoucherConfig[];
  
  // 奖池状态
  status: 'active' | 'paused' | 'depleted';
  
  // 使用统计
  stats: {
    totalDeposited: number;      // 总存入金额
    totalDistributed: number;    // 总发放金额
    distributionCount: number;   // 发放次数
    lastDistributionAt?: number; // 上次发放时间
  };
  
  createdAt: number;
  updatedAt: number;
}

/**
 * 奖池中的凭证配置
 */
export interface PoolVoucherConfig {
  voucherId: string;             // 凭证ID
  denomination: number;          // 面额
  initialQuantity: number;       // 初始数量
  remainingQuantity: number;     // 剩余数量
  depositedAt: number;           // 存入时间
  
  // 使用限制
  usageRules?: {
    maxPerUser?: number;         // 每用户最多获得次数
    dailyLimit?: number;         // 每日发放上限
    cooldownMinutes?: number;    // 冷却时间
  };
}

/**
 * 奖池存入请求
 */
export interface DepositToPoolRequest {
  voucherIds: string[];          // 要存入的凭证ID列表
  poolName?: string;             // 奖池名称（新建时使用）
  poolId?: string;               // 现有奖池ID（追加时使用）
}

/**
 * 奖池存入结果
 */
export interface DepositToPoolResult {
  success: boolean;
  deposited: PoolVoucherConfig[];
  totalAmount: number;
  error?: string;
}

/**
 * 奖池发放结果
 */
export interface DistributeFromPoolResult {
  success: boolean;
  voucherId?: string;
  denomination?: number;
  error?: string;
}

/**
 * 创建奖池请求
 */
export interface CreatePoolRequest {
  name: string;
  description?: string;
  initialVoucherIds?: string[];
}

/**
 * 扩展的平台绑定配置 - 支持用户奖池
 */
export interface ExtendedPlatformBindingConfig extends PlatformBindingConfig {
  poolSource: 'platform' | 'user';           // 奖池来源
  poolOwnerId?: string;                       // 用户奖池所有者ID（如果是用户奖池）
  poolId?: string;                            // 具体奖池ID
  allowMultiplePools?: boolean;               // 是否允许从多个奖池随机选择
}

/**
 * 用户奖池概览（用于列表展示）
 */
export interface UserPoolOverview {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  status: 'active' | 'paused' | 'depleted';
  totalBalance: number;          // 总余额
  voucherCount: number;          // 凭证数量
  distributionCount: number;     // 已发放次数
  lastActivityAt?: number;       // 上次活动时间
}

/**
 * 奖池统计信息
 */
export interface PoolStatistics {
  totalPools: number;
  activePools: number;
  totalDeposited: number;
  totalDistributed: number;
  topPools: UserPoolOverview[];
}
