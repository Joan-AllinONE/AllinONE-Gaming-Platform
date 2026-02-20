# New Day 库存 API 重复道具问题 - 需求文档

## 问题描述

New Day 的 `/api/allinone/inventory` 端点返回了重复的道具数据，导致 AllinONE 前端显示重复的道具。

## 问题详情

### 环境信息
- **端点**: `https://yxp6y2qgnh.coze.site/api/allinone/inventory`
- **HTTP 方法**: GET
- **认证**: Bearer Token

### 实际现象

**New Day API 返回数据**:
- API 返回道具总数: 16 个
- 实际应有道具数量: 12 个
- **重复道具数量: 4 个**
- 问题: 存在重复道具 ID

**React 错误**:
```
Warning: Encountered two children with the same key, `1770596447478`
```

**控制台日志**:
```
📦 New Day API 返回原始数据: {success: true, items: Array(16), total: 16}
📦 道具数量: 16
⚠️  预期应有 12 个道具，实际返回: 16
```

### 数据示例

假设用户实际拥有以下 12 个道具：

| 序号 | 道具名称 | 来源 |
|------|---------|------|
| 1 | 能量饮料 | adventureItems 表 |
| 2 | 探险工具包 | adventureItems 表 |
| 3 | 生命药水 | adventureItems 表 |
| ... | ... | ... |
| 12 | 新购买的道具 | userInventories 表 |

**但 API 返回了 16 个**，其中有 4 个是重复的（同一个道具在两个表中都存在）。

## 问题分析

### 根本原因

New Day 后端从两个表获取道具数据时，**去重逻辑不完善**：

1. **`adventureItems` 表**: 存储游戏内获得的道具
2. **`userInventories` 表**: 存储 AllinONE 集成相关的道具

**问题**: 同一个道具可能同时存在于两个表中，但后端的 `mergeAndDeduplicateItems` 函数没有正确去重。

### 具体表现

- **实际道具数量**: 12 个
- **API 返回数量**: 16 个
- **重复道具数量**: 4 个

**重复的道具示例**（从 React 错误中获取）:
- `1770596447478` （出现多次）

**重复原因**:
当用户通过 AllinONE 购买道具时，该道具会同时记录在：
- `userInventories` 表（AllinONE 购买记录）
- `adventureItems` 表（游戏内道具记录）

但两个表中的记录可能有不同的 ID 格式，导致去重失败。

## 需求

### 优先级: P0 (紧急)

请 New Day 团队修复 `/api/allinone/inventory` 端点的去重逻辑。

### 修复要求

#### 1. 确保道具 ID 唯一性

**当前代码（有问题）**:
```typescript
function mergeAndDeduplicateItems(items: InventoryItem[]): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    // 使用 itemId 作为去重键
    const key = item.id;  // ❌ 可能有问题：不同表的 ID 格式可能不同
    const existing = itemMap.get(key);

    // 如果不存在，或者当前道具更新（obtainedAt 更大），则替换
    if (!existing || item.obtainedAt > existing.obtainedAt) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => b.obtainedAt - a.obtainedAt);
}
```

**问题分析**:
- `item.id` 可能不是唯一的去重键
- 两个表中的同一个道具可能有不同的 ID 格式
- 需要找到真正的唯一标识（如 `itemId` 或 `itemName`）

#### 2. 建议修复方案

**方案 A: 使用 itemName 去重（推荐）**

```typescript
function mergeAndDeduplicateItems(items: InventoryItem[]): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    // 使用道具名称作为去重键（假设同名道具是同一个）
    const key = item.name;  // ✅ 使用 name 作为唯一标识
    const existing = itemMap.get(key);

    // 如果不存在，或者当前道具更新（obtainedAt 更大），则替换
    if (!existing || item.obtainedAt > existing.obtainedAt) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => b.obtainedAt - a.obtainedAt);
}
```

**方案 B: 使用组合键去重**

```typescript
function mergeAndDeduplicateItems(items: InventoryItem[]): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    // 使用组合键：name + type + rarity
    const key = `${item.name}-${item.type}-${item.rarity}`;
    const existing = itemMap.get(key);

    // 如果不存在，或者当前道具更新（obtainedAt 更大），则替换
    if (!existing || item.obtainedAt > existing.obtainedAt) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => b.obtainedAt - a.obtainedAt);
}
```

**方案 C: 标准化 ID 后去重**

