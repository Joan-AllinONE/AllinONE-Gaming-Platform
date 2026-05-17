/**
 * AllinONE Skill 系统 - Inventory 向后兼容层
 * 保持原有的 inventoryApiService API 不变，内部使用 InventorySkill
 */

import { skillGateway, authSkill, inventorySkill } from '../index';
import { InventoryItem, SyncResult } from '../inventory/InventorySkill';

// 保持原有的接口定义
export interface InventoryItemLegacy {
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

export interface SyncResultLegacy {
  success: boolean;
  synced?: number;
  added?: number;
  updated?: number;
  duration?: string;
  message?: string;
  error?: string;
}

// 全局注册锁，防止重复注册
let registrationPromise: Promise<void> | null = null;

/**
 * 确保依赖的 Skills 已按正确顺序注册
 */
async function ensureSkillsRegistered(): Promise<void> {
  if (registrationPromise) {
    return registrationPromise;
  }

  registrationPromise = (async () => {
    // 1. 首先注册 auth Skill（inventory 依赖它）
    if (!skillGateway.getSkill('auth')) {
      try {
        await skillGateway.registerSkill(authSkill);
        console.log('[InventoryCompat] authSkill 注册成功');
      } catch (error) {
        console.warn('[InventoryCompat] authSkill 注册失败:', error);
      }
    }

    // 2. 然后注册 inventory Skill
    if (!skillGateway.getSkill('inventory')) {
      try {
        await skillGateway.registerSkill(inventorySkill);
        console.log('[InventoryCompat] inventorySkill 注册成功');
      } catch (error) {
        console.warn('[InventoryCompat] inventorySkill 注册失败:', error);
      }
    }
  })();

  return registrationPromise;
}

/**
 * 库存 API 服务兼容层
 */
class InventoryApiServiceCompat {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    // 构造函数中不阻塞，立即触发异步注册
    ensureSkillsRegistered().catch(console.error);
  }

  /**
   * 获取当前用户信息
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
    let token = localStorage.getItem('token');
    let userId = null;
    
    if (!token) {
      const newDayToken = localStorage.getItem('newday_token');
      if (newDayToken) {
        const user = this.getCurrentUser();
        userId = user?.userId || '1';
        token = `user-${userId}_${newDayToken}`;
      }
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * 通用请求方法（保持原有逻辑）
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${endpoint}`;
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
  }): Promise<{ items: InventoryItemLegacy[]; pagination: any }> {
    await ensureSkillsRegistered();
    const response = await skillGateway.execute<{ items: InventoryItem[]; total: number; page: number; limit: number }>(
      'inventory',
      'getItems',
      {
        gameSource: params?.gameSource,
        category: params?.category,
        rarity: params?.rarity,
        page: params?.page,
        limit: params?.limit,
      }
    );

    if (!response.success) {
      throw new Error(response.error?.message || '获取库存失败');
    }

    // 转换为原有格式
    const items: InventoryItemLegacy[] = (response.data?.items || []).map(item => ({
      id: item.id,
      item_id: item.itemId,
      user_id: item.userId,
      name: item.name,
      description: item.description,
      game_source: item.gameSource as any,
      game_name: item.gameName,
      category: item.category,
      rarity: item.rarity,
      icon: item.icon,
      stats: item.stats,
      quantity: item.quantity,
      obtained_at: item.obtainedAt.toISOString(),
      obtained_from: item.obtainedFrom,
      sync_status: item.syncStatus,
    }));

    return {
      items,
      pagination: {
        page: response.data?.page || 1,
        limit: response.data?.limit || 20,
        total: response.data?.total || 0,
      },
    };
  }

  /**
   * 获取库存汇总统计
   */
  async getInventorySummary(): Promise<{ byGame: any[]; total: any }> {
    await ensureSkillsRegistered();
    const response = await skillGateway.execute('inventory', 'getSummary');

    if (!response.success) {
      throw new Error(response.error?.message || '获取汇总失败');
    }

    const data = response.data as any;
    return {
      byGame: data.byGame || [],
      total: {
        items: data.total,
        quantity: data.totalQuantity,
      },
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
  }): Promise<InventoryItemLegacy> {
    await ensureSkillsRegistered();
    const response = await skillGateway.execute<InventoryItem>('inventory', 'addItem', {
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      gameSource: item.gameSource,
      gameName: item.gameName || item.gameSource,
      category: item.category || 'general',
      rarity: item.rarity,
      icon: item.icon,
      stats: item.stats,
      quantity: item.quantity || 1,
      obtainedFrom: item.obtainedFrom,
      originalItemId: item.originalItemId,
    });

    if (!response.success) {
      throw new Error(response.error?.message || '添加道具失败');
    }

    const newItem = response.data!;
    return {
      id: newItem.id,
      item_id: newItem.itemId,
      user_id: newItem.userId,
      name: newItem.name,
      description: newItem.description,
      game_source: newItem.gameSource as any,
      game_name: newItem.gameName,
      category: newItem.category,
      rarity: newItem.rarity,
      icon: newItem.icon,
      stats: newItem.stats,
      quantity: newItem.quantity,
      obtained_at: newItem.obtainedAt.toISOString(),
      obtained_from: newItem.obtainedFrom,
      sync_status: newItem.syncStatus,
    };
  }

