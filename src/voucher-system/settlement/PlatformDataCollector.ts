/**
 * 平台数据收集器
 * 接入现有业务系统，收集全网数据用于算法凭证结算
 */

import type { 
  DataCollector, 
  UserPersonalData 
} from '../services/AlgorithmVoucherService';

// 导入现有服务
const walletService = {} as any;

/**
 * 平台数据收集器配置
 */
export interface PlatformDataCollectorConfig {
  /** 是否使用模拟数据（开发/测试环境） */
  useMockData: boolean;
  /** 模拟数据规模 */
  mockUserCount: number;
  /** 数据缓存时间（毫秒） */
  cacheDuration: number;
  /** 现金收入（人民币）转换为A币的汇率 */
  cashToACoinRate: number;
}

/**
 * 默认配置
 */
export const DEFAULT_COLLECTOR_CONFIG: PlatformDataCollectorConfig = {
  useMockData: false,
  mockUserCount: 100,
  cacheDuration: 60000, // 1分钟缓存
  cashToACoinRate: 0.1, // 默认汇率：1元人民币 = 0.1 A币
};

/**
 * 数据缓存
 */
interface DataCache {
  totalGameCoins: number;
  totalComputingPower: number;
  totalTransactionVolume: number;
  platformNetIncome: number;
  activeUserCount: number;
  userDataList: UserPersonalData[];
  timestamp: number;
}

/**
 * 平台数据收集器实现
 */
export class PlatformDataCollector implements DataCollector {
  private config: PlatformDataCollectorConfig;
  private cache: DataCache | null = null;
  
  constructor(config: Partial<PlatformDataCollectorConfig> = {}) {
    this.config = { ...DEFAULT_COLLECTOR_CONFIG, ...config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<PlatformDataCollectorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  // ========== 数据收集方法 ==========
  
  /**
   * 收集全网游戏币总量
   */
  async collectTotalGameCoins(): Promise<number> {
    if (this.config.useMockData) {
      return this.getMockTotalGameCoins();
    }
    
    try {
      // TODO: 从实际的游戏币系统获取数据
      // 这里暂时使用钱包服务的数据
      const stats = await walletService.getPlatformStats?.();
      return stats?.totalGameCoins || 0;
    } catch (error) {
      console.error('[PlatformDataCollector] 收集游戏币总量失败:', error);
      return 0;
    }
  }
  
  /**
   * 收集全网算力总量
   */
  async collectTotalComputingPower(): Promise<number> {
    if (this.config.useMockData) {
      return this.getMockTotalComputingPower();
    }
    
    try {
      // TODO: 从实际的算力系统获取数据
      const stats = await walletService.getPlatformStats?.();
      return stats?.totalComputingPower || 0;
    } catch (error) {
      console.error('[PlatformDataCollector] 收集算力总量失败:', error);
      return 0;
    }
  }
  
  /**
   * 收集全网交易额
   */
  async collectTotalTransactionVolume(startDate: string, endDate: string): Promise<number> {
    if (this.config.useMockData) {
      return this.getMockTransactionVolume();
    }
    
    try {
      // TODO: 从实际的交易系统获取数据
      // 可以调用交易历史API统计
      return 0;
    } catch (error) {
      console.error('[PlatformDataCollector] 收集交易额失败:', error);
      return 0;
    }
  }
  
  /**
   * 收集平台现金收入（人民币）
   * @returns 转换为A币后的金额
   */
  async collectPlatformNetIncome(startDate: string, endDate: string): Promise<number> {
    if (this.config.useMockData) {
      // 模拟现金收入（人民币），然后按汇率转换为A币
      const cashIncome = this.getMockCashIncome(); // 人民币收入
      const aCoinIncome = cashIncome * this.config.cashToACoinRate; // 转换为A币
      console.log(`[PlatformDataCollector] 模拟现金收入: ¥${cashIncome.toFixed(2)} => ${aCoinIncome.toFixed(4)} A币 (汇率: ${this.config.cashToACoinRate})`);
      return aCoinIncome;
    }
    
    try {
      // TODO: 从实际的财务系统获取现金收入（人民币）
      // const cashIncome = await financeAPI.getCashIncome(startDate, endDate);
      // const aCoinIncome = cashIncome * this.config.cashToACoinRate;
      // return aCoinIncome;
      return 0;
    } catch (error) {
      console.error('[PlatformDataCollector] 收集平台收入失败:', error);
      return 0;
    }
  }
  
  /**
   * 收集所有用户的个人数据
   */
  async collectAllUserData(startDate: string, endDate: string): Promise<UserPersonalData[]> {
    if (this.config.useMockData) {
      return this.generateMockUserData();
    }
    
    try {
      // TODO: 从用户系统获取所有活跃用户的数据
      // 这里需要批量获取用户的钱包数据
      
      // 示例实现（需要根据实际系统调整）
      const userDataList: UserPersonalData[] = [];
      
      // 获取活跃用户列表
      const activeUsers = await this.getActiveUsers();
      
      for (const user of activeUsers) {
        try {
          // 获取用户钱包信息
          const wallet = await walletService.getWallet(user.id);
          
          // 获取用户在日期范围内的交易数据
          const transactionVolume = await this.getUserTransactionVolume(user.id, startDate, endDate);
          
          userDataList.push({
            userId: user.id,
            userName: user.name || user.id,
            gameCoins: wallet.gameCoins || 0,
            computingPower: wallet.computingPower || 0,
            transactionVolume: transactionVolume,
            contributionScore: 0, // 将在后续计算
          });
        } catch (error) {
          console.warn(`[PlatformDataCollector] 获取用户 ${user.id} 数据失败:`, error);
        }
      }
      
      return userDataList;
    } catch (error) {
      console.error('[PlatformDataCollector] 收集用户数据失败:', error);
      return [];
    }
  }
  
  /**
   * 收集活跃用户数
   */
  async collectActiveUserCount(): Promise<number> {
    if (this.config.useMockData) {
      return this.config.mockUserCount;
    }
    
    try {
      const activeUsers = await this.getActiveUsers();
      return activeUsers.length;
    } catch (error) {
      console.error('[PlatformDataCollector] 收集活跃用户数失败:', error);
      return 0;
    }
  }
  
  // ========== 辅助方法 ==========
  
  /**
   * 获取活跃用户列表
   */
  private async getActiveUsers(): Promise<Array<{ id: string; name: string }>> {
    try {
      // TODO: 从用户系统获取活跃用户
      // 这里需要接入用户管理API
      
      // 临时方案：从localStorage获取
      const users: Array<{ id: string; name: string }> = [];
      const userData = localStorage.getItem('users');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (Array.isArray(parsed)) {
          return parsed.map(u => ({ id: u.id, name: u.name || u.id }));
        }
      }
      
      // 如果没有用户数据，返回当前登录用户
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return [{ id: user.id, name: user.name || user.id }];
      }
      
      return [];
    } catch (error) {
      console.error('[PlatformDataCollector] 获取活跃用户失败:', error);
      return [];
    }
  }
  
