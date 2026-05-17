/**
 * 算法分配型凭证类型定义
 * 适用于A币日结、分红等需要基于贡献度计算后发放的凭证
 */

import type { VoucherStatus, VoucherRules, VoucherMetadata } from './index';

/**
 * 凭证来源类型
 */
export enum VoucherSourceType {
  INSTANT = 'instant',       // 即时发放型（活动/游戏奖励）
  ALGORITHM = 'algorithm',   // 计算分配型（A币日结/分红）
}

/**
 * 结算周期类型
 */
export enum SettlementCycleType {
  DAILY = 'daily',       // 每日
  WEEKLY = 'weekly',     // 每周
  MONTHLY = 'monthly',   // 每月
  CUSTOM = 'custom',     // 自定义
}

/**
 * 贡献度算法配置
 */
export interface ContributionAlgorithm {
  /** 权重配置 */
  weights: {
    gameCoins: number;         // 游戏币权重 (默认0.5)
    computingPower: number;    // 算力权重 (默认0.3)
    transactionVolume: number; // 交易额权重 (默认0.2)
  };
  
  /** 计算公式类型 */
  formula: 'standard' | 'custom';
  
  /** 自定义公式（高级使用） */
  customFormula?: string;
  
  /** 数据收集范围配置 */
  dataCollection: {
    gameCoinsPeriod: number;      // 游戏币收集天数
    computingPowerPeriod: number; // 算力收集天数
    transactionPeriod: number;    // 交易额收集天数
  };
}

/**
 * 发放池计算模式
 */
export type PoolCalculationMode = 'auto' | 'fixed';

/**
 * 奖池来源分配模式（参考即时型凭证的 DistributionRule.allocation.mode）
 */
export type PoolAllocationMode = 'fixed' | 'ratio' | 'formula';

/**
 * 游戏奖池来源配置
 * 每个游戏可以配置独立的奖池，结算时通过公式计算发放金额
 */
export interface GamePoolSourceConfig {
  gameId: string;
  gameName: string;
  
  /** 奖池计算方式 */
  calculationMode?: PoolCalculationMode;  // 'auto' 或 'fixed'
  
  /** 固定总量（仅 calculationMode='fixed' 时使用） */
  fixedTotalSupply?: number;
  
  /** 分配配置（类似 DistributionRule.allocation） */
  allocation: {
    mode: PoolAllocationMode;              // 计算模式
    fixedAmount?: number;                   // 固定金额
    ratio?: number;                         // 比例（如游戏收入的一定比例）
    formula?: string;                       // 自定义公式表达式
  };
  
  /** 需要收集的计量要素（决定奖池大小的数据源） */
  metrics?: {
    gameRevenue?: boolean;      // 游戏收入
    playerCount?: boolean;      // 玩家数
    gameSessions?: boolean;     // 游戏局数
    totalScore?: boolean;       // 总分数
    averageScore?: boolean;     // 平均分
  };
}

/**
 * 发放池配置
 */
export interface DistributionPoolConfig {
  /** 价值来源（平台净收入） */
  source: 'platform_net_income';
  
  /** 发放比例 (默认0.4 = 40%) - 仅平台池使用 */
  ratio: number;
  
  /** 最小发放金额 */
  minDistributionAmount: number;
  
  /** 是否允许结余累积到下一期 */
  carryOverEnabled: boolean;
  
  /** 计算模式: auto=基于平台收入自动计算, fixed=使用固定总量 */
  calculationMode?: PoolCalculationMode;
  
  /** 固定总量（仅在 calculationMode='fixed' 时使用） */
  fixedTotalSupply?: number;

  /** 游戏奖池列表（每个游戏独立奖池） */
  gamePools?: GamePoolSourceConfig[];
}

/**
 * 算法凭证模板
 * 用于创建计算分配型凭证
 */
export interface AlgorithmVoucherTemplate {
  id: string;
  name: string;                    // 模板名称，如 "A币日结凭证"
  description?: string;            // 描述
  
  // 面值配置
  minDenomination: number;         // 最小面值，默认 0.0001
  denominationUnit: string;        // 单位，如 "ACOIN"
  
  // 结算配置
  settlementCycle: SettlementCycleType;
  settlementTime: string;          // 结算时间，如 "00:00" (24小时制)
  settlementDayOfWeek?: number;    // 周结算时的星期几 (0=周日, 6=周六)
  settlementDayOfMonth?: number;   // 月结算时的日期 (1-28)
  
