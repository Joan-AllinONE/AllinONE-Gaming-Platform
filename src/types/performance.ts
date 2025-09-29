/**
 * O币绩效计算相关类型定义
 */

/**
 * 平台绩效数据
 */
export interface PlatformPerformance {
  periodId: string;                    // 绩效周期ID
  startDate: Date;                     // 周期开始时间
  endDate: Date;                       // 周期结束时间
  revenueIncrease: number;             // 收入增加量（元）
  playerIncrease: number;              // 玩家增加量（人）
  developmentContribution: number;     // 开发贡献分数
  managementContribution: number;      // 管理贡献分数
  marketingContribution: number;       // 营销贡献分数
  totalScore: number;                  // 总绩效分数
  lastUpdated: Date;                   // 最后更新时间
}

/**
 * 用户绩效贡献
 */
export interface UserPerformanceContribution {
  userId: string;                      // 用户ID
  periodId: string;                    // 绩效周期ID
  revenueContribution: number;         // 收入贡献（元）
  playerReferralCount: number;         // 推荐玩家数量
  developmentScore: number;            // 开发贡献分数
  managementScore: number;             // 管理贡献分数
  marketingScore: number;              // 营销贡献分数
  totalScore: number;                  // 用户总贡献分数
  lastUpdated: Date;                   // 最后更新时间
}

/**
 * O币分配记录
 */
export interface OCoinAllocation {
  id: string;                          // 分配记录ID
  userId: string;                      // 用户ID
  periodId: string;                    // 绩效周期ID
  allocationType: 'performance';       // 分配类型（基于绩效）
  amount: number;                      // 分配的O币数量
  performanceScore: number;            // 绩效分数
  weights: {                           // 权重配置
    revenueWeight: number;
    playerWeight: number;
    developmentWeight: number;
    managementWeight: number;
    marketingWeight: number;
  };
  allocationDate: Date;                // 分配时间
  vestingPeriod: number;               // 锁定期（天）
  status: 'pending' | 'allocated' | 'vested'; // 状态
}

/**
 * 分红权重记录
 */
export interface DividendWeightRecord {
  id: string;                          // 记录ID
  userId: string;                      // 用户ID
  periodId: string;                    // 绩效周期ID
  weight: number;                      // 分红权重比例
  historicalScore: number;             // 历史绩效分数
  weights: {                           // 权重配置
    revenueWeight: number;
    playerWeight: number;
    developmentWeight: number;
    managementWeight: number;
    marketingWeight: number;
  };
  calculationDate: Date;               // 计算时间
  status: 'active' | 'expired';       // 状态
}

/**
 * 现金分红记录
 */
export interface CashDividendRecord {
  id: string;                          // 分红记录ID
  userId: string;                      // 用户ID
  periodId: string;                    // 分红周期ID
  dividendAmount: number;              // 分红金额（元）
  dividendWeight: number;              // 分红权重
  totalDividendPool: number;           // 总分红池金额
  distributionDate: Date;              // 分红发放时间
  status: 'pending' | 'distributed' | 'failed';  // 状态
}

/**
 * 绩效计算权重配置
 */
export interface PerformanceWeights {
  revenueWeight: number;               // 收入权重
  playerWeight: number;                // 玩家权重
  developmentWeight: number;           // 开发权重
  managementWeight: number;            // 管理权重
  marketingWeight: number;             // 营销权重
}