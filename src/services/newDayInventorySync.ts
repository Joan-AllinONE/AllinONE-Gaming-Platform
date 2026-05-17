/**
 * New Day 库存同步服务
 * 用于 AllinONE 与 New Day 之间的库存同步
 * 使用后端数据库存储（方案 B）
 */

import { newDayService } from './newDayService';
import { newDayApiService } from './newDayApiService';
import { allinoneSyncService, SyncItem } from './allinoneSyncService';
import { crossPlatformAuthService } from './crossPlatformAuthService';
import { inventoryApiService } from './inventoryApiService';
import { InventoryItemLegacy as InventoryItem } from '@/skills/compat/inventoryCompat';

interface CrossGameInventoryItem {
  id: string;
  name: string;
  description: string;
  gameSource: 'allinone' | 'newday';
  gameName: string;
  category: string;
  rarity: string;
  icon?: string;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
  };
  uses?: number;
  maxUses?: number;
  obtainedAt: Date;
  syncStatus?: 'not_synced' | 'syncing' | 'synced' | 'failed';
  syncedAt?: Date;
}

class NewDayInventorySyncService {
  /**
   * 从 New Day API 获取库存
   */
  async fetchFromNewDay(): Promise<CrossGameInventoryItem[]> {
    try {
      console.log('🔄 开始从 New Day API 获取库存...');
      const apiItems = await newDayApiService.getInventory();

      console.log('📦 New Day API 返回道具数量:', apiItems.length);

      if (apiItems.length === 0) {
        console.warn('⚠️  New Day API 返回空库存，请检查：');
        console.warn('  1. New Day 游戏是否有道具');
        console.warn('  2. New Day API 认证是否正常');
        console.warn('  3. New Day API 端点是否正确');
      }

      const items: CrossGameInventoryItem[] = apiItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        gameSource: 'newday',
        gameName: 'New Day',
        category: item.type,
        rarity: item.rarity,
        icon: item.stats ? 'fa-box' : 'fa-gift',
        stats: item.stats,
        uses: item.quantity > 1 ? 1 : undefined,
        maxUses: item.quantity > 1 ? item.quantity : undefined,
        obtainedAt: new Date(item.obtainedAt)
      }));

      console.log('✅ 从 New Day 获取库存完成:', items.length, '个道具');
      console.log('📋 道具列表:', items.map(i => ({ id: i.id, name: i.name })));

      // 验证 ID 唯一性
      const idSet = new Set(items.map(i => i.id));
      if (idSet.size !== items.length) {
        console.warn(`⚠️  检测到重复 ID！总道具: ${items.length}, 唯一ID: ${idSet.size}`);
      } else {
        console.log('✅ 所有道具 ID 都是唯一的');
      }

      // 统计同名道具
      const nameCount: Record<string, number> = {};
      items.forEach(item => {
        nameCount[item.name] = (nameCount[item.name] || 0) + 1;
      });
      const duplicateNames = Object.entries(nameCount).filter(([_, count]) => count > 1);
      if (duplicateNames.length > 0) {
        console.log('📊 同名道具统计:', duplicateNames.map(([name, count]) => `${name} x${count}`).join(', '));
      }

      return items;
    } catch (error) {
      console.error('❌ 从 New Day 获取库存失败:', error);
      return [];
    }
  }

  /**
   * 获取 AllinONE 库存（从后端数据库）
   */
  async fetchLocalInventory(): Promise<CrossGameInventoryItem[]> {
    try {
      // 从后端 API 获取库存（替代 localStorage）
      const { items } = await inventoryApiService.getInventory();

      console.log('✅ 从 AllinONE 数据库获取库存:', items.length, '个道具');
      console.log('📋 AllinONE 数据库道具详情:', items.map((item: InventoryItem) => ({
        id: item.item_id,
        name: item.name,
        game_source: item.game_source,
        game_name: item.game_name,
        sync_status: item.sync_status,
      })));

      // 转换为 CrossGameInventoryItem 格式
      return items.map((item: InventoryItem) => ({
        id: item.item_id,
        name: item.name,
        description: item.description,
        gameSource: item.game_source as 'allinone' | 'newday',
        gameName: item.game_name,
        category: item.category,
        rarity: item.rarity,
        icon: item.icon,
        stats: item.stats,
        quantity: item.quantity,
        maxUses: item.quantity,
        obtainedAt: new Date(item.obtained_at),
        syncStatus: item.sync_status as 'not_synced' | 'syncing' | 'synced' | 'failed' | undefined,
      }));
    } catch (error) {
      console.error('❌ 获取 AllinONE 库存失败:', error);
      // 降级到空数组，不阻断流程
      return [];
    }
  }

  /**
   * 获取合并后的跨游戏库存
   * New Day 道具完全以 New Day API 实时数据为准
   * 官方商店购买的 New Day 道具通过 marketplace 库存系统管理
   */
  async getMergedInventory(): Promise<CrossGameInventoryItem[]> {
    try {
      // 1. 从 New Day API 获取实时数据
      const newDayItems = await this.fetchFromNewDay();

      // 2. 从 AllinONE 数据库获取道具（包含官方商店购买的 New Day 道具）
      const allAllinoneItems = await this.fetchLocalInventory();

      console.log('✅ 获取合并库存:', {
        newDay: newDayItems.length,
        allinone: allAllinoneItems.length,
        total: newDayItems.length + allAllinoneItems.length
      });

      // 合并库存：New Day 道具（API） + AllinONE 道具（数据库，包含官方商店购买的）
      return [...newDayItems, ...allAllinoneItems];
    } catch (error) {
      console.error('❌ 获取合并库存失败:', error);
      throw error;
    }
  }

  /**
   * 保存道具到 AllinONE 库存（后端数据库）
   */
  private async saveToLocalInventory(item: CrossGameInventoryItem): Promise<void> {
    try {
      // 使用后端 API 添加/更新道具（替代 localStorage）
      await inventoryApiService.addItem({
        itemId: item.id,
        name: item.name,
        description: item.description,
        gameSource: 'allinone',
        gameName: 'AllinONE',
        category: item.category,
        rarity: item.rarity,
        stats: item.stats,
        quantity: item.maxUses || 1,
        obtainedFrom: 'sync',
      });
      
      console.log('✅ 道具已保存到 AllinONE 数据库:', item.name);
      
      // 触发库存更新事件
      window.dispatchEvent(new CustomEvent('inventoryUpdated', { 
        detail: { updatedItem: item } 
      }));
    } catch (error) {
      console.error('❌ 保存到 AllinONE 库存失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 同步道具到 AllinONE（使用同步服务）
   */
  private async syncToAllinONE(item: CrossGameInventoryItem): Promise<void> {
    try {
      const user = crossPlatformAuthService.getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 转换为同步道具格式
      const syncItem: SyncItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.category,
        rarity: item.rarity,
        stats: item.stats,
        quantity: item.maxUses || 1,
        obtainedAt: Date.now(),
        source: 'newday'
      };

      // 使用同步服务
      const result = await allinoneSyncService.syncPurchaseToAllinONE(
        user.userId,
        syncItem
      );

      if (result.success) {
        console.log('✅ 道具同步到 AllinONE 成功:', result.message);
      } else {
        console.warn('⚠️ 道具同步到 AllinONE 失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 同步到 AllinONE 失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 从 New Day 购买并转移到 AllinONE
   */
  async purchaseAndTransfer(params: {
    itemId: string;
    currencyType: string;
    quantity?: number;
  }): Promise<{ success: boolean; item?: CrossGameInventoryItem; message?: string }> {
    try {
      // 1. 从 New Day 市场购买
      const purchaseResult = await newDayService.purchaseFromNewDayMarket(params);
      
      if (!purchaseResult.success) {
        throw new Error(purchaseResult.message || '购买失败');
      }
      
      // 2. 等待道具进入 New Day 库存
      await this.delay(1000); // 等待 1 秒
      
      // 3. 同步 New Day 库存
      const newDayItems = await this.fetchFromNewDay();
      
      // 4. 找到购买的道具
      const purchasedItem = newDayItems.find(i => i.id === params.itemId);
      
      if (!purchasedItem) {
        return { success: false, message: '在 New Day 库存中找不到购买的道具' };
      }
      
      // 5. 调用 New Day API 转移道具
      const transferResult = await newDayService.transferItemToAllinONE({
        itemId: params.itemId,
        quantity: params.quantity || 1
      });
      
      if (transferResult.success) {
        // 6. 将道具保存到 AllinONE 本地库存
        await this.saveToLocalInventory(purchasedItem);
        
        // 7. 同步到 AllinONE（本地或真实 API）
        await this.syncToAllinONE(purchasedItem);
        
        console.log('✅ 成功购买并转移道具:', purchasedItem.name);
        
        return {
          success: true,
          item: purchasedItem,
          message: '购买并同步到 AllinONE 成功'
        };
      }
      
      return { success: false, message: '转移失败' };
    } catch (error) {
      console.error('❌ 购买并转移道具失败:', error);
      throw error;
    }
  }

  /**
   * 将 AllinONE 道具上架到 New Day 市场
   */
  async listToNewDayMarket(item: CrossGameInventoryItem, price: {
    gameCoins?: number;
    cash?: number;
    computingPower?: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await newDayService.listItemToNewDayMarket({
        name: item.name,
        description: `[AllinONE] ${item.description}`,
        itemType: item.category,
        price: {
          gameCoins: price.gameCoins || 100,
          cash: price.cash,
          computingPower: price.computingPower
        }
      });
      
      if (result) {
        console.log('✅ 成功上架 AllinONE 道具到 New Day 市场:', item.name);
        return { success: true, message: '上架成功' };
      }
      
      return { success: false, message: '上架失败' };
    } catch (error) {
      console.error('❌ 上架到 New Day 市场失败:', error);
      throw error;
    }
  }

  /**
   * 筛选库存
   */
  filterInventory(
    items: CrossGameInventoryItem[],
    filter: {
      gameSource?: 'all' | 'allinone' | 'newday';
      category?: string;
      rarity?: string;
      keyword?: string;
    }
  ): CrossGameInventoryItem[] {
    let filtered = [...items];
    
    if (filter.gameSource && filter.gameSource !== 'all') {
      filtered = filtered.filter(item => item.gameSource === filter.gameSource);
    }
    
    if (filter.category) {
      filtered = filtered.filter(item => item.category === filter.category);
    }
    
    if (filter.rarity) {
      filtered = filtered.filter(item => item.rarity === filter.rarity);
    }
    
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      );
    }
    
    return filtered;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 全量同步 New Day 库存到 AllinONE 数据库
   * 注意：此方法已弃用，New Day 道具不再同步到 AllinONE 数据库
   * New Day 道具完全以 API 实时数据为准
   */
  async syncAllFromNewDay(): Promise<{ success: boolean; synced: number; message: string }> {
    console.warn('⚠️  syncAllFromNewDay 已弃用，New Day 道具不再同步到 AllinONE 数据库');
    console.warn('⚠️  New Day 道具完全以 API 实时数据为准');

    return {
      success: true,
      synced: 0,
      message: '已弃用：New Day 道具不再同步到数据库'
    };
  }

  /**
   * 初始化库存同步
   * 修改：New Day 道具完全以 New Day API 实时数据为准，不存储到 AllinONE 数据库
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 初始化 New Day 库存同步...');

      // New Day 道具直接从 API 获取实时数据，不存储到数据库
      const newDayItems = await this.fetchFromNewDay();

      console.log('📦 初始化完成（New Day API 实时数据）:', {
        newDay: newDayItems.length,
        note: 'New Day 道具以 API 实时数据为准，不存储到 AllinONE 数据库'
      });

      console.log('✅ New Day 库存同步初始化完成');
    } catch (error) {
      console.error('❌ 初始化 New Day 库存同步失败:', error);
    }
  }

  /**
   * 自动同步库存
   * 修改：不再执行全量同步，因为 New Day 道具以 API 实时数据为准
   */
  async autoSync(intervalMs: number = 30000): Promise<() => void> {
    console.log('⏰ 自动同步已禁用，New Day 道具以 API 实时数据为准');

    // 首次初始化
    await this.initialize();

    const intervalId = setInterval(async () => {
      try {
        console.log('🔄 定期刷新 New Day API 数据...');
        const newDayItems = await this.fetchFromNewDay();
        console.log(`✅ 刷新完成: ${newDayItems.length} 个 New Day 道具`);
      } catch (error) {
        console.error('刷新 New Day API 数据失败:', error);
      }
    }, intervalMs);

    // 返回停止自动同步的函数
    return () => {
      clearInterval(intervalId);
      console.log('⏹️ 停止定期刷新');
    };
  }

  /**
   * 手动触发全量同步（供用户界面调用）
   */
  async manualSync(): Promise<{ success: boolean; message: string }> {
    console.log('👆 用户手动触发同步...');
    const result = await this.syncAllFromNewDay();
    return {
      success: result.success,
      message: result.message
    };
  }

  /**
   * 从后端数据库获取合并库存
   * 直接查询数据库获取最新的库存数据
   */
  async getInventoryFromDatabase(): Promise<CrossGameInventoryItem[]> {
    try {
      const { items } = await inventoryApiService.getInventory();
      
      return items.map((item: InventoryItem) => ({
        id: item.item_id,
        name: item.name,
        description: item.description,
        gameSource: item.game_source as 'allinone' | 'newday',
        gameName: item.game_name,
        category: item.category,
        rarity: item.rarity,
        icon: item.icon,
        stats: item.stats,
        quantity: item.quantity,
        maxUses: item.quantity,
        obtainedAt: new Date(item.obtained_at),
        syncStatus: item.sync_status as 'not_synced' | 'syncing' | 'synced' | 'failed' | undefined,
      }));
    } catch (error) {
      console.error('❌ 从数据库获取库存失败:', error);
      return [];
    }
  }
}

export const newDayInventorySyncService = new NewDayInventorySyncService();
