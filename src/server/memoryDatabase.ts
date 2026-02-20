/**
 * 内存数据库替代方案
 * 用于 CloudStudio 等无 PostgreSQL 环境
 * 数据仅在服务器运行期间保留
 */

interface InventoryItem {
  id: number;
  item_id: string;
  user_id: string;
  name: string;
  description: string;
  game_source: string;
  game_name: string;
  category: string;
  rarity: string;
  stats?: any;
  quantity: number;
  obtained_from: string;
  sync_status: string;
  obtained_at: Date;
  created_at: Date;
  updated_at: Date;
}

interface SyncLog {
  id: number;
  user_id: string;
  game_source: string;
  sync_type: string;
  items_synced: number;
  items_added: number;
  items_updated: number;
  items_removed: number;
  sync_status: string;
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  duration_ms: number;
}

class MemoryDatabase {
  private inventory: InventoryItem[] = [];
  private syncLogs: SyncLog[] = [];
  private idCounters = {
    inventory: 1,
    syncLog: 1
  };

  // ========== 库存操作 ==========
  
  async queryInventory(userId: string, options?: {
    gameSource?: string;
    category?: string;
    rarity?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: InventoryItem[]; total: number }> {
    let result = this.inventory.filter(item => item.user_id === userId);
    
    if (options?.gameSource) {
      result = result.filter(item => item.game_source === options.gameSource);
    }
    if (options?.category) {
      result = result.filter(item => item.category === options.category);
    }
    if (options?.rarity) {
      result = result.filter(item => item.rarity === options.rarity);
    }
    
    const total = result.length;
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      items: result.slice(start, end),
      total
    };
  }

  async findInventoryItem(userId: string, itemId: string, gameSource: string): Promise<InventoryItem | null> {
    return this.inventory.find(
      item => item.user_id === userId && item.item_id === itemId && item.game_source === gameSource
    ) || null;
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: this.idCounters.inventory++,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.inventory.push(newItem);
    console.log('[内存DB] 添加道具:', newItem.name, '用户:', item.user_id);
    return newItem;
  }

  async updateInventoryQuantity(id: number, quantity: number): Promise<void> {
    const item = this.inventory.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
      item.updated_at = new Date();
    }
  }

  async updateSyncStatus(itemId: string, userId: string, status: string): Promise<void> {
    const item = this.inventory.find(
      i => i.item_id === itemId && i.user_id === userId
    );
    if (item) {
      item.sync_status = status;
      item.updated_at = new Date();
      console.log('[内存DB] 更新同步状态:', itemId, '->', status);
    }
  }

  // ========== 统计操作 ==========
  
  async getInventorySummary(userId: string): Promise<any[]> {
    const userItems = this.inventory.filter(item => item.user_id === userId);
    const summary: Record<string, any> = {};
    
    userItems.forEach(item => {
      if (!summary[item.game_source]) {
        summary[item.game_source] = {
          user_id: userId,
          game_source: item.game_source,
          total_items: 0,
          total_quantity: 0,
          legendary_count: 0,
          epic_count: 0,
          rare_count: 0
        };
      }
      
      const s = summary[item.game_source];
      s.total_items++;
      s.total_quantity += item.quantity;
      
      if (item.rarity === 'legendary') s.legendary_count++;
      else if (item.rarity === 'epic') s.epic_count++;
      else if (item.rarity === 'rare') s.rare_count++;
    });
    
    return Object.values(summary);
  }

  // ========== 同步日志 ==========
  
  async addSyncLog(log: Omit<SyncLog, 'id'>): Promise<void> {
    this.syncLogs.push({
      ...log,
      id: this.idCounters.syncLog++
    });
  }

  // ========== 调试 ==========
  
  getStats(): { inventoryCount: number; syncLogCount: number } {
    return {
      inventoryCount: this.inventory.length,
      syncLogCount: this.syncLogs.length
    };
  }

  clear(): void {
    this.inventory = [];
    this.syncLogs = [];
    this.idCounters = { inventory: 1, syncLog: 1 };
  }
}

// 导出单例
export const memoryDB = new MemoryDatabase();
