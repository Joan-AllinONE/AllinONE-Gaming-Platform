/**
 * New Day 游戏库存 API
 * 管理用户道具库存
 */

import { verifyToken } from './auth';

interface InventoryItem {
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
  userId: string;
}

// 模拟库存数据库
export const userInventories = new Map<string, InventoryItem[]>();

/**
 * 同步购买到 AllinONE（模拟实现）
 * TODO: 实现真实的 AllinONE API 调用
 */
export async function syncPurchaseToAllinONE(
  userId: string,
  item: {
    id: string;
    name: string;
    description: string;
    type: string;
    rarity: string;
    stats?: any;
  }
): Promise<boolean> {
  try {
    // 这里可以调用真实的 AllinONE API
    // 目前先在本地库存中记录
    addItemToInventory(userId, {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      stats: item.stats,
      obtainedAt: Date.now(),
      quantity: 1,
    });

    console.log(`[AllinONE 同步] 道具购买已同步: ${item.name} (用户: ${userId})`);
    return true;
  } catch (error) {
    console.error("[AllinONE 同步] 同步失败:", error);
    return false;
  }
}

// 处理获取库存请求
export async function handleGetInventory(request: Request): Promise<Response> {
  try {
    // 验证令牌
    const token = verifyToken(request);
    if (!token) {
      return Response.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户库存
    const inventory = userInventories.get(token.userId) || [];

    return Response.json({
      success: true,
      items: inventory,
    });
  } catch (error) {
    console.error('获取库存错误:', error);
    return Response.json(
      { success: false, message: '获取库存失败' },
      { status: 500 }
    );
  }
}

// 添加道具到库存
export function addItemToInventory(
  userId: string,
  item: Omit<InventoryItem, 'userId'>
): void {
  const inventory = userInventories.get(userId) || [];
  inventory.push({
    ...item,
    userId,
  });
  userInventories.set(userId, inventory);
  console.log(`道具已添加到库存: ${item.name} (用户: ${userId})`);
}

// 从库存中移除道具
export function removeItemFromInventory(
  userId: string,
  itemId: string,
  quantity: number = 1
): boolean {
  const inventory = userInventories.get(userId);
  if (!inventory) return false;

  const itemIndex = inventory.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return false;

  const item = inventory[itemIndex];
  if (item.quantity > quantity) {
    item.quantity -= quantity;
  } else {
    inventory.splice(itemIndex, 1);
  }

  userInventories.set(userId, inventory);
  return true;
}

// 导出类型供其他模块使用
export type { InventoryItem };