```typescript
function mergeAndDeduplicateItems(items: InventoryItem[]): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    // 标准化 ID：移除前缀，只保留数字部分
    const normalizedId = item.id.toString().replace(/^\D+/g, '');
    const key = normalizedId;
    const existing = itemMap.get(key);

    // 如果不存在，或者当前道具更新（obtainedAt 更大），则替换
    if (!existing || item.obtainedAt > existing.obtainedAt) {
      itemMap.set(key, item);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => b.obtainedAt - a.obtainedAt);
}
```

### 验证步骤

修复后，请按以下步骤验证：

1. **调用 API 检查返回数量**
   ```bash
   curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer nd_token_xxxxx"
   ```

2. **验证响应**
   - `total` 应该等于 12（实际道具数量，不是 16）
   - `items` 数组长度应该等于 12
   - 不应该有重复的 `id` 或 `name`

3. **检查去重效果**
   ```javascript
   // 验证没有重复 ID
   const ids = data.items.map(item => item.id);
   const uniqueIds = [...new Set(ids)];
   console.assert(ids.length === uniqueIds.length, '存在重复 ID');
   console.log(`总道具数: ${ids.length}, 唯一ID数: ${uniqueIds.length}`);
   
   // 验证没有重复名称
   const names = data.items.map(item => item.name);
   const uniqueNames = [...new Set(names)];
   console.assert(names.length === uniqueNames.length, '存在重复名称');
   console.log(`总道具数: ${names.length}, 唯一名称数: ${uniqueNames.length}`);
   ```

4. **对比 New Day 游戏内显示**
   - API 返回的道具列表应该与 New Day 游戏内显示的道具完全一致
   - 道具数量应该相同（12 个）
   - 道具名称和数量应该一致

## 数据库表结构参考

### adventureItems 表
```sql
CREATE TABLE adventureItems (
  id TEXT PRIMARY KEY,          -- 格式如: "adv_123" 或数字
  playerId TEXT,
  itemName TEXT,                -- 道具名称
  itemDescription TEXT,
  itemType TEXT,
  rarity TEXT,
  isPurchased BOOLEAN,
  isUsed BOOLEAN,
  createdAt TIMESTAMP
);
```

### userInventories 表
```sql
CREATE TABLE userInventories (
  id TEXT PRIMARY KEY,          -- 格式如: "inv_456" 或数字
  userId TEXT,
  itemId TEXT,                  -- 道具 ID
  itemName TEXT,                -- 道具名称
  itemDescription TEXT,
  quantity INTEGER,
  obtainedAt TIMESTAMP
);
```

## 注意事项

1. **ID 格式不一致**: 两个表的 ID 格式可能不同，不能直接用 ID 去重
   - `adventureItems` 表的 ID 可能是 `1770596447478`（纯数字）
   - `userInventories` 表的 ID 可能是 `inv_1770596447478`（带前缀）

2. **同名道具**: 如果允许同名但不同类型的道具，需要使用组合键去重

3. **数量合并**: 如果是同一个道具，可能需要合并 `quantity` 字段

4. **时间戳**: 保留最新的道具记录（按 `obtainedAt` 或 `createdAt`）

5. **AllinONE 的期望**: AllinONE 前端希望 New Day API 返回的数据：
   - **无重复**: 每个道具只出现一次
   - **数量准确**: 返回的数量等于用户实际拥有的数量（当前是 12 个）
   - **数据完整**: 包含所有必要字段（id, name, description, type, rarity, quantity, obtainedAt）

## 优先级与期望

### 优先级: P1 (高优先级)

此问题影响 AllinONE 用户体验，道具重复显示会造成困惑。

### AllinONE 的立场

- **不打算在前端修复**: AllinONE 团队认为数据去重应该是后端的责任
- **期望后端修复**: 希望 New Day 团队在 API 层面解决重复问题
- **数据一致性**: 期望 API 返回的数据与 New Day 游戏内显示的数据完全一致

## 联系方式

- **AllinONE 负责人**: [你的姓名]
- **问题创建时间**: 2026-02-09
- **期望解决时间**: [填写期望时间]

## 附件

- 控制台日志截图
- React 错误截图
- 当前返回的 16 个道具列表（从日志中获取）
- 预期应有的 12 个道具列表（New Day 游戏内截图）

---

**文档版本**: 1.0
**最后更新**: 2026-02-09
**状态**: 待修复
