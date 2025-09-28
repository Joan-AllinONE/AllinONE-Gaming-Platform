import { 
  UserPerformanceContribution,
  DividendWeightRecord,
  CashDividendRecord,
  PerformanceWeights
} from '@/types/performance';
import platformConfigService from './platformConfigService';
import { walletService } from './walletService';

/**
 * 分红权重服务
 * 基于历史和当下绩效分配现金分红权重
 */
class DividendWeightService {
  private readonly DIVIDEND_WEIGHTS_KEY = 'dividend_weights';
  private readonly DIVIDEND_RECORDS_KEY = 'dividend_records';
  private readonly HISTORICAL_PERFORMANCE_KEY = 'historical_performance';
  
  /**
   * 计算用户历史绩效分数
   */
  calculateHistoricalPerformanceScore(
    userId: string,
    periodCount: number = 12, // 默认计算过去12个月
    weights?: PerformanceWeights
  ): number {
    // 获取当前权重配置
    const currentWeights = weights || platformConfigService.getDividendPerformanceWeights();
    
    // 获取用户历史绩效数据
    const historicalData = this.getHistoricalPerformance(userId, periodCount);
    
    if (historicalData.length === 0) {
      return 0;
    }
    
    // 计算平均绩效分数
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    historicalData.forEach((data, index) => {
      // 越近期的数据权重越高（衰减因子）
      const timeWeight = Math.pow(0.95, index); // 每个月衰减5%
      
      // 归一化各项贡献分数
      const normalizedRevenue = Math.min(data.revenueContribution / 10000, 1);
      const normalizedPlayer = Math.min(data.playerReferralCount / 100, 1);
      const normalizedDevelopment = Math.min(data.developmentScore / 100, 1);
      const normalizedManagement = Math.min(data.managementScore / 100, 1);
      const normalizedMarketing = Math.min(data.marketingScore / 100, 1);
      
      // 计算单期加权分数
      const periodScore = 
        normalizedRevenue * currentWeights.revenueWeight +
        normalizedPlayer * currentWeights.playerWeight +
        normalizedDevelopment * currentWeights.developmentWeight +
        normalizedManagement * currentWeights.managementWeight +
        normalizedMarketing * currentWeights.marketingWeight;
      
      totalWeightedScore += periodScore * timeWeight;
      totalWeight += timeWeight;
    });
    
    // 返回加权平均分数
    return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;
  }
  
  /**
   * 计算用户分红权重
   */
  calculateDividendWeight(
    userId: string,
    historicalScore: number,
    totalPlatformScore: number
  ): number {
    if (totalPlatformScore === 0) {
      return 0;
    }
    
    // 基础权重：个人分数 / 平台总分数
    const baseWeight = historicalScore / totalPlatformScore;
    
    // 应用权重上限（防止单个用户占比过高）
    const maxWeight = 0.15; // 最高15%
    const finalWeight = Math.min(baseWeight, maxWeight);
    
    return Number(finalWeight.toFixed(6)); // 保留6位小数
  }
  
  /**
   * 计算并更新所有用户的分红权重
   */
  async calculateAllDividendWeights(periodId: string): Promise<DividendWeightRecord[]> {
    // 获取所有用户的历史绩效数据
    const allUsers = this.getAllUsers();
    const dividendRecords: DividendWeightRecord[] = [];
    
    // 计算所有用户的历史绩效分数
    let totalPlatformScore = 0;
    const userScores: Array<{userId: string, score: number}> = [];
    
    for (const userId of allUsers) {
      const score = this.calculateHistoricalPerformanceScore(userId);
      userScores.push({ userId, score });
      totalPlatformScore += score;
    }
    
    // 计算每个用户的分红权重
    const weights = platformConfigService.getDividendPerformanceWeights();
    
    for (const { userId, score } of userScores) {
      const weight = this.calculateDividendWeight(userId, score, totalPlatformScore);
      
      const record: DividendWeightRecord = {
        id: `dividend-weight-${userId}-${periodId}-${Date.now()}`,
        userId,
        periodId,
        weight,
        historicalScore: score,
        weights,
        calculationDate: new Date(),
        status: 'active'
      };
      
      dividendRecords.push(record);
      this.saveDividendWeight(record);
    }
    
    // 🔥 触发分红权重计算完成事件
    window.dispatchEvent(new CustomEvent('dividend-weights-calculated', {
      detail: { periodId, records: dividendRecords, timestamp: new Date() }
    }));
    
    console.log(`[分红权重] 周期 ${periodId} 权重计算完成，共 ${dividendRecords.length} 个用户`);
    
    return dividendRecords;
  }
  
