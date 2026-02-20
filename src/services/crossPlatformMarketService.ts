/**
 * 跨平台市场服务
 * 用于 AllinONE 与外部游戏(如 New Day) 之间的道具交易
 */

import { crossPlatformAuthService } from './crossPlatformAuthService';
import { newDayService } from './newDayService';
import { newDayApiService } from './newDayApiService';
import { newDayInventorySyncService } from './newDayInventorySync';

interface CurrencyType {
  cash?: number;
  gameCoins?: number;
  computingPower?: number;
  aCoins?: number;
  oCoins?: number;
}

interface MarketItem {
  id: string;
  name: string;
  description: string;
  platform: 'allinone' | 'newday';
  itemType: string;
  imageUrl?: string;
  price: CurrencyType;
  sellerId: string;
  sellerName: string;
  listedAt: number;
  expiresAt?: number;
  originalItemId?: string; // 原始道具ID（用于 New Day 等外部游戏道具）
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  platform: 'allinone' | 'newday';
  itemType: string;
  quantity: number;
  obtainedAt: number;
}

interface PurchaseRequest {
  itemId: string;
  currencyType: keyof CurrencyType;
  quantity?: number;
}

interface ListingRequest {
  name: string;
  description: string;
  platform: 'allinone' | 'newday';
  itemType: string;
  imageUrl?: string;
  price: CurrencyType;
  expiresAt?: number;
}

class CrossPlatformMarketService {
  private readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  private readonly STORAGE_KEY = 'cross_platform_market_items';

