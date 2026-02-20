/**
 * AllinONE 同步服务
 * 支持本地模拟同步和真实 API 同步两种模式
 */

import { newDayApiService } from './newDayApiService';
import { crossPlatformAuthService } from './crossPlatformAuthService';

// 同步模式
export type SyncMode = 'local' | 'real';

// 同步配置
interface SyncConfig {
  mode: SyncMode;
  apiBaseUrl: string;
  timeout: number;
  retryCount: number;
}

// 道具数据接口
export interface SyncItem {
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
  quantity: number;
  obtainedAt: number;
  source: 'newday' | 'allinone';
}

// 同步结果
export interface SyncResult {
  success: boolean;
  message: string;
  item?: SyncItem;
  syncId?: string;
  timestamp: number;
}

// 默认配置
const DEFAULT_CONFIG: SyncConfig = {
  mode: (import.meta.env.VITE_ALLINONE_SYNC_MODE as SyncMode) || 'local',
  apiBaseUrl: import.meta.env.VITE_ALLINONE_API_URL || 'https://yxp6y2qgnh.coze.site/api/allinone',
  timeout: 10000,
  retryCount: 3
};

class AllinONESyncService {
  private config: SyncConfig;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log(`📡 AllinONE Sync Service initialized (mode: ${this.config.mode})`);
  }

  /**
   * 同步购买的道具到 AllinONE
   * 根据配置自动选择本地模式或真实 API 模式
   */
  async syncPurchaseToAllinONE(
    userId: string,
    item: SyncItem
  ): Promise<SyncResult> {
    console.log(`🔄 Syncing purchase to AllinONE (mode: ${this.config.mode})...`);

    if (this.config.mode === 'real') {
      return await this.syncToRealAPI(userId, item);
    } else {
      return await this.syncToLocalMock(userId, item);
    }
  }

  /**
   * 本地模拟同步（用于测试）
   */
  private async syncToLocalMock(
    userId: string,
    item: SyncItem
  ): Promise<SyncResult> {
    try {
      console.log('💾 Local mock sync:', item.name);

      // 从 localStorage 读取现有库存
      const storageKey = `allinone_inventory_${userId}`;
      const existingData = localStorage.getItem(storageKey);
      let inventory: SyncItem[] = [];

      if (existingData) {
        inventory = JSON.parse(existingData);
      }

      // 检查是否已存在相同道具
      const existingIndex = inventory.findIndex(i => i.id === item.id);

      if (existingIndex >= 0) {
        // 更新数量
        inventory[existingIndex].quantity += item.quantity;
        inventory[existingIndex].obtainedAt = Date.now();
      } else {
        // 添加新道具
        inventory.push({
          ...item,
          obtainedAt: Date.now()
        });
      }

      // 保存到 localStorage
      localStorage.setItem(storageKey, JSON.stringify(inventory));

      // 触发同步事件
      window.dispatchEvent(new CustomEvent('allinoneSyncCompleted', {
        detail: {
          userId,
          item,
          mode: 'local',
          timestamp: Date.now()
        }
      }));

      console.log('✅ Local mock sync successful');

      return {
        success: true,
        message: '本地同步成功（模拟模式）',
        item,
        syncId: `local_${Date.now()}`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Local mock sync failed:', error);
      return {
        success: false,
        message: `本地同步失败: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 真实 API 同步（调用 AllinONE 后端）
   */
  private async syncToRealAPI(
    userId: string,
    item: SyncItem
  ): Promise<SyncResult> {
    let retries = 0;

    while (retries < this.config.retryCount) {
      try {
        console.log(`🌐 Real API sync (attempt ${retries + 1}):`, item.name);

        // 获取认证 token
        const token = crossPlatformAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // 调用 AllinONE API 添加道具到库存
        const response = await fetch(
          `${this.config.apiBaseUrl}/inventory/sync`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId,
              item: {
                id: item.id,
                name: item.name,
                description: item.description,
                type: item.type,
                rarity: item.rarity,
                stats: item.stats,
                quantity: item.quantity,
                source: item.source,
                obtainedAt: item.obtainedAt
              }
            }),
            signal: AbortSignal.timeout(this.config.timeout)
          }
        );

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('API returned non-JSON response');
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        // 触发同步事件
        window.dispatchEvent(new CustomEvent('allinoneSyncCompleted', {
          detail: {
            userId,
            item,
            mode: 'real',
            syncId: data.syncId,
            timestamp: Date.now()
          }
        }));

        console.log('✅ Real API sync successful:', data.syncId);

        return {
          success: true,
          message: '同步到 AllinONE 成功',
          item,
          syncId: data.syncId,
          timestamp: Date.now()
        };

      } catch (error) {
        retries++;
        console.warn(`⚠️ Sync attempt ${retries} failed:`, error);

        if (retries >= this.config.retryCount) {
          console.error('❌ Real API sync failed after all retries');

          // 降级到本地模式
          console.log('🔄 Falling back to local mock mode...');
          return await this.syncToLocalMock(userId, item);
        }

        // 等待后重试
        await this.delay(1000 * retries);
      }
    }

    return {
      success: false,
      message: '同步失败，已达到最大重试次数',
      timestamp: Date.now()
    };
  }

  /**
   * 批量同步道具
   */
  async syncBatchToAllinONE(
    userId: string,
    items: SyncItem[]
  ): Promise<SyncResult[]> {
    console.log(`🔄 Batch syncing ${items.length} items to AllinONE...`);

    const results: SyncResult[] = [];

    for (const item of items) {
      const result = await this.syncPurchaseToAllinONE(userId, item);
      results.push(result);

      // 添加小延迟避免请求过快
      if (this.config.mode === 'real') {
        await this.delay(100);
      }
    }

    console.log(`✅ Batch sync completed: ${results.filter(r => r.success).length}/${items.length} successful`);

    return results;
  }

  /**
   * 获取同步配置
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * 更新同步配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📡 Sync config updated:', this.config);
  }

  /**
   * 切换同步模式
   */
  setMode(mode: SyncMode): void {
    this.config.mode = mode;
    console.log(`🔄 Sync mode switched to: ${mode}`);
  }

  /**
   * 获取当前模式
   */
  getMode(): SyncMode {
    return this.config.mode;
  }

  /**
   * 验证 API 连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.config.mode === 'local') {
      return {
        success: true,
        message: '本地模式 - 无需连接测试'
      };
    }

    try {
      const token = crossPlatformAuthService.getToken();
      if (!token) {
        return {
          success: false,
          message: '未获取到认证 token'
        };
      }

      const response = await fetch(
        `${this.config.apiBaseUrl}/wallet/balance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: 'API 连接正常'
        };
      } else {
        return {
          success: false,
          message: `API 返回错误: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error}`
      };
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const allinoneSyncService = new AllinONESyncService();

// 导出类供自定义配置使用
export { AllinONESyncService };
