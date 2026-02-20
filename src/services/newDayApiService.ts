/**
 * New Day 游戏 API 服务
 * 直接调用 New Day 游戏的 API 端点
 */

import { MarketItem } from '@/types/marketplace';
import { crossPlatformAuthService } from './crossPlatformAuthService';

interface NewDayItem {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
  };
  obtainedAt: number;
  quantity: number;
}

interface NewDayMarketItem {
  id: string;
  name: string;
  description: string;
  platform: 'allinone' | 'newday';
  itemType: string;
  imageUrl?: string;
  price: {
    cash?: number;
    newDayGameCoins?: number;
    computingPower?: number;
  };
  sellerId: string;
  sellerName: string;
  listedAt: number;
}

interface NewDayBalance {
  cash: number;
  newDayGameCoins: number;      // New Day 游戏币（从 New Day 实时获取）
  computingPower: number;
}

class NewDayApiService {
  private readonly API_BASE = 'https://yxp6y2qgnh.coze.site/api/allinone';
  private token: string | null = null;

  /**
   * 获取 New Day 令牌
   */
  private async getToken(): Promise<string> {
    // 优先从 crossPlatformAuthService 获取 New Day 专用的 token
    const storedToken = crossPlatformAuthService.getNewDayToken();
    if (storedToken) {
      return storedToken;
    }

    // 如果没有存储的 token，尝试重新登录
    const allinoneUser = crossPlatformAuthService.getCurrentUser();
    if (!allinoneUser) {
      return '';
    }

    this.token = await crossPlatformAuthService.generateNewDayToken(allinoneUser);
    return this.token || '';
  }

