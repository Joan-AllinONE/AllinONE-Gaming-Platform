import { 
  PlatformPerformance,
  UserPerformanceContribution,
  OCoinAllocation,
  PerformanceWeights
} from '@/types/performance';
import platformConfigService from './platformConfigService';

/**
 * O币绩效计算服务
 * 基于未来绩效预期分配O币期权
 */
class OCoinPerformanceService {
  private readonly STORAGE_KEY = 'ocoin_performance_data';
  private readonly ALLOCATIONS_KEY = 'ocoin_allocations';
  
  /**
   * 计算用户绩效分数
   */
  calculateUserPerformanceScore(
    contribution: UserPerformanceContribution,
    weights?: PerformanceWeights
  ): number {
    // 获取当前权重配置
    const currentWeights = weights || platformConfigService.getOCoinPerformanceWeights();
    
    // 归一化各项贡献分数（假设最大分数为100）
    const normalizedRevenue = Math.min(contribution.revenueContribution / 10000, 1); // 收入贡献除以10000元
    const normalizedPlayer = Math.min(contribution.playerReferralCount / 100, 1);   // 推荐玩家除以100人
    const normalizedDevelopment = Math.min(contribution.developmentScore / 100, 1); // 开发分数除以100
    const normalizedManagement = Math.min(contribution.managementScore / 100, 1);   // 管理分数除以100
    const normalizedMarketing = Math.min(contribution.marketingScore / 100, 1);     // 营销分数除以100
    
    // 计算加权总分
    const totalScore = 
      normalizedRevenue * currentWeights.revenueWeight +
      normalizedPlayer * currentWeights.playerWeight +
      normalizedDevelopment * currentWeights.developmentWeight +
      normalizedManagement * currentWeights.managementWeight +
      normalizedMarketing * currentWeights.marketingWeight;
    
    return Math.round(totalScore * 100); // 返回0-100的分数
  }
  
  /**
   * 计算O币分配量
   */
  calculateOCoinAllocation(
    performanceScore: number,
    totalOCoinPool: number = 10000 // 默认每期1万O币池
  ): number {
    // 基础分配：根据绩效分数分配
    const baseAllocation = (performanceScore / 100) * 1000; // 最高1000 O币
    
    // 根据总池子大小调整
    const poolMultiplier = totalOCoinPool / 10000;
    
    return Math.round(baseAllocation * poolMultiplier);
  }
  
  /**
   * 执行O币分配
   */
  async allocateOCoin(
    userId: string,
    contribution: UserPerformanceContribution,
    vestingPeriod: number = 365 // 默认锁定1年
  ): Promise<OCoinAllocation> {
    // 计算绩效分数
    const performanceScore = this.calculateUserPerformanceScore(contribution);
    
    // 计算分配量
    const amount = this.calculateOCoinAllocation(performanceScore);
    
    // 获取当前权重配置
    const weights = platformConfigService.getOCoinPerformanceWeights();
    
    // 创建分配记录
    const allocation: OCoinAllocation = {
      id: `ocoin-${userId}-${contribution.periodId}-${Date.now()}`,
      userId,
      periodId: contribution.periodId,
      allocationType: 'performance',
      amount,
      performanceScore,
      weights,
      allocationDate: new Date(),
      vestingPeriod,
      status: 'allocated'
    };
    
    // 保存分配记录
    this.saveAllocation(allocation);
    
    // 🔥 触发O币分配事件
    window.dispatchEvent(new CustomEvent('ocoin-allocation-completed', {
      detail: { allocation, timestamp: new Date() }
    }));
    
    console.log(`[O币绩效] 用户 ${userId} 获得 ${amount} O币，绩效分数: ${performanceScore}`);
    
    return allocation;
  }
  
  /**
   * 批量处理绩效周期的O币分配
   */
  async processPerformancePeriod(
    periodId: string,
    contributions: UserPerformanceContribution[]
  ): Promise<OCoinAllocation[]> {
    const allocations: OCoinAllocation[] = [];
    
    for (const contribution of contributions) {
      try {
        const allocation = await this.allocateOCoin(contribution.userId, contribution);
        allocations.push(allocation);
      } catch (error) {
        console.error(`[O币绩效] 处理用户 ${contribution.userId} 分配失败:`, error);
      }
    }
    
    // 🔥 触发批量分配完成事件
    window.dispatchEvent(new CustomEvent('ocoin-batch-allocation-completed', {
      detail: { periodId, allocations, timestamp: new Date() }
    }));
    
    console.log(`[O币绩效] 周期 ${periodId} 批量分配完成，共分配 ${allocations.length} 笔`);
    
    return allocations;
  }
  
