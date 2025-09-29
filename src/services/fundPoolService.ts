import { 
  FundPoolTransaction, 
  FundPoolBalance, 
  FundPoolStats, 
  PublicFundPoolData,
  ACoinConfig,
  ACoinDistribution,
  ACoinStats,
  OCoinConfig,
  OCoinDistribution,
  OCoinStats,
  OCoinDividend,
  SalaryPackageParams,
  SalaryPackageResult
} from '@/types/fundPool';
import * as oCoinService from './oCoinService';

class FundPoolService {
  private transactionsStorageKey = 'fundPool_transactions';
  private aCoinDistributionsStorageKey = 'fundPool_aCoinDistributions';
  private oCoinDistributionsStorageKey = 'fundPool_oCoinDistributions';
  private oCoinDividendsStorageKey = 'fundPool_oCoinDividends';

  private transactions: FundPoolTransaction[] = [];
  private balance: FundPoolBalance = {
    computingPower: 0,
    cash: 0,
    gameCoins: 0,
    aCoins: 0,
    oCoins: 0,
    totalValue: 0,
    lastUpdated: new Date()
  };

  // 货币转换率（用于计算总价值）
  private exchangeRates = {
    computingPower: 0.1, // 1算力 = 0.1现金
    gameCoins: 0.01, // 1游戏币 = 0.01现金
    aCoins: 1, // 1A币 = 1现金
    cash: 1, // 1现金 = 1现金
    oCoins: 1 // O币价格是动态的，初始值为1
  };

  // 获取O币价格
  private async getOCoinPrice(): Promise<number> {
    try {
      const marketData = await oCoinService.getMarketData();
      return marketData.currentPrice;
    } catch (error) {
      console.error('获取O币价格失败:', error);
      return 1; // 默认价格
    }
  }

  // A币配置
  private aCoinConfig: ACoinConfig = {
    totalSupply: 1000000000, // 10亿总供应量
    exchangeRate: 1, // 1 A币 = 1 RMB
    minUnit: 0.01, // 最小单位
    distributionRatio: 0.4 // 平台净收入的40%转化为A币发放
  };

  // A币发放记录
  private aCoinDistributions: ACoinDistribution[] = [];
  
  // A币统计数据
  private aCoinStats: ACoinStats = {
    totalSupply: 1000000000,
    circulatingSupply: 0,
    totalDistributed: 0,
    totalBurned: 0,
    currentPrice: 1,
    distributionHistory: [],
    holdersCount: 0,
    averageHolding: 0
  };

  // O币配置
  private oCoinConfig: OCoinConfig = {
    totalSupply: 1000000000, // 10亿总供应量
    exchangeRate: 1, // 初始价格，后续会波动
    minUnit: 0.00001, // 最小单位
    distributionRatio: 0.6 // 平台净收入的60%用于O币分红和管理
  };

  // O币发放记录
  private oCoinDistributions: OCoinDistribution[] = [];
  
  // O币分红记录
  private oCoinDividends: OCoinDividend[] = [];
  
  // O币统计数据
  private oCoinStats: OCoinStats = {
    totalSupply: 1000000000,
    circulatingSupply: 0,
    totalDistributed: 0,
    totalBurned: 0,
    totalLocked: 1000000000,
    currentPrice: 1,
    priceHistory: [],
    distributionHistory: [],
    dividendHistory: [],
    holdersCount: 0,
    averageHolding: 0,
    marketCap: 1000000000
  };

  constructor() {
    const loaded = this.loadFromStorage();
    if (!loaded) {
      this.initializeMockData();
    } else {
      this.updateBalance();
      this.updateACoinStats();
      this.updateOCoinStats();
    }
  }

  private _saveAll() {
    localStorage.setItem(this.transactionsStorageKey, JSON.stringify(this.transactions));
    localStorage.setItem(this.aCoinDistributionsStorageKey, JSON.stringify(this.aCoinDistributions));
    localStorage.setItem(this.oCoinDistributionsStorageKey, JSON.stringify(this.oCoinDistributions));
    localStorage.setItem(this.oCoinDividendsStorageKey, JSON.stringify(this.oCoinDividends));
  }

  private loadFromStorage(): boolean {
    let needsSave = false;
    const transactionsData = localStorage.getItem(this.transactionsStorageKey);
    if (transactionsData) {
      this.transactions = JSON.parse(transactionsData).map((tx: any) => {
        // 统一数据：将 computing 重命名为 computingPower
        if (tx.currency === 'computing') {
          tx.currency = 'computingPower';
          needsSave = true;
        }
        return {
          ...tx,
          timestamp: new Date(tx.timestamp),
        };
      });
    }

    const aCoinDistributionsData = localStorage.getItem(this.aCoinDistributionsStorageKey);
    if (aCoinDistributionsData) {
      this.aCoinDistributions = JSON.parse(aCoinDistributionsData).map((dist: any) => ({
        ...dist,
        timestamp: new Date(dist.timestamp),
      }));
    }

    const oCoinDistributionsData = localStorage.getItem(this.oCoinDistributionsStorageKey);
    if (oCoinDistributionsData) {
      this.oCoinDistributions = JSON.parse(oCoinDistributionsData).map((dist: any) => ({
        ...dist,
        timestamp: new Date(dist.timestamp),
      }));
    }

    const oCoinDividendsData = localStorage.getItem(this.oCoinDividendsStorageKey);
    if (oCoinDividendsData) {
      this.oCoinDividends = JSON.parse(oCoinDividendsData).map((div: any) => ({
        ...div,
        timestamp: new Date(div.timestamp),
      }));
    }

    if (needsSave) {
      this._saveAll();
    }

    return !!transactionsData || !!aCoinDistributionsData || !!oCoinDistributionsData || !!oCoinDividendsData;
  }

