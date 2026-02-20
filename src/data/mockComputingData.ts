/**
 * 算力中心模拟数据生成器
 * 用于在没有真实数据的情况下提供UI展示所需的数据
 */

import { 
  ComputingEconomicData, 
  PlayerEconomicProfile, 
  ComputingMarketData,
  NetworkActivityData,
  ComputingPowerBreakdown
} from '@/types/computing';

/**
 * 生成模拟的算力经济数据
 */
export function generateMockComputingEconomicData(): ComputingEconomicData {
  return {
    totalNetworkComputingPower: 125000,
    totalEconomicValue: 6250,
    activeComputingNodes: 1250,
    totalGameSessions: 8500,
    fundPoolBalance: 15000,
    computingContributionToFund: 1875,
    economicHealthScore: 78,
    riskLevel: 'low',
    averageComputingEfficiency: 78.5,
    computingROI: 12.8,
    playerRetentionRate: 86.3,
    totalPlayTime: 4250,
    sustainabilityIndex: 82,
    projectedMonthlyEarnings: 1312.5,
    computingPowerGrowthRate: 5.2,
    dailyComputingRevenue: 31.25
  };
}

/**
 * 生成模拟的玩家经济档案
 */
export function generateMockPlayerEconomicProfile(userId: string = 'current_user'): PlayerEconomicProfile {
  return {
    userId,
    economicLevel: 'gold',
    performanceRank: 42,
    computingPowerBreakdown: {
      baseActivity: 250,
      gamePerformance: 180,
      socialContribution: 120,
      loyaltyBonus: 100,
      achievementBonus: 150,
      economicContribution: 50,
      total: 850
    },
    economicContribution: {
      totalTransactionVolume: 7500,
      totalCommissionGenerated: 350,
      marketMakingContribution: 750,
      liquidityProvided: 1500,
    },
    riskProfile: {
      riskTolerance: 'moderate',
      diversificationScore: 65,
      volatilityExposure: 25,
    },
    projectedEarnings: {
      daily: 13.30,
      weekly: 93.10,
      monthly: 399.00,
      yearly: 4853.50,
    },
    investmentRecommendations: [
      {
        type: 'activity_boost',
        title: '增加游戏活跃度',
        description: '通过增加每日游戏时长和参与更多游戏来提升基础活动算力',
        cost: 0,
        expectedReturn: 200,
        paybackPeriod: 0,
        riskLevel: 'low',
        priority: 1,
      },
      {
        type: 'economic_participation',
        title: '参与经济活动',
        description: '通过交易、提供流动性等方式参与平台经济，获得经济贡献算力',
        cost: 1000,
        expectedReturn: 1500,
        paybackPeriod: 30,
        riskLevel: 'medium',
        priority: 2,
      }
    ]
  };
}

/**
 * 生成模拟的算力市场数据
 */
export function generateMockComputingMarketData(): ComputingMarketData {
  // 生成价格历史
  const priceHistory = Array(30).fill(0).map((_, i) => {
    const basePrice = 0.05;
    const volatility = 0.002;
    const trend = 0.0001;
    const randomFactor = Math.random() * volatility * 2 - volatility;
    const trendFactor = trend * (30 - i);
    const price = basePrice + randomFactor + trendFactor;
    const change = i > 0 ? ((price - basePrice) / basePrice) * 100 : 0;
    
    return {
      timestamp: new Date(Date.now() - (29 - i) * 86400000),
      price: parseFloat(price.toFixed(4)),
      change: parseFloat(change.toFixed(2))
    };
  });
  
  // 计算价格波动率
  const prices = priceHistory.map(item => item.price);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
  const priceVolatility = parseFloat((Math.sqrt(variance) / avgPrice * 100).toFixed(1));
  
  // 确定市场趋势
  const recentPrices = prices.slice(-7);
  const oldPrices = prices.slice(-14, -7);
  const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
  const oldAvg = oldPrices.reduce((sum, price) => sum + price, 0) / oldPrices.length;
  const marketTrend = recentAvg > oldAvg ? 'bullish' : recentAvg < oldAvg ? 'bearish' : 'stable';
  
  return {
    currentComputingPrice: priceHistory[priceHistory.length - 1].price,
    marketCap: 6250,
    tradingVolume24h: 312.5,
    marketTrend,
    priceVolatility,
    priceHistory
  };
}

/**
 * 生成模拟的全网活动数据
 */
export function generateMockNetworkActivityData(): NetworkActivityData {
  // 生成顶级玩家
  const topPerformers = Array(10).fill(0).map((_, i) => ({
    userId: `user_00${i+1}`,
    username: `玩家00${i+1}`,
    computingPower: 1000 - i * 50,
    activityScore: 10000 - i * 500
  }));
  
  // 生成游戏热度
  const gamePopularity = [
    {
      gameId: 'match3',
      gameName: '消消乐',
      playerCount: 156,
      totalSessions: 487,
      averageScore: 850
    },
    {
      gameId: 'memory',
      gameName: '记忆翻牌',
      playerCount: 124,
      totalSessions: 362,
      averageScore: 720
    },
    {
      gameId: 'puzzle',
      gameName: '益智拼图',
      playerCount: 98,
      totalSessions: 245,
      averageScore: 650
    },
    {
      gameId: 'runner',
      gameName: '跑酷大师',
      playerCount: 87,
      totalSessions: 213,
      averageScore: 580
    },
    {
      gameId: 'word',
      gameName: '成语接龙',
      playerCount: 76,
      totalSessions: 198,
      averageScore: 520
    }
  ];
  
  return {
    totalActivePlayers: 542,
    totalGameSessions: 1505,
    totalPlayTime: 12840, // 分钟
    averagePlayerLevel: 4.2,
    topPerformers,
    gamePopularity
  };
}

/**
 * 生成模拟的算力分解数据
 */
export function generateMockComputingPowerBreakdown(userId: string): ComputingPowerBreakdown {
  // 根据用户ID生成一些变化，使不同用户有不同的数据
  const userSeed = parseInt(userId.replace(/\D/g, '')) || 1;
  const randomFactor = (userSeed % 10) / 10;
  
  return {
    baseActivity: Math.floor(200 + randomFactor * 100),
    gamePerformance: Math.floor(150 + randomFactor * 80),
    socialContribution: Math.floor(100 + randomFactor * 50),
    loyaltyBonus: Math.floor(80 + randomFactor * 40),
    achievementBonus: Math.floor(120 + randomFactor * 60),
    economicContribution: Math.floor(40 + randomFactor * 20),
    total: Math.floor(690 + randomFactor * 350)
  };
}
