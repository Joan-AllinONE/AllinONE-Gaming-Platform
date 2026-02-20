# AllinONE 库存 API 修复总结

## 问题描述

AllinONE 团队调用 New Day 的 `/api/allinone/inventory` 端点获取用户库存时，返回的道具数量不正确：
- **实际用户库存**：9 个道具
- **API 返回数量**：1 个道具

## 问题根源

New Day 的道具存储在两个不同的数据库表中：

1. **`adventureItems` 表**：游戏内获得的道具（通过冒险、任务等获得）
2. **`userInventories` 表**：AllinONE 集成相关的道具（通过 AllinONE 市场购买）

原始 API 只查询 `userInventories` 表，导致只能看到 AllinONE 相关的道具，而游戏内的道具（存储在 `adventureItems` 表）无法被 AllinONE 获取。

## 解决方案

修改 `/api/allinone/inventory` API，使其同时查询两个表并合并结果：

### 修改内容

#### 1. 新增 `getAdventureItems` 函数
```typescript
/**
 * 从 adventureItems 表获取道具
 * 这些是游戏内获得的道具
 */
async function getAdventureItems(userId: string): Promise<InventoryItem[]> {
  const db = await getDb();

  const items = await db
    .select()
    .from(adventureItems)
    .where(
      and(
        eq(adventureItems.playerId, userId),
        eq(adventureItems.isPurchased, true),
        eq(adventureItems.isUsed, false)
      )
    )
    .orderBy(desc(adventureItems.createdAt));

  return items.map(item => ({
    id: item.id,
    name: item.itemName,
    description: item.itemDescription,
    type: "consumable",
    rarity: "common",
    stats: safeParseEffects(item.effects),
    obtainedAt: new Date(item.createdAt || Date.now()).getTime(),
    quantity: 1,
    userId: userId,
  }));
}
```

#### 2. 修改 `handleGetInventory` 函数
```typescript
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

    console.log(`[AllinONE 库存] 查询用户 ${token.userId} 的库存`);

    // 并行查询两个表的道具
    const [adventureItems, userInventoryItems] = await Promise.all([
      getAdventureItems(token.userId),
      getUserInventoryItems(token.userId),
    ]);

    console.log(`[AllinONE 库存] adventureItems: ${adventureItems.length}, userInventoryItems: ${userInventoryItems.length}`);

    // 合并并去重
    const allItems = mergeAndDeduplicateItems([
      ...adventureItems,
      ...userInventoryItems,
    ]);

    console.log(`[AllinONE 库存] 合并后总道具数: ${allItems.length}`);

    return Response.json({
      success: true,
      items: allItems,
      total: allItems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取库存错误:', error);
    return Response.json(
      { success: false, message: '获取库存失败' },
      { status: 500 }
    );
  }
}
```

#### 3. 新增 `mergeAndDeduplicateItems` 函数
```typescript
/**
 * 合并去重道具列表
 * 按 itemId 去重，保留最新的道具
 */
function mergeAndDeduplicateItems(items: InventoryItem[]): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    // 使用 itemId 作为去重键
    const key = item.id;
    const existing = itemMap.get(key);

    // 如果不存在，或者当前道具更新（obtainedAt 更大），则替换
    if (!existing || item.obtainedAt > existing.obtainedAt) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => b.obtainedAt - a.obtainedAt);
}
```

## 修复后的 API 行为

### 请求

```bash
curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nd_token_xxxxx"
```

### 响应

```json
{
  "success": true,
  "items": [
    {
      "id": "item_001",
      "name": "道具名称",
      "description": "道具描述",
      "type": "consumable",
      "rarity": "common",
      "stats": {},
      "obtainedAt": 1234567890,
      "quantity": 1,
      "userId": "user_123"
    },
    // ... 更多道具（所有道具）
  ],
  "total": 9,
  "timestamp": "2026-02-08T11:30:38.986Z"
}
```

## 功能特点

1. **并行查询**：使用 `Promise.all` 并行查询两个表，提高性能
2. **智能合并**：合并两个表的道具，并按道具 ID 去重
3. **实时同步**：直接从数据库读取，确保数据实时同步
4. **完整返回**：返回所有道具，不限制数量
5. **详细日志**：添加了详细的日志输出，便于调试

## 测试步骤

1. **使用相同的 token 调用 API**
   ```bash
   curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer nd_token_xxxxx"
   ```

2. **验证响应**
   - HTTP 状态码应为 200
   - `success` 应为 `true`
   - `items` 数组应包含所有道具（9 个）
   - `total` 应该等于 9
   - 每个道具应包含 `id`, `name`, `description`, `type`, `rarity`, `quantity`, `obtainedAt` 字段

3. **验证道具内容**
   - 确认返回的道具与 New Day 游戏中实际显示的道具一致
   - 确认道具数量、名称、类型等信息正确

## 数据库表说明

### adventureItems 表
- **用途**：存储游戏内获得的道具
- **字段**：
  - `id`: 道具 ID
  - `playerId`: 玩家 ID
  - `adventureId`: 冒险 ID
  - `itemName`: 道具名称
  - `itemDescription`: 道具描述
  - `itemIcon`: 道具图标
  - `isPurchased`: 是否已购买
  - `isUsed`: 是否已使用
  - `effects`: 道具效果
  - `createdAt`: 创建时间

### userInventories 表
- **用途**：存储 AllinONE 集成相关的道具
- **字段**：
  - `id`: 记录 ID
  - `userId`: 用户 ID
  - `itemId`: 道具 ID
  - `itemName`: 道具名称
  - `itemDescription`: 道具描述
  - `itemIcon`: 道具图标
  - `quantity`: 数量
  - `obtainedFrom`: 获得来源
  - `obtainedAt`: 获得时间

## 注意事项

1. **去重逻辑**：如果同一道具有多个记录，会保留最新的记录（按 `obtainedAt` 排序）
2. **性能优化**：使用并行查询提高性能
3. **实时性**：数据直接从数据库读取，确保实时同步
4. **日志输出**：添加了详细的日志，便于监控和调试

## 文件修改清单

- ✅ `src/lib/allinone/inventory.ts` - 修改库存查询逻辑

---

**修复时间**：2026-02-08
**修复人员**：New Day 团队
**状态**：已完成
