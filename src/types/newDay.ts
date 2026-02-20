/**
 * New Day 游戏集成类型定义
 * 支持 New Day 游戏道具在 AllinONE 平台的展示和交易
 */

/**
 * New Day 游戏道具类型
 */
export enum NewDayItemType {
  WEAPON = 'weapon',          // 武器
  ARMOR = 'armor',            // 护甲
  ACCESSORY = 'accessory',    // 饰品
  CONSUMABLE = 'consumable',  // 消耗品
  MATERIAL = 'material',      // 材料
  SPECIAL = 'special',        // 特殊道具
  SKIN = 'skin',             // 皮肤
  PET = 'pet'                // 宠物
}

/**
 * 道具稀有度
 */
export enum NewDayRarity {
  COMMON = 'common',          // 普通
  UNCOMMON = 'uncommon',      // 稀有
  RARE = 'rare',             // 史诗
  EPIC = 'epic',             // 传说
  LEGENDARY = 'legendary'    // 神话
}

/**
 * New Day 游戏道具接口
 */
export interface NewDayItem {
  id: string;
  name: string;
  description: string;
  type: NewDayItemType;
  rarity: NewDayRarity;
  icon?: string;
  imageUrl?: string;
  
  // 游戏内属性
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
    [key: string]: number | undefined;
  };
  
  // 等级和成长
  level?: number;
  maxLevel?: number;
  
  // 使用次数（消耗品）
  uses?: number;
  maxUses?: number;
  
  // 时效性
  expireTime?: Date;
  
  // 创建时间
  createdAt: Date;
  
  // 来源信息
  source?: {
    gameId: string;
    gameName: string;
    obtainedFrom: string;  // 获得方式（商店、任务、活动等）
  };
}

/**
 * New Day 游戏库存接口
 */
export interface NewDayInventory {
  userId: string;
  items: NewDayItem[];
  maxSlots: number;
  usedSlots: number;
  lastUpdated: Date;
}

/**
 * New Day 游戏商店道具接口
 */
export interface NewDayStoreItem {
  id: string;
  name: string;
  description: string;
  type: NewDayItemType;
  rarity: NewDayRarity;
  icon?: string;
  
  // 价格
  prices: {
    cash?: number;           // 现金
    gameCoins?: number;      // 游戏币
    computingPower?: number; // 算力
    aCoins?: number;         // A币
    newDayCoins?: number;    // New Day 专属货币
  };
  
  // 库存
  stock?: number;
  stockUnlimited?: boolean;
  
  // 限制
  dailyLimit?: number;
  userLimit?: number;
  levelRequirement?: number;
  
  // 标签
  tags?: string[];
  featured?: boolean;
  popular?: boolean;
  
  // 游戏内属性
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
    [key: string]: number | undefined;
  };
  
  // 奖励
  rewards?: Array<{
    type: string;
    amount: number;
    itemName?: string;
  }>;
  
  // 时间限制
  startTime?: Date;
  endTime?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * New Day 游戏购买记录接口
 */
export interface NewDayPurchaseRecord {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  paymentMethod: string;
  amount: number;
  currencyType: string;
  rewards: Array<{
    type: string;
    amount: number;
    itemName?: string;
  }>;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * New Day 游戏统计接口
 */
export interface NewDayGameStats {
  totalItems: number;
  totalSales: number;
  totalRevenue: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    newDayCoins: number;
  };
  popularItems: NewDayStoreItem[];
  recentPurchases: NewDayPurchaseRecord[];
}

/**
 * New Day 游戏配置接口
 */
export interface NewDayConfig {
  gameId: string;
  gameName: string;
  gameUrl?: string;  // New Day 游戏的访问地址
  enabled: boolean;
  currency: {
    name: string;
    symbol: string;
    exchangeRate: number;  // 相对于游戏币的汇率
  };
  supportedPaymentMethods: string[];
  apiEndpoint?: string;  // New Day 游戏的 API 地址（可选）
}

/**
 * 转换为 AllinONE 平台通用格式的道具
 */
export interface AllinONECompatibleItem {
  id: string;
  name: string;
  description: string;
  category: string;  // 映射到 AllinONE 的分类
  rarity: string;
  price: number;
  currency: string;
  gameSource: string;  // 来源游戏标识
  sourceGameId?: string;  // 源游戏中的道具 ID
  originalItem?: NewDayItem;  // 原始道具数据
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
    [key: string]: number | undefined;
  };
  createdAt: Date;
}
