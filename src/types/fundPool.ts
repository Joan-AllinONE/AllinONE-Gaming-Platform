// 平台资金池相关类型定义
import { Currency } from './common';

export interface FundPoolTransaction {
  id: string; // 交易编号
  type: 'income' | 'expense'; // 收入或支出
  category: 'commission' | 'operation' | 'reward' | 'refund' | 'maintenance' | 'dividend'; // 交易类别
  amount: number; // 金额
  currency: Currency; // 货币类型
  description: string; // 交易描述
  relatedTransactionId?: string; // 关联的原始交易ID
  timestamp: Date; // 时间戳
  source: 'player_market' | 'official_store' | 'game_store' | 'system'; // 来源
  anonymizedUserId?: string; // 匿名化用户ID（如user_***）
}

export interface FundPoolBalance {
  computingPower: number;  // 算力余额
  cash: number;            // 现金余额
  gameCoins: number;       // AllinONE 游戏币余额
  newDayGameCoins: number; // New Day 游戏币余额
  aCoins: number;          // A币余额
  oCoins: number;          // O币余额
  totalValue: number;      // 总价值（以现金计算）
  lastUpdated: Date;       // 最后更新时间
}

export interface FundPoolStats {
  // 收入统计
  totalIncome: {
    computingPower: number;
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    aCoins: number;
    oCoins: number;
    totalValue: number;
  };
  // 支出统计
  totalExpense: {
    computingPower: number;
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    aCoins: number;
    oCoins: number;
    totalValue: number;
  };
  // 净收入
  netIncome: {
    computingPower: number;
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    aCoins: number;
    oCoins: number;
    totalValue: number;
  };
  // 按类别统计
  incomeByCategory: {
    commission: number;
    operation: number;
    reward: number;
    refund: number;
    maintenance: number;
  };
  expenseByCategory: {
    commission: number;
    operation: number;
    reward: number;
    refund: number;
    maintenance: number;
  };
  // 按来源统计
  incomeBySource: {
    player_market: number;
    official_store: number;
    game_store: number;
    system: number;
  };
  // 时间范围统计
  dailyStats: Array<{
    date: string;
    income: number;
    expense: number;
    netIncome: number;
  }>;
  weeklyStats: Array<{
    week: string;
    income: number;
    expense: number;
    netIncome: number;
  }>;
  monthlyStats: Array<{
    month: string;
    income: number;
    expense: number;
    netIncome: number;
  }>;
}

// A币相关类型定义
export interface ACoinConfig {
  totalSupply: number; // 总供应量 (10亿)
  exchangeRate: number; // 兑换率 (1 A币 = 1 RMB)
  minUnit: number; // 最小单位 (0.01)
  distributionRatio: number; // 平台收入转化为A币的比例
}

export interface ACoinDistribution {
  id: string; // 发放记录ID
  period: string; // 发放周期 (如: 2025-01-26)
  totalDistributed: number; // 本期发放总量
  platformIncome: number; // 平台收入
  distributionPool: number; // 发放池金额
  recipients: Array<{
    userId: string;
    amount: number;
    reason: 'activity' | 'computing' | 'economic' | 'special';
    contributionScore: number;
  }>;
  timestamp: Date;
}

export interface ACoinStats {
  totalSupply: number; // 总供应量
  circulatingSupply: number; // 流通供应量
  totalDistributed: number; // 累计发放量
  totalBurned: number; // 累计销毁量
  currentPrice: number; // 当前价格 (固定1RMB)
  distributionHistory: ACoinDistribution[]; // 发放历史
  holdersCount: number; // 持有者数量
  averageHolding: number; // 平均持有量
}

// O币相关类型定义
export interface OCoinConfig {
  totalSupply: number; // 总供应量 (10亿)
  exchangeRate: number; // 兑换率 (根据市场波动)
  minUnit: number; // 最小单位 (0.01)
  distributionRatio: number; // 平台净收入减去A币发放后的比例
}

export interface OCoinDistribution {
  id: string; // 发放记录ID
  period: string; // 发放周期 (如: 2025-01-26)
  totalDistributed: number; // 本期发放总量
  platformNetIncome: number; // 平台净收入
  distributionPool: number; // 发放池金额
  recipients: Array<{
    userId: string;
    amount: number;
    reason: 'development' | 'management' | 'investment' | 'community';
    contributionScore: number;
  }>;
  timestamp: Date;
}

export interface OCoinStats {
  totalSupply: number; // 总供应量
  circulatingSupply: number; // 流通供应量
  totalDistributed: number; // 累计发放量
  totalBurned: number; // 累计销毁量
  totalLocked: number; // 未解锁的O币数量
  currentPrice: number; // 当前价格 (根据市场波动)
  priceHistory: Array<{
    date: string;
    price: number;
  }>;
  distributionHistory: OCoinDistribution[]; // 发放历史
  dividendHistory: OCoinDividend[]; // 分红历史
  holdersCount: number; // 持有者数量
  averageHolding: number; // 平均持有量
  marketCap: number; // 市值
}

export interface OCoinDividend {
  id: string;
  period: string; // 分红周期
  totalAmount: number; // 总分红金额
  recipients: Array<{
    userId: string;
    oCoinAmount: number; // 持有的O币数量
    dividendRatio: number; // 分红比例
    amount: number; // 分红金额
  }>;
  timestamp: Date;
}

export interface PublicFundPoolData {
  currentBalance: FundPoolBalance;
  recentTransactions: FundPoolTransaction[]; // 最近的交易记录
  stats: FundPoolStats;
  transactionCount: number; // 总交易数量
  averageTransactionAmount: number; // 平均交易金额
  aCoinStats: ACoinStats; // A币统计数据
  oCoinStats: OCoinStats; // O币统计数据
}

// 工资包计算结果
export interface SalaryPackageResult {
  cashReward: number; // 现金奖励部分
  oCoinReward: number; // O币奖励部分
  totalValue: number; // 总价值（现金 + O币市值）
  breakdown: {
    platformReward: number; // 平台委员会奖励部分
    communityReward: number; // 玩家社区代表奖励部分
    oCoinOptions: number; // O币期权数量
  };
}

// 工资包计算参数
export interface SalaryPackageParams {
  userId: string; // 用户ID
  platformNetIncome: number; // 平台净收入
  platformOperatingCost: number; // 平台运营成本
  gameRevenueIncrease: number; // 游戏收入增长
  platformCommitteeRewardPercent: number; // 平台委员会奖励百分比
  communityRepresentativeRewardPercent: number; // 玩家社区代表奖励百分比
  oCoinOptions: number; // O币期权数量
}