  // 算法规则
  algorithm: ContributionAlgorithm;
  
  // 发放池配置
  poolConfig: DistributionPoolConfig;
  
  // 凭证总量配置（可选）
  totalSupply?: number;            // 凭证总量上限 = 总价值 / 最小面值
  totalValue?: number;             // 凭证总价值（用于计算 totalSupply）
  
  // 状态
  isActive: boolean;
  
  // 元数据
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  createdByName: string;
}

/**
 * 全网数据快照
 * 结算时记录的全网状态
 */
export interface NetworkSnapshot {
  timestamp: number;               // 快照时间戳
  
  // 全网总量数据
  totalGameCoins: number;          // 全网游戏币总量
  totalComputingPower: number;     // 全网算力总量
  totalTransactionVolume: number;  // 全网交易额
  totalContributionScore: number;  // 全网总贡献分数
  totalActiveUsers: number;        // 活跃用户数
  
  // 财务数据
  platformNetIncome: number;       // 平台净收入
  distributionPool: number;        // 实际发放池金额
  carriedOverAmount: number;       // 从上一期结转金额
  
  // 游戏奖池数据（多奖池支持）
  gamePoolDetails?: {
    gameId: string;
    gameName: string;
    amount: number;
    calculationDetail: string;
  }[];
  
  // 凭证总量信息
  totalSupply?: number;            // 凭证总量上限（如果设置了）
  totalValue?: number;             // 凭证总价值
  
  // 统计信息
  minContributionScore: number;    // 最小贡献分数
  maxContributionScore: number;    // 最大贡献分数
  avgContributionScore: number;    // 平均贡献分数
}

/**
 * 用户个人数据
 */
export interface UserPersonalData {
  userId: string;
  userName: string;
  
  // 原始数据
  gameCoins: number;               // 个人游戏币
  computingPower: number;          // 个人算力
  transactionVolume: number;       // 个人交易额
  
  // 计算后的贡献分数
  contributionScore: number;
  
  // 排名
  rank?: number;
}

/**
 * 结算周期记录
 */
export interface SettlementCycle {
  id: string;
  templateId: string;
  templateName?: string;
  cycleNumber: number;             // 周期序号（自增）
  
  // 时间范围
  startDate: string;               // 开始日期 YYYY-MM-DD
  endDate: string;                 // 结束日期 YYYY-MM-DD
  settlementDate: string;          // 结算日期
  
  // 状态
  status: SettlementStatus;
  
  // 数据
  networkSnapshot?: NetworkSnapshot;
  
  // 结果汇总
  result?: SettlementResult;
  
  // 时间戳
  createdAt: number;
  startedAt?: number;              // 开始结算时间
  completedAt?: number;            // 完成时间
  
  // 执行信息
  executedBy?: string;             // 执行人（手动触发时）
  errorMessage?: string;           // 错误信息
}

/**
 * 结算状态
 */
export enum SettlementStatus {
  PENDING = 'pending',           // 待结算
  COLLECTING = 'collecting',     // 数据收集中
  CALCULATING = 'calculating',   // 计算中
  ISSUING = 'issuing',           // 凭证发行中
  COMPLETED = 'completed',       // 已完成
  FAILED = 'failed',             // 失败
}

/**
 * 用户结算结果
 */
export interface UserSettlementResult {
  userId: string;
  userName: string;
  
  // 个人数据
  personalData: {
    gameCoins: number;
    computingPower: number;
    transactionVolume: number;
  };
  
  // 贡献度计算结果
  contributionScore: number;       // 个人贡献分数
  contributionRatio: number;       // 贡献比例 (占总分的百分比)
  
  // 发放结果
  calculatedAmount: number;        // 计算应得金额（未取整）
  actualVoucherCount: number;      // 实际凭证数量
  actualTotalValue: number;        // 实际总价值（取整后）
  
  // 生成的凭证
  voucherIds: string[];
  
  // 状态
  status: 'pending' | 'issued' | 'failed';
  issuedAt?: number;
  
  // 错误信息
  errorMessage?: string;
}

/**
 * 结算结果汇总
 */
export interface SettlementResult {
  // 参与统计
  totalParticipants: number;       // 参与用户数
  eligibleParticipants: number;    // 符合条件的用户数
  
  // 发放统计
  totalDistributed: number;        // 总发放金额
  totalVouchersIssued: number;     // 总凭证数量
  averagePerUser: number;          // 人均发放
  medianPerUser: number;           // 中位数
  minReward: number;               // 最小奖励
  maxReward: number;               // 最大奖励
  
