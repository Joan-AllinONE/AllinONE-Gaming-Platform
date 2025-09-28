import { MarketItem, Transaction, MarketStats } from '@/types/marketplace';
import { Currency } from '@/types/common';
import { fundPoolService } from './fundPoolService';

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
  }
  return defaultValue;
};

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

class MarketplaceService {
  private items: MarketItem[];
  private transactions: Transaction[];
  private userInventories: Map<string, MarketItem[]>;
  
  // 佣金费率配置
  private commissionRates = {
    player_market: 0.01,    // 玩家交易市场 1%
    official_store: 0.15,   // 官方商店 15%
    game_store: 0.30        // 游戏电商 30%
  };

  constructor() {
    this.items = loadFromLocalStorage('marketplace_items', []);
    this.transactions = loadFromLocalStorage('marketplace_transactions', []);
    const storedInventories = loadFromLocalStorage<[string, MarketItem[]][]>('marketplace_userInventories', []);
    this.userInventories = new Map(storedInventories);

    if (this.items.length === 0 && this.transactions.length === 0) {
      this.initializeMockData();
    }
  }

  private _saveData() {
    saveToLocalStorage('marketplace_items', this.items);
    saveToLocalStorage('marketplace_transactions', this.transactions);
    saveToLocalStorage('marketplace_userInventories', Array.from(this.userInventories.entries()));
  }

  // 计算交易佣金
  private calculateCommission(price: number, transactionType: 'player_market' | 'official_store' | 'game_store'): { commission: number; commissionRate: number; totalAmount: number; sellerReceives?: number } {
    const rate = this.commissionRates[transactionType];
    const commission = Math.round(price * rate * 100) / 100; // 保留两位小数
    
    if (transactionType === 'player_market') {
      // 交易市场：买家支付原价+佣金，卖家收到原价
      const totalAmount = Math.round((price + commission) * 100) / 100; // 买家实际支付
      const sellerReceives = price; // 卖家收到原价
      return { commission, commissionRate: rate, totalAmount, sellerReceives };
    } else {
      // 官方商店和游戏电商：买家支付原价+佣金
      const totalAmount = Math.round((price + commission) * 100) / 100; // 总支付金额
      return { commission, commissionRate: rate, totalAmount };
    }
  }

