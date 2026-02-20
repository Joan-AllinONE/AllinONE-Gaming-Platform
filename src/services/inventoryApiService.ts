/**
 * AllinONE 库存 API 服务
 * 与后端数据库交互，替代 localStorage 方案
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 道具接口
export interface InventoryItem {
  id: number;
  item_id: string;
  user_id: string;
  name: string;
  description: string;
  game_source: 'allinone' | 'newday';
  game_name: string;
  category: string;
  rarity: string;
  icon?: string;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
  };
  quantity: number;
  obtained_at: string;
  obtained_from: string;
  sync_status: string;
}

// 同步结果接口
export interface SyncResult {
  success: boolean;
  synced?: number;
  added?: number;
  updated?: number;
  duration?: string;
  message?: string;
  error?: string;
}

class InventoryApiService {
  /**
   * 获取当前用户信息 (使用 Login.tsx 存储的 currentUser)
   */
  private getCurrentUser(): { userId: string; username: string } | null {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          userId: user.id,
          username: user.username
        };
      }
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
    return null;
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders(): Record<string, string> {
    // 尝试多种方式获取 token
    let token = localStorage.getItem('token');
    let userId = null;
    
    // 如果没有 token，尝试从 New Day token 构建一个
    if (!token) {
      const newDayToken = localStorage.getItem('newday_token');
      if (newDayToken) {
        // 尝试获取用户信息
        const user = this.getCurrentUser();
        userId = user?.userId || '1'; // 默认用户ID
        // 使用 New Day token 格式构建 AllinONE token
        token = `user-${userId}_${newDayToken}`;
      }
    }
    
    console.log('🔑 Inventory API - Token used:', token ? token.substring(0, 40) + '...' : 'EMPTY');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取用户库存列表
   */
  async getInventory(params?: {
    gameSource?: string;
    category?: string;
    rarity?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: InventoryItem[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.gameSource) queryParams.set('gameSource', params.gameSource);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.rarity) queryParams.set('rarity', params.rarity);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>(`/inventory${query}`);
    
    return {
      items: response.data?.items || [],
      pagination: response.data?.pagination || {},
    };
  }

  /**
   * 获取库存汇总统计
   */
  async getInventorySummary(): Promise<{ byGame: any[]; total: any }> {
    const response = await this.request<any>('/inventory/summary');
    return {
      byGame: response.data?.byGame || [],
      total: response.data?.total || {},
    };
  }

  /**
   * 添加道具到库存
   */
  async addItem(item: {
    itemId: string;
    name: string;
    description?: string;
    gameSource: string;
    gameName?: string;
    category?: string;
    rarity?: string;
    icon?: string;
    stats?: any;
    quantity?: number;
    obtainedFrom?: string;
    originalItemId?: string;
    syncStatus?: 'not_synced' | 'syncing' | 'synced' | 'failed';
  }): Promise<InventoryItem> {
    const response = await this.request<any>('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response.data;
  }

  /**
   * 全量同步库存（从外部游戏如 New Day）
   */
  async syncInventory(gameSource: string, items: any[]): Promise<SyncResult> {
    const response = await this.request<any>('/inventory/sync', {
      method: 'POST',
      body: JSON.stringify({ gameSource, items }),
    });
    return {
      success: response.success,
      synced: response.data?.synced,
      added: response.data?.added,
      updated: response.data?.updated,
      duration: response.data?.duration,
      message: response.message,
    };
  }

  /**
   * 更新道具同步状态
   */
  async updateSyncStatus(
    itemId: string,
    syncStatus: 'not_synced' | 'syncing' | 'synced' | 'failed',
    syncedAt?: Date
  ): Promise<void> {
    const body: any = {
      syncStatus,
    };
    
    if (syncedAt) {
      body.syncedAt = syncedAt.toISOString();
    }
    
    const response = await this.request<any>(`/inventory/${itemId}/sync-status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    
    if (!response.success) {
      throw new Error(response.message || '更新同步状态失败');
    }
  }

  /**
   * 获取道具同步状态
   */
  async getSyncStatus(itemId: string): Promise<{
    success: boolean;
    syncStatus?: string;
    syncedAt?: string;
  }> {
    const response = await this.request<any>(`/inventory/${itemId}/sync-status`, {
      method: 'GET',
    });
    
    return {
      success: true,
      syncStatus: response.data?.syncStatus,
      syncedAt: response.data?.syncedAt,
    };
  }

  /**
   * 从库存中移除道具
   */
  async removeItem(
    itemId: string,
    gameSource: string,
    quantity?: number
  ): Promise<boolean> {
    const response = await this.request<any>(`/inventory/${itemId}`, {
      method: 'DELETE',
      body: JSON.stringify({ gameSource, quantity }),
    });
    return response.success;
  }

  /**
   * 获取同步历史记录
   */
  async getSyncHistory(gameSource?: string, limit?: number): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (gameSource) queryParams.set('gameSource', gameSource);
    if (limit) queryParams.set('limit', limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>(`/inventory/sync-history${query}`);
    return response.data || [];
  }

  /**
   * 批量添加道具
   */
  async addItems(items: Array<{
    itemId: string;
    name: string;
    gameSource: string;
    quantity?: number;
    [key: string]: any;
  }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await this.addItem(item);
        success++;
      } catch (error) {
        console.error('添加道具失败:', item.name, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

// 导出单例
export const inventoryApiService = new InventoryApiService();
