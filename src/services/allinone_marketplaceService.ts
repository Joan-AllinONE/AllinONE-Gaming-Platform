// AllinONE 跨平台市场服务
// ===================

// 说明：此服务作为 AllinONE 与外部游戏(如 New Day) 之间的适配层
// 使用新的跨平台服务架构进行统一认证和交易

import { MarketItem, Transaction, MarketStats } from '@/types/marketplace';
import { Currency } from '@/types/common';
import { crossPlatformAuthService } from './crossPlatformAuthService';
import { crossPlatformMarketService } from './crossPlatformMarketService';
import { crossPlatformWalletService, CurrencyType } from './crossPlatformWalletService';

class MarketplaceService {
  private items: MarketItem[] = [];
  private transactions: Transaction[];
  private userInventories: Map<string, MarketItem[]>;

  // 佣金费率配置
  private commissionRates = {
    player_market: 0.01,    // 玩家交易市场 1%
    official_store: 0.15,   // 官方商店 15%
    game_store: 0.30        // 游戏电商 30%
  };

  constructor() {
    // 从 localStorage 加载本地数据
    this.items = this.loadFromLocalStorage('marketplace_items', []);
    this.transactions = this.loadFromLocalStorage('marketplace_transactions', []);
    const storedInventories = this.loadFromLocalStorage('marketplace_userInventories', []);
    this.userInventories = new Map(storedInventories);

    // 初始化跨平台服务
    this.initializeCrossPlatformIntegration();
  }

  /**
   * 初始化跨平台集成
   */
  private initializeCrossPlatformIntegration() {
    // 检查是否有有效的跨平台令牌
    if (crossPlatformAuthService.isTokenValid()) {
      console.log('Cross-platform token is valid');
    } else {
      console.log('No valid cross-platform token');
    }
  }

  private loadFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue, (_key, value) => {
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
  }

  private saveToLocalStorage(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }

  // ==================== 跨平台集成方法 ====================

  /**
   * 从跨平台市场获取列表
   * @param platform 平台类型 'allinone' | 'newday'
   * @param itemType 物品类型
   */
  async getCrossPlatformMarketItems(
    platform?: 'allinone' | 'newday',
    itemType?: string
  ): Promise<MarketItem[]> {
    try {
      const { items } = await crossPlatformMarketService.getMarketItems(
        platform,
        itemType,
        'listed_desc',
        1,
        100
      );

      // 转换为 AllinONE 格式
      return items.map(item => this.convertCrossPlatformItem(item));
    } catch (error) {
      console.error('获取跨平台市场数据失败', error);
      return [];
    }
  }

  /**
   * 上架道具到跨平台市场
   * 
   * @param item 道具信息
   * @param originalItemId 原始道具ID（用于扣除 New Day 等外部游戏库存）
   * @param platform 平台类型 ('allinone' | 'newday')
   */
  async listItemToCrossPlatform(
    item: {
      name: string;
      description: string;
      itemType: string;
      imageUrl?: string;
      price: {
        cash?: number;
        gameCoins?: number;
        computingPower?: number;
        aCoins?: number;
        oCoins?: number;
      };
    },
    originalItemId?: string,
    platform: 'allinone' | 'newday' = 'allinone'
  ): Promise<MarketItem | null> {
    try {
      const listedItem = await crossPlatformMarketService.listItem({
        name: item.name,
        description: item.description,
        platform: platform,
        itemType: item.itemType,
        imageUrl: item.imageUrl,
        price: item.price,
      }, originalItemId);

      return this.convertCrossPlatformItem(listedItem);
    } catch (error) {
      console.error('上架到跨平台市场失败', error);
      return null;
    }
  }

  /**
   * 从跨平台市场购买道具
   */
  async purchaseFromCrossPlatform(
    itemId: string,
    currencyType: CurrencyType = 'cash'
  ): Promise<Transaction | null> {
    try {
      const result = await crossPlatformMarketService.purchaseItem({
        itemId,
        currencyType,
      });

      if (result.success) {
        // 创建本地交易记录
        const transaction: Transaction = {
          id: result.transactionId,
          buyerId: crossPlatformAuthService.getCurrentUser()?.userId || '',
          sellerId: 'unknown',
          item: {
            id: itemId,
            name: 'Unknown Item',
            description: '',
            category: 'unknown',
            rarity: 'common'
          },
          price: 0,
          transactionType: 'player_market',
          timestamp: new Date(),
        };

        this.transactions.unshift(transaction);
        this.saveToLocalStorage('marketplace_transactions', this.transactions);

        return transaction;
      }

      return null;
    } catch (error) {
      console.error('从跨平台市场购买失败', error);
      return null;
    }
  }

