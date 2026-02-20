import { 
  OfficialStoreItem, 
  StoreCategory, 
  StoreItemType, 
  PaymentMethod, 
  PurchaseRecord, 
  StoreStats,
  UserPurchaseHistory
} from '@/types/officialStore';
import { marketplaceService } from './marketplaceService';
import { MarketItem } from '@/types/marketplace';
import { fundPoolService } from './fundPoolService';
import { walletService } from './walletService';
import { inventoryApiService } from './inventoryApiService';
import { NewDayStoreItem, NewDayItemType, NewDayRarity } from '@/types/newDay';

class OfficialStoreService {
  private items: OfficialStoreItem[] = [];
  private categories: StoreCategory[] = [];
  private purchaseHistory: PurchaseRecord[] = [];
  private userPurchases: Map<string, PurchaseRecord[]> = new Map();
  
  // New Day 商店数据
  private newDayItems: NewDayStoreItem[] = [];

  // 佣金费率配置 - 与其他服务保持一致
  private commissionRate = 0.15; // 官方商店 15% 佣金

  constructor() {
    this.initializeCategories();
    this.initializeMockItems();
    this.initializeNewDayStore();
  }

  // 计算佣金
  private calculateCommission(price: number): { commission: number; totalAmount: number } {
    const commission = Math.round(price * this.commissionRate * 100) / 100;
    const totalAmount = Math.round((price + commission) * 100) / 100;
    return { commission, totalAmount };
  }

  // 初始化商品分类
  private initializeCategories(): void {
    this.categories = [
      {
        id: 'props',
        name: '游戏道具',
        type: StoreItemType.PROPS,
        icon: 'fa-magic',
        description: '各种游戏道具和装备',
        order: 1
      },
      {
        id: 'computing',
        name: '算力商店',
        type: StoreItemType.COMPUTING_POWER,
        icon: 'fa-microchip',
        description: '购买算力提升收益',
        order: 2
      },
      {
        id: 'recharge',
        name: '充值中心',
        type: StoreItemType.RECHARGE,
        icon: 'fa-credit-card',
        description: '游戏币充值服务',
        order: 3
      },
      {
        id: 'membership',
        name: '会员特权',
        type: StoreItemType.MEMBERSHIP,
        icon: 'fa-crown',
        description: 'VIP会员和特权服务',
        order: 4
      },
      {
        id: 'bundle',
        name: '超值礼包',
        type: StoreItemType.BUNDLE,
        icon: 'fa-gift',
        description: '限时优惠组合礼包',
        order: 5
      },
      {
        id: 'special',
        name: '限时特惠',
        type: StoreItemType.SPECIAL,
        icon: 'fa-fire',
        description: '限时特价商品',
        order: 6
      }
    ];
  }

  // 初始化模拟商品数据
  private initializeMockItems(): void {
    const now = new Date();
    
    this.items = [
      // 游戏道具
      {
        id: 'prop_001',
        name: '传说宝箱',
        description: '开启后必得传说级道具，还有机会获得稀有皮肤',
        type: StoreItemType.PROPS,
        category: 'props',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 9.99 },
          { method: PaymentMethod.GAME_COINS, amount: 1000 }
        ],
        stock: 100,
        dailyLimit: 3,
        tags: ['热门', '限量'],
        rewards: [
          { type: 'props', amount: 1, itemName: '随机传说道具' }
        ],
        icon: 'fa-treasure-chest',
        rarity: 'legendary',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prop_002',
        name: '经验加速器',
        description: '使用后1小时内经验获得翻倍',
        type: StoreItemType.PROPS,
        category: 'props',
        prices: [
          { method: PaymentMethod.GAME_COINS, amount: 200 },
          { method: PaymentMethod.COMPUTING_POWER, amount: 500 }
        ],
        stock: -1,
        dailyLimit: 5,
        tags: ['实用'],
        rewards: [
          { type: 'props', amount: 1, itemName: '经验加速器' }
        ],
        icon: 'fa-rocket',
        rarity: 'rare',
        featured: false,
        popular: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prop_003',
        name: 'A币礼包',
        description: '购买后可获得A币',
        type: StoreItemType.PROPS,
        category: 'props',
        prices: [
          { method: PaymentMethod.A_COINS, amount: 10 }
        ],
        stock: 100,
        dailyLimit: 1,
        tags: ['稀有'],
        rewards: [
          { type: 'a_coins', amount: 10 }
        ],
        icon: 'fa-coins',
        rarity: 'epic',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      },

