import { computingEconomicService } from './computingEconomicService';
import { fundPoolService } from './fundPoolService';

// A币发放记录接口
export interface ACoinDistributionRecord {
  id: string;
  userId: string;
  date: string;
  personalContributionScore: number;
  networkContributionScore: number;
  personalRatio: number;
  calculatedAmount: number;
  actualDistributed: number;
  platformNetIncome: number;
  distributionPool: number;
  status: 'success' | 'failed' | 'insufficient';
  reason?: string;
  timestamp: Date;
}

// A币发放统计接口
export interface ACoinDistributionStats {
  totalDistributed: number;
  totalRecipients: number;
  averageDistribution: number;
  lastDistributionDate: string;
  distributionHistory: ACoinDistributionRecord[];
}

class ACoinService {
  private readonly DISTRIBUTION_RATIO = 0.4; // 平台净收入的40%用于A币发放
  private readonly MIN_DISTRIBUTION_AMOUNT = 0.01; // 最小发放单位
  private readonly WEIGHT_GAME_COINS = 0.5; // 游戏币权重
  private readonly WEIGHT_COMPUTING_POWER = 0.3; // 算力权重
  private readonly WEIGHT_TRANSACTION = 0.2; // 交易权重

  /**
   * 计算个人贡献分数
   */
  private calculatePersonalContribution(
    gameCoins: number,
    computingPower: number,
    transactionVolume: number
  ): number {
    return (
      gameCoins * this.WEIGHT_GAME_COINS +
      computingPower * this.WEIGHT_COMPUTING_POWER +
      transactionVolume * this.WEIGHT_TRANSACTION
    );
  }

  /**
   * 计算全网总贡献分数
   */
  private async calculateNetworkContribution(): Promise<number> {
    const dailySettlement = await computingEconomicService.getDailySettlementData();
    const networkTransactionVolume = 50000; // 模拟全网交易量，实际应从数据库获取

    return (
      dailySettlement.totalDailyGameCoinsDistributed * this.WEIGHT_GAME_COINS +
      dailySettlement.totalDailyComputingPower * this.WEIGHT_COMPUTING_POWER +
      networkTransactionVolume * this.WEIGHT_TRANSACTION
    );
  }