  /**
   * 全量同步库存
   */
  async syncInventory(gameSource: string, items: any[]): Promise<SyncResultLegacy> {
    await ensureSkillsRegistered();
    const response = await skillGateway.execute<SyncResult>('inventory', 'sync', {
      gameSource,
      items: items.map(item => ({
        itemId: item.item_id || item.itemId,
        name: item.name,
        quantity: item.quantity,
        ...item,
      })),
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || '同步失败',
      };
    }

    const result = response.data!;
    return {
      success: result.success,
      synced: result.synced,
      added: result.added,
      updated: result.updated,
      duration: `${result.duration}ms`,
      message: `同步完成：新增 ${result.added}，更新 ${result.updated}，失败 ${result.failed}`,
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
    await ensureSkillsRegistered();
    const response = await skillGateway.execute('inventory', 'updateSyncStatus', {
      itemId,
      syncStatus,
    });

    if (!response.success) {
      throw new Error(response.error?.message || '更新同步状态失败');
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
    await ensureSkillsRegistered();
    const response = await skillGateway.execute<{ syncStatus: string; syncedAt?: Date }>('inventory', 'getSyncStatus', {
      itemId,
    });

    if (!response.success) {
      return { success: false };
    }

    return {
      success: true,
      syncStatus: response.data?.syncStatus,
      syncedAt: response.data?.syncedAt?.toISOString(),
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
    await ensureSkillsRegistered();
    const response = await skillGateway.execute('inventory', 'removeItem', {
      itemId,
      quantity,
    });

    if (!response.success) {
      throw new Error(response.error?.message || '移除道具失败');
    }

    return true;
  }

  /**
   * 获取同步历史记录
   */
  async getSyncHistory(gameSource?: string, limit?: number): Promise<any[]> {
    // 这里简化处理，实际应该从后端获取
    console.log('[InventoryCompat] 获取同步历史:', { gameSource, limit });
    return [];
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
    await ensureSkillsRegistered();
    const response = await skillGateway.execute<{ success: any[]; failed: any[] }>('inventory', 'addItems', {
      items: items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        gameSource: item.gameSource,
        quantity: item.quantity || 1,
        ...item,
      })),
    });

    if (!response.success) {
      return { success: 0, failed: items.length };
    }

    return {
      success: response.data?.success.length || 0,
      failed: response.data?.failed.length || 0,
    };
  }
}

// 导出兼容层实例（保持原有导出名称）
export const inventoryApiService = new InventoryApiServiceCompat();
export default inventoryApiService;