      // 算力商店
      {
        id: 'power_001',
        name: '算力包 - 小',
        description: '立即获得1000算力，提升挖矿收益',
        type: StoreItemType.COMPUTING_POWER,
        category: 'computing',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 4.99 }
        ],
        stock: -1,
        tags: ['推荐'],
        rewards: [
          { type: 'computing_power', amount: 1000 }
        ],
        icon: 'fa-microchip',
        featured: true,
        popular: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'power_002',
        name: '算力包 - 大',
        description: '立即获得5000算力，超值优惠',
        type: StoreItemType.COMPUTING_POWER,
        category: 'computing',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 19.99, originalAmount: 24.99 }
        ],
        discount: 20,
        stock: -1,
        tags: ['超值', '推荐'],
        rewards: [
          { type: 'computing_power', amount: 5000 },
          { type: 'game_coins', amount: 500 }
        ],
        icon: 'fa-microchip',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      },

      // 充值中心
      {
        id: 'recharge_001',
        name: '游戏币 - 基础包',
        description: '获得1000游戏币',
        type: StoreItemType.RECHARGE,
        category: 'recharge',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 0.99 }
        ],
        stock: -1,
        tags: ['新手推荐'],
        rewards: [
          { type: 'game_coins', amount: 1000 }
        ],
        icon: 'fa-coins',
        featured: false,
        popular: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'recharge_002',
        name: '游戏币 - 超值包',
        description: '获得10000游戏币，首充双倍',
        type: StoreItemType.RECHARGE,
        category: 'recharge',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 9.99 }
        ],
        stock: -1,
        userLimit: 1,
        tags: ['首充', '双倍'],
        rewards: [
          { type: 'game_coins', amount: 20000 }
        ],
        icon: 'fa-coins',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      },

      // 会员特权
      {
        id: 'vip_001',
        name: 'VIP月卡',
        description: '30天VIP特权，每日领取奖励，专属客服',
        type: StoreItemType.MEMBERSHIP,
        category: 'membership',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 12.99 }
        ],
        stock: -1,
        tags: ['特权', '每日奖励'],
        rewards: [
          { type: 'vip_days', amount: 30 },
          { type: 'game_coins', amount: 1000 }
        ],
        icon: 'fa-crown',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      },

      // 超值礼包
      {
        id: 'bundle_001',
        name: '新手大礼包',
        description: '包含算力、游戏币、道具的超值组合',
        type: StoreItemType.BUNDLE,
        category: 'bundle',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 6.99, originalAmount: 15.99 }
        ],
        discount: 56,
        stock: 500,
        userLimit: 1,
        tags: ['新手', '限购', '超值'],
        rewards: [
          { type: 'computing_power', amount: 2000 },
          { type: 'game_coins', amount: 3000 },
          { type: 'props', amount: 3, itemName: '随机稀有道具' }
        ],
        icon: 'fa-gift',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      },

      // 限时特惠
      {
        id: 'special_001',
        name: '闪购特惠 - 算力暴击',
        description: '限时24小时，算力获得率提升200%',
        type: StoreItemType.SPECIAL,
        category: 'special',
        prices: [
          { method: PaymentMethod.REAL_MONEY, amount: 2.99, originalAmount: 9.99 }
        ],
        discount: 70,
        stock: 100,
        dailyLimit: 1,
        endTime: new Date(Date.now() + 86400000), // 24小时后过期
        tags: ['限时', '闪购', '暴击'],
        rewards: [
          { type: 'props', amount: 1, itemName: '算力暴击卡(24h)' }
        ],
        icon: 'fa-bolt',
        featured: true,
        popular: true,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  // 获取所有分类
  async getCategories(): Promise<StoreCategory[]> {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  // 获取商品列表
  async getItems(categoryId?: string): Promise<OfficialStoreItem[]> {
    let items = [...this.items];
    
    if (categoryId && categoryId !== 'all') {
      items = items.filter(item => item.category === categoryId);
    }
    
    // 按推荐、热门、创建时间排序
    return items.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.popular !== b.popular) return a.popular ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // 获取推荐商品
  async getFeaturedItems(): Promise<OfficialStoreItem[]> {
    return this.items.filter(item => item.featured).slice(0, 6);
  }

  // 获取热门商品
  async getPopularItems(): Promise<OfficialStoreItem[]> {
    return this.items.filter(item => item.popular).slice(0, 8);
  }

  // 购买商品
  async purchaseItem(
    itemId: string, 
    userId: string, 
    paymentMethod: PaymentMethod,
    quantity: number = 1
  ): Promise<PurchaseRecord> {
    const item = this.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('商品不存在');
    }

    // 检查库存
    if (item.stock !== undefined && item.stock !== -1 && item.stock < quantity) {
      throw new Error('库存不足');
    }

    // 检查购买限制
    const userPurchases = this.userPurchases.get(userId) || [];
    const todayPurchases = userPurchases.filter(p => 
      p.itemId === itemId && 
      new Date(p.timestamp).toDateString() === new Date().toDateString()
    );

    if (item.dailyLimit && todayPurchases.length >= item.dailyLimit) {
      throw new Error(`每日限购${item.dailyLimit}个`);
    }

    const totalPurchases = userPurchases.filter(p => p.itemId === itemId).length;
    if (item.userLimit && totalPurchases >= item.userLimit) {
      throw new Error(`用户限购${item.userLimit}个`);
    }

    // 检查支付方式
    const priceOption = item.prices.find(p => p.method === paymentMethod);
    if (!priceOption) {
      throw new Error('不支持的支付方式');
    }

    // 计算商品价格和佣金
    const itemPrice = priceOption.amount * quantity;
    const { commission, totalAmount } = this.calculateCommission(itemPrice);

    // 记录佣金到资金池（仅现金支付时记录佣金）
    if (paymentMethod === PaymentMethod.REAL_MONEY && commission > 0) {
      try {
        await fundPoolService.recordCommissionIncome(
          `official_store_${Date.now()}`,
          commission,
          'cash',
          'official_store',
          userId
        );
      } catch (error) {
        console.error('记录官方商店佣金失败:', error);
      }
    }

    // 记录用户的商品购买和佣金支付到钱包（分别记录两笔交易）
    const currencyType = paymentMethod === PaymentMethod.REAL_MONEY ? 'cash' :
                       paymentMethod === PaymentMethod.GAME_COINS ? 'gameCoins' :
                       paymentMethod === PaymentMethod.A_COINS ? 'aCoins' : 'computingPower';
    
    try {
      // 1. 记录商品购买支出
      await walletService.addTransaction({
        type: 'expense',
        amount: itemPrice,
        currency: currencyType,
        description: `官方商店购买: ${item.name}`,
        category: 'purchase'
      });
      
      // 2. 记录佣金支出（如果有佣金）
      if (commission > 0) {
        await walletService.addTransaction({
          type: 'expense',
          amount: commission,
          currency: currencyType,
          description: `官方商店购买佣金 - ${item.name} (15%)`,
          category: 'commission'
        });
      }
    } catch (error) {
      console.error('记录用户购买和佣金支付失败:', error);
    }

    // 创建购买记录
    const purchase: PurchaseRecord = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemId,
      itemName: item.name,
      paymentMethod,
      amount: itemPrice, // 商品原价
      commission, // 佣金金额
      totalAmount, // 实际支付总金额
      rewards: item.rewards.map(reward => ({
        ...reward,
        amount: reward.amount * quantity
      })),
      timestamp: new Date(),
      status: 'completed'
    };

    // 更新库存
    if (item.stock !== undefined && item.stock !== -1) {
      item.stock -= quantity;
    }

    // 将道具类商品添加到用户库存（个人中心）
    if (item.type === StoreItemType.PROPS) {
      try {
        // 创建道具对象，添加到marketplace服务的用户库存中
        const marketItem: MarketItem = {
          id: `owned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          description: item.description,
          category: this.mapStoreItemToMarketCategory(item.category),
          rarity: item.rarity || 'common',
          price: 0, // 已拥有，不显示价格
          sellerId: 'official-store',
          sellerName: '官方商店',
          listedAt: new Date(),
          views: 0,
          gameSource: '官方商店'
        };

        // 添加到用户库存
        await marketplaceService.addItemToUserInventory(userId, marketItem);
      } catch (error) {
        console.error('添加道具到用户库存失败:', error);
      }
    }

    // 保存购买记录
    this.purchaseHistory.push(purchase);
    const userHistory = this.userPurchases.get(userId) || [];
    userHistory.push(purchase);
    this.userPurchases.set(userId, userHistory);

    // 重要：将官方商店购买记录同步到交易记录系统
    try {
      await marketplaceService.recordOfficialStorePurchase(
        userId,
        item.name,
        item.description,
        itemPrice, // 商品原价
        commission, // 佣金
        totalAmount, // 实际支付总金额
        paymentMethod
      );
      console.log('官方商店购买记录已同步到交易系统');
    } catch (error) {
      console.error('同步官方商店购买记录失败:', error);
    }

    return purchase;
  }

  // 获取商店统计
  async getStoreStats(): Promise<StoreStats> {
    const today = new Date().toDateString();
    const dailySales = this.purchaseHistory.filter(p => 
      new Date(p.timestamp).toDateString() === today
    ).length;

    const totalRevenue = this.purchaseHistory
      .filter(p => p.paymentMethod === PaymentMethod.REAL_MONEY)
      .reduce((sum, p) => sum + p.amount, 0);

    const popularItems = this.items
      .filter(item => item.popular)
      .slice(0, 5);

    const recentPurchases = [...this.purchaseHistory]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    // 分类统计
    const categoryStats = this.categories.map(category => {
      const categoryItems = this.items.filter(item => item.category === category.id);
      const categorySales = this.purchaseHistory.filter(p => 
        categoryItems.some(item => item.id === p.itemId)
      );
      const categoryRevenue = categorySales
        .filter(p => p.paymentMethod === PaymentMethod.REAL_MONEY)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        category: category.name,
        itemCount: categoryItems.length,
        salesCount: categorySales.length,
        revenue: categoryRevenue
      };
    });

    return {
      totalItems: this.items.length,
      dailySales,
      totalRevenue,
      popularItems,
      recentPurchases,
      categoryStats
    };
  }

  // 辅助方法：将官方商店商品分类映射到交易市场分类
  private mapStoreItemToMarketCategory(storeCategory: string): string {
    switch (storeCategory) {
      case 'props': return 'consumable';
      case 'computing': return 'material';
      case 'recharge': return 'material';
      case 'membership': return 'rare';
      case 'bundle': return 'rare';
      case 'special': return 'rare';
      default: return 'consumable';
    }
  }

  // ==================== New Day 官方商店功能 ====================

  /**
   * 初始化 New Day 官方商店商品
   */
  private initializeNewDayStore(): void {
    const now = new Date();
    
    this.newDayItems = [
      {
        id: 'nd_store_weapon_001',
        name: '黎明之剑',
        description: 'New Day 世界的传说武器，攻击力极高，散发着神圣的光芒',
        type: NewDayItemType.WEAPON,
        rarity: NewDayRarity.LEGENDARY,
        icon: 'fa-sword',
        prices: {
          cash: 19.99,
          gameCoins: 20000,
          computingPower: 5000,
          newDayCoins: 1000
        },
        stock: 50,
        dailyLimit: 2,
        tags: ['传说', '热门', '武器', 'New Day'],
        featured: true,
        popular: true,
        stats: {
          attack: 150,
          defense: 20,
          speed: 10
        },
        rewards: [
          { type: 'weapon', amount: 1, itemName: '黎明之剑' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'nd_store_armor_001',
        name: '龙鳞护甲',
        description: '由上古龙鳞制成的传说护甲，防御力惊人',
        type: NewDayItemType.ARMOR,
        rarity: NewDayRarity.EPIC,
        icon: 'fa-shield-halved',
        prices: {
          cash: 14.99,
          gameCoins: 15000,
          computingPower: 3000,
          newDayCoins: 800
        },
        stock: 100,
        dailyLimit: 3,
        tags: ['史诗', '热门', '护甲', 'New Day'],
        featured: true,
        popular: true,
        stats: {
          attack: 10,
          defense: 120,
          health: 50
        },
        rewards: [
          { type: 'armor', amount: 1, itemName: '龙鳞护甲' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'nd_store_consumable_001',
        name: '生命药水（大）',
        description: '立即恢复 1000 点生命值，New Day 冒险必备',
        type: NewDayItemType.CONSUMABLE,
        rarity: NewDayRarity.COMMON,
        icon: 'fa-flask',
        prices: {
          gameCoins: 100,
          newDayCoins: 10
        },
        stock: -1,
        dailyLimit: 20,
        tags: ['消耗品', '新手推荐', 'New Day'],
        featured: false,
        popular: true,
        rewards: [
          { type: 'consumable', amount: 5, itemName: '生命药水（大）' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'nd_store_material_001',
        name: '龙晶石',
        description: 'New Day 稀有材料，用于打造顶级装备',
        type: NewDayItemType.MATERIAL,
        rarity: NewDayRarity.RARE,
        icon: 'fa-gem',
        prices: {
          gameCoins: 5000,
          computingPower: 1000,
          newDayCoins: 500
        },
        stock: 200,
        dailyLimit: 10,
        tags: ['材料', '稀有', 'New Day'],
        featured: false,
        popular: false,
        rewards: [
          { type: 'material', amount: 1, itemName: '龙晶石' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'nd_store_pet_001',
        name: '迷你龙宠物',
        description: '可爱的迷你龙，会陪伴你在 New Day 世界冒险',
        type: NewDayItemType.PET,
        rarity: NewDayRarity.EPIC,
        icon: 'fa-dragon',
        prices: {
          cash: 9.99,
          gameCoins: 10000,
          newDayCoins: 500
        },
        stock: 100,
        dailyLimit: 1,
        tags: ['宠物', '可爱', 'New Day'],
        featured: true,
        popular: true,
        stats: {
          attack: 50,
          defense: 30,
          speed: 20
        },
        rewards: [
          { type: 'pet', amount: 1, itemName: '迷你龙宠物' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'nd_store_special_001',
        name: 'New Day 新手礼包',
        description: '包含武器、护甲、药水的超值新手礼包',
        type: NewDayItemType.SPECIAL,
        rarity: NewDayRarity.EPIC,
        icon: 'fa-gift',
        prices: {
          cash: 4.99,
          gameCoins: 5000,
          newDayCoins: 300
        },
        stock: 500,
        userLimit: 1,
        tags: ['礼包', '新手', '超值', 'New Day'],
        featured: true,
        popular: true,
        rewards: [
          { type: 'weapon', amount: 1, itemName: '新手长剑' },
          { type: 'armor', amount: 1, itemName: '新手护甲' },
          { type: 'consumable', amount: 10, itemName: '生命药水' }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * 获取 New Day 官方商店商品
   */
  async getNewDayStoreItems(category?: NewDayItemType): Promise<NewDayStoreItem[]> {
    let items = [...this.newDayItems];
    
    if (category) {
      items = items.filter(item => item.type === category);
    }
    
    // 按推荐、热门、创建时间排序
    return items.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.popular !== b.popular) return a.popular ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * 获取 New Day 推荐商品
   */
  async getNewDayFeaturedItems(): Promise<NewDayStoreItem[]> {
    return this.newDayItems.filter(item => item.featured).slice(0, 6);
  }

  /**
   * 获取 New Day 热门商品
   */
  async getNewDayPopularItems(): Promise<NewDayStoreItem[]> {
    return this.newDayItems.filter(item => item.popular).slice(0, 8);
  }

  /**
   * 购买 New Day 官方商店商品
   * 复用 AllinONE 现有的交易和记录系统
   */
  async purchaseNewDayItem(
    itemId: string,
    userId: string,
    paymentMethod: string,
    quantity: number = 1
  ): Promise<PurchaseRecord> {
    const item = this.newDayItems.find(i => i.id === itemId);
    if (!item) {
      throw new Error('商品不存在');
    }

    // 检查库存
    if (item.stock !== undefined && item.stock !== -1 && item.stock < quantity) {
      throw new Error('库存不足');
    }

    // 检查购买限制
    const userPurchases = this.userPurchases.get(userId) || [];
    const todayPurchases = userPurchases.filter(p => 
      p.itemId === itemId && 
      new Date(p.timestamp).toDateString() === new Date().toDateString()
    );

    if (item.dailyLimit && todayPurchases.length >= item.dailyLimit) {
      throw new Error(`每日限购${item.dailyLimit}个`);
    }

    const totalPurchases = userPurchases.filter(p => p.itemId === itemId).length;
    if (item.userLimit && totalPurchases >= item.userLimit) {
      throw new Error(`用户限购${item.userLimit}个`);
    }

    // 检查支付方式 - 只支持 AllinONE 钱包（与官方商店一致）
    const priceMap: Record<string, number | undefined> = {
      'cash': item.prices.cash,
      'gameCoins': item.prices.gameCoins,
      'computingPower': item.prices.computingPower,
      'aCoins': item.prices.aCoins
    };

    const price = priceMap[paymentMethod];
    if (!price) {
      throw new Error('不支持的支付方式，New Day 官方商店仅支持 AllinONE 钱包支付');
    }

    const finalPrice = price * quantity;
    const commissionRate = 0.15; // 官方商店 15% 佣金
    const commission = Math.round(finalPrice * commissionRate * 100) / 100;
    const totalAmount = finalPrice + commission;

    // ===== 使用 AllinONE 钱包支付（与官方商店一致） =====
    console.log('💰 使用 AllinONE 钱包支付 New Day 道具:', {
      item: item.name,
      price: finalPrice,
      commission,
      total: totalAmount,
      paymentMethod
    });

    try {
      // 1. 记录商品购买支出
      await walletService.addTransaction({
        type: 'expense',
        amount: finalPrice,
        currency: paymentMethod as any,
        description: `购买 New Day 道具: ${item.name}`,
        category: 'purchase'
      });
      
      // 2. 记录佣金支出
      if (commission > 0) {
        await walletService.addTransaction({
          type: 'expense',
          amount: commission,
          currency: paymentMethod as any,
          description: `购买 New Day 道具佣金 - ${item.name} (15%)`,
          category: 'commission'
        });
      }
      
      console.log('✅ AllinONE 钱包扣款成功');
    } catch (error: any) {
      console.error('❌ 钱包支付失败:', error);
      throw new Error(`钱包支付失败: ${error.message}`);
    }

    // ===== 将道具添加到用户库存（与官方商店一致） =====
    console.log('📦 添加 New Day 道具到用户库存:', item.name);
    try {
      // 生成唯一ID：使用原始itemId + 时间戳 + 随机数，确保全局唯一性
      const uniqueId = `nd_${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // 创建道具对象，添加到 marketplace 服务的用户库存
      const marketItem: MarketItem = {
        id: uniqueId,
        name: `[New Day] ${item.name}`,
        description: item.description,
        category: this.mapNewDayTypeToCategory(item.type),
        rarity: item.rarity,
        price: 0, // 已拥有，不显示价格
        sellerId: 'newday-official-store',
        sellerName: 'New Day 官方商店',
        listedAt: new Date(),
        views: 0,
        gameSource: 'newday'
      };

      // 使用与官方商店相同的方法添加到用户库存
      await marketplaceService.addItemToUserInventory(userId, marketItem);
      console.log('✅ 道具已添加到用户库存');
      
      // 同时保存到后端数据库，确保在跨游戏库存中显示
      await inventoryApiService.addItem({
        itemId: marketItem.id,
        name: marketItem.name,
        description: marketItem.description,
        gameSource: 'newday',
        gameName: 'New Day',
        category: marketItem.category,
        rarity: marketItem.rarity,
        quantity: 1,
        obtainedFrom: 'official_store_purchase',
        syncStatus: 'not_synced', // New Day 道具默认为未同步状态
        originalItemId: item.id // 保存原始道具ID，用于同步时识别
      });
      console.log('✅ 道具已保存到后端数据库（syncStatus: not_synced）');
    } catch (error: any) {
      console.error('❌ 添加道具到用户库存失败:', error);
      // 不影响主流程，只记录错误
    }

    // 创建购买记录
    const purchase: PurchaseRecord = {
      id: `nd_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemId,
      itemName: `[New Day] ${item.name}`,
      paymentMethod: paymentMethod as PaymentMethod,
      amount: finalPrice,
      commission,
      totalAmount,
      rewards: item.rewards?.map(reward => ({
        type: reward.type as any,
        amount: reward.amount * quantity,
        itemName: reward.itemName
      })) || [],
      timestamp: new Date(),
      status: 'completed'
    };

    // 更新库存
    if (item.stock !== undefined && item.stock !== -1) {
      item.stock -= quantity;
    }

    // 保存购买记录
    this.purchaseHistory.push(purchase);
    const userHistory = this.userPurchases.get(userId) || [];
    userHistory.push(purchase);
    this.userPurchases.set(userId, userHistory);

    // ===== 使用与官方商店相同的方法同步到交易记录系统 =====
    try {
      await marketplaceService.recordOfficialStorePurchase(
        userId,
        `[New Day] ${item.name}`,
        item.description,
        finalPrice,
        commission,
        totalAmount,
        paymentMethod as PaymentMethod
      );
      console.log('✅ New Day 购买记录已同步到交易系统');
    } catch (error) {
      console.error('❌ 同步到交易系统失败:', error);
    }

    console.log('✅ New Day 购买完成:', {
      item: item.name,
      price: finalPrice,
      commission,
      total: totalAmount,
      paymentMethod
    });

    return purchase;
  }

  /**
   * 将 New Day 道具类型映射到 AllinONE 分类
   */
  private mapNewDayTypeToCategory(type: NewDayItemType): string {
    switch (type) {
      case NewDayItemType.WEAPON: return 'weapon';
      case NewDayItemType.ARMOR: return 'armor';
      case NewDayItemType.ACCESSORY: return 'rare';
      case NewDayItemType.CONSUMABLE: return 'consumable';
      case NewDayItemType.MATERIAL: return 'material';
      case NewDayItemType.SPECIAL: return 'rare';
      case NewDayItemType.SKIN: return 'rare';
      case NewDayItemType.PET: return 'rare';
      default: return 'consumable';
    }
  }

  /**
   * 获取 New Day 商店统计
   */
  async getNewDayStoreStats(): Promise<{
    totalItems: number;
    dailySales: number;
    totalRevenue: number;
    popularItems: NewDayStoreItem[];
  }> {
    const today = new Date().toDateString();
    const ndPurchases = this.purchaseHistory.filter(p => 
      p.itemId.startsWith('nd_store_') &&
      new Date(p.timestamp).toDateString() === today
    );

    const totalRevenue = ndPurchases
      .filter(p => p.paymentMethod === PaymentMethod.REAL_MONEY)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalItems: this.newDayItems.length,
      dailySales: ndPurchases.length,
      totalRevenue,
      popularItems: this.newDayItems.filter(item => item.popular).slice(0, 5)
    };
  }

  // 获取用户购买历史
  async getUserPurchaseHistory(userId: string): Promise<UserPurchaseHistory> {
    const purchases = this.userPurchases.get(userId) || [];
    
    const totalSpent = purchases.reduce((acc, purchase) => {
      switch (purchase.paymentMethod) {
        case PaymentMethod.REAL_MONEY:
          acc.realMoney += purchase.amount;
          break;
        case PaymentMethod.GAME_COINS:
          acc.gameCoins += purchase.amount;
          break;
        case PaymentMethod.COMPUTING_POWER:
          acc.computingPower += purchase.amount;
          break;
        case PaymentMethod.A_COINS:
          acc.aCoins += purchase.amount;
          break;
      }
      return acc;
    }, { realMoney: 0, gameCoins: 0, computingPower: 0, aCoins: 0 });

    const recentPurchases = [...purchases]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    const ownedItemIds = purchases.map(p => p.itemId);
    const ownedItems = this.items.filter(item => ownedItemIds.includes(item.id));

    return {
      totalPurchases: purchases.length,
      totalSpent,
      recentPurchases,
      ownedItems
    };
  }
}

export const officialStoreService = new OfficialStoreService();