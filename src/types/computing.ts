// 算力中心相关类型定义

// 算力分解数据接口
export interface ComputingPowerBreakdown {
  baseActivity: number; // 基础活动算力
  gamePerformance: number; // 游戏表现算力
  socialContribution: number; // 社交贡献算力
  loyaltyBonus: number; // 忠诚度奖励算力
  achievementBonus: number; // 成就奖励算力
  economicContribution: number; // 经济贡献算力
  total: number;
}

// 网络活动数据接口
export interface NetworkActivityData {
  totalActivePlayers: number;
  totalGameSessions: number;
  totalPlayTime: number;
  averagePlayerLevel: number;
  totalTransactions: number; // 总交易数量
  topPerformers: Array<{
    userId: string;
    username: string;
    computingPower: number;
    activityScore: number;
  }>;
  gamePopularity: Array<{
    gameId: string;
    gameName: string;
    playerCount: number;
    totalSessions: number;
    averageScore: number;
  }>;
}

// 算力经济数据接口
export interface ComputingEconomicData {
  totalNetworkComputingPower: number;
  totalEconomicValue: number;
  activeComputingNodes: number;
  totalGameSessions: number;
  fundPoolBalance: number;
  computingContributionToFund: number;
  economicHealthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  averageComputingEfficiency: number;
  computingROI: number;
  playerRetentionRate: number;
  totalPlayTime: number;
  sustainabilityIndex: number;
  projectedMonthlyEarnings: number;
  computingPowerGrowthRate: number;
  dailyComputingRevenue: number;
}

// 玩家经济档案接口
export interface PlayerEconomicProfile {
  userId: string;
  economicLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  performanceRank: number;
  computingPowerBreakdown: ComputingPowerBreakdown;
  economicContribution: {
    totalTransactionVolume: number;
    totalCommissionGenerated: number;
    marketMakingContribution: number;
    liquidityProvided: number;
  };
  riskProfile: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    diversificationScore: number;
    volatilityExposure: number;
  };
  projectedEarnings: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  investmentRecommendations: Array<{
    type: 'computing_upgrade' | 'activity_boost' | 'economic_participation';
    title: string;
    description: string;
    cost: number;
    expectedReturn: number;
    paybackPeriod: number;
    riskLevel: 'low' | 'medium' | 'high';
    priority: number;
  }>;
}

// 算力市场数据接口
export interface ComputingMarketData {
  currentComputingPrice: number;
  marketCap: number;
  tradingVolume24h: number;
  marketTrend: 'bullish' | 'bearish' | 'stable';
  priceVolatility: number;
  priceHistory: Array<{
    timestamp: Date;
    price: number;
    change: number;
  }>;
}

// 游戏活动数据类型定义
export interface GameActivityData {
  userId: string;
  sessionId: string;
  gameId: string;
  gameName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 秒
  score: number;
  level: number;
  achievements: string[];
  computingPowerEarned: number;
  gameCoinsEarned: number;
  activityType: 'game_play' | 'social_interaction' | 'daily_login' | 'achievement' | 'task_completion';
}

export interface PlayerActivityStats {
  userId: string;
  totalPlayTime: number; // 总游戏时长（分钟）
  totalSessions: number; // 总游戏场次
  averageSessionTime: number; // 平均游戏时长
  totalScore: number; // 总分数
  averageScore: number; // 平均分数
  achievementCount: number; // 成就数量
  consecutiveDays: number; // 连续游戏天数
  socialInteractions: number; // 社交互动次数
  tasksCompleted: number; // 完成任务数
  lastActiveDate: Date;
  activityLevel: 'low' | 'medium' | 'high' | 'very_high'; // 活跃度等级
}

// 每日结算数据接口
export interface DailySettlementData {
  date: string; // 结算日期，格式：YYYY-MM-DD
  platformNetIncome: number; // 平台当日净收入
  totalDailyGameCoinsDistributed: number; // 当日游戏币分发总量
  totalDailyComputingPower: number; // 当日算力总量
  totalDailyTransactions: number; // 当日交易总量
  totalDailyActivePlayers: number; // 当日活跃用户数
  aCoinDistributionPool: number; // A币发放池（平台净收入的40%）
  averageContributionScore: number; // 平均贡献分数
  totalContributionScore: number; // 总贡献分数
  settlementStatus: 'ready' | 'processing' | 'completed' | 'insufficient_income' | 'failed'; // 结算状态
}