  /**
   * 从 localStorage 加载市场数据
   */
  private loadFromStorage(): MarketItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('加载市场数据失败:', error);
    }
    return [];
  }

  /**
   * 保存市场数据到 localStorage
   */
  private saveToStorage(items: MarketItem[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('保存市场数据失败:', error);
    }
  }

  /**
   * 获取市场列表
   * 注意：所有交易都在 AllinONE 完成，New Day 没有自己的交易市场
   */
  async getMarketItems(
    platform?: 'allinone' | 'newday',
    itemType?: string,
    sortBy?: 'price_asc' | 'price_desc' | 'listed_asc' | 'listed_desc',
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: MarketItem[]; total: number }> {
    // 所有市场数据都从 AllinONE 本地存储获取
    // New Day 没有自己的交易市场，它的道具通过 AllinONE 交易
    let items = this.loadFromStorage();

    // 按平台过滤
    if (platform) {
      items = items.filter(item => item.platform === platform);
    }

    // 按物品类型过滤
    if (itemType) {
      items = items.filter(item => item.itemType === itemType);
    }

    // 排序
    if (sortBy) {
      items.sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return (a.price.cash || a.price.gameCoins || 0) - (b.price.cash || b.price.gameCoins || 0);
          case 'price_desc':
            return (b.price.cash || b.price.gameCoins || 0) - (a.price.cash || a.price.gameCoins || 0);
          case 'listed_asc':
            return a.listedAt - b.listedAt;
          case 'listed_desc':
            return b.listedAt - a.listedAt;
          default:
            return 0;
        }
      });
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return { items: paginatedItems, total };
  }

  /**
   * 获取物品详情
   */
  async getItemDetails(itemId: string): Promise<MarketItem> {
    try {
      const items = this.loadFromStorage();
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error('物品不存在');
      }

      return item;
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  }

  /**
   * 上架物品到 AllinONE 交易市场
   * 
   * 业务逻辑：
   * 1. AllinONE 道具：直接从用户库存移除，上架到市场
   * 2. New Day 道具：调用 New Day API 扣除道具，然后在 AllinONE 市场上架
   * 
   * 注意：New Day 没有自己的交易市场，所有交易都在 AllinONE 完成
   */
  async listItem(
    request: ListingRequest,
    originalItemId?: string
  ): Promise<MarketItem> {
    try {
      const currentUser = crossPlatformAuthService.getCurrentUser();
      
      // 如果是 New Day 道具，先调用 New Day API 扣除道具
      if (request.platform === 'newday' && originalItemId) {
        console.log('🔔 上架 New Day 道具，先扣除 New Day 库存:', originalItemId);
        console.log('🔔 道具信息:', {
          name: request.name,
          itemType: request.itemType,
          originalItemId: originalItemId
        });
        
        // 调用 New Day API 扣除道具
        const deductResult = await newDayApiService.transferItem({
          itemId: originalItemId,
          targetPlatform: 'allinone', // 转移到 AllinONE
          quantity: 1,
        });

        console.log('📥 New Day transferItem 返回结果:', deductResult);

        if (!deductResult.success) {
          console.error('❌ 扣除 New Day 道具失败:', deductResult.message);
          throw new Error(`扣除 New Day 道具失败: ${deductResult.message || '未知错误'}`);
        }

        console.log('✅ New Day 道具已扣除:', originalItemId);
      } else {
        console.log('ℹ️ 不是 New Day 道具或没有 originalItemId，跳过扣除:', {
          platform: request.platform,
          originalItemId: originalItemId
        });
      }
      
      const newItem: MarketItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: request.name,
        description: request.description,
        platform: request.platform,
        itemType: request.itemType,
        imageUrl: request.imageUrl,
        price: request.price,
        sellerId: currentUser?.userId || 'unknown',
        sellerName: currentUser?.username || 'Unknown User',
        listedAt: Date.now(),
        expiresAt: request.expiresAt,
        // 保存原始道具ID，用于后续购买后转移回游戏
        originalItemId: originalItemId,
      };

      // 保存到本地存储
      const items = this.loadFromStorage();
      items.push(newItem);
      this.saveToStorage(items);

      console.log('✅ 物品上架成功:', newItem);
      return newItem;
    } catch (error) {
      console.error('Error listing item:', error);
      throw error;
    }
  }

  /**
   * 购买物品
   * 注意：New Day API 的购买端点可能不存在，使用本地 AllinONE 市场服务
   */
  async purchaseItem(request: PurchaseRequest): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    try {
      // 使用 AllinONE 本地用户ID（与 marketplaceService 保持一致）
      const userId = 'current-user-id';

      // 导入 AllinONE 市场服务
      const { marketplaceService } = await import('./marketplaceService');

      // 使用 AllinONE 本地市场服务购买
      await marketplaceService.purchaseItem(request.itemId, userId);

      return {
        success: true,
        transactionId: `local_${Date.now()}`,
        message: '购买成功'
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  /**
   * 获取库存（从 New Day 库存同步服务获取）
   */
  async getInventory(
    platform?: 'allinone' | 'newday'
  ): Promise<InventoryItem[]> {
    try {
      // 直接使用 New Day Inventory Sync Service 获取库存
      const inventory = await newDayInventorySyncService.getMergedInventory();
      
      console.log('✅ crossPlatformMarketService 获取库存:', {
        total: inventory.length,
        newday: inventory.filter(i => i.gameSource === 'newday').length,
        allinone: inventory.filter(i => i.gameSource === 'allinone').length
      });
      
      // 转换为 InventoryItem 格式
      const items: InventoryItem[] = inventory.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        platform: item.gameSource === 'newday' ? 'newday' : 'allinone',
        itemType: item.category || 'unknown',
        quantity: item.quantity || item.maxUses || 1,
        obtainedAt: item.obtainedAt ? new Date(item.obtainedAt).getTime() : Date.now(),
      }));

      // 按平台过滤
      if (platform) {
        return items.filter(item => item.platform === platform);
      }

      return items;
    } catch (error) {
      console.warn('Error fetching inventory:', error);
      return [];
    }
  }

  /**
   * 转移物品到外部游戏
   */
  async transferToExternalGame(
    itemId: string,
    targetPlatform: 'newday',
    quantity: number = 1
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.API_BASE}/market/cross-platform/transfer`,
        {
          method: 'POST',
          headers: crossPlatformAuthService.getAuthHeaders(),
          body: JSON.stringify({
            itemId,
            targetPlatform,
            quantity,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to transfer item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error transferring item:', error);
      throw error;
    }
  }

  /**
   * 取消上架
   */
  async cancelListing(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      const items = this.loadFromStorage();
      const index = items.findIndex(item => item.id === itemId);
      
      if (index === -1) {
        throw new Error('物品不存在');
      }

      // 从列表中移除
      items.splice(index, 1);
      this.saveToStorage(items);

      console.log('✅ 物品下架成功:', itemId);
      return { success: true, message: '物品已成功下架' };
    } catch (error) {
      console.error('Error canceling listing:', error);
      throw error;
    }
  }

  /**
   * 获取用户余额（从跨平台钱包服务获取）
   */
  async getUserBalance(): Promise<CurrencyType> {
    try {
      const { crossPlatformWalletService } = await import('./crossPlatformWalletService');
      return await crossPlatformWalletService.getBalance();
    } catch (error) {
      console.error('Error fetching user balance:', error);
      // 返回默认余额
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
   * 搜索物品
   */
  async searchItems(
    keyword: string,
    platform?: 'allinone' | 'newday'
  ): Promise<MarketItem[]> {
    try {
      let items = this.loadFromStorage();
      
      // 按关键词过滤
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(lowerKeyword) ||
          item.description.toLowerCase().includes(lowerKeyword)
        );
      }
      
      // 按平台过滤
      if (platform) {
        items = items.filter(item => item.platform === platform);
      }

      return items;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * 获取物品类型列表
   */
  async getItemTypes(platform?: 'allinone' | 'newday'): Promise<string[]> {
    try {
      let items = this.loadFromStorage();
      
      // 按平台过滤
      if (platform) {
        items = items.filter(item => item.platform === platform);
      }
      
      // 提取唯一的物品类型
      const types = [...new Set(items.map(item => item.itemType))];
      return types;
    } catch (error) {
      console.error('Error fetching item types:', error);
      throw error;
    }
  }
}

// 导出单例
export const crossPlatformMarketService = new CrossPlatformMarketService();
