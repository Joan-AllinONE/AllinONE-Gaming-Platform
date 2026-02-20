# New Day 库存 API 同名道具显示问题 - 修复总结

## 问题描述

AllinONE 团队反馈：经过上次修复后，虽然不再有重复道具，但出现了新的问题：
- 玩家有 3 个"能量饮料"
- New Day 数据库中确实有 3 条记录
- 但 AllinONE 只显示 1 个"能量饮料"

### 问题原因

之前的修复方案使用道具名称（`item.name`）作为去重键，导致所有同名道具被合并成一条记录。

**原始逻辑（有问题）**：
```typescript
// ❌ 使用名称去重，导致同名道具被合并
const key = item.name;
const existing = itemMap.get(key);

if (!existing || item.obtainedAt > existing.obtainedAt) {
  itemMap.set(key, item);
}
```

**结果**：
- 3 个"能量饮料" → 只保留 1 个（获得时间最新的）
- 2 个"生命药水" → 只保留 1 个
- 用户看不到所有道具实例

## 用户需求

AllinONE 团队希望：
1. 每个道具实例都有唯一标识
2. 即使是同名的道具（如 3 个"能量饮料"），也应该在 AllinONE 中分别显示
3. 可以通过购买时间 + 道具名称生成唯一编号，或者使用数据库的原始 ID

## 解决方案

### 核心思路

**使用道具的原始 ID 作为唯一标识，而不是名称**

原因：
1. 数据库中每个记录都有唯一的 `id` 字段（UUID 格式）
2. 即使是同名的道具，它们在数据库中也有不同的 ID
3. 使用 ID 去重可以确保每个道具实例都被正确显示

### 实现方案

#### 1. 为每个表的 ID 添加表前缀

为了避免两个表的 ID 冲突，为每个表的 ID 添加唯一前缀：
- `adventureItems` 表的 ID 添加 `"adv-"` 前缀
- `userInventories` 表的 ID 添加 `"inv-"` 前缀

**示例**：
```typescript
// adventureItems 表
adv-550e8400-e29b-41d4-a716-446655440000

// userInventories 表
inv-6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

#### 2. 修改去重逻辑

使用 ID 作为去重键，而不是名称：

```typescript
function mergeAndDeduplicateItems(items: InventoryItem[]): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    // ✅ 使用原始 ID 作为去重键
    const key = item.id;
    const existing = itemMap.get(key);

    // 保留所有道具实例（不去重）
    if (!existing) {
      itemMap.set(key, item);
    }
  });

  const allItems = Array.from(itemMap.values()).sort((a, b) => b.obtainedAt - a.obtainedAt);

  console.log(`[AllinONE 合并] 总道具数: ${allItems.length}`);
  console.log(`[AllinONE 合并] 道具实例: ${allItems.map(i => `${i.name} (${i.id})`).join(', ')}`);

  return allItems;
}
```

#### 3. 修改获取道具的函数

**修改 `getAdventureItems` 函数**：
```typescript
return items.map(item => ({
  // ✅ 为 ID 添加表前缀，确保唯一性
  id: `adv-${item.id}`,
  name: item.itemName,
  description: item.itemDescription,
  type: "consumable",
  rarity: "common",
  stats: safeParseEffects(item.effects),
  obtainedAt: new Date(item.createdAt || Date.now()).getTime(),
  quantity: 1,
  userId: userId,
}));
```

**修改 `getUserInventoryItems` 函数**：
```typescript
return items.map(item => ({
  // ✅ 为 ID 添加表前缀，确保唯一性
  id: `inv-${item.id}`,
  name: item.itemName,
  description: item.itemDescription || "",
  type: 'consumable',
  rarity: 'common',
  obtainedAt: new Date(item.obtainedAt).getTime(),
  quantity: item.quantity || 1,
  userId: userId,
}));
```

#### 4. 修改验证逻辑

只检查 ID 是否重复（不应该重复），并统计同名道具数量：

```typescript
// 验证：检查是否有重复 ID（不应该重复）
const uniqueIds = new Set(allItems.map(item => item.id));

if (uniqueIds.size !== allItems.length) {
  console.error(`[AllinONE 库存] ❌ 检测到重复的道具 ID！`);
} else {
  console.log(`[AllinONE 库存] ✅ 道具 ID 验证通过，无重复`);
}

// 统计同名道具的数量（同名道具是允许的）
const nameCountMap = new Map<string, number>();
allItems.forEach(item => {
  const count = nameCountMap.get(item.name) || 0;
  nameCountMap.set(item.name, count + 1);
});

// 输出同名道具统计
const duplicateNames = Array.from(nameCountMap.entries())
  .filter(([_, count]) => count > 1)
  .map(([name, count]) => `${name} x${count}`);

