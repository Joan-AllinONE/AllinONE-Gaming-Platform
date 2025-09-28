/**
 * O币相关类型定义
 */

/**
 * 价格点数据
 */
export interface PricePoint {
  timestamp: Date;
  price: number;
}

/**
 * O币市场数据
 */
export interface OCoinMarketData {
  currentPrice: number;
  circulatingSupply: number;
  totalSupply: number;
  totalDistributed: number;
  totalLocked: number;
  marketCap: number;
  priceHistory: PricePoint[];
  allTimeHigh: number;
  allTimeLow: number;
  lastUpdated: Date;
  dividendPool: number;
  lastDividendDate: Date | null;
  lastDividendPerCoin: number;
}

/**
 * O币用户余额
 */
export interface OCoinUserBalance {
  userId: string;
  availableBalance: number;
  lockedBalance: number;
  dividendRights: number;
  lastDividendAmount: number;
  totalDividendsReceived: number;
}

/**
 * O币期权
 */
export interface OCoinOption {
  id: string;
  userId: string;
  amount: number;
  vestedAmount: number;
  vestingPeriod: number; // 天数
  grantDate: Date;
  isFullyVested: boolean;
}

/**
 * O币交易记录
 */
export interface OCoinTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'dividend' | 'grant' | 'vest';
  amount: number;
  price?: number;
  timestamp: Date;
  description: string;
  status?: 'pending' | 'completed' | 'failed';
  userId: string;
  relatedUserId?: string;
}

/**
 * O币统计数据
 */
export interface OCoinStats {
  totalSupply: number;
  circulatingSupply: number;
  totalDistributed: number;
  totalLocked: number;
  marketCap: number;
}