  /**
   * 获取用户交易额
   */
  private async getUserTransactionVolume(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<number> {
    try {
      // TODO: 从交易系统获取用户交易额
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  // ========== 模拟数据方法（用于开发/测试） ==========
  
  /**
   * 生成模拟用户数据
   * 生成差异较大的数据，便于测试贡献度分配
   */
  private generateMockUserData(): UserPersonalData[] {
    const users: UserPersonalData[] = [];
    const count = this.config.mockUserCount;
    
    // 定义不同用户类型，产生明显差异（最高最低约10倍）
    const userTypes = [
      { name: '大佬', gameCoins: [18000, 25000], computingPower: [8000, 12000], transactionVolume: [5000, 8000], ratio: 0.1 },
      { name: '高手', gameCoins: [10000, 18000], computingPower: [5000, 8000], transactionVolume: [3000, 5000], ratio: 0.2 },
      { name: '活跃', gameCoins: [5000, 10000], computingPower: [3000, 5000], transactionVolume: [1500, 3000], ratio: 0.3 },
      { name: '普通', gameCoins: [2000, 5000], computingPower: [1000, 3000], transactionVolume: [800, 1500], ratio: 0.3 },
      { name: '新手', gameCoins: [500, 2000], computingPower: [300, 1000], transactionVolume: [200, 800], ratio: 0.1 },
    ];
    
    let userIndex = 0;
    for (const type of userTypes) {
      const typeCount = Math.floor(count * type.ratio);
      for (let i = 0; i < typeCount && userIndex < count; i++) {
        users.push({
          userId: `user_${userIndex + 1}`,
          userName: `${type.name}${i + 1}`,
          gameCoins: this.randomBetween(type.gameCoins[0], type.gameCoins[1]),
          computingPower: this.randomBetween(type.computingPower[0], type.computingPower[1]),
          transactionVolume: this.randomBetween(type.transactionVolume[0], type.transactionVolume[1]),
          contributionScore: 0,
        });
        userIndex++;
      }
    }
    
    // 填充剩余用户
    while (userIndex < count) {
      users.push({
        userId: `user_${userIndex + 1}`,
        userName: `普通${userIndex + 1}`,
        gameCoins: this.randomBetween(3000, 4000),
        computingPower: this.randomBetween(1500, 2000),
        transactionVolume: this.randomBetween(600, 800),
        contributionScore: 0,
      });
      userIndex++;
    }
    
    return users;
  }
  
  /**
   * 生成指定范围内的随机数
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min));
  }
  
  private getMockTotalGameCoins(): number {
    return this.config.mockUserCount * 8000; // 平均8000游戏币
  }
  
  private getMockTotalComputingPower(): number {
    return this.config.mockUserCount * 3800; // 平均3800算力
  }
  
  private getMockTransactionVolume(): number {
    return this.config.mockUserCount * 2500; // 平均2500交易额
  }
  
  /**
   * 生成模拟现金收入（人民币）
   * 模拟每日平台现金收入 50,000 - 100,000 元
   */
  private getMockCashIncome(): number {
    const minIncome = 50000;  // 最低5万元
    const maxIncome = 100000; // 最高10万元
    return minIncome + Math.random() * (maxIncome - minIncome);
  }

  // ========== 多奖池支持：游戏级模拟数据 ==========

  /**
   * 收集游戏收入（模拟各游戏的不同收入水平）
   */
  async collectGameRevenue(gameId: string, startDate: string, endDate: string): Promise<number> {
    if (!this.config.useMockData) return 0;
    
    // 不同游戏有不同的模拟收入
    const gameRevenueConfig: Record<string, { min: number; max: number }> = {
      'match3': { min: 10000, max: 30000 },    // 消消乐：1-3万
      'puzzle': { min: 5000, max: 15000 },     // 益智闯关：0.5-1.5万
      'racing': { min: 20000, max: 50000 },    // 赛车：2-5万
      'shooter': { min: 15000, max: 40000 },   // 射击：1.5-4万
      'default': { min: 5000, max: 20000 },    // 默认
    };
    const config = gameRevenueConfig[gameId] || gameRevenueConfig['default'];
    const cashIncome = this.randomBetween(config.min, config.max);
    const aCoinIncome = cashIncome * this.config.cashToACoinRate;
    console.log(`[PlatformDataCollector] 游戏 ${gameId} 模拟收入: ¥${cashIncome} => ${aCoinIncome.toFixed(4)} A币`);
    return aCoinIncome;
  }

  /**
   * 收集游戏玩家数
   */
  async collectGamePlayerCount(gameId: string, startDate: string, endDate: string): Promise<number> {
    if (!this.config.useMockData) return 0;
    return this.randomBetween(10, 50);  // 模拟10-50活跃玩家
  }

  /**
   * 收集游戏局数
   */
  async collectGameSessions(gameId: string, startDate: string, endDate: string): Promise<number> {
    if (!this.config.useMockData) return 0;
    return this.randomBetween(100, 1000);  // 模拟100-1000局
  }

  /**
   * 收集游戏总分数
   */
  async collectGameTotalScore(gameId: string, startDate: string, endDate: string): Promise<number> {
    if (!this.config.useMockData) return 0;
    return this.randomBetween(50000, 500000);  // 模拟5万-50万总分
  }

  /**
   * 收集游戏玩家ID列表（用于游戏奖池独立分配）
   */
  async collectGameUserIds(gameId: string, startDate: string, endDate: string): Promise<string[]> {
    if (!this.config.useMockData) return [];

    // 从模拟用户数据中随机选取一部分玩家
    const mockUsers = this.generateMockUserData();
    const playerCount = Math.min(this.randomBetween(5, Math.min(30, mockUsers.length)), mockUsers.length);
    const shuffled = [...mockUsers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, playerCount).map(u => u.userId);
  }
}

// 导出单例
export const platformDataCollector = new PlatformDataCollector();
