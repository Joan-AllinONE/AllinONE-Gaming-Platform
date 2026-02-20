/**
 * New Day 游戏集成服务
 * 管理 New Day 游戏道具在 AllinONE 平台的数据同步、库存管理和商店功能
 */

import {
  NewDayItem,
  NewDayInventory,
  NewDayStoreItem,
  NewDayPurchaseRecord,
  NewDayGameStats,
  NewDayConfig,
  AllinONECompatibleItem,
  NewDayItemType,
  NewDayRarity
} from '@/types/newDay';
import { MarketItem } from '@/types/marketplace';
import { marketplaceService } from './marketplaceService';
import { newDayApiService } from './newDayApiService';

class NewDayService {
  private inventory: Map<string, NewDayInventory> = new Map();
  private storeItems: NewDayStoreItem[] = [];
  private purchaseHistory: NewDayPurchaseRecord[] = [];
  private userPurchases: Map<string, NewDayPurchaseRecord[]> = new Map();

  // New Day 游戏配置
  private config: NewDayConfig = {
    gameId: 'newday',
    gameName: 'New Day',
    gameUrl: 'https://yxp6y2qgnh.coze.site/', // New Day 游戏实际地址
    enabled: true,
    currency: {
      name: 'New Day 币',
      symbol: 'NDC',
      exchangeRate: 1.0
    },
    supportedPaymentMethods: ['cash', 'gameCoins', 'computingPower', 'aCoins', 'newDayCoins']
  };

  constructor() {
    this.initializeStoreItems();
  }