  // 初始化模拟数据
  private initializeMockData(): void {
    const mockTransactions: FundPoolTransaction[] = [
      {
        id: 'FP001',
        type: 'income',
        category: 'commission',
        amount: 105,
        currency: 'gameCoins',
        description: '游戏电商交易佣金',
        relatedTransactionId: 'game_store_purchase_1',
        timestamp: new Date(Date.now() - 86400000 * 2),
        source: 'game_store',
        anonymizedUserId: 'user_***1'
      },
      {
        id: 'FP002',
        type: 'income',
        category: 'commission',
        amount: 8,
        currency: 'computingPower',
        description: '玩家交易市场佣金',
        relatedTransactionId: 'market_purchase_1',
        timestamp: new Date(Date.now() - 86400000 * 4),
        source: 'player_market',
        anonymizedUserId: 'user_***2'
      },
      {
        id: 'FP003',
        type: 'expense',
        category: 'reward',
        amount: 50,
        currency: 'gameCoins',
        description: '用户活动奖励发放',
        timestamp: new Date(Date.now() - 86400000 * 1),
        source: 'system'
      },
      {
        id: 'FP004',
        type: 'income',
        category: 'commission',
        amount: 1.2,
        currency: 'computingPower',
        description: '玩家交易市场佣金',
        relatedTransactionId: 'sale_1',
        timestamp: new Date(Date.now() - 86400000 * 2),
        source: 'player_market',
        anonymizedUserId: 'user_***3'
      },
      // A币相关交易示例
      {
        id: 'FP005',
        type: 'expense',
        category: 'reward',
        amount: 1.2,
        currency: 'aCoins',
        description: 'A币发放 - 2025-01-10',
        relatedTransactionId: 'ACOIN_DIST_1736467200000',
        timestamp: new Date(Date.now() - 86400000 * 1),
        source: 'system',
        anonymizedUserId: 'system'
      },
      {
        id: 'FP006',
        type: 'expense',
        category: 'reward',
        amount: 0.8,
        currency: 'aCoins',
        description: 'A币发放 - 2025-01-09',
        relatedTransactionId: 'ACOIN_DIST_1736380800000',
        timestamp: new Date(Date.now() - 86400000 * 2),
        source: 'system',
        anonymizedUserId: 'system'
      },
      {
        id: 'FP007',
        type: 'expense',
        category: 'reward',
        amount: 1.17,
        currency: 'aCoins',
        description: 'A币发放 - 2025-01-08',
        relatedTransactionId: 'ACOIN_DIST_1736294400000',
        timestamp: new Date(Date.now() - 86400000 * 3),
        source: 'system',
        anonymizedUserId: 'system'
      },
      {
        id: 'FP008',
        type: 'expense',
        category: 'reward',
        amount: 0.5,
        currency: 'aCoins',
        description: 'A币发放 - 2025-01-07',
        relatedTransactionId: 'ACOIN_DIST_1736208000000',
        timestamp: new Date(Date.now() - 86400000 * 4),
        source: 'system',
        anonymizedUserId: 'system'
      }
    ];

    this.transactions = mockTransactions;
    this.updateBalance();
    this._saveAll();
  }

  // 生成交易编号
  private generateTransactionId(): string {
    const count = this.transactions.length + 1;
    return `FP${count.toString().padStart(3, '0')}`;
  }

  // 匿名化用户ID
  private anonymizeUserId(userId: string): string {
    if (userId === 'official_store' || userId === 'system') {
      return userId;
    }
    // 生成匿名ID，保留前缀和后缀的一些字符
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `user_***${Math.abs(hash) % 1000}`;
  }

  // 记录佣金收入
  async recordCommissionIncome(
    transactionId: string,
    amount: number,
    currency: 'computingPower' | 'cash' | 'gameCoins',
    source: 'player_market' | 'official_store' | 'game_store',
    userId: string,
    originalAmount?: number
  ): Promise<FundPoolTransaction> {
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: 'income',
      category: 'commission',
      amount,
      currency,
      description: this.getCommissionDescription(source),
      relatedTransactionId: transactionId,
      timestamp: new Date(),
      source,
      anonymizedUserId: this.anonymizeUserId(userId)
    };

    this.transactions.push(transaction);
    this.updateBalance();
    this._saveAll();
    
