# New Day API 500 错误修复指南

## 错误信息

```json
{
  "success": false,
  "message": "添加道具到数据库失败",
  "errorCode": "INSERT_ERROR",
  "errorDetail": "Failed query: insert into \"user_inventories\" (...) values (...)"
}
```

## 问题分析

从错误详情可以看出，SQL 插入语句执行失败。具体参数：

```
user_id: user-002
item_id: nd_nd_store_material_001_1770679030317_56i9ry
item_name: [New Day] 龙晶石
item_description: New Day 稀有材料，用于打造顶级装备
item_icon: 💎          <-- 问题可能在这里！
quantity: 1
obtained_from: allinone_official_store
item_type: material
item_rarity: rare
```

## 可能的原因及解决方案

### 原因 1: 数据库编码问题（最可能）

**问题**: `item_icon` 字段传入的是 emoji 表情 `💎`，数据库可能不支持 UTF-8MB4 编码。

**解决方案**:

**选项 A: 修改数据库编码**
```sql
-- 修改数据库编码支持 emoji
ALTER DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修改表编码
ALTER TABLE user_inventories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修改字段编码
ALTER TABLE user_inventories MODIFY item_icon VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**选项 B: 在代码中处理 emoji（推荐）**
```javascript
// 在插入数据库前，将 emoji 转换为字符串或空值
function sanitizeIcon(icon) {
  if (!icon) return null;
  
  // 选项 1: 移除 emoji
  // return icon.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  
  // 选项 2: 将 emoji 转换为文字描述
  const emojiMap = {
    '💎': 'gem',
    '⚔️': 'sword',
    '🛡️': 'shield',
    '❤️': 'heart',
    '🧪': 'potion',
    // ... 其他映射
  };
  
  return emojiMap[icon] || icon;
}

// 使用示例
const itemData = {
  ...req.body,
  item_icon: sanitizeIcon(req.body.icon) || 'default_icon'
};
```

### 原因 2: 字段类型不匹配

**问题**: `item_icon` 字段类型可能是 INTEGER 或其他类型，不是 VARCHAR。

**检查表结构**:
```sql
-- PostgreSQL
\d user_inventories

-- MySQL
DESCRIBE user_inventories;

-- 或
SHOW COLUMNS FROM user_inventories;
```

**修复**:
```sql
-- 如果字段类型不正确，修改它
ALTER TABLE user_inventories MODIFY item_icon VARCHAR(255);
```

### 原因 3: 缺少默认值

**问题**: 某些 NOT NULL 字段没有传入值，也没有默认值。

**检查**:
```sql
-- 查看表结构，找出 NOT NULL 但没有默认值的字段
SELECT column_name, is_nullable, column_default, data_type
FROM information_schema.columns
WHERE table_name = 'user_inventories';
```

**修复**:
```sql
-- 为字段添加默认值
ALTER TABLE user_inventories 
ALTER COLUMN item_icon SET DEFAULT 'default_icon';
```

### 原因 4: 字段长度限制

**问题**: `item_id` 或其他字段长度不够。

**检查**:
```sql
-- 查看字段长度
SELECT column_name, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_inventories';
```

**修复**:
```sql
-- 增加字段长度
ALTER TABLE user_inventories 
ALTER COLUMN item_id TYPE VARCHAR(500);
```

## 推荐的修复步骤

### 步骤 1: 添加详细错误日志

修改 New Day 的 API 代码，捕获具体的数据库错误：

```javascript
try {
  const result = await db.query(insertSQL, params);
  res.json({ success: true, data: result });
} catch (dbError) {
  console.error('数据库错误详情:', dbError);
  console.error('错误代码:', dbError.code);
  console.error('错误消息:', dbError.message);
  console.error('SQL 语句:', insertSQL);
  console.error('参数:', params);
  
  res.status(500).json({
    success: false,
    message: '添加道具到数据库失败',
    errorCode: 'INSERT_ERROR',
    errorDetail: dbError.message,  // 返回具体错误信息
    sqlErrorCode: dbError.code     // 返回 SQL 错误代码
  });
}
```

### 步骤 2: 验证数据类型

在插入前验证所有字段：

```javascript
function validateItemData(data) {
  const errors = [];
  
  if (!data.itemId || typeof data.itemId !== 'string') {
    errors.push('itemId 必须是字符串');
  }
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('name 必须是字符串');
  }
  
  if (data.icon && typeof data.icon !== 'string') {
    errors.push('icon 必须是字符串');
  }
  
  // 检查 emoji
  if (data.icon && /[\u{1F600}-\u{1F64F}]/u.test(data.icon)) {
    console.warn('检测到 emoji，可能需要处理:', data.icon);
  }
  
  return errors;
}
```

### 步骤 3: 处理特殊字符

```javascript
// 在插入数据库前清理数据
function sanitizeItemData(data) {
  return {
    ...data,
    // 移除或替换 emoji
    icon: data.icon ? data.icon.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') : null,
    // 确保字符串长度不超过限制
    itemId: data.itemId?.substring(0, 500),
    name: data.name?.substring(0, 255),
    description: data.description?.substring(0, 1000)
  };
}
```

## 快速测试

使用以下 SQL 手动测试插入：

```sql
-- 测试插入（使用实际数据）
INSERT INTO user_inventories (
  user_id, 
  item_id, 
  item_name, 
  item_description, 
  item_icon, 
  quantity, 
  obtained_from, 
  item_type, 
  item_rarity
) VALUES (
  'user-002',
  'nd_nd_store_material_001_1770679030317_56i9ry',
  '[New Day] 龙晶石',
  'New Day 稀有材料，用于打造顶级装备',
  '💎',  -- 测试 emoji
  1,
  'allinone_official_store',
  'material',
  'rare'
);
```

如果上面的 SQL 报错，尝试：
```sql
-- 不使用 emoji
INSERT INTO user_inventories (...) VALUES (... 'gem' ...);
```

## 建议的 AllinONE 修改

同时，AllinONE 可以修改发送的数据，避免发送 emoji：

```javascript
// 在发送前清理 icon
const sanitizedItem = {
  ...item,
  icon: item.icon ? item.icon.replace(/[\u{1F600}-\u{1F64F}]/gu, '') : null
};
```

## 总结

最可能的原因是 **数据库编码不支持 emoji**。建议：

1. **首选方案**: 在 New Day 代码中处理 emoji（转换为文字或移除）
2. **备选方案**: 修改数据库编码为 utf8mb4
3. **同时**: AllinONE 也清理发送的数据

请 New Day 团队先尝试在代码中处理 emoji，这是最快最简单的解决方案。
