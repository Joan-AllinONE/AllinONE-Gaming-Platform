import { EconomicData, MarketStats, Transaction, MarketListing } from '@/types/marketplace';

class EconomicService {
  private economicData: EconomicData | null = null;
  private marketStats: MarketStats | null = null;
  private listeners: Array<(data: EconomicData) => void> = [];

  // 模拟实时经济数据
  private generateEconomicData(): EconomicData {
    const now = new Date();
    const fluctuation = () => (Math.random() - 0.5) * 0.1; // ±10% 波动

    return {
      timestamp: now,
      totalNetworkPower: Math.floor(1250000 + Math.random() * 250000),
      activePlayers: Math.floor(8500 + Math.random() * 1500),
      dailyRewards: Math.floor(45000 + Math.random() * 10000),
      powerGrowthRate: 12.5 + fluctuation() * 5,
      averageEfficiency: 85.2 + fluctuation() * 10,
      networkLoad: 67.8 + fluctuation() * 20,
      expectedReturn: 8.5 + fluctuation() * 2,
      powerDistribution: [
        { category: '游戏算力', power: 450000, percentage: 36, color: '#3b82f6' },
        { category: '交易算力', power: 350000, percentage: 28, color: '#10b981' },
        { category: '社区算力', power: 250000, percentage: 20, color: '#f59e0b' },
        { category: '系统算力', power: 200000, percentage: 16, color: '#ef4444' }
      ],
      platformRevenue: {
        daily: Math.floor(25000 + Math.random() * 5000),
        weekly: Math.floor(175000 + Math.random() * 35000),
        monthly: Math.floor(750000 + Math.random() * 150000)
      },
      transactionVolume: {
        daily: Math.floor(1200 + Math.random() * 300),
        total: Math.floor(450000 + Math.random() * 50000)
      },
      averagePrice: 125.5 + fluctuation() * 25,
      priceHistory: [
        { timestamp: new Date(Date.now() - 86400000 * 2), averagePrice: 118.2, change: -2.1 },
        { timestamp: new Date(Date.now() - 86400000), averagePrice: 122.8, change: 3.9 },
        { timestamp: new Date(), averagePrice: 125.5, change: 2.2 }
      ],
      rewardHistory: [
        { date: '2025-01-24', totalReward: 42500, participants: 8200, averageReward: 5.18 },
        { date: '2025-01-25', totalReward: 45800, participants: 8650, averageReward: 5.29 },
        { date: '2025-01-26', totalReward: 48200, participants: 9100, averageReward: 5.30 }
      ]
    };
  }

  // 获取实时经济数据
  async getEconomicData(): Promise<EconomicData> {
    this.economicData = this.generateEconomicData();
    return this.economicData;
  }

  // 订阅实时数据更新
  subscribe(callback: (data: EconomicData) => void): () => void {
    this.listeners.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 启动实时数据更新
  startRealTimeUpdates(): void {
    setInterval(() => {
      const newData = this.generateEconomicData();
      this.economicData = newData;
      this.listeners.forEach(callback => callback(newData));
    }, 3000); // 每3秒更新一次
  }

  // 获取市场统计数据
  async getMarketStats(): Promise<MarketStats> {
    // 模拟市场数据
    return {
      totalListings: Math.floor(500 + Math.random() * 200),
      activeListings: Math.floor(300 + Math.random() * 100),
      totalTransactions: Math.floor(2500 + Math.random() * 500),
      totalVolume: Math.floor(125000 + Math.random() * 25000),
      averagePrice: Math.floor(50 + Math.random() * 30),
      topSellingItems: [], // 稍后实现
      priceHistory: [] // 稍后实现
    };
  }

  // 计算经济健康度指标
  calculateEconomicHealth(data: EconomicData): {
    score: number;
    indicators: Array<{ name: string; value: number; status: 'good' | 'warning' | 'critical' }>;
  } {
    const indicators: Array<{ name: string; value: number; status: 'good' | 'warning' | 'critical' }> = [
      {
        name: '算力效率',
        value: data.averageEfficiency,
        status: data.averageEfficiency > 80 ? 'good' : 
                data.averageEfficiency > 60 ? 'warning' : 'critical'
      },
      {
        name: '网络负载',
        value: data.networkLoad,
        status: data.networkLoad < 70 ? 'good' : 
                data.networkLoad < 85 ? 'warning' : 'critical'
      },
      {
        name: '用户活跃度',
        value: data.activePlayers / 10000,
        status: data.activePlayers > 8000 ? 'good' : 
                data.activePlayers > 6000 ? 'warning' : 'critical'
      }
    ];

    const score = indicators.reduce((sum, indicator) => {
      const weight = indicator.status === 'good' ? 1 : indicator.status === 'warning' ? 0.6 : 0.3;
      return sum + weight;
    }, 0) / indicators.length * 100;

    return { score, indicators };
  }
}

export const economicService = new EconomicService();

// 启动实时更新
economicService.startRealTimeUpdates();