  // 初始化模拟数据
  private initializeMockData(): void {
    if (this.items.length > 0) return;
    // 生成更多模拟道具
    const mockItems: MarketItem[] = [
      {
        id: 'item_1',
        name: '烈焰之剑',
        description: '传说中的烈焰之剑，攻击力+50，来自消消乐游戏的稀有掉落',
        category: 'weapon',
        rarity: 'legendary',
        price: 1250,
        sellerId: 'user_1',
        sellerName: '剑圣玩家',
        listedAt: new Date(Date.now() - 86400000 * 2),
        views: 156,
        gameSource: '消消乐'
      },
      {
        id: 'item_2',
        name: '守护者盾牌',
        description: '坚固的盾牌，防御力+30，适合新手玩家使用',
        category: 'armor',
        rarity: 'epic',
        price: 8500,
        currency: 'gameCoins',
        sellerId: 'user_2',
        sellerName: '守护骑士',
        listedAt: new Date(Date.now() - 86400000),
        views: 89,
        gameSource: '消消乐'
      },
      {
        id: 'item_3',
        name: '幸运符咒',
        description: '增加幸运值的神秘符咒，提升道具掉落率',
        category: 'consumable',
        rarity: 'rare',
        price: 50,
        currency: 'cash',
        sellerId: 'user_3',
        sellerName: '幸运星',
        listedAt: new Date(Date.now() - 3600000 * 12),
        views: 234,
        gameSource: '消消乐'
      },
      {
        id: 'item_4',
        name: '魔法水晶',
        description: '蕴含强大魔力的水晶，可用于装备强化',
        category: 'material',
        rarity: 'rare',
        price: 180,
        sellerId: 'user_4',
        sellerName: '水晶猎人',
        listedAt: new Date(Date.now() - 3600000 * 6),
        views: 67,
        gameSource: '消消乐'
      },
      {
        id: 'item_5',
        name: '龙鳞护甲',
        description: '由古龙鳞片制成的护甲，防御力极高',
        category: 'armor',
        rarity: 'legendary',
        price: 2100,
        sellerId: 'user_5',
        sellerName: '屠龙勇士',
        listedAt: new Date(Date.now() - 3600000 * 18),
        views: 312,
        gameSource: '消消乐'
      },
      {
        id: 'item_6',
        name: '治疗药水',
        description: '快速恢复生命值的药水，战斗必备',
        category: 'consumable',
        rarity: 'common',
        price: 45,
        sellerId: 'user_6',
        sellerName: '药剂师',
        listedAt: new Date(Date.now() - 3600000 * 3),
        views: 28,
        gameSource: '消消乐'
      },
      {
        id: 'item_7',
        name: '闪电法杖',
        description: '释放闪电魔法的法杖，魔法攻击力+40',
        category: 'weapon',
        rarity: 'epic',
        price: 95,
        currency: 'cash',
        sellerId: 'user_7',
        sellerName: '雷电法师',
        listedAt: new Date(Date.now() - 3600000 * 8),
        views: 145,
        gameSource: '消消乐'
      },
      {
        id: 'item_8',
        name: '稀有宝石',
        description: '闪闪发光的稀有宝石，可用于交易或收藏',
        category: 'material',
        rarity: 'epic',
        price: 680,
        sellerId: 'user_8',
        sellerName: '宝石商人',
        listedAt: new Date(Date.now() - 3600000 * 24),
        views: 198,
        gameSource: '消消乐'
      },
      {
        id: 'item_9',
        name: '风之靴',
        description: '轻盈的靴子，移动速度+25%',
        category: 'armor',
        rarity: 'uncommon',
        price: 2800,
        currency: 'gameCoins',
        sellerId: 'user_9',
        sellerName: '疾风行者',
        listedAt: new Date(Date.now() - 3600000 * 4),
        views: 52,
        gameSource: '消消乐'
      },
      {
        id: 'item_10',
        name: '经验宝珠',
        description: '使用后获得大量经验值',
        category: 'consumable',
        rarity: 'rare',
        price: 150,
        sellerId: 'user_10',
        sellerName: '经验大师',
        listedAt: new Date(Date.now() - 3600000 * 1),
        views: 15,
        gameSource: '消消乐'
      }
    ];

    this.items = mockItems;

    // 初始化空的交易记录数组，只保存真实的交易
    this.transactions = [];
    this._saveData();
  }

  // 获取市场商品列表
  async getMarketItems(): Promise<MarketItem[]> {
    return [...this.items];
  }

  // 购买商品
  async purchaseItem(itemId: string, buyerId: string): Promise<void> {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('商品不存在');
    }

    const item = this.items[itemIndex];
    
    // 计算佣金（玩家交易市场）
    const { commission, commissionRate, totalAmount, sellerReceives } = this.calculateCommission(item.price, 'player_market');
    
