// 交易市场相关类型定义
import { Currency } from './common';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
}

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  price: number;
  currency?: Currency; // 新增货币类型字段
  sellerId: string;
  sellerName: string;
  listedAt: Date;
  views: number;
  gameSource: string;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  item: GameItem;
  price: number; // 商品原价
  commission?: number; // 佣金金额
  totalAmount?: number; // 实际支付总金额 (price + commission)
  commissionRate?: number; // 佣金费率
  transactionType?: 'player_market' | 'official_store' | 'game_store'; // 交易类型
  timestamp: Date;
}

export interface MarketStats {
  totalListings: number;
  dailyTransactions: number;
  totalVolume: number;
  averagePrice: number;
  totalCommission?: number;
  dailyCommission?: number;
  commissionByType?: {
    player_market: number;
    official_store: number;
    game_store: number;
  };
}

export interface EconomicData {
  timestamp: Date;
  totalNetworkPower: number;
  activePlayers: number;
  dailyRewards: number;
  powerGrowthRate: number;
  averageEfficiency: number;
  networkLoad: number;
  expectedReturn: number;
  powerDistribution: Array<{
    category: string;
    power: number;
    percentage: number;
    color: string;
  }>;
  platformRevenue: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  transactionVolume: {
    daily: number;
    total: number;
  };
  averagePrice: number;
  priceHistory: Array<{
    timestamp: Date;
    averagePrice: number;
    change: number;
  }>;
  rewardHistory: Array<{
    date: string;
    totalReward: number;
    participants: number;
    averageReward: number;
  }>;
}