  /**
   * 执行现金分红分配
   */
  async distributeCashDividend(
    periodId: string,
    totalDividendPool: number
  ): Promise<CashDividendRecord[]> {
    // 获取当期分红权重
    const weightRecords = this.getPeriodDividendWeights(periodId);
    
    // 对同一用户的权重记录按最新计算时间去重，避免重复发放
    const uniqueByUser = new Map<string, DividendWeightRecord>();
    for (const wr of weightRecords) {
      const existing = uniqueByUser.get(wr.userId);
      if (!existing || new Date(wr.calculationDate).getTime() > new Date(existing.calculationDate).getTime()) {
        uniqueByUser.set(wr.userId, wr);
      }
    }
    const dedupedWeightRecords = Array.from(uniqueByUser.values());
    
    if (dedupedWeightRecords.length === 0) {
      throw new Error('未找到分红权重数据，请先计算分红权重');
    }
    
    const dividendRecords: CashDividendRecord[] = [];
    
    // 按权重分配分红
    for (const weightRecord of dedupedWeightRecords) {
      const dividendAmount = totalDividendPool * weightRecord.weight;
      
      // 只有分红金额大于0.01元才分配
      if (dividendAmount >= 0.01) {
        const record: CashDividendRecord = {
          id: `dividend-${weightRecord.userId}-${periodId}-${Date.now()}`,
          userId: weightRecord.userId,
          periodId,
          dividendAmount: Number(dividendAmount.toFixed(2)),
          dividendWeight: weightRecord.weight,
          totalDividendPool,
          distributionDate: new Date(),
          status: 'distributed'
        };
        
        dividendRecords.push(record);
        this.saveDividendRecord(record);
        
        // 🔥 真正发放现金到用户钱包
        try {
          await walletService.distributeCashDividend(
            weightRecord.userId,
            dividendAmount,
            periodId,
            `基于历史绩效的现金分红`
          );
          
          console.log(`[现金分红] 成功发放 ${dividendAmount.toFixed(2)} 元到用户 ${weightRecord.userId} 钱包`);
        } catch (error) {
          console.error(`[现金分红] 发放失败，用户 ${weightRecord.userId}:`, error);
          // 如果钱包发放失败，记录状态为失败
          record.status = 'failed' as any;
        }
      }
    }
    
    // 🔥 触发现金分红完成事件
    window.dispatchEvent(new CustomEvent('cash-dividend-distributed', {
      detail: { 
        periodId, 
        records: dividendRecords, 
        totalDistributed: dividendRecords.reduce((sum, r) => sum + r.dividendAmount, 0),
        timestamp: new Date() 
      }
    }));
    
    console.log(`[现金分红] 周期 ${periodId} 分红完成，共分配 ${dividendRecords.reduce((sum, r) => sum + r.dividendAmount, 0).toFixed(2)} 元`);
    
    return dividendRecords;
  }
  
  /**
   * 获取用户分红历史
   */
  getUserDividendHistory(userId: string): CashDividendRecord[] {
    const allRecords = this.getAllDividendRecords();
    return allRecords.filter(record => record.userId === userId);
  }
  
  /**
   * 获取用户当前分红权重
   */
  getUserCurrentDividendWeight(userId: string): number {
    const weights = this.getUserDividendWeights(userId);
    if (weights.length === 0) return 0;
    
    // 返回最新的权重
    const latestWeight = weights.sort((a, b) => 
      new Date(b.calculationDate).getTime() - new Date(a.calculationDate).getTime()
    )[0];
    
    return latestWeight.weight;
  }
  
  /**
   * 获取分红统计信息
   */
  getDividendStats(): {
    totalDistributed: number;
    totalRecipients: number;
    averageDividend: number;
    topRecipients: Array<{userId: string, totalReceived: number, weight: number}>;
  } {
    const allRecords = this.getAllDividendRecords();
    
    const totalDistributed = allRecords.reduce((sum, record) => sum + record.dividendAmount, 0);
    const uniqueRecipients = new Set(allRecords.map(record => record.userId));
    const totalRecipients = uniqueRecipients.size;
    const averageDividend = totalRecipients > 0 ? totalDistributed / totalRecipients : 0;
    
    // 按用户聚合分红总额
    const userTotals = new Map<string, {totalReceived: number, latestWeight: number}>();
    
    allRecords.forEach(record => {
      const current = userTotals.get(record.userId) || {totalReceived: 0, latestWeight: 0};
      current.totalReceived += record.dividendAmount;
      current.latestWeight = record.dividendWeight; // 使用最新的权重
      userTotals.set(record.userId, current);
    });
    
    // 按总收入排序，取前10名
    const topRecipients = Array.from(userTotals.entries())
      .map(([userId, data]) => ({
        userId,
        totalReceived: data.totalReceived,
        weight: data.latestWeight
      }))
      .sort((a, b) => b.totalReceived - a.totalReceived)
      .slice(0, 10);
    
    return {
      totalDistributed: Number(totalDistributed.toFixed(2)),
      totalRecipients,
      averageDividend: Number(averageDividend.toFixed(2)),
      topRecipients
    };
  }
  