    // 创建交易记录
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      buyerId,
      sellerId: item.sellerId,
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        rarity: item.rarity
      },
      price: item.price, // 商品原价
      commission, // 佣金
      totalAmount, // 实际支付总金额
      commissionRate,
      transactionType: 'player_market',
      timestamp: new Date()
    };

    this.transactions.push(transaction);
    
    // 记录佣金到资金池
    if (commission > 0) {
      const commissionCurrency = item.currency || 'computingPower';
      // fundPoolService only accepts a subset of currencies
      if (commissionCurrency === 'cash' || commissionCurrency === 'gameCoins' || commissionCurrency === 'computingPower') {
        await fundPoolService.recordCommissionIncome(
          transaction.id,
          commission,
          commissionCurrency,
          'player_market',
          buyerId
        );
      } else {
        console.warn(`Fund pool does not support commission in ${commissionCurrency}. Transaction not recorded in fund pool.`);
      }
    }
    
    // 记录买家的支付（商品费用 + 佣金）
    const walletService = await import('./walletService');
    
    // 1. 记录买家商品购买支出
    await walletService.walletService.addTransaction({
      type: 'expense',
      category: 'purchase',
      amount: item.price,
      currency: (item.currency as Currency) || 'gameCoins',
      description: `交易市场购买: ${item.name}`,
      relatedId: transaction.id
    });
    
    // 2. 记录买家佣金支出
    if (commission > 0) {
      await walletService.walletService.addTransaction({
        type: 'expense',
        category: 'commission',
        amount: commission,
        currency: (item.currency as Currency) || 'gameCoins',
        description: `交易市场购买佣金 - ${item.name} (1%)`,
        relatedId: transaction.id
      });
    }
    
    // 3. 给卖家转账（商品原价）
    if (sellerReceives && sellerReceives > 0) {
      await walletService.walletService.addTransaction({
        type: 'income',
        category: 'trade',
        amount: sellerReceives,
        currency: (item.currency as Currency) || 'gameCoins',
        description: `交易市场销售: ${item.name}`,
        relatedId: transaction.id
      });
    }
    
    // 将道具添加到买家库存
    const userInventory = this.userInventories.get(buyerId) || [];
    const ownedItem: MarketItem = {
      ...item,
      id: `owned_${Date.now()}`,
      price: 0, // 已拥有，不显示价格
      sellerId: '',
      sellerName: '',
      listedAt: new Date(),
      views: 0
    };
    userInventory.push(ownedItem);
    this.userInventories.set(buyerId, userInventory);
    
    // 从市场移除商品
    this.items.splice(itemIndex, 1);
    this._saveData();
  }

  // 获取用户库存
  async getUserInventory(userId: string): Promise<MarketItem[]> {
    let inventory = this.userInventories.get(userId) || [];
    
    // 如果用户库存为空，添加一些初始道具用于测试
    if (inventory.length === 0) {
      const initialItems: MarketItem[] = [
        {
          id: 'user_item_1',
          name: '新手之剑',
          description: '适合新手使用的基础武器',
          category: 'weapon',
          rarity: 'common',
          price: 150,
          sellerId: '',
          sellerName: '',
          listedAt: new Date(),
          views: 0,
          gameSource: '消消乐'
        },
        {
          id: 'user_item_2',
          name: '生命药水',
          description: '恢复少量生命值',
          category: 'consumable',
          rarity: 'common',
          price: 50,
          sellerId: '',
          sellerName: '',
          listedAt: new Date(),
          views: 0,
          gameSource: '消消乐'
        },
        {
          id: 'user_item_3',
          name: '魔法石',
          description: '蕴含魔力的神秘石头',
          category: 'material',
          rarity: 'rare',
          price: 300,
          sellerId: '',
          sellerName: '',
          listedAt: new Date(),
          views: 0,
          gameSource: '消消乐'
        }
      ];
      
      this.userInventories.set(userId, initialItems);
      inventory = initialItems;
      this._saveData();
    }
    
    return inventory;
  }

  // 获取市场统计
  async getMarketStats(): Promise<MarketStats> {
    const totalVolume = this.transactions.reduce((sum, tx) => sum + tx.price, 0);
    const averagePrice = this.transactions.length > 0 ? totalVolume / this.transactions.length : 0;
    
    // 获取佣金统计
    const commissionStats = await this.getCommissionStats();

    return {
      totalListings: this.items.length,
      dailyTransactions: this.transactions.filter(tx => 
        tx.timestamp.getTime() > Date.now() - 86400000
      ).length,
      totalVolume,
      averagePrice,
      totalCommission: commissionStats.totalCommission,
      dailyCommission: commissionStats.dailyCommission,
      commissionByType: commissionStats.commissionByType
    };
  }

  // 获取交易历史
  async getTransactionHistory(): Promise<Transaction[]> {
    return [...this.transactions].reverse(); // 最新的在前
  }

  // 获取用户的完整交易记录
  async getUserTransactionHistory(userId: string): Promise<{
    purchases: Transaction[]; // 购买记录
    sales: Transaction[];     // 销售记录
    listings: MarketItem[];   // 当前挂单商品
  }> {
    // 获取真实的交易记录
    const purchases = this.transactions.filter(tx => tx.buyerId === userId);
    const sales = this.transactions.filter(tx => tx.sellerId === userId);
    const listings = this.items.filter(item => item.sellerId === userId);

    console.log('查询用户ID:', userId);
    console.log('所有交易记录:', this.transactions);
    console.log('交易记录详情:', this.transactions.map(tx => ({ id: tx.id, buyerId: tx.buyerId, sellerId: tx.sellerId, itemName: tx.item.name })));
    console.log('用户购买记录:', purchases);

    // 如果有真实交易记录，直接返回
    if (purchases.length > 0 || sales.length > 0) {
      return {
        purchases: purchases.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        sales: sales.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        listings
      };
    }

    // 添加完整的模拟交易记录，包括官方商店购买
    const allPurchases: Transaction[] = [
      // 官方商店购买记录
      {
        id: 'official_purchase_1',
        buyerId: userId,
        sellerId: 'official_store',
        item: {
          id: 'official_item_1',
          name: '官方限定武器包',
          description: '包含3把稀有武器的官方礼包',
          category: 'weapon',
          rarity: 'legendary'
        },
        price: 1200,
        timestamp: new Date(Date.now() - 86400000 * 1), // 1天前
        commission: 0,
        commissionRate: 0,
        transactionType: 'official_store'
      },
      {
        id: 'official_purchase_2',
        buyerId: userId,
        sellerId: 'official_store',
        item: {
          id: 'official_item_2',
          name: '经验加速器',
          description: '官方商店购买的经验加速道具',
          category: 'consumable',
          rarity: 'epic'
        },
        price: 500,
        timestamp: new Date(Date.now() - 86400000 * 3), // 3天前
        commission: 0,
        commissionRate: 0,
        transactionType: 'official_store'
      },
      // 游戏商店购买记录
      {
        id: 'game_store_purchase_1',
        buyerId: userId,
        sellerId: 'game_store_1',
        item: {
          id: 'game_store_item_1',
          name: '魔法卷轴套装',
          description: '从游戏商店购买的魔法卷轴',
          category: 'consumable',
          rarity: 'rare'
        },
        price: 350, // 商品原价
        commission: 105, // 30% 佣金 (350 * 0.3)
        totalAmount: 455, // 实际支付 (350 + 105)
        commissionRate: 0.30,
        transactionType: 'game_store',
        timestamp: new Date(Date.now() - 86400000 * 2) // 2天前
      },
      // 交易市场购买记录
      {
        id: 'market_purchase_1',
        buyerId: userId,
        sellerId: 'player_seller_1',
        item: {
          id: 'market_item_1',
          name: '玩家出售的护甲',
          description: '从其他玩家购买的高级护甲',
          category: 'armor',
          rarity: 'epic'
        },
        price: 100, // 商品原价
        commission: 1, // 1% 佣金 (100 * 0.01)
        totalAmount: 101, // 买家实际支付 (100 + 1)
        commissionRate: 0.01,
        transactionType: 'player_market',
        timestamp: new Date(Date.now() - 86400000 * 4) // 4天前
      }
    ];

    const allSales: Transaction[] = [
      ...sales,
      // 模拟销售记录
      {
        id: 'sale_1',
        buyerId: 'buyer_1',
        sellerId: userId,
        item: {
          id: 'sold_item_1',
          name: '传说宝箱',
          description: '出售给其他玩家的传说宝箱',
          category: 'consumable',
          rarity: 'legendary'
        },
        price: 99, // 卖家实际收到的金额（100原价-1佣金）
        commission: 1, // 1% 佣金 (100 * 0.01)
        totalAmount: 101, // 买家实际支付 (100 + 1)
        commissionRate: 0.01,
        transactionType: 'player_market',
        timestamp: new Date(Date.now() - 86400000 * 2) // 2天前
      }
    ];

    // 如果有真实交易记录，优先返回真实记录
    if (purchases.length > 0 || sales.length > 0) {
      return {
        purchases: purchases.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        sales: sales.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        listings
      };
    }

    // 否则返回包含模拟数据的记录
    return {
      purchases: allPurchases.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      sales: allSales.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      listings
    };
  }

  // 从用户库存中移除商品
  async removeItemFromUserInventory(userId: string, itemId: string): Promise<boolean> {
    const userInventory = this.userInventories.get(userId) || [];
    const itemIndex = userInventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false; // 商品不存在
    }
    
    // 移除商品
    userInventory.splice(itemIndex, 1);
    this.userInventories.set(userId, userInventory);
    return true;
  }

  // 下架商品并返回到用户库存
  async delistItem(itemId: string, userId: string): Promise<boolean> {
    const itemIndex = this.items.findIndex(item => item.id === itemId && item.sellerId === userId);
    
    if (itemIndex === -1) {
      return false; // 商品不存在或不属于该用户
    }
    
    // 从市场中移除商品
    const item = this.items[itemIndex];
    this.items.splice(itemIndex, 1);
    
    // 将商品重新添加到用户库存
    const userInventory = this.userInventories.get(userId) || [];
    const inventoryItem: MarketItem = {
      ...item,
      id: `user_item_${Date.now()}`, // 生成新的库存ID
      sellerId: '',
      sellerName: '',
      views: 0
    };
    
    userInventory.push(inventoryItem);
    this.userInventories.set(userId, userInventory);
    this._saveData();
    return true;
  }

  // 创建新的商品列表
  async createListing(item: Omit<MarketItem, 'id' | 'listedAt' | 'views'> & { originalItemId?: string }): Promise<MarketItem> {
    const newItem: MarketItem = {
      ...item,
      id: `item_${Date.now()}`,
      listedAt: new Date(),
      views: 0,
      currency: item.currency || 'computingPower' // 默认为算力
    };

    // 如果提供了原始商品ID，从用户库存中移除该商品
    if (item.originalItemId && item.sellerId) {
      await this.removeItemFromUserInventory(item.sellerId, item.originalItemId);
    }

    this.items.push(newItem);
    this._saveData();
    return newItem;
  }

  // 添加道具到用户库存（供官方商店使用）
  async addItemToUserInventory(userId: string, item: MarketItem): Promise<void> {
    const userInventory = this.userInventories.get(userId) || [];
    userInventory.push(item);
    this.userInventories.set(userId, userInventory);
    this._saveData();
  }

  // 记录游戏电商购买交易
  async recordGameStorePurchase(userId: string, itemName: string, itemDescription: string, actualPaidAmount: number, storeId: string): Promise<void> {
    // 游戏商店：用户支付的金额就是实际支付金额，平台从中抽取佣金给商家
    const commissionRate = this.commissionRates.game_store; // 30%
    const commission = Math.round(actualPaidAmount * commissionRate * 100) / 100;
    const merchantReceives = actualPaidAmount - commission; // 商家实际收到的金额
    
    const transaction: Transaction = {
      id: `game_store_purchase_${Date.now()}`,
      buyerId: userId,
      sellerId: `game_store_${storeId}`,
      item: {
        id: `game_store_item_${Date.now()}`,
        name: itemName,
        description: itemDescription,
        category: 'consumable',
        rarity: 'common'
      },
      price: actualPaidAmount, // 用户实际支付金额
      commission, // 平台佣金
      totalAmount: actualPaidAmount, // 用户实际支付金额
      commissionRate,
      transactionType: 'game_store',
      timestamp: new Date()
    };

    this.transactions.push(transaction);
    
    // 记录佣金到资金池
    if (commission > 0) {
      await fundPoolService.recordCommissionIncome(
        transaction.id,
        commission,
        'gameCoins', // 游戏电商默认使用游戏币
        'game_store',
        userId
      );
    }
    
    console.log('添加交易记录 - 商品价格:', actualPaidAmount, '佣金:', commission, '总支付:', actualPaidAmount);
    console.log('当前所有交易记录:', this.transactions);
    this._saveData();
  }

  // 记录官方商店购买交易
  async recordOfficialStorePurchase(
    userId: string, 
    itemName: string, 
    itemDescription: string, 
    price: number, 
    commission: number, 
    totalAmount: number, 
    paymentMethod: string
  ): Promise<void> {
    const transaction: Transaction = {
      id: `official_store_purchase_${Date.now()}`,
      buyerId: userId,
      sellerId: 'official_store',
      item: {
        id: `official_store_item_${Date.now()}`,
        name: itemName,
        description: itemDescription,
        category: 'bundle',
        rarity: 'epic'
      },
      price: price, // 商品原价
      commission, // 佣金
      totalAmount, // 实际支付总金额
      commissionRate: commission / price,
      transactionType: 'official_store',
      timestamp: new Date()
    };

    this.transactions.push(transaction);
    
    console.log('添加官方商店交易记录 - 商品价格:', price, '佣金:', commission, '总支付:', totalAmount);
    console.log('当前所有交易记录:', this.transactions);
    this._saveData();
  }

  // 上架道具到市场
  async listItem(itemId: string, price: number): Promise<MarketItem> {
    const userId = 'current-user-id'; // 当前用户ID
    
    // 获取用户库存
    const userInventory = this.userInventories.get(userId) || [];
    
    // 查找要上架的道具
    const itemIndex = userInventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('道具不存在于用户库存中');
    }
    
    // 获取道具信息
    const item = userInventory[itemIndex];
    
    // 创建新的市场列表项
    const marketItem: MarketItem = {
      ...item,
      id: `market_${Date.now()}`,
      sellerId: userId,
      sellerName: '当前用户',
      price: price,
      listedAt: new Date(),
      views: 0
    };
    
    // 添加到市场列表
    this.items.push(marketItem);
    
    // 从用户库存中移除该道具
    userInventory.splice(itemIndex, 1);
    this.userInventories.set(userId, userInventory);
    this._saveData();
    return marketItem;
  }

  // 卖出用户库存中的道具（保留原方法）
  async sellItem(userId: string, itemId: string, price?: number): Promise<MarketItem> {
    return this.listItem(itemId, price || 100);
  }

  // 获取用户已上架的商品
  async getUserListings(userId: string): Promise<MarketItem[]> {
    return this.items.filter(item => item.sellerId === userId);
  }



  // 修改商品价格
  async updateItemPrice(itemId: string, newPrice: number, userId: string): Promise<void> {
    const item = this.items.find(item => item.id === itemId && item.sellerId === userId);
    if (!item) {
      throw new Error('商品不存在或您无权操作');
    }

    if (newPrice <= 0) {
      throw new Error('价格必须大于0');
    }

    item.price = newPrice;
    this._saveData();
  }

  // 获取平台佣金收入统计
  // 新增方法：用于从外部服务（如GameStoreService）记录一笔已完成的交易
  public async addTransactionRecord(transactionData: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    this.transactions.push(newTransaction);
    console.log('已通过 addTransactionRecord 添加新的交易记录:', newTransaction);
    this._saveData();
    return newTransaction;
  }

  async getCommissionStats(): Promise<{
    totalCommission: number;
    dailyCommission: number;
    weeklyCommission: number;
    monthlyCommission: number;
    commissionByType: {
      player_market: number;
      official_store: number;
      game_store: number;
    };
  }> {
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const oneWeekAgo = now - 86400000 * 7;
    const oneMonthAgo = now - 86400000 * 30;

    const totalCommission = this.transactions.reduce((sum, tx) => sum + (tx.commission || 0), 0);
    const dailyCommission = this.transactions
      .filter(tx => tx.timestamp.getTime() > oneDayAgo)
      .reduce((sum, tx) => sum + (tx.commission || 0), 0);
    const weeklyCommission = this.transactions
      .filter(tx => tx.timestamp.getTime() > oneWeekAgo)
      .reduce((sum, tx) => sum + (tx.commission || 0), 0);
    const monthlyCommission = this.transactions
      .filter(tx => tx.timestamp.getTime() > oneMonthAgo)
      .reduce((sum, tx) => sum + (tx.commission || 0), 0);

    const commissionByType = {
      player_market: this.transactions
        .filter(tx => tx.transactionType === 'player_market')
        .reduce((sum, tx) => sum + (tx.commission || 0), 0),
      official_store: this.transactions
        .filter(tx => tx.transactionType === 'official_store')
        .reduce((sum, tx) => sum + (tx.commission || 0), 0),
      game_store: this.transactions
        .filter(tx => tx.transactionType === 'game_store')
        .reduce((sum, tx) => sum + (tx.commission || 0), 0)
    };

    return {
      totalCommission: Math.round(totalCommission * 100) / 100,
      dailyCommission: Math.round(dailyCommission * 100) / 100,
      weeklyCommission: Math.round(weeklyCommission * 100) / 100,
      monthlyCommission: Math.round(monthlyCommission * 100) / 100,
      commissionByType: {
        player_market: Math.round(commissionByType.player_market * 100) / 100,
        official_store: Math.round(commissionByType.official_store * 100) / 100,
        game_store: Math.round(commissionByType.game_store * 100) / 100
      }
    };
  }
}

export const marketplaceService = new MarketplaceService();