if (duplicateNames.length > 0) {
  console.log(`[AllinONE 库存] 📦 同名道具统计: ${duplicateNames.join(', ')}`);
} else {
  console.log(`[AllinONE 库存] 📦 所有道具名称唯一`);
}
```

## 修复效果

### 修复前
- 玩家有 3 个"能量饮料"
- API 只返回 1 个"能量饮料"
- 用户看不到所有道具实例

### 修复后（预期）
- 玩家有 3 个"能量饮料"
- API 返回 3 个"能量饮料"（每个有不同的 ID）
- 用户可以看到所有道具实例

### API 响应示例

```json
{
  "success": true,
  "items": [
    {
      "id": "adv-550e8400-e29b-41d4-a716-446655440000",
      "name": "能量饮料",
      "description": "恢复体力",
      "type": "consumable",
      "rarity": "common",
      "stats": {},
      "obtainedAt": 1234567890,
      "quantity": 1,
      "userId": "user_123"
    },
    {
      "id": "adv-6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "能量饮料",
      "description": "恢复体力",
      "type": "consumable",
      "rarity": "common",
      "stats": {},
      "obtainedAt": 1234567895,
      "quantity": 1,
      "userId": "user_123"
    },
    {
      "id": "inv-7d444840-9dc0-11d1-b245-00c04fd430c8",
      "name": "能量饮料",
      "description": "恢复体力",
      "type": "consumable",
      "rarity": "common",
      "stats": {},
      "obtainedAt": 1234567900,
      "quantity": 1,
      "userId": "user_123"
    },
    // ... 其他道具
  ],
  "total": 12,
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

### 日志输出示例

```
[AllinONE 库存] 查询用户 user_123 的库存
[AllinONE 库存] adventureItems: 8, userInventoryItems: 4
[AllinONE 合并] 总道具数: 12
[AllinONE 合并] 道具实例: 能量饮料 (adv-550e8400), 能量饮料 (inv-6ba7b810), 生命药水 (adv-7d444840), ...
[AllinONE 库存] ✅ 道具 ID 验证通过，无重复
[AllinONE 库存] 📦 同名道具统计: 能量饮料 x3, 生命药水 x2
```

## 技术细节

### 为什么需要添加表前缀？

**问题**：虽然两个表的 `id` 字段都是 UUID，但理论上可能存在冲突（虽然概率极低）。

**解决方案**：为每个表的 ID 添加表前缀，确保 100% 唯一：
- `adv-` 前缀表示来自 `adventureItems` 表
- `inv-` 前缀表示来自 `userInventories` 表

### 为什么使用 ID 去重而不是名称？

1. **唯一性**：数据库中每个记录都有唯一的 ID
2. **精确性**：ID 可以精确区分不同的道具实例
3. **符合需求**：用户希望看到所有道具实例，而不是合并后的结果

### React 的 key 冲突问题

现在每个道具都有唯一的 ID，不会再出现 `Warning: Encountered two children with the same key` 的警告。

AllinONE 前端可以使用 `item.id` 作为 React 列表的 key：
```jsx
{items.map(item => (
  <ItemCard key={item.id} item={item} />
))}
```

## 验证步骤

1. **调用 API 检查返回数量**
   ```bash
   curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer nd_token_xxxxx"
   ```

2. **验证响应**
   - `total` 应该等于实际道具数量（包括所有同名实例）
   - `items` 数组应该包含所有道具实例
   - 每个道具都有唯一的 `id`（带表前缀）
   - 没有重复的 `id`

3. **检查同名道具**
   ```javascript
   // 统计同名道具
   const nameCount = {};
   data.items.forEach(item => {
     nameCount[item.name] = (nameCount[item.name] || 0) + 1;
   });

   console.log('同名道具统计:', nameCount);
   // 例如: { "能量饮料": 3, "生命药水": 2, ... }
   ```

4. **检查 React 警告**
   - 打开浏览器控制台
   - 确认没有 `Warning: Encountered two children with the same key` 警告

## 文件修改清单

- ✅ `src/lib/allinone/inventory.ts`
  - 修改 `mergeAndDeduplicateItems` 函数：使用 ID 去重
  - 修改 `getAdventureItems` 函数：为 ID 添加 "adv-" 前缀
  - 修改 `getUserInventoryItems` 函数：为 ID 添加 "inv-" 前缀
  - 修改 `handleGetInventory` 函数：更新验证逻辑，统计同名道具

## 注意事项

1. **ID 格式变化**：所有道具的 ID 现在都带有表前缀（`adv-` 或 `inv-`）
2. **同名道具**：同名道具是允许的，每个实例都有唯一的 ID
3. **React Key**：AllinONE 前端应使用 `item.id` 作为列表的 key
4. **向后兼容**：如果其他地方依赖旧的 ID 格式，需要相应调整

---

**修复时间**：2026-02-08
**修复人员**：New Day 团队
**状态**：已完成
**测试状态**：类型检查通过，服务正常运行，等待 AllinONE 团队验证