  /**
   * 获取历史绩效数据
   */
  private getHistoricalPerformance(userId: string, periodCount: number): UserPerformanceContribution[] {
    // 这里应该从实际数据源获取，现在使用模拟数据
    const mockData: UserPerformanceContribution[] = [];
    
    for (let i = 0; i < periodCount; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      mockData.push({
        userId,
        periodId: `period-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        revenueContribution: Math.random() * 30000,
        playerReferralCount: Math.floor(Math.random() * 30),
        developmentScore: Math.random() * 80 + 20, // 20-100分
        managementScore: Math.random() * 80 + 20,
        marketingScore: Math.random() * 80 + 20,
        totalScore: 0,
        lastUpdated: date
      });
    }
    
    return mockData;
  }
  
  /**
   * 获取所有用户ID（模拟）
   */
  private getAllUsers(): string[] {
    // 实际应用中应该从用户服务获取
    return ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
  }
  
  /**
   * 保存分红权重
   */
  private saveDividendWeight(weight: DividendWeightRecord): void {
    const weights = this.getAllDividendWeights();
    const idx = weights.findIndex((w: any) => w.userId === weight.userId && w.periodId === weight.periodId);
    if (idx >= 0) {
      weights[idx] = weight; // 覆盖同一用户同一周期的旧权重
    } else {
      weights.push(weight);
    }
    localStorage.setItem(this.DIVIDEND_WEIGHTS_KEY, JSON.stringify(weights));
  }
  
  /**
   * 保存分红记录
   */
  private saveDividendRecord(record: CashDividendRecord): void {
    const records = this.getAllDividendRecords();
    const idx = records.findIndex((r: any) => r.userId === record.userId && r.periodId === record.periodId);
    if (idx >= 0) {
      records[idx] = record; // 覆盖同一用户同一周期的旧分红记录
    } else {
      records.push(record);
    }
    localStorage.setItem(this.DIVIDEND_RECORDS_KEY, JSON.stringify(records));
  }
  
  /**
   * 获取所有分红权重
   */
  private getAllDividendWeights(): DividendWeightRecord[] {
    const stored = localStorage.getItem(this.DIVIDEND_WEIGHTS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((weight: any) => ({
        ...weight,
        calculationDate: new Date(weight.calculationDate)
      }));
    } catch (error) {
      console.error('[分红权重] 解析权重数据失败:', error);
      return [];
    }
  }
  
  /**
   * 获取所有分红记录
   */
  private getAllDividendRecords(): CashDividendRecord[] {
    const stored = localStorage.getItem(this.DIVIDEND_RECORDS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((record: any) => ({
        ...record,
        distributionDate: new Date(record.distributionDate)
      }));
    } catch (error) {
      console.error('[分红权重] 解析分红记录失败:', error);
      return [];
    }
  }
  
  /**
   * 获取用户分红权重
   */
  getUserDividendWeights(userId: string): DividendWeightRecord[] {
    const allWeights = this.getAllDividendWeights();
    return allWeights.filter(weight => weight.userId === userId);
  }
  
  /**
   * 获取周期分红权重
   */
  getPeriodDividendWeights(periodId: string): DividendWeightRecord[] {
    const allWeights = this.getAllDividendWeights();
    return allWeights.filter(weight => weight.periodId === periodId);
  }
  
  /**
   * 清空数据（测试用）
   */
  clearData(): void {
    localStorage.removeItem(this.DIVIDEND_WEIGHTS_KEY);
    localStorage.removeItem(this.DIVIDEND_RECORDS_KEY);
    localStorage.removeItem(this.HISTORICAL_PERFORMANCE_KEY);
    console.log('[分红权重] 已清空所有数据');
  }
}

export const dividendWeightService = new DividendWeightService();
export default dividendWeightService;