  // 凭证统计
  totalVoucherCount: number;       // 凭证总数量
  
  // 用户结果列表
  userResults: UserSettlementResult[];
  
  // 汇总时间戳
  calculatedAt: number;
}

/**
 * 算法型凭证信息（嵌入在Voucher中）
 */
export interface AlgorithmVoucherInfo {
  templateId: string;              // 所属模板ID
  templateName?: string;           // 模板名称
  settlementCycleId: string;       // 结算周期ID
  cycleNumber: number;             // 周期序号
  settlementDate: string;          // 结算日期
  
  // 贡献度信息
  contributionScore: number;       // 贡献分数
  contributionRatio: number;       // 贡献比例
  
  // 计算结果
  calculatedAmount: number;        // 计算金额
  
  // 原始数据快照
  personalDataSnapshot: {
    gameCoins: number;
    computingPower: number;
    transactionVolume: number;
  };
}

/**
 * 用户预估收益
 */
export interface UserEstimatedReward {
  userId: string;
  
  // 个人数据
  personalData: {
    gameCoins: number;
    computingPower: number;
    transactionVolume: number;
  };
  
  // 预估贡献分数
  contributionScore: number;
  contributionRatio: number;       // 预估占比
  
  // 预估收益
  estimatedAmount: number;
  estimatedVoucherCount: number;
  
  // 排名信息
  rank?: number;
  totalParticipants?: number;
  percentile?: number;             // 百分位（如前10%）
  
  // 基于当前全网数据预估
  basedOnSnapshot?: NetworkSnapshot;
  
  // 预估时间
  estimatedAt: number;
}

/**
 * 结算配置选项
 */
export interface SettlementOptions {
  /** 是否自动发行凭证 */
  autoIssue: boolean;
  
  /** 最小发放阈值（低于此值不发放） */
  minThreshold: number;
  
  /** 是否发送通知 */
  sendNotification: boolean;
  
  /** 是否记录详细日志 */
  detailedLogging: boolean;
}

/**
 * 贡献度排行榜项
 */
export interface ContributionLeaderboardItem {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  
  // 贡献数据
  contributionScore: number;
  contributionRatio: number;
  
  // 原始数据
  gameCoins: number;
  computingPower: number;
  transactionVolume: number;
  
  // 奖励
  rewardAmount: number;
  voucherCount: number;
}

/**
 * 结算历史查询参数
 */
export interface SettlementHistoryQuery {
  userId?: string;
  templateId?: string;
  startDate?: string;
  endDate?: string;
  status?: SettlementStatus;
  page?: number;
  pageSize?: number;
}

/**
 * 结算历史查询结果
 */
export interface SettlementHistoryResult {
  items: SettlementCycle[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 创建算法凭证模板请求
 */
export interface CreateAlgorithmTemplateRequest {
  name: string;
  description?: string;
  
  minDenomination?: number;        // 默认0.0001
  denominationUnit?: string;       // 默认"ACOIN"
  
  settlementCycle: SettlementCycleType;
  settlementTime: string;
  settlementDayOfWeek?: number;
  settlementDayOfMonth?: number;
  
  algorithm: Partial<ContributionAlgorithm>;
  poolConfig: Partial<DistributionPoolConfig>;
}

/**
 * 更新算法凭证模板请求
 */
export interface UpdateAlgorithmTemplateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  algorithm?: Partial<ContributionAlgorithm>;
  poolConfig?: Partial<DistributionPoolConfig>;
}

/**
 * 默认算法配置
 */
export const DEFAULT_CONTRIBUTION_ALGORITHM: ContributionAlgorithm = {
  weights: {
    gameCoins: 0.5,
    computingPower: 0.3,
    transactionVolume: 0.2,
  },
  formula: 'standard',
  dataCollection: {
    gameCoinsPeriod: 1,
    computingPowerPeriod: 1,
    transactionPeriod: 1,
  },
};

/**
 * 默认发放池配置
 */
export const DEFAULT_POOL_CONFIG: DistributionPoolConfig = {
  source: 'platform_net_income',
  ratio: 0.4,
  minDistributionAmount: 0.0001,
  carryOverEnabled: true,
  calculationMode: 'auto',
};

/**
 * 默认结算选项
 */
export const DEFAULT_SETTLEMENT_OPTIONS: SettlementOptions = {
  autoIssue: true,
  minThreshold: 0.0001,
  sendNotification: true,
  detailedLogging: true,
};
