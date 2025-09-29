// 官方商店相关类型定义

export enum StoreItemType {
  PROPS = 'props',                    // 道具
  COMPUTING_POWER = 'computing_power', // 算力
  RECHARGE = 'recharge',              // 充值
  MEMBERSHIP = 'membership',          // 会员
  BUNDLE = 'bundle',                  // 礼包
  SPECIAL = 'special'                 // 限时特惠
}

export enum PaymentMethod {
  REAL_MONEY = 'real_money',          // 真实货币
  GAME_COINS = 'game_coins',          // 游戏币
  COMPUTING_POWER = 'computing_power',  // 算力
  A_COINS = 'a_coins'                 // A币
}

export interface StoreCategory {
  id: string;
  name: string;
  type: StoreItemType;
  icon: string;
  description: string;
  order: number;
}

export interface ItemReward {
  type: 'game_coins' | 'computing_power' | 'props' | 'vip_days' | 'a_coins';
  amount: number;
  itemId?: string;
  itemName?: string;
}

export interface PriceOption {
  method: PaymentMethod;
  amount: number;
  originalAmount?: number; // 原价，用于显示折扣
}

export interface OfficialStoreItem {
  id: string;
  name: string;
  description: string;
  type: StoreItemType;
  category: string;
  prices: PriceOption[];              // 多种支付方式
  originalPrice?: number;             // 原价(用于显示折扣)
  discount?: number;                  // 折扣百分比
  stock?: number;                     // 库存(-1表示无限)
  dailyLimit?: number;                // 每日购买限制
  userLimit?: number;                 // 用户总购买限制
  vipRequired?: number;               // 需要的VIP等级
  startTime?: Date;                   // 开始销售时间
  endTime?: Date;                     // 结束销售时间
  tags: string[];                     // 标签(热门、新品、限时等)
  rewards: ItemReward[];              // 购买后获得的奖励
  icon: string;
  images?: string[];                  // 商品图片
  rarity?: string;
  featured: boolean;                  // 是否为推荐商品
  popular: boolean;                   // 是否为热门商品
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  paymentMethod: PaymentMethod;
  amount: number; // 商品原价
  commission?: number; // 佣金金额
  totalAmount?: number; // 实际支付总金额
  rewards: ItemReward[];
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface StoreStats {
  totalItems: number;
  dailySales: number;
  totalRevenue: number;
  popularItems: OfficialStoreItem[];
  recentPurchases: PurchaseRecord[];
  categoryStats: Array<{
    category: string;
    itemCount: number;
    salesCount: number;
    revenue: number;
  }>;
}

export interface UserPurchaseHistory {
  totalPurchases: number;
  totalSpent: {
    realMoney: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
  };
  recentPurchases: PurchaseRecord[];
  ownedItems: OfficialStoreItem[];
}