  /**
   * 初始化 New Day 游戏商店道具
   */
  private initializeStoreItems(): void {
    const now = new Date();
    
    this.storeItems = [
      // 武器类
      {
        id: 'nd_weapon_001',
        name: '黎明之剑',
        description: 'New Day 世界的传说武器，攻击力极高',
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
        tags: ['传说', '热门', '武器'],
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
        id: 'nd_weapon_002',
        name: '骑士长剑',
        description: '标准骑士装备，适合新手使用',
        type: NewDayItemType.WEAPON,
        rarity: NewDayRarity.COMMON,
        icon: 'fa-khanda',
        prices: {
          gameCoins: 500,
          newDayCoins: 50
        },
        stock: -1,
        tags: ['新手', '武器'],
        featured: false,
        popular: true,
        stats: {
          attack: 30,
          defense: 5
        },
        rewards: [
          { type: 'weapon', amount: 1, itemName: '骑士长剑' }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 护甲类
      {
        id: 'nd_armor_001',
        name: '龙鳞护甲',
        description: '由龙鳞制成，防御力惊人',
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
        tags: ['史诗', '热门', '护甲'],
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

      // 饰品类
      {
        id: 'nd_accessory_001',
        name: '神秘护身符',
        description: '传说中的护身符，拥有神秘力量',
        type: NewDayItemType.ACCESSORY,
        rarity: NewDayRarity.LEGENDARY,
        icon: 'fa-amulet',
        prices: {
          cash: 24.99,
          gameCoins: 25000,
          computingPower: 6000,
          newDayCoins: 1200
        },
        stock: 30,
        dailyLimit: 1,
        tags: ['传说', '特殊', '饰品'],
        featured: true,
        popular: true,
        stats: {
          attack: 20,
          defense: 20,
          health: 100,
          speed: 30
        },
        rewards: [
          { type: 'accessory', amount: 1, itemName: '神秘护身符' }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 消耗品类
      {
        id: 'nd_consumable_001',
        name: '生命药水',
        description: '立即恢复 500 点生命值',
        type: NewDayItemType.CONSUMABLE,
        rarity: NewDayRarity.COMMON,
        icon: 'fa-flask',
        prices: {
          gameCoins: 100,
          newDayCoins: 10
        },
        stock: -1,
        dailyLimit: 10,
        tags: ['消耗品', '新手推荐'],
        featured: false,
        popular: true,
        uses: 1,
        maxUses: 1,
        rewards: [
          { type: 'consumable', amount: 1, itemName: '生命药水' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'nd_consumable_002',
        name: '经验卷轴',
        description: '使用后获得 1000 经验值',
        type: NewDayItemType.CONSUMABLE,
        rarity: NewDayRarity.UNCOMMON,
        icon: 'fa-scroll',
        prices: {
          gameCoins: 300,
          newDayCoins: 30
        },
        stock: -1,
        dailyLimit: 5,
        tags: ['消耗品', '经验'],
        featured: false,
        popular: true,
        rewards: [
          { type: 'consumable', amount: 1, itemName: '经验卷轴' }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 材料类
      {
        id: 'nd_material_001',
        name: '龙骨',
        description: '稀有材料，用于打造高级装备',
        type: NewDayItemType.MATERIAL,
        rarity: NewDayRarity.EPIC,
        icon: 'fa-bone',
        prices: {
          gameCoins: 5000,
          newDayCoins: 500
        },
        stock: 200,
        dailyLimit: 5,
        tags: ['材料', '稀有'],
        featured: false,
        popular: false,
        rewards: [
          { type: 'material', amount: 1, itemName: '龙骨' }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 皮肤类
      {
        id: 'nd_skin_001',
        name: 'New Day 限定皮肤 - 黄金骑士',
        description: 'New Day 游戏限定皮肤，尊贵象征',
        type: NewDayItemType.SKIN,
        rarity: NewDayRarity.LEGENDARY,
        icon: 'fa-user-ninja',
        prices: {
          cash: 29.99,
          gameCoins: 30000,
          computingPower: 7000,
          newDayCoins: 1500
        },
        stock: -1,
        userLimit: 1,
        tags: ['限定', '皮肤', '热门'],
        featured: true,
        popular: true,
        rewards: [
          { type: 'skin', amount: 1, itemName: '黄金骑士皮肤' }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 宠物类
      {
        id: 'nd_pet_001',
        name: '迷你龙',
        description: '可爱的迷你龙宠物，会陪伴你冒险',
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
        tags: ['宠物', '可爱'],
        featured: true,
        popular: true,
        stats: {
          attack: 50,
          defense: 30,
          speed: 20
        },
        rewards: [
          { type: 'pet', amount: 1, itemName: '迷你龙' }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 特殊道具
      {
        id: 'nd_special_001',
        name: '时光回溯石',
        description: '可以回到过去，改变某些选择',
        type: NewDayItemType.SPECIAL,
        rarity: NewDayRarity.LEGENDARY,
        icon: 'fa-clock',
        prices: {
          cash: 49.99,
          gameCoins: 50000,
          aCoins: 100,
          newDayCoins: 2000
        },
        stock: 10,
        userLimit: 1,
        tags: ['特殊', '传说', '限时'],
        featured: true,
        popular: false,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        rewards: [
          { type: 'special', amount: 1, itemName: '时光回溯石' }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * 获取 New Day 游戏配置
   */
  getConfig(): NewDayConfig {
    return { ...this.config };
  }

  /**
   * 获取商店道具列表
   */
  async getStoreItems(category?: NewDayItemType): Promise<NewDayStoreItem[]> {
    let items = [...this.storeItems];
    
    if (category) {
      items = items.filter(item => item.type === category);
    }
    
    // 按稀有度和创建时间排序
    return items.sort((a, b) => {
      const rarityOrder = {
        [NewDayRarity.LEGENDARY]: 5,
        [NewDayRarity.EPIC]: 4,
        [NewDayRarity.RARE]: 3,
        [NewDayRarity.UNCOMMON]: 2,
        [NewDayRarity.COMMON]: 1
      };
      
      if (rarityOrder[b.rarity] !== rarityOrder[a.rarity]) {
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * 获取推荐道具
   */
  async getFeaturedItems(): Promise<NewDayStoreItem[]> {
    return this.storeItems.filter(item => item.featured).slice(0, 6);
  }

  /**
   * 获取热门道具
   */
  async getPopularItems(): Promise<NewDayStoreItem[]> {
    return this.storeItems.filter(item => item.popular).slice(0, 8);
  }

  /**
   * 获取单个道具详情
   */
  async getItem(itemId: string): Promise<NewDayStoreItem | undefined> {
    return this.storeItems.find(item => item.id === itemId);
  }

  /**
   * 购买道具
   */
  async purchaseItem(
    userId: string,
    itemId: string,
    paymentMethod: string,
    quantity: number = 1
  ): Promise<NewDayPurchaseRecord> {
    const item = this.storeItems.find(i => i.id === itemId);
    
    if (!item) {
      throw new Error('道具不存在');
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

    // 获取价格
    const priceMap = {
      'cash': item.prices.cash,
      'gameCoins': item.prices.gameCoins,
      'computingPower': item.prices.computingPower,
      'aCoins': item.prices.aCoins,
      'newDayCoins': item.prices.newDayCoins
    };

    const price = priceMap[paymentMethod as keyof typeof priceMap];
    if (!price) {
      throw new Error('不支持的支付方式');
    }

    const finalPrice = price * quantity;

    // 创建购买记录
    const purchase: NewDayPurchaseRecord = {
      id: `nd_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemId,
      itemName: item.name,
      paymentMethod,
      amount: finalPrice,
      currencyType: paymentMethod,
      rewards: item.rewards?.map(r => ({
        ...r,
        amount: r.amount * quantity
      })) || [],
      timestamp: new Date(),
      status: 'completed'
    };

    // 更新库存
    if (item.stock !== undefined && item.stock !== -1) {
      item.stock -= quantity;
    }

    // 将道具添加到用户库存
    await this.addItemToUserInventory(userId, item);

    // 保存购买记录
    this.purchaseHistory.push(purchase);
    const userHistory = this.userPurchases.get(userId) || [];
    userHistory.push(purchase);
    this.userPurchases.set(userId, userHistory);

    // 同步到 AllinONE 交易市场
    await this.syncToMarketplace(userId, item);

    return purchase;
  }

  /**
   * 添加道具到用户库存
   */
  async addItemToUserInventory(userId: string, item: NewDayStoreItem): Promise<void> {
    // 获取或创建用户库存
    let inventory = this.inventory.get(userId);
    
    if (!inventory) {
      inventory = {
        userId,
        items: [],
        maxSlots: 100,
        usedSlots: 0,
        lastUpdated: new Date()
      };
    }

    // 检查库存空间
    if (inventory.usedSlots >= inventory.maxSlots) {
      throw new Error('库存已满');
    }

    // 创建道具实例
    const newItem: NewDayItem = {
      id: `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      icon: item.icon,
      imageUrl: item.imageUrl,
      stats: item.stats,
      uses: item.uses,
      maxUses: item.maxUses,
      expireTime: item.endTime,
      createdAt: new Date(),
      source: {
        gameId: this.config.gameId,
        gameName: this.config.gameName,
        obtainedFrom: 'AllinONE官方商店'
      }
    };

    inventory.items.push(newItem);
    inventory.usedSlots = inventory.items.length;
    inventory.lastUpdated = new Date();

    this.inventory.set(userId, inventory);
  }

  /**
   * 获取用户库存
   */
  async getUserInventory(userId: string): Promise<NewDayInventory | undefined> {
    // 优先从 New Day API 获取真实库存
    try {
      const apiItems = await newDayApiService.getInventory();
      
      if (apiItems && apiItems.length > 0) {
        const inventory: NewDayInventory = {
          userId,
          items: apiItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type as NewDayItemType,
            rarity: item.rarity as NewDayRarity,
            icon: item.stats ? 'fa-box' : 'fa-gift',
            stats: item.stats,
            uses: item.quantity > 1 ? 1 : undefined,
            maxUses: item.quantity > 1 ? item.quantity : undefined,
            createdAt: new Date(item.obtainedAt),
            source: {
              gameId: this.config.gameId,
              gameName: this.config.gameName,
              obtainedFrom: 'New Day游戏'
            }
          })),
          maxSlots: 100,
          usedSlots: apiItems.length,
          lastUpdated: new Date()
        };
        
        this.inventory.set(userId, inventory);
        return inventory;
      }
    } catch (error) {
      console.warn('从 New Day API 获取库存失败，使用本地数据:', error);
    }
    
    return this.inventory.get(userId);
  }

  /**
   * 从 New Day API 同步库存
   */
  async syncInventoryFromNewDay(userId: string): Promise<void> {
    try {
      const apiItems = await newDayApiService.getInventory();
      
      const inventory: NewDayInventory = {
        userId,
        items: apiItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.type as NewDayItemType,
          rarity: item.rarity as NewDayRarity,
          icon: item.stats ? 'fa-box' : 'fa-gift',
          stats: item.stats,
          uses: item.quantity > 1 ? 1 : undefined,
          maxUses: item.quantity > 1 ? item.quantity : undefined,
          createdAt: new Date(item.obtainedAt),
          source: {
            gameId: this.config.gameId,
            gameName: this.config.gameName,
            obtainedFrom: 'New Day游戏'
          }
        })),
        maxSlots: 100,
        usedSlots: apiItems.length,
        lastUpdated: new Date()
      };
      
      this.inventory.set(userId, inventory);
      console.log('✅ 成功同步 New Day 库存:', apiItems.length, '个道具');
    } catch (error) {
      console.error('❌ 同步 New Day 库存失败:', error);
      throw error;
    }
  }

  /**
   * 将 New Day 道具同步到 AllinONE 交易市场
   */
  private async syncToMarketplace(userId: string, item: NewDayStoreItem): Promise<void> {
    try {
      const compatibleItem: AllinONECompatibleItem = {
        id: `newday_${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        description: `[${this.config.gameName}] ${item.description}`,
        category: this.mapNewDayTypeToMarketCategory(item.type),
        rarity: item.rarity,
        price: 0, // 用户已拥有的道具，初始价格设为0
        currency: 'gameCoins',
        gameSource: this.config.gameId,
        sourceGameId: item.id,
        originalItem: {
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.type,
          rarity: item.rarity,
          icon: item.icon,
          stats: item.stats,
          uses: item.uses,
          maxUses: item.maxUses,
          createdAt: item.createdAt,
          source: {
            gameId: this.config.gameId,
            gameName: this.config.gameName,
            obtainedFrom: 'AllinONE官方商店'
          }
        },
        stats: item.stats,
        createdAt: new Date()
      };

      // 添加到市场服务的用户库存
      const marketItem: MarketItem = {
        id: compatibleItem.id,
        name: compatibleItem.name,
        description: compatibleItem.description,
        category: compatibleItem.category,
        rarity: compatibleItem.rarity as any,
        price: compatibleItem.price,
        sellerId: userId,
        sellerName: '用户',
        listedAt: new Date(),
        views: 0,
        gameSource: this.config.gameId
      };

      await marketplaceService.addItemToUserInventory(userId, marketItem);
    } catch (error) {
      console.error('同步 New Day 道具到交易市场失败:', error);
    }
  }

  /**
   * 将 New Day 道具类型映射到 AllinONE 交易市场分类
   */
  private mapNewDayTypeToMarketCategory(type: NewDayItemType): string {
    switch (type) {
      case NewDayItemType.WEAPON:
        return 'weapon';
      case NewDayItemType.ARMOR:
        return 'armor';
      case NewDayItemType.ACCESSORY:
        return 'rare';
      case NewDayItemType.CONSUMABLE:
        return 'consumable';
      case NewDayItemType.MATERIAL:
        return 'material';
      case NewDayItemType.SPECIAL:
        return 'rare';
      case NewDayItemType.SKIN:
        return 'rare';
      case NewDayItemType.PET:
        return 'rare';
      default:
        return 'consumable';
    }
  }

  /**
   * 从 New Day API 同步钱包余额
   */
  async syncBalanceFromNewDay(): Promise<{
    cash: number;
    gameCoins: number;
    computingPower: number;
    newDayCoins: number;
    aCoins: number;
  }> {
    try {
      const balance = await newDayApiService.getBalance();
      console.log('✅ 成功同步 New Day 钱包:', balance);
      return balance;
    } catch (error) {
      console.error('❌ 同步 New Day 钱包失败:', error);
      throw error;
    }
  }

  /**
   * 获取 New Day 市场道具列表
   */
  async getMarketItems(params?: {
    platform?: 'allinone' | 'newday';
    itemType?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number }> {
    try {
      const result = await newDayApiService.getMarketItems(params);
      console.log('✅ 获取 New Day 市场道具:', result.total, '个');
      return result;
    } catch (error) {
      console.error('❌ 获取 New Day 市场道具失败:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * 购买 New Day 市场道具
   */
  async purchaseFromNewDayMarket(params: {
    itemId: string;
    currencyType: string;
    quantity?: number;
  }): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    try {
      const result = await newDayApiService.purchaseItem(params);
      if (result.success) {
        console.log('✅ 成功购买 New Day 市场道具:', params.itemId);
      }
      return result;
    } catch (error) {
      console.error('❌ 购买 New Day 市场道具失败:', error);
      throw error;
    }
  }

  /**
   * 上架道具到 New Day 市场
   */
  async listItemToNewDayMarket(item: {
    name: string;
    description: string;
    itemType: string;
    price: {
      cash?: number;
      gameCoins?: number;
      computingPower?: number;
      newDayGameCoins?: number; // New Day 游戏币
      newDayCoins?: number;    // 向后兼容
    };
  }): Promise<any> {
    try {
      const result = await newDayApiService.listItem({
        name: item.name,
        description: item.description,
        platform: 'newday',
        itemType: item.itemType,
        price: item.price
      });

      if (result) {
        console.log('✅ 成功上架道具到 New Day 市场:', item.name);
        return result;
      }
      throw new Error('上架失败');
    } catch (error) {
      console.error('❌ 上架道具到 New Day 市场失败:', error);
      throw error;
    }
  }

  /**
   * 转移道具到 AllinONE
   */
  async transferItemToAllinONE(params: {
    itemId: string;
    quantity: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await newDayApiService.transferItem({
        itemId: params.itemId,
        targetPlatform: 'allinone',
        quantity: params.quantity
      });
      
      if (result.success) {
        console.log('✅ 成功转移道具到 AllinONE:', params.itemId);
      }
      return result;
    } catch (error) {
      console.error('❌ 转移道具到 AllinONE 失败:', error);
      throw error;
    }
  }

  /**
   * 获取游戏统计
   */
  async getGameStats(): Promise<NewDayGameStats> {
    const popularItems = this.storeItems.filter(item => item.popular).slice(0, 5);
    const recentPurchases = this.purchaseHistory.slice(-10).reverse();

    const totalRevenue = {
      cash: 0,
      gameCoins: 0,
      computingPower: 0,
      aCoins: 0,
      newDayCoins: 0
    };

    this.purchaseHistory.forEach(purchase => {
      totalRevenue[purchase.currencyType as keyof typeof totalRevenue] += purchase.amount;
    });

    return {
      totalItems: this.storeItems.length,
      totalSales: this.purchaseHistory.length,
      totalRevenue,
      popularItems,
      recentPurchases
    };
  }

  /**
   * 获取用户购买历史
   */
  async getUserPurchaseHistory(userId: string): Promise<NewDayPurchaseRecord[]> {
    return this.userPurchases.get(userId) || [];
  }

  /**
   * 设置 New Day 游戏配置
   */
  updateConfig(config: Partial<NewDayConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 添加新的商店道具
   */
  async addStoreItem(item: NewDayStoreItem): Promise<void> {
    this.storeItems.push(item);
  }

  /**
   * 移除商店道具
   */
  async removeStoreItem(itemId: string): Promise<boolean> {
    const index = this.storeItems.findIndex(i => i.id === itemId);
    if (index > -1) {
      this.storeItems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 更新商店道具
   */
  async updateStoreItem(itemId: string, updates: Partial<NewDayStoreItem>): Promise<boolean> {
    const item = this.storeItems.find(i => i.id === itemId);
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date() });
      return true;
    }
    return false;
  }
}

export const newDayService = new NewDayService();
