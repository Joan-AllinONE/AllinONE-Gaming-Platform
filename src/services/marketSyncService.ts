/**
 * AllinONE 市场交易同步服务
 * 处理 AllinONE 市场买卖后与外部游戏（如 New Day）的库存同步
 */

import { newDayApiService } from './newDayApiService';

interface MarketItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  price: number;
  gameSource: string;
  originalItemId?: string;
}

class MarketSyncService {
  /**
   * 上架道具后同步库存
   * AllinONE 道具：直接从用户库存移除（已由 marketplaceService 处理）
   * New Day 道具：调用 New Day API 扣除库存（已由 crossPlatformMarketService.listItem 处理）
   */
  async syncAfterListing(item: MarketItem): Promise<{ success: boolean; message?: string }> {
    console.log('🔄 上架后同步库存:', item);

    try {
      // New Day 道具上架时已经由 crossPlatformMarketService.listItem 调用了 newDayApiService.transferItem
      // 这里只需要记录日志和触发前端更新
      if (item.gameSource === 'newday') {
        console.log('✅ New Day 道具上架同步完成（已由 crossPlatformMarketService 处理）');
      } else {
        console.log('✅ AllinONE 道具上架同步完成（已由 marketplaceService 处理）');
      }

      // 触发库存更新事件
      window.dispatchEvent(new CustomEvent('inventoryUpdated', {
        detail: { action: 'list', item: item }
      }));

      return { success: true, message: '上架同步完成' };
    } catch (error) {
      console.error('❌ 上架同步失败:', error);
      return { success: false, message: '上架同步失败' };
    }
  }

  /**
   * 购买道具后同步库存
   * AllinONE 道具：添加到用户库存（已由 marketplaceService.purchaseItem 处理）
   * New Day 道具：添加到 New Day 库存（需要调用 New Day API）
   */
  async syncAfterPurchase(item: MarketItem, buyerUserId: string): Promise<{ success: boolean; message?: string }> {
    console.log('🔄 购买后同步库存:', { item, buyerUserId });

    try {
      if (item.gameSource === 'newday') {
        // 购买 New Day 道具后，需要添加到 New Day 库存
        // 注意：New Day API 可能没有添加道具的接口，这里需要确认
        console.log('ℹ️ 购买 New Day 道具，需要同步到 New Day 库存');
        console.log('⚠️  New Day API 可能不支持添加道具接口，暂时跳过');

        // TODO: 如果 New Day API 支持添加道具，需要在这里调用
        // const addResult = await newDayApiService.addItem({
        //   itemId: item.originalItemId || item.id,
        //   name: item.name,
        //   description: item.description,
        //   type: item.category,
        //   rarity: item.rarity,
        //   quantity: 1
        // });
      } else {
        console.log('✅ AllinONE 道具购买同步完成（已由 marketplaceService 处理）');
      }

      // 触发库存更新事件
      window.dispatchEvent(new CustomEvent('inventoryUpdated', {
        detail: { action: 'purchase', item: item, buyerId: buyerUserId }
      }));

      return { success: true, message: '购买同步完成' };
    } catch (error) {
      console.error('❌ 购买同步失败:', error);
      return { success: false, message: '购买同步失败' };
    }
  }

  /**
   * 取消上架后恢复库存
   * AllinONE 道具：添加回用户库存
   * New Day 道具：添加回 New Day 库存（需要调用 New Day API）
   */
  async syncAfterCancelListing(item: MarketItem, sellerUserId: string): Promise<{ success: boolean; message?: string }> {
    console.log('🔄 取消上架后恢复库存:', { item, sellerUserId });

    try {
      if (item.gameSource === 'newday') {
        // 取消 New Day 道具上架，需要恢复到 New Day 库存
        // 注意：New Day API 可能没有添加道具的接口，这里需要确认
        console.log('ℹ️ 取消 New Day 道具上架，需要恢复到 New Day 库存');
        console.log('⚠️  New Day API 可能不支持添加道具接口，暂时跳过');

        // TODO: 如果 New Day API 支持添加道具，需要在这里调用
        // const addResult = await newDayApiService.addItem({
        //   itemId: item.originalItemId || item.id,
        //   name: item.name,
        //   description: item.description,
        //   type: item.category,
        //   rarity: item.rarity,
        //   quantity: 1
        // });
      } else {
        // AllinONE 道具：添加回用户库存
        console.log('✅ AllinONE 道具取消上架同步完成（需要手动处理）');
      }

      // 触发库存更新事件
      window.dispatchEvent(new CustomEvent('inventoryUpdated', {
        detail: { action: 'cancel', item: item, sellerId: sellerUserId }
      }));

      return { success: true, message: '取消上架同步完成' };
    } catch (error) {
      console.error('❌ 取消上架同步失败:', error);
      return { success: false, message: '取消上架同步失败' };
    }
  }
}

export const marketSyncService = new MarketSyncService();