  /**
   * 获取认证头
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    console.log('🔑 New Day API - Token used:', token ? `${token.substring(0, 30)}...` : 'EMPTY');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * 获取用户库存
   */
  async getInventory(): Promise<NewDayItem[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.API_BASE}/inventory`;
      console.log('🔍 调用 New Day 库存 API:', url);
      console.log('🔑 请求头:', headers);

      const response = await fetch(url, {
        headers,
      });

      console.log('📥 New Day 库存 API 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ New Day inventory API 失败:', response.status, errorText);
        return [];
      }

      const data = await response.json();
      console.log('📦 New Day API 返回原始数据:', data);
      console.log('📦 道具数量:', data.items?.length || 0);
      console.log('⚠️  预期应有 9 个道具，实际返回:', data.items?.length || 0);

      if (data.items && data.items.length < 9) {
        console.error('❌ New Day API 返回的道具数量不正确！预期 9 个，实际返回', data.items.length);
        console.error('   请检查 New Day 后端 /inventory 端点');
      }

      return data.items || [];
    } catch (error) {
      console.error('❌ 获取 New Day 库存异常:', error);
      return [];
    }
  }

  /**
   * 获取市场道具列表
   */
  async getMarketItems(params?: {
    platform?: 'allinone' | 'newday';
    itemType?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: NewDayMarketItem[]; total: number }> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (params?.platform) queryParams.append('platform', params.platform);
      if (params?.itemType) queryParams.append('itemType', params.itemType);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${this.API_BASE}/market/items?${queryParams.toString()}`,
        { headers }
      );

      if (!response.ok) {
        console.warn('New Day market API not available');
        return { items: [], total: 0 };
      }

      const data = await response.json();
      return {
        items: data.items || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.warn('Error fetching New Day market items:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * 上架道具到市场
   */
  async listItem(item: {
    name: string;
    description: string;
    platform: 'allinone' | 'newday';
    itemType: string;
    imageUrl?: string;
    price: {
      cash?: number;
      newDayGameCoins?: number;
      computingPower?: number;
    };
  }): Promise<NewDayMarketItem | null> {
    try {
      console.log('📤 上架道具到 New Day:', item);
      const headers = await this.getAuthHeaders();
      console.log('🔑 使用 Headers:', headers);

      const response = await fetch(`${this.API_BASE}/market/list`, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });

      console.log('📥 New Day 上架响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ New Day 上架 API 失败:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('✅ New Day 上架成功:', data);
      return data.item || null;
    } catch (error) {
      console.error('❌ 上架道具到 New Day 市场异常:', error);
      return null;
    }
  }

  /**
   * 购买道具
   */
  async purchaseItem(params: {
    itemId: string;
    currencyType: string;
    quantity?: number;
  }): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.API_BASE}/market/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        return { success: false, message: '购买失败' };
      }

      const data = await response.json();
      return {
        success: data.success || false,
        transactionId: data.transactionId,
        message: data.message,
      };
    } catch (error) {
      console.warn('Error purchasing item from New Day market:', error);
      return { success: false, message: '购买失败' };
    }
  }

  /**
   * 获取用户余额
   */
  async getBalance(): Promise<NewDayBalance> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('🔍 调用 New Day 余额 API:', `${this.API_BASE}/wallet/balance`);
      console.log('🔍 请求头:', headers);

      const response = await fetch(`${this.API_BASE}/wallet/balance`, {
        headers,
      });

      if (!response.ok) {
        console.warn('⚠️ New Day balance API 不可用:', response.status, response.statusText);
        return this.getEmptyBalance();
      }

      const data = await response.json();
      console.log('📥 New Day API 返回数据:', data);

      // 处理两种可能的数据格式: { balance: {...} } 或 直接的 {...}
      const balanceData = data.balance || data;

      // 确保返回正确的字段名（移除 aCoins）
      const result: NewDayBalance = {
        cash: balanceData.cash || 0,
        newDayGameCoins: balanceData.newDayGameCoins || 0,
        computingPower: balanceData.computingPower || 0,
      };

      console.log('✅ 解析后的 New Day 余额:', result);
      return result;
    } catch (error) {
      console.error('❌ 获取 New Day 余额失败:', error);
      return this.getEmptyBalance();
    }
  }

  /**
   * 转移道具到 AllinONE
   */
  async transferItem(params: {
    itemId: string;
    targetPlatform: 'allinone' | 'newday';
    quantity: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📤 调用 New Day transferItem API:', params);
      
      const headers = await this.getAuthHeaders();
      const url = `${this.API_BASE}/market/transfer`;
      console.log('📤 请求 URL:', url);
      console.log('📤 请求 Headers:', headers);
      console.log('📤 请求 Body:', JSON.stringify(params));
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      console.log('📥 New Day API 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ New Day API 返回错误:', response.status, errorText);
        return { success: false, message: `转移失败: ${response.status} ${errorText}` };
      }

      const data = await response.json();
      console.log('📥 New Day API 返回数据:', data);
      
      return {
        success: data.success || false,
        message: data.message,
      };
    } catch (error: any) {
      console.error('❌ Error transferring item from New Day:', error);
      return { success: false, message: `转移失败: ${error?.message || '未知错误'}` };
    }
  }

  /**
   * 获取空余额（只从 New Day API 获取，不提供虚拟数据）
   */
  private getEmptyBalance(): NewDayBalance {
    return {
      cash: 0,
      newDayGameCoins: 0,      // 从 New Day 实时获取
      computingPower: 0,
    };
  }

  /**
   * 添加道具到 New Day 库存
   * @param item 道具信息
   * @returns 同步结果
   */
  async addItemToNewDay(item: {
    itemId: string;
    name: string;
    description: string;
    itemType: string;  // New Day 已统一使用 'itemType'
    rarity: string;
    quantity: number;
    stats?: any;
    originalSource?: string;
    allinoneItemId?: string;
    icon?: string;
  }): Promise<{ success: boolean; message?: string; data?: any; errorCode?: string; errorDetail?: any }> {
    try {
      console.log('========================================');
      console.log('📤 添加道具到 New Day 游戏');
      console.log('========================================');
      console.log('请求数据:', JSON.stringify(item, null, 2));
      
      const headers = await this.getAuthHeaders();
      const url = `${this.API_BASE}/inventory/add`;
      
      console.log('请求 URL:', url);
      console.log('请求 Headers:', {
        ...headers,
        Authorization: headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : 'none'
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });

      console.log('========================================');
      console.log('📥 New Day API 响应');
      console.log('========================================');
      console.log('HTTP 状态:', response.status, response.statusText);
      console.log('响应 Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('原始响应:', responseText);

      if (!response.ok) {
        console.error('❌ New Day API 返回错误');
        console.error('状态码:', response.status);
        console.error('响应内容:', responseText);
        
        // 尝试解析错误信息
        let errorMessage = `添加失败: ${response.status}`;
        let errorCode = 'UNKNOWN_ERROR';
        let errorDetail = null;
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `添加失败: ${response.status}`;
          errorCode = errorData.errorCode || 'UNKNOWN_ERROR';
          errorDetail = errorData.errorDetail || null;
          
          // 根据错误码提供更友好的错误信息
          switch (errorCode) {
            case 'INVALID_TOKEN':
              errorMessage = '登录已过期，请重新登录';
              break;
            case 'INVALID_JSON':
              errorMessage = '请求格式错误，请检查道具数据';
              break;
            case 'MISSING_FIELDS':
              const missingFields = errorDetail?.missingFields || errorData.missingFields || [];
              errorMessage = `缺少必填字段: ${missingFields.join(', ') || '未知字段'}`;
              break;
            case 'INVALID_ITEM_TYPE':
              errorMessage = `无效的道具类型: ${errorDetail?.received || '未知'}。有效类型: ${errorDetail?.validTypes?.join(', ') || 'weapon, armor, consumable, material, accessory, tool'}`;
              break;
            case 'INVALID_RARITY':
              errorMessage = `无效的稀有度: ${errorDetail?.received || '未知'}。有效稀有度: ${errorDetail?.validRarities?.join(', ') || 'common, uncommon, rare, epic, legendary'}`;
              break;
            case 'INVALID_QUANTITY':
              errorMessage = '道具数量必须大于 0';
              break;
            case 'DATABASE_CONNECTION_ERROR':
            case 'QUERY_ERROR':
            case 'INSERT_ERROR':
              errorMessage = 'New Day 数据库错误，请稍后重试';
              break;
            case 'ITEM_ALREADY_EXISTS':
              errorMessage = 'ITEM_ALREADY_EXISTS';
              break;
            case 'SERVER_ERROR':
              errorMessage = 'New Day 服务器内部错误，请联系管理员';
              break;
            default:
              errorMessage = errorData.message || `添加失败: ${response.status}`;
          }
        } catch (e) {
          errorMessage = `添加失败: ${response.status} ${responseText}`;
        }
        
        return {
          success: false,
          message: errorMessage,
          errorCode: errorCode,
          errorDetail: errorDetail
        };
      }

      // 解析成功响应
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ 解析响应 JSON 失败:', e);
        return {
          success: false,
          message: '解析响应失败: ' + responseText
        };
      }
      
      console.log('✅ New Day 添加道具成功');
      console.log('响应数据:', JSON.stringify(data, null, 2));
      console.log('========================================');
      
      return {
        success: data.success || false,
        message: data.message,
        data: data.item
      };
    } catch (error: any) {
      console.error('========================================');
      console.error('❌ 添加道具到 New Day 异常');
      console.error('========================================');
      console.error('错误类型:', error.name);
      console.error('错误信息:', error.message);
      console.error('错误堆栈:', error.stack);
      console.error('========================================');
      
      return {
        success: false,
        message: error?.message || '网络错误'
      };
    }
  }

  /**
   * 转换 New Day 道具为 AllinONE 格式
   */
  convertNewDayItemToMarketItem(item: NewDayItem | NewDayMarketItem): MarketItem {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.type || item.itemType || 'unknown',
      rarity: item.rarity || 'common',
      price:
        (item as NewDayMarketItem).price?.computingPower ||
        (item as NewDayMarketItem).price?.newDayGameCoins ||
        (item as NewDayMarketItem).price?.cash ||
        0,
      sellerId: (item as NewDayMarketItem).sellerId || '',
      sellerName: (item as NewDayMarketItem).sellerName || '',
      listedAt: new Date(item.listedAt || item.obtainedAt),
      views: 0,
      gameSource: 'newday',
    };
  }
}

// 导出单例
export const newDayApiService = new NewDayApiService();