  /**
   * 获取跨平台库存
   */
  async getCrossPlatformInventory(
    platform?: 'allinone' | 'newday'
  ): Promise<MarketItem[]> {
    try {
      const inventoryItems = await crossPlatformMarketService.getInventory(platform);

      // 转换为 AllinONE 格式
      return inventoryItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.itemType,
        rarity: 'common',
        price: 0,
        sellerId: '',
        sellerName: '',
        listedAt: new Date(item.obtainedAt),
        views: 0,
        gameSource: item.platform,
      }));
    } catch (error) {
      console.error('获取跨平台库存失败', error);
      return [];
    }
  }

  /**
   * 获取用户余额
   */
  async getUserBalance() {
    try {
      return await crossPlatformWalletService.getBalance();
    } catch (error) {
      console.error('获取用户余额失败', error);
      return {
        cash: 0,
        gameCoins: 0,
        computingPower: 0,
        aCoins: 0,
        oCoins: 0,
      };
    }
  }

  /**
   * 货币兑换
   */
  async exchangeCurrency(
    from: CurrencyType,
    to: CurrencyType,
    amount: number
  ): Promise<Transaction | null> {
    try {
      const exchangeResult = await crossPlatformWalletService.exchange({
        fromCurrency: from,
        toCurrency: to,
        amount,
      });

      return {
        id: exchangeResult.id,
        buyerId: crossPlatformAuthService.getCurrentUser()?.userId || '',
        sellerId: '',
        item: {
          id: '',
          name: 'Currency Exchange',
          description: 'Currency Exchange',
          category: 'exchange',
          rarity: 'common'
        },
        price: amount,
        transactionType: 'player_market',
        timestamp: new Date(exchangeResult.createdAt),
      };
    } catch (error) {
      console.error('货币兑换失败', error);
      return null;
    }
  }

  /**
   * 转换跨平台物品格式为 AllinONE 格式
   */
  private convertCrossPlatformItem(item: any): MarketItem {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.itemType,
      rarity: 'common',
      price: item.price?.cash || item.price?.gameCoins || 0,
      currency: 'cash' as Currency,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      listedAt: new Date(item.listedAt),
      views: 0,
      gameSource: item.platform,
    };
  }

  // ==================== 保留原有的 localStorage 方法 ====================

  /**
   * 获取所有市场道具（合并本地和跨平台数据）
   */
  async getAllMarketItems(): Promise<MarketItem[]> {
    // 获取本地数据
    const localItems = this.items;

    // 获取跨平台数据
    const crossPlatformItems = await this.getCrossPlatformMarketItems();

    // 合并数据（去重）
    const allItems = [...localItems];
    crossPlatformItems.forEach(newItem => {
      if (!allItems.some(item => item.id === newItem.id)) {
        allItems.push(newItem);
      }
    });

    return allItems;
  }

  /**
   * 按 gameSource 过滤道具
   */
  async getMarketItemsBySource(gameSource: string): Promise<MarketItem[]> {
    if (gameSource === 'New Day') {
      return await this.getCrossPlatformMarketItems('newday');
    } else if (gameSource === 'AllinONE') {
      return await this.getCrossPlatformMarketItems('allinone');
    }

    // 返回本地数据
    return this.items;
  }

  // ==================== 原有的方法保持不变 ====================

  private _saveData() {
    this.saveToLocalStorage('marketplace_items', this.items);
    this.saveToLocalStorage('marketplace_transactions', this.transactions);
    this.saveToLocalStorage('marketplace_userInventories', Array.from(this.userInventories.entries()));
  }

  private calculateCommission(price: number, transactionType: 'player_market' | 'official_store' | 'game_store'): {
    commission: number;
    commissionRate: number;
    totalAmount: number;
    sellerReceives?: number;
  } {
    const rate = this.commissionRates[transactionType];
    const commission = Math.round(price * rate * 100) / 100;

    if (transactionType === 'player_market') {
      const totalAmount = Math.round((price + commission) * 100) / 100;
      const sellerReceives = price;
      return { commission, commissionRate: rate, totalAmount, sellerReceives };
    } else {
      const totalAmount = Math.round((price + commission) * 100) / 100;
      return { commission, commissionRate: rate, totalAmount };
    }
  }

  private initializeMockData(): void {
    // 如果需要,可以初始化模拟数据
    // 现在主要依赖跨平台服务
  }

  // 获取用户库存
  getUserInventory(userId: string): MarketItem[] {
    return this.userInventories.get(userId) || [];
  }

  // 添加到用户库存
  addToUserInventory(userId: string, item: MarketItem): void {
    if (!this.userInventories.has(userId)) {
      this.userInventories.set(userId, []);
    }
    this.userInventories.get(userId)!.push(item);
    this._saveData();
  }

  // 获取交易记录
  getTransactions(): Transaction[] {
    return this.transactions;
  }

  // 获取市场统计数据
  async getMarketStats(): Promise<MarketStats> {
    const allItems = await this.getAllMarketItems();

    return {
      totalListings: allItems.length,
      dailyTransactions: this.transactions.length,
      totalVolume: this.transactions.reduce((sum, tx) => sum + tx.price, 0),
      averagePrice: allItems.length > 0
        ? Math.round(allItems.reduce((sum, item) => sum + item.price, 0) / allItems.length)
        : 0,
    };
  }

  /**
   * 刷新跨平台令牌
   */
  async refreshToken(): Promise<boolean> {
    try {
      const newToken = await crossPlatformAuthService.refreshToken();
      return newToken !== null;
    } catch (error) {
      console.error('刷新令牌失败', error);
      return false;
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return crossPlatformAuthService.getCurrentUser();
  }

  /**
   * 检查认证状态
   */
  isAuthenticated(): boolean {
    return crossPlatformAuthService.isTokenValid();
  }
}

export const marketplaceService = new MarketplaceService();
export const allinone_marketplaceService = marketplaceService;
