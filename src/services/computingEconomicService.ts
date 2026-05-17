import { gameActivityService } from './gameActivityService';
import { 
  ComputingPowerBreakdown,
  ComputingEconomicData,
  PlayerEconomicProfile,
  ComputingMarketData,
} from '@/types/computing';

class ComputingEconomicService {
  private readonly ECONOMIC_CONSTANTS = {
    COMPUTING_POWER_BASE_VALUE: 0.05, // 每单位算力的基础价值
    FUND_POOL_CONTRIBUTION_RATE: 0.3, // 算力对资金池的贡献率
    DAILY_REWARD_RATE: 0.005, // 日收益率
  };

  // 获取算力经济数据
  async getComputingEconomicData(): Promise<ComputingEconomicData> {
    try {
      // 导入模拟数据生成器
      const { generateMockComputingEconomicData } = await import('@/data/mockComputingData');
      
      // 生成模拟数据
      return generateMockComputingEconomicData();
    } catch (error) {
      console.error('获取算力经济数据失败:', error);
      // 返回基础模拟数据
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
        dailyComputingRevenue: 31.25,
      };
    }
  }

  // 获取玩家经济档案
  async getPlayerEconomicProfile(userId: string): Promise<PlayerEconomicProfile> {
    try {
      // 导入模拟数据生成器
      const { generateMockPlayerEconomicProfile } = await import('@/data/mockComputingData');
      
      // 生成模拟数据
      return generateMockPlayerEconomicProfile(userId);
    } catch (error) {
      console.error('获取玩家经济档案失败:', error);
      // 返回基础模拟数据
      return {
        userId,
        economicLevel: 'gold',
        performanceRank: 42,
        computingPowerBreakdown: {
          baseActivity: 350,
          gamePerformance: 280,
          socialContribution: 120,
          loyaltyBonus: 80,
          achievementBonus: 150,
          economicContribution: 220,
          total: 1200,
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
          },
          {
            type: 'computing_upgrade',
            title: '算力设备升级',
            description: '投资更高效的算力设备，提升整体算力产出效率',
            cost: 5000,
            expectedReturn: 8000,
            paybackPeriod: 90,
            riskLevel: 'medium',
            priority: 3,
          },
        ],
      };
    }
  }

  // 获取算力市场数据
  async getComputingMarketData(): Promise<ComputingMarketData> {
    try {
      // 导入模拟数据生成器
      const { generateMockComputingMarketData } = await import('@/data/mockComputingData');
      
      // 生成模拟数据
      return generateMockComputingMarketData();
    } catch (error) {
      console.error('获取算力市场数据失败:', error);
      // 返回基础模拟数据
      return {
        currentComputingPrice: 0.05,
        marketCap: 6250,
        tradingVolume24h: 312.5,
        marketTrend: 'bullish',
        priceVolatility: 3.8,
        priceHistory: this.generatePriceHistory(),
      };
    }
  }

  // 私有方法：计算经济健康度
  private calculateEconomicHealthScore(
    totalComputingPower: number,
    fundPoolTotal: number,
    activePlayers: number
  ): number {
    // 计算健康度的简单实现
    const computingScore = Math.min(100, totalComputingPower / 1000);
    const fundScore = Math.min(100, fundPoolTotal / 100);
    const playerScore = Math.min(100, activePlayers / 10);
    
    return (computingScore * 0.4 + fundScore * 0.4 + playerScore * 0.2);
  }

  // 私有方法：计算经济等级
  private calculateEconomicLevel(totalComputingPower: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    if (totalComputingPower >= 5000) return 'diamond';
    if (totalComputingPower >= 2000) return 'platinum';
    if (totalComputingPower >= 1000) return 'gold';
    if (totalComputingPower >= 500) return 'silver';
    return 'bronze';
  }

  // 私有方法：计算经济贡献
  private async calculateEconomicContribution(userId: string): Promise<{
    totalTransactionVolume: number;
    totalCommissionGenerated: number;
    marketMakingContribution: number;
    liquidityProvided: number;
  }> {
    try {
      // 这里应该从交易记录中获取用户的经济贡献
      // 暂时返回模拟值
      return {
        totalTransactionVolume: 7500,
        totalCommissionGenerated: 350,
        marketMakingContribution: 750,
        liquidityProvided: 1500,
      };
    } catch (error) {
      console.error('计算经济贡献失败:', error);
      return {
        totalTransactionVolume: 7500,
        totalCommissionGenerated: 350,
        marketMakingContribution: 750,
        liquidityProvided: 1500,
      };
    }
  }

  // 私有方法：获取玩家排名
  private async getPlayerPerformanceRank(userId: string): Promise<number> {
    try {
      // 这里应该从数据库中获取玩家排名
      // 暂时返回模拟值
      return Math.floor(Math.random() * 100) + 1;
    } catch (error) {
      console.error('获取玩家排名失败:', error);
      return Math.floor(Math.random() * 100) + 1;
    }
  }

  // 私有方法：计算玩家预测收益
  private async calculatePlayerProjectedEarnings(userId: string, totalComputingPower: number): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  }> {
    try {
      const dailyRate = 0.005; // 日收益率0.5%
      const computingValue = totalComputingPower * this.ECONOMIC_CONSTANTS.COMPUTING_POWER_BASE_VALUE;
      
      const daily = computingValue * dailyRate;
      const weekly = daily * 7;
      const monthly = daily * 30;
      const yearly = daily * 365;

      return { daily, weekly, monthly, yearly };
    } catch (error) {
      console.error('计算玩家预测收益失败:', error);
      return { daily: 13.30, weekly: 93.10, monthly: 399.00, yearly: 4853.50 };
    }
  }

  // 私有方法：生成投资建议
  private async generateInvestmentRecommendations(
    userId: string,
    playerStats: any,
    computingBreakdown: any
  ): Promise<Array<{
    type: 'computing_upgrade' | 'activity_boost' | 'economic_participation';
    title: string;
    description: string;
    cost: number;
    expectedReturn: number;
    paybackPeriod: number;
    riskLevel: 'low' | 'medium' | 'high';
    priority: number;
  }>> {
    const recommendations = [];

    // 基于算力分析生成建议
    if (computingBreakdown.baseActivity < 1000) {
      recommendations.push({
        type: 'activity_boost' as const,
        title: '增加游戏活跃度',
        description: '通过增加每日游戏时长和参与更多游戏来提升基础活动算力',
        cost: 0,
        expectedReturn: 200,
        paybackPeriod: 0,
        riskLevel: 'low' as const,
        priority: 1,
      });
    }

    if (computingBreakdown.socialContribution < 500) {
      recommendations.push({
        type: 'activity_boost' as const,
        title: '提升社交参与',
        description: '增加好友互动、社区参与和内容分享来获得社交贡献算力',
        cost: 0,
        expectedReturn: 150,
        paybackPeriod: 0,
        riskLevel: 'low' as const,
        priority: 2,
      });
    }

    if (computingBreakdown.economicContribution < 300) {
      recommendations.push({
        type: 'economic_participation' as const,
        title: '参与经济活动',
        description: '通过交易、提供流动性等方式参与平台经济，获得经济贡献算力',
        cost: 1000,
        expectedReturn: 1500,
        paybackPeriod: 30,
        riskLevel: 'medium' as const,
        priority: 3,
      });
    }

    if (computingBreakdown.total > 2000) {
      recommendations.push({
        type: 'computing_upgrade' as const,
        title: '算力设备升级',
        description: '投资更高效的算力设备，提升整体算力产出效率',
        cost: 5000,
        expectedReturn: 8000,
        paybackPeriod: 90,
        riskLevel: 'medium' as const,
        priority: 4,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  // 私有方法：计算玩家风险档案
  private async calculatePlayerRiskProfile(userId: string, economicContribution: any): Promise<{
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    diversificationScore: number;
    volatilityExposure: number;
  }> {
    try {
      // 基于经济贡献和活动模式分析风险偏好
      const totalContribution = economicContribution.totalTransactionVolume;
      
      let riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'conservative';
      if (totalContribution > 10000) riskTolerance = 'aggressive';
      else if (totalContribution > 5000) riskTolerance = 'moderate';

      const diversificationScore = Math.min(100, (economicContribution.marketMakingContribution / totalContribution) * 100);
      const volatilityExposure = Math.random() * 30 + 10; // 10-40%

      return {
        riskTolerance,
        diversificationScore,
        volatilityExposure,
      };
    } catch (error) {
      console.error('计算玩家风险档案失败:', error);
      return {
        riskTolerance: 'moderate',
        diversificationScore: 65,
        volatilityExposure: 25,
      };
    }
  }

  // 获取每日结算数据
  async getDailySettlementData(): Promise<DailySettlementData> {
    try {
      // 获取资金池统计数据
      const fundPoolStats = await fundPoolService.getStats();
      
      // 获取活动数据
      const activityData = await gameActivityService.getNetworkActivityData();
      
      // 获取算力经济数据
      const economicData = await this.getComputingEconomicData();
      
      // 计算平台当日净收入
      // 1. 首先尝试从资金池统计中获取最新一天的数据
      const latestDailyStats = fundPoolStats.dailyStats[fundPoolStats.dailyStats.length - 1];
      let platformNetIncome = latestDailyStats ? latestDailyStats.netIncome : 0;
      
      // 2. 如果净收入为0或负数，尝试使用资金池的总净收入
      if (platformNetIncome <= 0) {
        platformNetIncome = fundPoolStats.netIncome.totalValue;
        console.log(`使用资金池总净收入: ${platformNetIncome}`);
      }
      
      // 3. 如果仍然为0或负数，检查是否有强制设置的值
      if (platformNetIncome <= 0) {
        const forcedIncomeStr = localStorage.getItem('forced_platform_income');
        if (forcedIncomeStr) {
          platformNetIncome = parseFloat(forcedIncomeStr);
          console.log(`使用强制设置的平台净收入: ${platformNetIncome}`);
        }
      }
      
      // 计算当日游戏币分发总量
      const totalDailyGameCoinsDistributed = Math.floor(Math.random() * 10000 + 5000);
      
      // 计算当日算力总量
      const totalDailyComputingPower = economicData.totalNetworkComputingPower;
      
      // 计算当日交易总量
      const totalDailyTransactions = activityData ? activityData.totalTransactions || 1000 : 1000;
      
      // 计算当日活跃用户数
      const activeUsers = await this.getActiveUsersWithContributionScores();
      const totalDailyActivePlayers = activeUsers.length;
      
      // 计算A币发放池
      const aCoinDistributionPool = platformNetIncome > 0 ? platformNetIncome * 0.4 : 0;
      
      // 计算平均贡献分数
      const totalContributionScore = activeUsers.reduce((sum, user) => {
        const contributionScore = 
          user.gameCoins * 0.5 + // 游戏币权重50%
          user.computingPower * 0.3 + // 算力权重30%
          user.transactionVolume * 0.2 / 1000; // 交易量权重20%
        return sum + contributionScore;
      }, 0);
      const averageContributionScore = totalDailyActivePlayers > 0 ? 
        totalContributionScore / totalDailyActivePlayers : 0.5;
      
      return {
        date: new Date().toISOString().split('T')[0],
        platformNetIncome,
        totalDailyGameCoinsDistributed,
        totalDailyComputingPower,
        totalDailyTransactions,
        totalDailyActivePlayers,
        aCoinDistributionPool,
        averageContributionScore,
        totalContributionScore,
        settlementStatus: platformNetIncome > 0 ? 'ready' : 'insufficient_income'
      };
    } catch (error) {
      console.error('获取每日结算数据失败:', error);
      // 返回默认数据
      return {
        date: new Date().toISOString().split('T')[0],
        platformNetIncome: 1000,
        totalDailyGameCoinsDistributed: 10000,
        totalDailyComputingPower: 5000,
        totalDailyTransactions: 1000,
        totalDailyActivePlayers: 500,
        aCoinDistributionPool: 400,
        averageContributionScore: 0.5,
        totalContributionScore: 250,
        settlementStatus: 'ready'
      };
    }
  }

  // 获取活跃用户及其贡献分数
  async getActiveUsersWithContributionScores(): Promise<Array<{
    userId: string;
    gameCoins: number;
    computingPower: number;
    transactionVolume: number;
  }>> {
    try {
      // 首先尝试从localStorage获取模拟用户数据
      const mockUsersJson = localStorage.getItem('mock_active_users');
      if (mockUsersJson) {
        console.log('使用本地存储的模拟用户数据');
        return JSON.parse(mockUsersJson);
      }
      
      // 如果没有模拟数据，返回默认模拟数据
      console.log('使用默认模拟用户数据');
      return [
        { userId: 'user1', gameCoins: 120, computingPower: 350, transactionVolume: 500 },
        { userId: 'user2', gameCoins: 80, computingPower: 200, transactionVolume: 300 },
        { userId: 'user3', gameCoins: 150, computingPower: 400, transactionVolume: 700 },
        { userId: 'user4', gameCoins: 60, computingPower: 180, transactionVolume: 250 },
        { userId: 'user5', gameCoins: 200, computingPower: 500, transactionVolume: 800 },
        { userId: 'current-user', gameCoins: 100, computingPower: 250, transactionVolume: 400 }
      ];
    } catch (error) {
      console.error('获取活跃用户数据失败:', error);
      // 返回基础模拟数据
      return [
        { userId: 'user1', gameCoins: 120, computingPower: 350, transactionVolume: 500 },
        { userId: 'current-user', gameCoins: 100, computingPower: 250, transactionVolume: 400 }
      ];
    }
  }

  // 私有方法：生成价格历史
  private generatePriceHistory(): Array<{
    timestamp: Date;
    price: number;
    change: number;
  }> {
    const history = [];
    let basePrice = 0.05;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() * 10 - 5) / 100; // -5% to +5%
      basePrice = basePrice * (1 + change);
      
      history.push({
        timestamp: date,
        price: basePrice,
        change: change * 100,
      });
    }
    
    return history;
  }

  // 私有方法：计算价格波动率
  private calculatePriceVolatility(priceHistory: Array<{ change: number }>): number {
    const changes = priceHistory.map(item => Math.abs(item.change));
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  // 私有方法：确定市场趋势
  private determineMarketTrend(priceHistory: Array<{ change: number }>): 'bullish' | 'bearish' | 'stable' {
    const recentChanges = priceHistory.slice(-7);
    const averageChange = recentChanges.reduce((sum, item) => sum + item.change, 0) / recentChanges.length;
    
    if (averageChange > 1) return 'bullish';
    if (averageChange < -1) return 'bearish';
    return 'stable';
  }

  // 自动结算A币（已废弃）
  async autoSettleACoin() {
    console.log('[废弃] A币自动结算功能已迁移至凭证系统');
    return { success: false, message: '已废弃', data: null };
  }
}

// 导出服务实例
export const computingEconomicService = new ComputingEconomicService();

// 不需要在这里导出类型，因为已经在types/computing.ts中定义