  /**
   * 获取用户O币分配历史
   */
  getUserAllocations(userId: string): OCoinAllocation[] {
    const allAllocations = this.getAllAllocations();
    return allAllocations.filter(allocation => allocation.userId === userId);
  }
  
  /**
   * 获取绩效周期的所有分配
   */
  getPeriodAllocations(periodId: string): OCoinAllocation[] {
    const allAllocations = this.getAllAllocations();
    return allAllocations.filter(allocation => allocation.periodId === periodId);
  }
  
  /**
   * 计算用户总O币余额（包括锁定的）
   */
  calculateUserOCoinBalance(userId: string): {
    totalAllocated: number;
    vested: number;
    locked: number;
  } {
    const userAllocations = this.getUserAllocations(userId);
    
    let totalAllocated = 0;
    let vested = 0;
    let locked = 0;
    
    const now = new Date();
    
    userAllocations.forEach(allocation => {
      totalAllocated += allocation.amount;
      
      // 检查是否已解锁
      const unlockDate = new Date(allocation.allocationDate);
      unlockDate.setDate(unlockDate.getDate() + allocation.vestingPeriod);
      
      if (now >= unlockDate) {
        vested += allocation.amount;
      } else {
        locked += allocation.amount;
      }
    });
    
    return { totalAllocated, vested, locked };
  }
  
  /**
   * 获取平台绩效统计
   */
  getPlatformPerformanceStats(): {
    totalOCoinAllocated: number;
    totalUsers: number;
    averageScore: number;
    topPerformers: Array<{userId: string, score: number, amount: number}>;
  } {
    const allAllocations = this.getAllAllocations();
    
    const totalOCoinAllocated = allAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    const uniqueUsers = new Set(allAllocations.map(allocation => allocation.userId));
    const totalUsers = uniqueUsers.size;
    
    const averageScore = allAllocations.length > 0 
      ? allAllocations.reduce((sum, allocation) => sum + allocation.performanceScore, 0) / allAllocations.length 
      : 0;
    
    // 按绩效分数排序，取前10名
    const topPerformers = allAllocations
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10)
      .map(allocation => ({
        userId: allocation.userId,
        score: allocation.performanceScore,
        amount: allocation.amount
      }));
    
    return {
      totalOCoinAllocated,
      totalUsers,
      averageScore: Math.round(averageScore),
      topPerformers
    };
  }
  
  /**
   * 保存分配记录
   */
  private saveAllocation(allocation: OCoinAllocation): void {
    const allocations = this.getAllAllocations();
    allocations.push(allocation);
    localStorage.setItem(this.ALLOCATIONS_KEY, JSON.stringify(allocations));
  }
  
  /**
   * 获取所有分配记录
   */
  private getAllAllocations(): OCoinAllocation[] {
    const stored = localStorage.getItem(this.ALLOCATIONS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((allocation: any) => ({
        ...allocation,
        allocationDate: new Date(allocation.allocationDate)
      }));
    } catch (error) {
      console.error('[O币绩效] 解析分配记录失败:', error);
      return [];
    }
  }
  
  /**
   * 清空分配记录（测试用）
   */
  clearAllocations(): void {
    localStorage.removeItem(this.ALLOCATIONS_KEY);
    console.log('[O币绩效] 已清空所有分配记录');
  }
  
  /**
   * 模拟绩效数据（测试用）
   */
  generateMockPerformanceData(userId: string, periodId: string): UserPerformanceContribution {
    return {
      userId,
      periodId,
      revenueContribution: Math.random() * 50000,        // 0-5万元
      playerReferralCount: Math.floor(Math.random() * 50), // 0-50人
      developmentScore: Math.random() * 100,             // 0-100分
      managementScore: Math.random() * 100,              // 0-100分
      marketingScore: Math.random() * 100,               // 0-100分
      totalScore: 0, // 将会重新计算
      lastUpdated: new Date()
    };
  }
}

export const oCoinPerformanceService = new OCoinPerformanceService();
export default oCoinPerformanceService;