    console.log('资金池记录佣金收入:', transaction);
    return transaction;
  }

  // 记录支出
  async recordExpense(
    amount: number,
    currency: 'computingPower' | 'cash' | 'gameCoins' | 'aCoins',
    category: 'operation' | 'reward' | 'refund' | 'maintenance',
    description: string,
    relatedTransactionId?: string
  ): Promise<FundPoolTransaction> {
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: 'expense',
      category,
      amount,
      currency,
      description,
      relatedTransactionId,
      timestamp: new Date(),
      source: 'system'
    };

    this.transactions.push(transaction);
    this.updateBalance();
    this._saveAll();
    
    console.log('资金池记录支出:', transaction);
    return transaction;
  }

  // 获取佣金描述
  private getCommissionDescription(source: string): string {
    switch (source) {
      case 'player_market': return '玩家交易市场佣金';
      case 'game_store': return '游戏电商交易佣金';
      case 'official_store': return '官方商店交易佣金';
      default: return '平台交易佣金';
    }
  }

  // 更新资金池余额
  private updateBalance(): void {
    const newBalance: FundPoolBalance = {
      computingPower: 0,
      cash: 0,
      gameCoins: 0,
      aCoins: 0,
      oCoins: 0,
      totalValue: 0,
      lastUpdated: new Date()
    };

    // 计算各币种余额
    this.transactions.forEach(tx => {
      const multiplier = tx.type === 'income' ? 1 : -1;
      switch (tx.currency) {
        case 'computingPower':
          newBalance.computingPower += tx.amount * multiplier;
          break;
        case 'cash':
          newBalance.cash += tx.amount * multiplier;
          break;
        case 'gameCoins':
          newBalance.gameCoins += tx.amount * multiplier;
          break;
        case 'aCoins':
          // A币特殊处理：只记录发放出去的总量，资金池中A币余额始终为0
          // 因为A币是基金模式，发放即转移给用户，不在资金池中保留
          // 这里我们保持余额为0，实际的A币统计在aCoinStats中处理
          break;
        case 'oCoins':
          // O币特殊处理：只记录发放出去的总量，资金池中O币余额始终为0
          // 因为O币是证券模式，发放即转移给用户，不在资金池中保留
          // 这里我们保持余额为0，实际的O币统计在oCoinStats中处理
          break;
      }
    });

    // 计算总价值（转换为现金）
    newBalance.totalValue = 
      newBalance.computingPower * this.exchangeRates.computingPower +
      newBalance.cash * this.exchangeRates.cash +
      newBalance.gameCoins * this.exchangeRates.gameCoins +
      newBalance.aCoins * this.exchangeRates.aCoins +
      newBalance.oCoins * this.exchangeRates.oCoins;

    // 保留两位小数
    newBalance.computingPower = Math.round(newBalance.computingPower * 100) / 100;
    newBalance.cash = Math.round(newBalance.cash * 100) / 100;
    newBalance.gameCoins = Math.round(newBalance.gameCoins * 100) / 100;
    // A币余额始终为0，因为发放即转移给用户
    newBalance.aCoins = 0;
    // O币余额始终为0，因为发放即转移给用户
    newBalance.oCoins = 0;
    newBalance.totalValue = Math.round(newBalance.totalValue * 100) / 100;

    this.balance = newBalance;
  }

  // 获取当前余额
  async getCurrentBalance(): Promise<FundPoolBalance> {
    return { ...this.balance };
  }

  // 获取所有交易记录
  async getAllTransactions(): Promise<FundPoolTransaction[]> {
    return [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 获取分页交易记录
  async getTransactions(page: number = 1, limit: number = 50): Promise<{
    transactions: FundPoolTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const sortedTransactions = [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      transactions: sortedTransactions.slice(startIndex, endIndex),
      total: this.transactions.length,
      page,
      totalPages: Math.ceil(this.transactions.length / limit)
    };
  }

  // 获取统计数据
  async getStats(): Promise<FundPoolStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    // 检查是否有强制设置的平台净收入
    const forcedIncomeStr = localStorage.getItem('forced_platform_income');
    const hasForcedIncome = forcedIncomeStr !== null;
    const forcedIncome = hasForcedIncome ? parseFloat(forcedIncomeStr) : 0;

    // 计算总收入和支出
    const totalIncome = { computingPower: 0, cash: 0, gameCoins: 0, aCoins: 0, oCoins: 0, totalValue: 0 };
    const totalExpense = { computingPower: 0, cash: 0, gameCoins: 0, aCoins: 0, oCoins: 0, totalValue: 0 };
    
    // 按类别统计
    const incomeByCategory = { commission: 0, operation: 0, reward: 0, refund: 0, maintenance: 0, dividend: 0 };
    const expenseByCategory = { commission: 0, operation: 0, reward: 0, refund: 0, maintenance: 0, dividend: 0 };
    
    // 按来源统计
    const incomeBySource = { player_market: 0, official_store: 0, game_store: 0, system: 0 };

    this.transactions.forEach(tx => {
      const value = tx.amount * (this.exchangeRates[tx.currency as keyof typeof this.exchangeRates] || 0);
      
      if (tx.type === 'income') {
        (totalIncome as any)[tx.currency] += tx.amount;
        totalIncome.totalValue += value;
        (incomeByCategory as any)[tx.category] += value;
        (incomeBySource as any)[tx.source] += value;
      } else {
        (totalExpense as any)[tx.currency] += tx.amount;
        totalExpense.totalValue += value;
        (expenseByCategory as any)[tx.category] += value;
      }
    });

    // 计算净收入
    const netIncome = {
      computingPower: totalIncome.computingPower - totalExpense.computingPower,
      cash: totalIncome.cash - totalExpense.cash,
      gameCoins: totalIncome.gameCoins - totalExpense.gameCoins,
      aCoins: totalIncome.aCoins - totalExpense.aCoins,
      oCoins: totalIncome.oCoins - totalExpense.oCoins,
      totalValue: hasForcedIncome ? forcedIncome : totalIncome.totalValue - totalExpense.totalValue
    };

    // 如果有强制设置的平台净收入，更新总收入
    if (hasForcedIncome) {
      console.log(`使用强制设置的平台净收入: ${forcedIncome}`);
      totalIncome.totalValue = forcedIncome + totalExpense.totalValue;
      totalIncome.cash = forcedIncome + totalExpense.cash;
    }

    // 生成日统计（最近30天）
    const dailyStats = this.generateDailyStats(thirtyDaysAgo, now, hasForcedIncome, forcedIncome);
    const weeklyStats = this.generateWeeklyStats();
    const monthlyStats = this.generateMonthlyStats();

    return {
      totalIncome,
      totalExpense,
      netIncome,
      incomeByCategory,
      expenseByCategory,
      incomeBySource,
      dailyStats,
      weeklyStats,
      monthlyStats
    };
  }

  // 生成日统计
  private generateDailyStats(
    startDate: Date, 
    endDate: Date, 
    hasForcedIncome: boolean = false, 
    forcedIncome: number = 0
  ): Array<{
    date: string;
    income: number;
    expense: number;
    netIncome: number;
  }> {
    const stats: { [key: string]: { income: number; expense: number } } = {};
    
    // 初始化所有日期
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      stats[dateStr] = { income: 0, expense: 0 };
    }

    // 统计每日数据
    this.transactions.forEach(tx => {
      const dateStr = tx.timestamp.toISOString().split('T')[0];
      if (stats[dateStr]) {
        const value = tx.amount * this.exchangeRates[tx.currency];
        if (tx.type === 'income') {
          stats[dateStr].income += value;
        } else {
          stats[dateStr].expense += value;
        }
      }
    });

    // 处理结果
    const result = Object.entries(stats).map(([date, data]) => {
      // 如果是今天且有强制设置的收入，则使用强制设置的收入
      const isToday = date === new Date().toISOString().split('T')[0];
      const income = (isToday && hasForcedIncome) ? forcedIncome + data.expense : data.income;
      const netIncome = (isToday && hasForcedIncome) ? forcedIncome : income - data.expense;
      
      return {
        date,
        income: Math.round(income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        netIncome: Math.round(netIncome * 100) / 100
      };
    });
    
    return result;
  }

  // 生成周统计
  private generateWeeklyStats(): Array<{
    week: string;
    income: number;
    expense: number;
    netIncome: number;
  }> {
    // 简化实现，返回最近4周的数据
    return [
      { week: '第1周', income: 150.5, expense: 50.0, netIncome: 100.5 },
      { week: '第2周', income: 200.3, expense: 75.2, netIncome: 125.1 },
      { week: '第3周', income: 180.7, expense: 60.0, netIncome: 120.7 },
      { week: '第4周', income: 220.1, expense: 80.5, netIncome: 139.6 }
    ];
  }

  // 生成月统计
  private generateMonthlyStats(): Array<{
    month: string;
    income: number;
    expense: number;
    netIncome: number;
  }> {
    // 简化实现，返回最近6个月的数据
    return [
      { month: '1月', income: 500.0, expense: 150.0, netIncome: 350.0 },
      { month: '2月', income: 650.5, expense: 200.3, netIncome: 450.2 },
      { month: '3月', income: 720.8, expense: 180.5, netIncome: 540.3 },
      { month: '4月', income: 800.2, expense: 220.0, netIncome: 580.2 },
      { month: '5月', income: 900.1, expense: 250.8, netIncome: 649.3 },
      { month: '6月', income: 1050.3, expense: 300.2, netIncome: 750.1 }
    ];
  }

  // A币发放方法 - 基于实际可获得数据的算法
  async distributeACoins(platformNetIncome: number, dailyUserData: {
    userId: string;
    gameCoinsEarned: number; // 当日获得的游戏币数量
    computingPowerContributed: number; // 当日贡献的算力
    transactionVolume: number; // 当日交易金额
  }[]): Promise<ACoinDistribution> {
    const distributionAmount = platformNetIncome * this.aCoinConfig.distributionRatio;
    const period = new Date().toISOString().split('T')[0];
    
    // 计算全网当日总数据
    const totalGameCoinsEarned = dailyUserData.reduce((sum, user) => sum + user.gameCoinsEarned, 0);
    const totalComputingContributed = dailyUserData.reduce((sum, user) => sum + user.computingPowerContributed, 0);
    const totalTransactionVolume = dailyUserData.reduce((sum, user) => sum + user.transactionVolume, 0);
    
    // 计算每个用户的个人贡献分数
    const recipients = dailyUserData.map(user => {
      // 个人贡献分数计算公式
      const contributionScore = this.calculateContributionScore(
        user.gameCoinsEarned,
        user.computingPowerContributed,
        user.transactionVolume,
        totalGameCoinsEarned,
        totalComputingContributed,
        totalTransactionVolume
      );
      
      return {
        userId: user.userId,
        contributionScore,
        gameCoinsEarned: user.gameCoinsEarned,
        computingPowerContributed: user.computingPowerContributed,
        transactionVolume: user.transactionVolume
      };
    });
    
    // 计算全网总贡献分数
    const totalContributionScore = recipients.reduce((sum, user) => sum + user.contributionScore, 0);
    
    // 按贡献分数比例分配A币
    const finalRecipients = recipients
      .filter(user => user.contributionScore > 0) // 只给有贡献的用户发放
      .map(user => {
        const distributionRatio = user.contributionScore / totalContributionScore;
        const amount = Math.round(distributionAmount * distributionRatio * 100) / 100; // 保留两位小数
        
        // 确定发放原因
        let reason: 'activity' | 'computing' | 'economic' | 'special' = 'activity';
        if (user.computingPowerContributed > user.gameCoinsEarned * 0.1) {
          reason = 'computing';
        } else if (user.transactionVolume > user.gameCoinsEarned * 0.05) {
          reason = 'economic';
        }
        
        return {
          userId: user.userId,
          amount,
          reason,
          contributionScore: user.contributionScore
        };
      })
      .filter(user => user.amount >= 0.01); // 过滤掉小于最小单位的发放

    const actualDistributed = finalRecipients.reduce((sum, user) => sum + user.amount, 0);

    const distribution: ACoinDistribution = {
      id: `ACOIN_DIST_${Date.now()}`,
      period,
      totalDistributed: actualDistributed,
      platformIncome: platformNetIncome,
      distributionPool: distributionAmount,
      recipients: finalRecipients,
      timestamp: new Date()
    };

    this.aCoinDistributions.push(distribution);
    this.updateACoinStats();

    // 记录A币发放交易 - 注意：这不是从资金池支出，而是平台收入的转化记录
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: 'expense', // 标记为支出是为了记录目的，但不影响资金池余额
      category: 'reward',
      amount: actualDistributed,
      currency: 'aCoins',
      description: `每日A币自动结算发放 - ${period}`,
      relatedTransactionId: distribution.id,
      timestamp: new Date(),
      source: 'system',
      anonymizedUserId: 'system'
    };

    this.transactions.push(transaction);
    this._saveAll();
    // 注意：不调用updateBalance()，因为A币发放不影响资金池余额

    return distribution;
  }

  // 个人贡献分数计算公式
  private calculateContributionScore(
    userGameCoins: number,
    userComputingPower: number,
    userTransactionVolume: number,
    totalGameCoins: number,
    totalComputing: number,
    totalTransactionVolume: number
  ): number {
    // 权重配置
    const weights = {
      gameCoins: 0.5,    // 游戏币获得权重 50%
      computingPower: 0.3,    // 算力贡献权重 30%
      transaction: 0.2   // 交易活跃权重 20%
    };
    
    // 计算各项贡献比例（避免除零）
    const gameCoinsRatio = totalGameCoins > 0 ? userGameCoins / totalGameCoins : 0;
    const computingRatio = totalComputing > 0 ? userComputingPower / totalComputing : 0;
    const transactionRatio = totalTransactionVolume > 0 ? userTransactionVolume / totalTransactionVolume : 0;
    
    // 综合贡献分数 = 各项比例 × 权重 × 1000（放大便于计算）
    const contributionScore = (
      gameCoinsRatio * weights.gameCoins +
      computingRatio * weights.computingPower +
      transactionRatio * weights.transaction
    ) * 1000;
    
    // 设置最低贡献门槛（避免微小贡献获得奖励）
    return contributionScore >= 0.1 ? Math.round(contributionScore * 100) / 100 : 0;
  }

  // 获取用户贡献分数详情
  async getUserContributionDetails(userId: string, period: string): Promise<{
    gameCoinsContribution: number;
    computingContribution: number;
    transactionContribution: number;
    totalScore: number;
    rank: number;
  } | null> {
    const distribution = this.aCoinDistributions.find(d => d.period === period);
    if (!distribution) return null;
    
    const userRecord = distribution.recipients.find(r => r.userId === userId);
    if (!userRecord) return null;
    
    // 这里需要根据实际数据计算，暂时返回模拟数据
    return {
      gameCoinsContribution: 0.5,
      computingContribution: 0.3,
      transactionContribution: 0.2,
      totalScore: userRecord.contributionScore,
      rank: distribution.recipients
        .sort((a, b) => b.contributionScore - a.contributionScore)
        .findIndex(r => r.userId === userId) + 1
    };
  }

  // 更新A币统计数据
  private updateACoinStats(): void {
    // 计算总发放量
    const totalDistributed = this.aCoinDistributions.reduce((sum, dist) => sum + dist.totalDistributed, 0);
    
    // 计算持有人数量 - 如果recipients为空，则使用模拟数据
    let holdersCount = this.aCoinDistributions.reduce((count, dist) => {
      // 如果有recipients数据，使用实际数据
      if (dist.recipients && dist.recipients.length > 0) {
        return count + dist.recipients.length;
      }
      // 否则，估算持有人数量（假设每人平均获得10个A币）
      return count + Math.ceil(dist.totalDistributed / 10);
    }, 0);
    
    // 确保持有人数量至少为1
    holdersCount = Math.max(1, holdersCount);
    
    // 从交易记录中获取A币发放记录
    const aCoinTransactions = this.transactions.filter(tx => 
      tx.currency === 'aCoins' && tx.type === 'expense' && tx.category === 'reward'
    );
    
    // 计算实际流通量（考虑可能的回收）
    const circulatingSupply = Math.max(0, totalDistributed - this.aCoinStats.totalBurned);
    
    // 更新A币统计数据
    this.aCoinStats = {
      ...this.aCoinStats,
      circulatingSupply,
      totalDistributed,
      distributionHistory: [...this.aCoinDistributions],
      holdersCount,
      averageHolding: holdersCount > 0 ? circulatingSupply / holdersCount : 0
    };
    
    // 将更新后的数据保存到localStorage，确保UI能够正确显示
    localStorage.setItem('acoin_circulating_supply', circulatingSupply.toString());
    localStorage.setItem('acoin_total_distributed', totalDistributed.toString());
    localStorage.setItem('acoin_holders_count', holdersCount.toString());
    
    console.log('A币统计数据已更新:', {
      circulatingSupply,
      totalDistributed,
      holdersCount,
      averageHolding: this.aCoinStats.averageHolding
    });
  }

  // 获取A币统计数据
  async getACoinStats(): Promise<ACoinStats> {
    // 从localStorage获取最新的A币统计数据
    const circulatingSupply = localStorage.getItem('acoin_circulating_supply');
    const totalDistributed = localStorage.getItem('acoin_total_distributed');
    const holdersCount = localStorage.getItem('acoin_holders_count');
    
    // 如果localStorage中有数据，则使用localStorage中的数据
    if (circulatingSupply && totalDistributed && holdersCount) {
      const stats = { 
        ...this.aCoinStats,
        circulatingSupply: parseFloat(circulatingSupply),
        totalDistributed: parseFloat(totalDistributed),
        holdersCount: parseInt(holdersCount, 10)
      };
      
      // 更新内存中的统计数据
      this.aCoinStats = stats;
      
      console.log('从localStorage获取A币统计数据:', stats);
      return stats;
    }
    
    // 如果localStorage中没有数据，则刷新统计数据
    await this.refreshACoinStats();
    return { ...this.aCoinStats };
  }
  
  // 刷新A币统计数据
  async refreshACoinStats(): Promise<void> {
    // 计算总发放量
    const totalDistributed = this.aCoinDistributions.reduce((sum, dist) => sum + dist.totalDistributed, 0);
    
    // 从交易记录中获取A币发放记录
    const aCoinTransactions = this.transactions.filter(tx => 
      tx.currency === 'aCoins' && tx.type === 'expense' && tx.category === 'reward'
    );
    
    // 如果没有分发记录，但有交易记录，则使用交易记录计算总发放量
    const transactionTotal = aCoinTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const finalTotalDistributed = totalDistributed > 0 ? totalDistributed : transactionTotal;
    
    // 计算持有人数量
    let holdersCount = this.aCoinDistributions.reduce((count, dist) => {
      // 如果有recipients数据，使用实际数据
      if (dist.recipients && dist.recipients.length > 0) {
        return count + dist.recipients.length;
      }
      // 否则，估算持有人数量（假设每人平均获得10个A币）
      return count + Math.ceil(dist.totalDistributed / 10);
    }, 0);
    
    // 确保持有人数量至少为1
    holdersCount = Math.max(1, holdersCount);
    
    // 检查是否有模拟数据
    const mockDistributed = localStorage.getItem('mock_acoin_distributed');
    const mockHolders = localStorage.getItem('mock_acoin_holders');
    
    // 如果有模拟数据，则使用模拟数据
    if (mockDistributed) {
      const mockAmount = parseFloat(mockDistributed);
      if (mockAmount > finalTotalDistributed) {
        console.log(`使用模拟A币发放量: ${mockAmount}`);
        this.aCoinStats.totalDistributed = mockAmount;
        this.aCoinStats.circulatingSupply = mockAmount;
      }
    }
    
    if (mockHolders) {
      const mockHoldersCount = parseInt(mockHolders, 10);
      if (mockHoldersCount > holdersCount) {
        console.log(`使用模拟A币持有人数: ${mockHoldersCount}`);
        this.aCoinStats.holdersCount = mockHoldersCount;
      }
    }
    
    // 如果没有模拟数据，则使用计算的数据
    if (!mockDistributed && finalTotalDistributed > 0) {
      this.aCoinStats.totalDistributed = finalTotalDistributed;
      this.aCoinStats.circulatingSupply = finalTotalDistributed - this.aCoinStats.totalBurned;
    }
    
    if (!mockHolders && holdersCount > 0) {
      this.aCoinStats.holdersCount = holdersCount;
    }
    
    // 计算平均持有量
    this.aCoinStats.averageHolding = this.aCoinStats.holdersCount > 0 
      ? this.aCoinStats.circulatingSupply / this.aCoinStats.holdersCount 
      : 0;
    
    // 将更新后的数据保存到localStorage，确保UI能够正确显示
    localStorage.setItem('acoin_circulating_supply', this.aCoinStats.circulatingSupply.toString());
    localStorage.setItem('acoin_total_distributed', this.aCoinStats.totalDistributed.toString());
    localStorage.setItem('acoin_holders_count', this.aCoinStats.holdersCount.toString());
    
    console.log('A币统计数据已刷新:', {
      circulatingSupply: this.aCoinStats.circulatingSupply,
      totalDistributed: this.aCoinStats.totalDistributed,
      holdersCount: this.aCoinStats.holdersCount,
      averageHolding: this.aCoinStats.averageHolding
    });
  }

  // 获取A币配置
  async getACoinConfig(): Promise<ACoinConfig> {
    return { ...this.aCoinConfig };
  }

  // 获取公开资金池数据
  async getPublicFundPoolData(): Promise<PublicFundPoolData> {
    const [balance, recentTransactions, stats, aCoinStats, oCoinStats] = await Promise.all([
      this.getCurrentBalance(),
      this.getTransactions(1, 20),
      this.getStats(),
      this.getACoinStats(),
      this.getOCoinStats()
    ]);

    const averageTransactionAmount = this.transactions.length > 0 
      ? this.transactions.reduce((sum, tx) => sum + tx.amount * this.exchangeRates[tx.currency], 0) / this.transactions.length
      : 0;

    return {
      currentBalance: balance,
      recentTransactions: recentTransactions.transactions,
      stats,
      transactionCount: this.transactions.length,
      averageTransactionAmount: Math.round(averageTransactionAmount * 100) / 100,
      aCoinStats,
      oCoinStats
    };
  }

  // 更新A币余额
  async updateACoinBalance(amount: number, description: string): Promise<void> {
    // 记录A币变动交易
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: amount < 0 ? 'expense' : 'income',
      category: 'reward',
      amount: Math.abs(amount),
      currency: 'aCoins',
      description,
      timestamp: new Date(),
      source: 'system',
      anonymizedUserId: 'system'
    };

    this.transactions.push(transaction);
    
    // 更新A币统计数据
    if (amount < 0) {
      // A币发放，增加流通量
      this.aCoinStats.circulatingSupply += Math.abs(amount);
      this.aCoinStats.totalDistributed += Math.abs(amount);
    } else {
      // A币回收，减少流通量
      this.aCoinStats.circulatingSupply -= Math.min(Math.abs(amount), this.aCoinStats.circulatingSupply);
      this.aCoinStats.totalBurned += Math.abs(amount);
    }
    
    // 更新A币分发历史
    const today = new Date().toISOString().split('T')[0];
    const existingDistribution = this.aCoinDistributions.find(d => d.period === today);
    
    if (existingDistribution && amount < 0) {
      // 如果今天已有分发记录，更新总量
      existingDistribution.totalDistributed += Math.abs(amount);
    } else if (amount < 0) {
      // 如果今天没有分发记录，创建新记录
      this.aCoinDistributions.push({
        id: `ACOIN_DIST_${Date.now()}`,
        period: today,
        totalDistributed: Math.abs(amount),
        platformIncome: 1000, // 假设平台收入
        distributionPool: Math.abs(amount),
        recipients: [],
        timestamp: new Date()
      });
    }
    
    // 更新统计数据
    this.updateACoinStats();
    this._saveAll();
    
    console.log(`A币余额更新: ${amount > 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)} A币`);
  }

  // 获取O币配置
  async getOCoinConfig(): Promise<OCoinConfig> {
    return { ...this.oCoinConfig };
  }

  // 更新O币余额
  async updateOCoinBalance(amount: number, description: string): Promise<void> {
    // 记录O币变动交易
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: amount < 0 ? 'expense' : 'income',
      category: 'reward',
      amount: Math.abs(amount),
      currency: 'oCoins',
      description,
      timestamp: new Date(),
      source: 'system',
      anonymizedUserId: 'system'
    };

    this.transactions.push(transaction);
    
    // 更新O币统计数据
    if (amount < 0) {
      // O币发放，增加流通量，减少锁定量
      this.oCoinStats.circulatingSupply += Math.abs(amount);
      this.oCoinStats.totalDistributed += Math.abs(amount);
      this.oCoinStats.totalLocked -= Math.abs(amount);
    } else {
      // O币回收，减少流通量
      this.oCoinStats.circulatingSupply -= Math.min(Math.abs(amount), this.oCoinStats.circulatingSupply);
      this.oCoinStats.totalBurned += Math.abs(amount);
    }
    
    // 更新O币分发历史
    const today = new Date().toISOString().split('T')[0];
    const existingDistribution = this.oCoinDistributions.find(d => d.period === today);
    
    if (existingDistribution && amount < 0) {
      // 如果今天已有分发记录，更新总量
      existingDistribution.totalDistributed += Math.abs(amount);
    } else if (amount < 0) {
      // 如果今天没有分发记录，创建新记录
      this.oCoinDistributions.push({
        id: `OCOIN_DIST_${Date.now()}`,
        period: today,
        totalDistributed: Math.abs(amount),
        platformNetIncome: 1000, // 假设平台净收入
        distributionPool: Math.abs(amount),
        recipients: [],
        timestamp: new Date()
      });
    }
    
    // 更新统计数据
    this.updateOCoinStats();
    this._saveAll();
    
    console.log(`O币余额更新: ${amount > 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)} O币`);
  }

  // 更新O币统计数据
  private async updateOCoinStats(): Promise<void> {
    // 获取最新O币价格
    const currentPrice = await this.getOCoinPrice();
    this.exchangeRates.oCoins = currentPrice;
    
    // 计算总发放量
    const totalDistributed = this.oCoinDistributions.reduce((sum, dist) => sum + dist.totalDistributed, 0);
    
    // 从交易记录中获取O币发放记录
    const oCoinTransactions = this.transactions.filter(tx => 
      tx.currency === 'oCoins' && tx.type === 'expense' && tx.category === 'reward'
    );
    
    // 如果没有分发记录，但有交易记录，则使用交易记录计算总发放量
    const transactionTotal = oCoinTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const finalTotalDistributed = totalDistributed > 0 ? totalDistributed : transactionTotal;
    
    // 计算持有人数量
    let holdersCount = this.oCoinDistributions.reduce((count, dist) => {
      // 如果有recipients数据，使用实际数据
      if (dist.recipients && dist.recipients.length > 0) {
        return count + dist.recipients.length;
      }
      // 否则，估算持有人数量（假设每人平均获得1000个O币）
      return count + Math.ceil(dist.totalDistributed / 1000);
    }, 0);
    
    // 确保持有人数量至少为1
    holdersCount = Math.max(1, holdersCount);
    
    // 检查是否有模拟数据
    const mockDistributed = localStorage.getItem('mock_ocoin_distributed');
    const mockHolders = localStorage.getItem('mock_ocoin_holders');
    
    // 如果有模拟数据，则使用模拟数据
    if (mockDistributed) {
      const mockAmount = parseFloat(mockDistributed);
      if (mockAmount > finalTotalDistributed) {
        console.log(`使用模拟O币发放量: ${mockAmount}`);
        this.oCoinStats.totalDistributed = mockAmount;
        this.oCoinStats.circulatingSupply = mockAmount;
        this.oCoinStats.totalLocked = this.oCoinStats.totalSupply - mockAmount;
      }
    }
    
    if (mockHolders) {
      const mockHoldersCount = parseInt(mockHolders, 10);
      if (mockHoldersCount > holdersCount) {
        console.log(`使用模拟O币持有人数: ${mockHoldersCount}`);
        this.oCoinStats.holdersCount = mockHoldersCount;
      }
    }
    
    // 如果没有模拟数据，则使用计算的数据
    if (!mockDistributed && finalTotalDistributed > 0) {
      this.oCoinStats.totalDistributed = finalTotalDistributed;
      this.oCoinStats.circulatingSupply = finalTotalDistributed - this.oCoinStats.totalBurned;
      this.oCoinStats.totalLocked = this.oCoinStats.totalSupply - this.oCoinStats.circulatingSupply;
    }
    
    if (!mockHolders && holdersCount > 0) {
      this.oCoinStats.holdersCount = holdersCount;
    }
    
    // 计算平均持有量
    this.oCoinStats.averageHolding = this.oCoinStats.holdersCount > 0 
      ? this.oCoinStats.circulatingSupply / this.oCoinStats.holdersCount 
      : 0;
    
    // 计算市值
    this.oCoinStats.marketCap = this.oCoinStats.circulatingSupply * currentPrice;
    
    // 将更新后的数据保存到localStorage，确保UI能够正确显示
    localStorage.setItem('ocoin_circulating_supply', this.oCoinStats.circulatingSupply.toString());
    localStorage.setItem('ocoin_total_distributed', this.oCoinStats.totalDistributed.toString());
    localStorage.setItem('ocoin_holders_count', this.oCoinStats.holdersCount.toString());
    localStorage.setItem('ocoin_current_price', currentPrice.toString());
    localStorage.setItem('ocoin_market_cap', this.oCoinStats.marketCap.toString());
    
    console.log('O币统计数据已更新:', {
      circulatingSupply: this.oCoinStats.circulatingSupply,
      totalDistributed: this.oCoinStats.totalDistributed,
      holdersCount: this.oCoinStats.holdersCount,
      averageHolding: this.oCoinStats.averageHolding,
      currentPrice,
      marketCap: this.oCoinStats.marketCap
    });
  }

  // 获取O币统计数据
  async getOCoinStats(): Promise<OCoinStats> {
    // 从localStorage获取最新的O币统计数据
    const circulatingSupply = localStorage.getItem('ocoin_circulating_supply');
    const totalDistributed = localStorage.getItem('ocoin_total_distributed');
    const holdersCount = localStorage.getItem('ocoin_holders_count');
    const currentPrice = localStorage.getItem('ocoin_current_price');
    const marketCap = localStorage.getItem('ocoin_market_cap');
    
    // 如果localStorage中有数据，则使用localStorage中的数据
    if (circulatingSupply && totalDistributed && holdersCount && currentPrice && marketCap) {
      const stats = { 
        ...this.oCoinStats,
        circulatingSupply: parseFloat(circulatingSupply),
        totalDistributed: parseFloat(totalDistributed),
        holdersCount: parseInt(holdersCount, 10),
        currentPrice: parseFloat(currentPrice),
        marketCap: parseFloat(marketCap),
        totalLocked: this.oCoinStats.totalSupply - parseFloat(circulatingSupply)
      };
      
      // 更新内存中的统计数据
      this.oCoinStats = stats;
      
      console.log('从localStorage获取O币统计数据:', stats);
      return stats;
    }
    
    // 如果localStorage中没有数据，则刷新统计数据
    await this.updateOCoinStats();
    return { ...this.oCoinStats };
  }

  // O币发放方法 - 基于贡献值和期权的算法
  async distributeOCoins(platformNetIncome: number, contributorData: {
    userId: string;
    contributionType: 'development' | 'management' | 'investment' | 'community';
    contributionValue: number; // 贡献值
    optionsAmount: number; // 期权数量
  }[]): Promise<OCoinDistribution> {
    // 计算可分配的O币总量（平台净收入的60%减去A币发放后的部分）
    const aCoinDistributionAmount = platformNetIncome * this.aCoinConfig.distributionRatio;
    const remainingNetIncome = platformNetIncome - aCoinDistributionAmount;
    const distributionAmount = remainingNetIncome * this.oCoinConfig.distributionRatio;
    const period = new Date().toISOString().split('T')[0];
    
    // 计算全网当日总贡献值
    const totalContributionValue = contributorData.reduce((sum, contributor) => sum + contributor.contributionValue, 0);
    
    // 计算每个贡献者的个人贡献分数
    const recipients = contributorData.map(contributor => {
      // 个人贡献分数计算公式
      const contributionScore = totalContributionValue > 0 
        ? contributor.contributionValue / totalContributionValue * 1000 
        : 0;
      
      // 计算分配的O币数量（基于贡献分数和期权数量）
      const contributionBasedAmount = distributionAmount * (contributionScore / 1000);
      const optionsBasedAmount = contributor.optionsAmount;
      const totalAmount = contributionBasedAmount + optionsBasedAmount;
      
      return {
        userId: contributor.userId,
        amount: Math.round(totalAmount * 100) / 100, // 保留两位小数
        reason: contributor.contributionType,
        contributionScore
      };
    }).filter(recipient => recipient.amount >= this.oCoinConfig.minUnit); // 过滤掉小于最小单位的发放
    
    const actualDistributed = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
    
    const distribution: OCoinDistribution = {
      id: `OCOIN_DIST_${Date.now()}`,
      period,
      totalDistributed: actualDistributed,
      platformNetIncome: platformNetIncome,
      distributionPool: distributionAmount,
      recipients,
      timestamp: new Date()
    };
    
    this.oCoinDistributions.push(distribution);
    
    // 记录O币发放交易
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: 'expense',
      category: 'reward',
      amount: actualDistributed,
      currency: 'oCoins',
      description: `O币发放 - ${period} (平台贡献奖励)`,
      relatedTransactionId: distribution.id,
      timestamp: new Date(),
      source: 'system',
      anonymizedUserId: 'system'
    };
    
    this.transactions.push(transaction);
    
    // 更新O币统计数据
    await this.updateOCoinStats();
    this._saveAll();
    
    return distribution;
  }

  // 计算工资包（根据用户描述的业务逻辑）
  async calculateSalaryPackage(params: SalaryPackageParams): Promise<SalaryPackageResult> {
    // 平台奖励部分：平台委员会决定的百分比 * (平台收入 - 运营成本)
    const platformReward = params.platformNetIncome * params.platformCommitteeRewardPercent;
    
    // 社区奖励部分：玩家社区代表决定的百分比 * 游戏收入增长
    const communityReward = params.gameRevenueIncrease * params.communityRepresentativeRewardPercent;
    
    // 现金奖励总额
    const cashReward = platformReward + communityReward;
    
    // O币奖励（期权数量）
    const oCoinReward = params.oCoinOptions;
    
    // 计算总价值（现金 + O币的当前市值）
    const oCoinPrice = await this.getOCoinPrice();
    const totalValue = cashReward + (oCoinReward * oCoinPrice);
    
    return {
      cashReward,
      oCoinReward,
      totalValue,
      breakdown: {
        platformReward,
        communityReward,
        oCoinOptions: params.oCoinOptions
      }
    };
  }

  // 计算O币分红
  async calculateOCoinDividend(dividendPool: number): Promise<OCoinDividend> {
    const period = new Date().toISOString().split('T')[0];
    
    // 获取所有O币持有者数据（在实际应用中，这应该从数据库获取）
    // 这里我们使用模拟数据
    const holders = await this.getOCoinHolders();
    
    // 计算总流通O币数量
    const totalCirculatingOCoins = this.oCoinStats.circulatingSupply;
    
    // 计算每个持有者的分红
    const recipients = holders.map(holder => {
      const dividendRatio = totalCirculatingOCoins > 0 ? holder.oCoinAmount / totalCirculatingOCoins : 0;
      const amount = dividendPool * dividendRatio;
      
      return {
        userId: holder.userId,
        oCoinAmount: holder.oCoinAmount,
        dividendRatio,
        amount: Math.round(amount * 100) / 100 // 保留两位小数
      };
    }).filter(recipient => recipient.amount >= 0.01); // 过滤掉小于0.01的分红
    
    const actualDividendAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
    
    const dividend: OCoinDividend = {
      id: `OCOIN_DIV_${Date.now()}`,
      period,
      totalAmount: actualDividendAmount,
      recipients,
      timestamp: new Date()
    };
    
    this.oCoinDividends.push(dividend);
    
    // 记录分红交易
    const transaction: FundPoolTransaction = {
      id: this.generateTransactionId(),
      type: 'expense',
      category: 'dividend',
      amount: actualDividendAmount,
      currency: 'cash',
      description: `O币持有者分红 - ${period}`,
      relatedTransactionId: dividend.id,
      timestamp: new Date(),
      source: 'system',
      anonymizedUserId: 'system'
    };
    
    this.transactions.push(transaction);
    this.updateBalance();
    
    // 更新O币统计数据
    this.oCoinStats.dividendHistory.push(dividend);
    this._saveAll();
    
    return dividend;
  }

  // 获取O币持有者数据（模拟数据）
  private async getOCoinHolders(): Promise<Array<{
    userId: string;
    oCoinAmount: number;
  }>> {
    // 在实际应用中，这应该从数据库获取
    // 这里我们使用模拟数据
    const holdersCount = this.oCoinStats.holdersCount || 10;
    const circulatingSupply = this.oCoinStats.circulatingSupply || 1000000;
    
    // 生成模拟持有者数据
    const holders: Array<{userId: string; oCoinAmount: number}> = [];
    
    // 创建一些大持有者（占总量的30%）
    const bigHoldersCount = Math.max(1, Math.floor(holdersCount * 0.05));
    const bigHoldersTotalAmount = circulatingSupply * 0.3;
    const avgBigHolderAmount = bigHoldersTotalAmount / bigHoldersCount;
    
    for (let i = 0; i < bigHoldersCount; i++) {
      holders.push({
        userId: `big_holder_${i}`,
        oCoinAmount: avgBigHolderAmount * (0.8 + Math.random() * 0.4) // 随机波动±20%
      });
    }
    
    // 创建中等持有者（占总量的40%）
    const mediumHoldersCount = Math.max(1, Math.floor(holdersCount * 0.25));
    const mediumHoldersTotalAmount = circulatingSupply * 0.4;
    const avgMediumHolderAmount = mediumHoldersTotalAmount / mediumHoldersCount;
    
    for (let i = 0; i < mediumHoldersCount; i++) {
      holders.push({
        userId: `medium_holder_${i}`,
        oCoinAmount: avgMediumHolderAmount * (0.8 + Math.random() * 0.4) // 随机波动±20%
      });
    }
    
    // 创建小持有者（占总量的30%）
    const smallHoldersCount = holdersCount - bigHoldersCount - mediumHoldersCount;
    const smallHoldersTotalAmount = circulatingSupply * 0.3;
    const avgSmallHolderAmount = smallHoldersTotalAmount / smallHoldersCount;
    
    for (let i = 0; i < smallHoldersCount; i++) {
      holders.push({
        userId: `small_holder_${i}`,
        oCoinAmount: avgSmallHolderAmount * (0.8 + Math.random() * 0.4) // 随机波动±20%
      });
    }
    
    return holders;
  }

  // 更新O币价格
  async updateOCoinPrice(newPrice: number): Promise<void> {
    // 更新O币价格
    this.oCoinStats.currentPrice = newPrice;
    this.exchangeRates.oCoins = newPrice;
    
    // 更新价格历史
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.oCoinStats.priceHistory) {
      this.oCoinStats.priceHistory = [];
    }
    
    const existingPriceRecord = this.oCoinStats.priceHistory.find(record => record.date === today);
    
    if (existingPriceRecord) {
      existingPriceRecord.price = newPrice;
    } else {
      this.oCoinStats.priceHistory.push({
        date: today,
        price: newPrice
      });
    }
    
    // 更新市值
    this.oCoinStats.marketCap = this.oCoinStats.circulatingSupply * newPrice;
    
    // 保存到localStorage
    localStorage.setItem('ocoin_current_price', newPrice.toString());
    localStorage.setItem('ocoin_market_cap', this.oCoinStats.marketCap.toString());
    
    console.log(`O币价格更新: ${newPrice.toFixed(4)}, 市值: ${this.oCoinStats.marketCap.toFixed(2)}`);
  }

  // 模拟O币价格波动
  async simulateOCoinPriceFluctuation(): Promise<number> {
    // 获取当前价格
    const currentPrice = this.oCoinStats.currentPrice;
    
    // 生成随机波动（±5%）
    const fluctuationRatio = 0.95 + Math.random() * 0.1;
    const newPrice = currentPrice * fluctuationRatio;
    
    // 更新价格
    await this.updateOCoinPrice(newPrice);
    
    return newPrice;
  }

  // 搜索交易记录
  async searchTransactions(query: {
    type?: 'income' | 'expense';
    category?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<FundPoolTransaction[]> {
    let filtered = [...this.transactions];

    if (query.type) {
      filtered = filtered.filter(tx => tx.type === query.type);
    }
    if (query.category) {
      filtered = filtered.filter(tx => tx.category === query.category);
    }
    if (query.source) {
      filtered = filtered.filter(tx => tx.source === query.source);
    }
    if (query.startDate) {
      filtered = filtered.filter(tx => tx.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter(tx => tx.timestamp <= query.endDate!);
    }
    if (query.minAmount !== undefined) {
      filtered = filtered.filter(tx => tx.amount >= query.minAmount!);
    }
    if (query.maxAmount !== undefined) {
      filtered = filtered.filter(tx => tx.amount <= query.maxAmount!);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }


}

export const fundPoolService = new FundPoolService();