  /**
   * 计算A币发放
   */
  async calculateACoinDistribution(
    userId: string,
    personalData: {
      gameCoins: number;
      computingPower: number;
      transactionVolume: number;
    }
  ): Promise<ACoinDistributionRecord> {
    try {
      // 获取每日结算数据
      const dailySettlement = await computingEconomicService.getDailySettlementData();
      
      // 第一步：计算个人贡献分数
      const personalContributionScore = this.calculatePersonalContribution(
        personalData.gameCoins,
        personalData.computingPower,
        personalData.transactionVolume
      );

      // 第二步：计算全网总贡献分数
      const networkContributionScore = await this.calculateNetworkContribution();

      // 第三步：计算A币发放
      const platformNetIncome = dailySettlement.platformNetIncome;
      const distributionPool = platformNetIncome > 0 ? platformNetIncome * this.DISTRIBUTION_RATIO : 0;
      
      const personalRatio = networkContributionScore > 0 ? personalContributionScore / networkContributionScore : 0;
      const calculatedAmount = distributionPool * personalRatio;
      
      // 检查最小发放条件
      const actualDistributed = calculatedAmount >= this.MIN_DISTRIBUTION_AMOUNT ? calculatedAmount : 0;
      
      let status: 'success' | 'failed' | 'insufficient' = 'success';
      let reason: string | undefined;

      if (platformNetIncome <= 0) {
        status = 'failed';
        reason = '平台净收入不足，无法发放A币';
      } else if (actualDistributed === 0) {
        status = 'insufficient';
        reason = `计算金额${calculatedAmount.toFixed(4)}低于最小发放单位${this.MIN_DISTRIBUTION_AMOUNT}`;
      }

      return {
        id: `acoin_${userId}_${Date.now()}`,
        userId,
        date: new Date().toISOString().split('T')[0],
        personalContributionScore,
        networkContributionScore,
        personalRatio,
        calculatedAmount,
        actualDistributed,
        platformNetIncome,
        distributionPool,
        status,
        reason,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('A币计算失败:', error);
      throw new Error('A币计算服务异常');
    }
  }

  /**
   * 执行A币发放
   */
  async distributeACoin(
    userId: string,
    personalData: {
      gameCoins: number;
      computingPower: number;
      transactionVolume: number;
    }
  ): Promise<ACoinDistributionRecord> {
    // 计算发放金额
    const distributionRecord = await this.calculateACoinDistribution(userId, personalData);

    if (distributionRecord.status === 'success' && distributionRecord.actualDistributed > 0) {
      try {
        // 保存发放记录
        await this.saveDistributionRecord(distributionRecord);
        
        console.log(`A币发放成功: 用户${userId}获得${distributionRecord.actualDistributed.toFixed(2)} A币`);
      } catch (error) {
        console.error('A币发放执行失败:', error);
        distributionRecord.status = 'failed';
        distributionRecord.reason = '发放执行失败';
      }
    }

    return distributionRecord;
  }

  /**
   * 更新资金池A币数量
   */
  private async updateFundPoolACoin(amount: number): Promise<void> {
    try {
      // 使用直接更新方法更新资金池A币余额
      // 注意：amount为负数表示发放（从资金池减少）
      const description = amount < 0 
        ? `A币发放 - ${new Date().toISOString().split('T')[0]}`
        : `A币回收 - ${new Date().toISOString().split('T')[0]}`;
        
      // 直接调用资金池服务的更新方法
      await fundPoolService.updateACoinBalance(amount, description);
      
      // 获取更新后的资金池数据（用于日志显示）
      const fundPoolData = await fundPoolService.getPublicFundPoolData();
      
      // 将A币统计数据保存到localStorage，确保UI能够正确显示
      localStorage.setItem('acoin_circulating_supply', fundPoolData.aCoinStats.circulatingSupply.toString());
      localStorage.setItem('acoin_total_distributed', fundPoolData.aCoinStats.totalDistributed.toString());
      localStorage.setItem('acoin_holders_count', fundPoolData.aCoinStats.holdersCount.toString());
      
      console.log(`资金池A币变化: ${amount > 0 ? '+' : ''}${amount.toFixed(2)} A币`);
      console.log(`资金池余额: ${fundPoolData.currentBalance.aCoins.toFixed(2)} A币`);
      console.log(`流通供应量: ${fundPoolData.aCoinStats.circulatingSupply.toFixed(2)} A币`);
      console.log(`累计发放量: ${fundPoolData.aCoinStats.totalDistributed.toFixed(2)} A币`);
      console.log(`持有人数: ${fundPoolData.aCoinStats.holdersCount} 人`);
    } catch (error) {
      console.error('更新资金池失败:', error);
      throw error;
    }
  }

  /**
   * 保存发放记录
   */
  private async saveDistributionRecord(record: ACoinDistributionRecord): Promise<void> {
    try {
      // 从localStorage获取现有记录
      const existingRecords = this.getDistributionHistory();
      const updatedRecords = [record, ...existingRecords.slice(0, 99)]; // 保留最近100条记录
      
      localStorage.setItem('acoin-distribution-records', JSON.stringify(updatedRecords));
      console.log('A币发放记录已保存');
    } catch (error) {
      console.error('保存发放记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取发放历史记录
   */
  getDistributionHistory(): ACoinDistributionRecord[] {
    try {
      const records = localStorage.getItem('acoin-distribution-records');
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('获取发放历史失败:', error);
      return [];
    }
  }

  /**
   * 获取用户的发放记录
   */
  getUserDistributionHistory(userId: string): ACoinDistributionRecord[] {
    const allRecords = this.getDistributionHistory();
    return allRecords.filter(record => record.userId === userId);
  }

  /**
   * 获取发放统计数据
   */
  getDistributionStats(): ACoinDistributionStats {
    const records = this.getDistributionHistory();
    const successfulRecords = records.filter(r => r.status === 'success');
    
    const totalDistributed = successfulRecords.reduce((sum, r) => sum + r.actualDistributed, 0);
    const uniqueRecipients = new Set(successfulRecords.map(r => r.userId)).size;
    const averageDistribution = uniqueRecipients > 0 ? totalDistributed / uniqueRecipients : 0;
    const lastDistributionDate = successfulRecords.length > 0 ? successfulRecords[0].date : '';

    return {
      totalDistributed,
      totalRecipients: uniqueRecipients,
      averageDistribution,
      lastDistributionDate,
      distributionHistory: records.slice(0, 10) // 最近10条记录
    };
  }

  /**
   * 检查用户今日是否已发放
   */
  hasDistributedToday(userId: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const userRecords = this.getUserDistributionHistory(userId);
    return userRecords.some(record => 
      record.date === today && record.status === 'success'
    );
  }

  /**
   * 获取用户今日可发放的A币预估
   */
  async estimateUserACoin(
    userId: string,
    personalData: {
      gameCoins: number;
      computingPower: number;
      transactionVolume: number;
    }
  ): Promise<{
    estimatedAmount: number;
    canDistribute: boolean;
    reason?: string;
  }> {
    try {
      // 检查今日是否已发放
      if (this.hasDistributedToday(userId)) {
        return {
          estimatedAmount: 0,
          canDistribute: false,
          reason: '今日已发放，每日只能发放一次'
        };
      }

      // 计算预估金额
      const calculation = await this.calculateACoinDistribution(userId, personalData);
      
      return {
        estimatedAmount: calculation.actualDistributed,
        canDistribute: calculation.status === 'success' && calculation.actualDistributed > 0,
        reason: calculation.reason
      };
    } catch (error) {
      console.error('预估A币失败:', error);
      return {
        estimatedAmount: 0,
        canDistribute: false,
        reason: '计算服务异常'
      };
    }
  }

  /**
   * 获取用户A币贡献度数据
   */
  async getUserContributionData(): Promise<{
    gameCoinsEarned: number;
    computingPowerContribution: number;
    transactionActivity: number;
    gameCoinsWeight: number;
    computingPowerWeight: number;
    transactionWeight: number;
    totalACoinEarned: number;
    lastDistribution: Date;
  }> {
    try {
      // 获取用户的游戏币、算力和交易数据
      const userGameCoins = await this.getUserGameCoinsData();
      const userComputingPower = await this.getUserComputingPowerData();
      const userTransactions = await this.getUserTransactionData();
      
      // 获取用户的A币发放记录
      const distributionRecords = this.getUserDistributionHistory('current-user-id');
      const totalACoinEarned = distributionRecords.reduce((sum, record) => sum + record.actualDistributed, 0);
      
      // 获取最后一次发放日期
      const lastDistribution = distributionRecords.length > 0 
        ? new Date(distributionRecords[0].timestamp) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认30天前
      
      return {
        gameCoinsEarned: userGameCoins,
        computingPowerContribution: userComputingPower,
        transactionActivity: userTransactions,
        gameCoinsWeight: this.WEIGHT_GAME_COINS,
        computingPowerWeight: this.WEIGHT_COMPUTING_POWER,
        transactionWeight: this.WEIGHT_TRANSACTION,
        totalACoinEarned,
        lastDistribution
      };
    } catch (error) {
      console.error('获取用户贡献度数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户游戏币数据
   */
  private async getUserGameCoinsData(): Promise<number> {
    try {
      // 从本地存储获取钱包数据
      const walletData = localStorage.getItem('wallet_data');
      if (walletData) {
        const parsedData = JSON.parse(walletData);
        if (parsedData.balance && typeof parsedData.balance.gameCoins === 'number') {
          return parsedData.balance.gameCoins;
        }
      }
      
      // 如果无法获取真实数据，返回0而不是随机数
      return 0;
    } catch (error) {
      console.error('获取用户游戏币数据失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户算力数据
   */
  private async getUserComputingPowerData(): Promise<number> {
    try {
      // 从本地存储获取钱包数据
      const walletData = localStorage.getItem('wallet_data');
      if (walletData) {
        const parsedData = JSON.parse(walletData);
        if (parsedData.balance && typeof parsedData.balance.computingPower === 'number') {
          return parsedData.balance.computingPower;
        }
      }
      
      // 如果无法获取真实数据，返回0而不是随机数
      return 0;
    } catch (error) {
      console.error('获取用户算力数据失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户交易数据
   */
  private async getUserTransactionData(): Promise<number> {
    try {
      // 从本地存储获取钱包数据
      const walletData = localStorage.getItem('wallet_data');
      if (walletData) {
        const parsedData = JSON.parse(walletData);
        if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
          // 计算最近30天的交易数量
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          return parsedData.transactions.filter((tx: any) => {
            const txDate = new Date(tx.timestamp);
            return txDate >= thirtyDaysAgo;
          }).length;
        }
      }
      
      // 如果无法获取真实数据，返回0而不是随机数
      return 0;
    } catch (error) {
      console.error('获取用户交易数据失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户A币交易记录
   */
  async getACoinTransactions(limit: number = 10): Promise<any[]> {
    try {
      // 模拟从服务器获取数据
      const transactions = [];
      const now = new Date();
      
      for (let i = 0; i < limit; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // 过去limit天
        const isIncome = Math.random() > 0.3; // 70%概率是收入
        
        transactions.push({
          id: `acoin_tx_${i}`,
          type: isIncome ? 'income' : 'expense',
          amount: parseFloat((isIncome ? Math.random() * 10 + 1 : Math.random() * 5 + 0.5).toFixed(2)),
          description: isIncome 
            ? (i % 3 === 0 ? 'A币贡献奖励' : i % 2 === 0 ? '算力奖励转换' : '交易活跃度奖励')
            : (i % 2 === 0 ? 'A币兑换游戏币' : 'A币兑换现金'),
          currency: 'aCoins',
          category: isIncome ? 'acoin_distribution' : 'acoin_exchange',
          timestamp: date
        });
      }
      
      return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('获取A币交易记录失败:', error);
      return [];
    }
  }

  /**
   * 获取用户A币兑换限制
   */
  async getUserACoinExchangeLimits(): Promise<{
    dailyExchangeIn: number;
    dailyExchangeOut: number;
    monthlyExchangeIn: number;
    monthlyExchangeOut: number;
    remainingDailyIn: number;
    remainingDailyOut: number;
    remainingMonthlyIn: number;
    remainingMonthlyOut: number;
  }> {
    try {
      // 模拟从服务器获取数据
      // 实际应用中应该从用户配置或系统设置中获取
      return {
        dailyExchangeIn: 1000,  // 每日最大兑入1000 A币
        dailyExchangeOut: 500,  // 每日最大兑出500 A币
        monthlyExchangeIn: 10000, // 每月最大兑入10000 A币
        monthlyExchangeOut: 5000, // 每月最大兑出5000 A币
        remainingDailyIn: 1000,  // 今日剩余可兑入
        remainingDailyOut: 500,  // 今日剩余可兑出
        remainingMonthlyIn: 10000, // 本月剩余可兑入
        remainingMonthlyOut: 5000  // 本月剩余可兑出
      };
    } catch (error) {
      console.error('获取A币兑换限制失败:', error);
      throw error;
    }
  }

  /**
   * 记录A币兑换交易
   */
  async recordACoinExchange(amount: number, targetCurrency: string, targetAmount: number): Promise<boolean> {
    try {
      // 记录A币兑换交易
      const transaction = {
        id: `acoin_exchange_${Date.now()}`,
        userId: 'current-user-id',
        amount,
        targetCurrency,
        targetAmount,
        exchangeRate: targetAmount / amount,
        timestamp: new Date(),
        status: 'success'
      };
      
      // 模拟保存到本地存储
      const existingTransactions = localStorage.getItem('acoin-exchange-transactions');
      const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];
      transactions.unshift(transaction);
      localStorage.setItem('acoin-exchange-transactions', JSON.stringify(transactions.slice(0, 100)));
      
      console.log(`A币兑换交易已记录: ${amount} A币 -> ${targetAmount} ${targetCurrency}`);
      return true;
    } catch (error) {
      console.error('记录A币兑换交易失败:', error);
      return false;
    }
  }

  /**
   * 批量分发A币给多个用户
   * @param distributionPool 总分发池大小
   * @param users 用户列表及其贡献数据
   * @returns 分发结果统计
   */
  async distributeACoinsByContribution(
    distributionPool: number,
    users: Array<{
      userId: string;
      gameCoins: number;
      computingPower: number;
      transactionVolume: number;
    }>
  ): Promise<{
    totalAmount: number;
    recipientsCount: number;
    successfulDistributions: Array<{
      userId: string;
      amount: number;
      contributionScore: number;
    }>;
  }> {
    try {
      console.log(`开始批量分发A币，总池子: ${distributionPool} A币，用户数: ${users.length}`);
      
      // 计算所有用户的贡献分数
      const userContributions = users.map(user => {
        const contributionScore = this.calculatePersonalContribution(
          user.gameCoins,
          user.computingPower,
          user.transactionVolume
        );
        return { ...user, contributionScore };
      });
      
      // 计算总贡献分数
      const totalContributionScore = userContributions.reduce(
        (sum, user) => sum + user.contributionScore, 
        0
      );
      
      console.log(`总贡献分数: ${totalContributionScore}`);
      
      // 如果总贡献分数为0，无法分发
      if (totalContributionScore === 0) {
        return {
          totalAmount: 0,
          recipientsCount: 0,
          successfulDistributions: []
        };
      }
      
      // 计算每个用户应得的A币
      const distributions = userContributions.map(user => {
        const ratio = user.contributionScore / totalContributionScore;
        const calculatedAmount = distributionPool * ratio;
        const actualAmount = calculatedAmount >= this.MIN_DISTRIBUTION_AMOUNT ? calculatedAmount : 0;
        
        return {
          userId: user.userId,
          contributionScore: user.contributionScore,
          ratio,
          calculatedAmount,
          actualAmount
        };
      });
      
      // 过滤出有效的分发（金额大于最小发放单位）
      const validDistributions = distributions.filter(d => d.actualAmount > 0);
      
      console.log(`有效分发数: ${validDistributions.length}/${distributions.length}`);
      
      // 执行分发
      let totalDistributed = 0;
      const successfulDistributions = [];
      
      for (const dist of validDistributions) {
        try {
          // 创建分发记录
          const record: ACoinDistributionRecord = {
            id: `acoin_batch_${dist.userId}_${Date.now()}`,
            userId: dist.userId,
            date: new Date().toISOString().split('T')[0],
            personalContributionScore: dist.contributionScore,
            networkContributionScore: totalContributionScore,
            personalRatio: dist.ratio,
            calculatedAmount: dist.calculatedAmount,
            actualDistributed: dist.actualAmount,
            platformNetIncome: distributionPool / this.DISTRIBUTION_RATIO, // 反推平台净收入
            distributionPool,
            status: 'success',
            timestamp: new Date()
          };
          
          // 保存分发记录
          await this.saveDistributionRecord(record);
          
          totalDistributed += dist.actualAmount;
          successfulDistributions.push({
            userId: dist.userId,
            amount: dist.actualAmount,
            contributionScore: dist.contributionScore
          });
          
          console.log(`成功分发 ${dist.actualAmount.toFixed(2)} A币给用户 ${dist.userId}`);
        } catch (error) {
          console.error(`分发A币给用户 ${dist.userId} 失败:`, error);
        }
      }
      
      // 更新资金池A币余额
      if (totalDistributed > 0) {
        await this.updateFundPoolACoin(-totalDistributed);
        
        // 直接更新localStorage中的A币统计数据，确保UI能够立即显示最新数据
        const currentCirculatingSupply = localStorage.getItem('acoin_circulating_supply');
        const currentTotalDistributed = localStorage.getItem('acoin_total_distributed');
        const currentHoldersCount = localStorage.getItem('acoin_holders_count');
        
        // 更新流通供应量
        if (currentCirculatingSupply) {
          const newCirculatingSupply = parseFloat(currentCirculatingSupply) + totalDistributed;
          localStorage.setItem('acoin_circulating_supply', newCirculatingSupply.toString());
        } else {
          localStorage.setItem('acoin_circulating_supply', totalDistributed.toString());
        }
        
        // 更新累计发放量
        if (currentTotalDistributed) {
          const newTotalDistributed = parseFloat(currentTotalDistributed) + totalDistributed;
          localStorage.setItem('acoin_total_distributed', newTotalDistributed.toString());
        } else {
          localStorage.setItem('acoin_total_distributed', totalDistributed.toString());
        }
        
        // 更新持有人数
        const uniqueUserIds = new Set(validDistributions.map(d => d.userId));
        if (currentHoldersCount) {
          const newHoldersCount = Math.max(parseInt(currentHoldersCount), uniqueUserIds.size);
          localStorage.setItem('acoin_holders_count', newHoldersCount.toString());
        } else {
          localStorage.setItem('acoin_holders_count', uniqueUserIds.size.toString());
        }
        
        console.log('已更新A币统计数据:', {
          circulatingSupply: localStorage.getItem('acoin_circulating_supply'),
          totalDistributed: localStorage.getItem('acoin_total_distributed'),
          holdersCount: localStorage.getItem('acoin_holders_count')
        });
      }
      
      return {
        totalAmount: totalDistributed,
        recipientsCount: successfulDistributions.length,
        successfulDistributions
      };
    } catch (error) {
      console.error('批量分发A币失败:', error);
      throw error;
    }
  }
}

export const aCoinService = new ACoinService();