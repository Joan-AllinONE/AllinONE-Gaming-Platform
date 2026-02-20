# New Day API 500 错误诊断指南

## 错误信息
```
HTTP Status: 500
Response: {"success":false,"message":"服务器错误"}
```

## 可能原因

500 错误表示 New Day 服务器在处理请求时发生内部错误。常见原因：

1. **数据库错误** - SQL 执行失败、字段不存在、约束冲突
2. **空指针异常** - 访问了未初始化的对象或属性
3. **类型转换错误** - 字符串转数字失败、JSON 解析失败
4. **缺少必要字段** - 请求中缺少服务器必需的字段
5. **代码逻辑错误** - 数组越界、除零错误等

---

## 诊断步骤

### 步骤 1: 检查请求数据

AllinONE 发送的请求示例：
```json
{
  "itemId": "nd_health_potion_20250209123456_abc123",
  "name": "[New Day] 生命药水",
  "description": "立即恢复 1000 点生命值",
  "type": "consumable",
  "rarity": "common",
  "quantity": 1,
  "stats": {
    "healAmount": 1000
  },
  "originalSource": "allinone_official_store",
  "allinoneItemId": "nd_owned_123456789_abc123"
}
```

**请 New Day 团队检查：**
- 是否正确接收并解析了 JSON 数据
- 所有必需字段是否存在
- 字段类型是否匹配（特别是 `quantity` 应该是数字）

### 步骤 2: 检查数据库操作

**常见问题：**
- 表是否已创建
- 字段名是否正确（注意大小写）
- 字段类型是否匹配
- 是否缺少默认值

**建议 SQL 检查：**
```sql
-- 检查表结构
\d cross_game_inventory

-- 或
DESCRIBE cross_game_inventory;

-- 检查是否有 NOT NULL 字段缺少默认值
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cross_game_inventory';
```

### 步骤 3: 添加详细错误日志

**建议 New Day 在代码中添加：**

```javascript
// 在 API 处理函数中
try {
  console.log('收到请求:', req.body);
  
  // 验证必需字段
  const required = ['itemId', 'name', 'type', 'rarity'];
  for (const field of required) {
    if (!req.body[field]) {
      console.error(`缺少必需字段: ${field}`);
      return res.status(400).json({
        success: false,
        message: `缺少必需字段: ${field}`,
        errorCode: 'MISSING_FIELD'
      });
    }
  }
  
  // 数据库操作
  console.log('开始数据库操作...');
  const result = await db.query('INSERT INTO ...', [...]);
  console.log('数据库操作成功:', result);
  
  res.json({ success: true, ... });
  
} catch (error) {
  // 详细记录错误
  console.error('服务器错误详情:', error);
  console.error('错误堆栈:', error.stack);
  console.error('请求数据:', req.body);
  
  res.status(500).json({
    success: false,
    message: '服务器错误: ' + error.message,
    errorCode: 'SERVER_ERROR'
  });
}
```

### 步骤 4: 检查数据库表结构

**请确认以下表结构：**

```sql
CREATE TABLE IF NOT EXISTS allinone_synced_items (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(255) NOT NULL UNIQUE,  -- AllinONE 传来的 itemId
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  rarity VARCHAR(50) NOT NULL,
  quantity INTEGER DEFAULT 1,
  stats JSONB,
  original_source VARCHAR(100),
  allinone_item_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,  -- 从 token 中获取的用户ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**关键字段说明：**
- `item_id`: 必需，唯一，对应 AllinONE 的 `itemId`
- `user_id`: 必需，从 token 中解析的用户ID
- `quantity`: 必需，默认 1

---

## 快速测试

### 使用 curl 测试 API

```bash
curl -X POST http://your-newday-api.com/api/allinone/inventory/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "itemId": "test_item_001",
    "name": "测试道具",
    "description": "这是一个测试道具",
    "type": "consumable",
    "rarity": "common",
    "quantity": 1,
    "originalSource": "allinone_official_store"
  }'
```

### 使用 Postman 测试

1. 设置请求类型：POST
2. URL: `http://your-newday-api.com/api/allinone/inventory/add`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
4. Body (raw JSON):
   ```json
   {
     "itemId": "test_item_001",
     "name": "测试道具",
     "type": "consumable",
     "rarity": "common",
     "quantity": 1
   }
   ```

---

## 常见错误及解决方案

### 错误 1: 数据库连接失败
```
error: connection refused
```
**解决**: 检查数据库服务是否运行，连接配置是否正确

### 错误 2: 字段不存在
```
error: column "item_id" does not exist
```
**解决**: 检查表结构，确保字段名正确

### 错误 3: 违反唯一约束
```
error: duplicate key value violates unique constraint
```
**解决**: 这是正常的，应该返回 409 而不是 500

### 错误 4: 缺少用户ID
```
Cannot read property 'userId' of undefined
```
**解决**: 检查 token 解析逻辑，确保能正确获取用户ID

---

## 需要 New Day 提供的信息

请 New Day 团队提供以下信息以便进一步诊断：

1. **服务器错误日志** - 包含详细的错误堆栈
2. **数据库表结构** - 使用 `\d table_name` 或 `DESCRIBE` 输出
3. **API 代码片段** - 处理 `/api/allinone/inventory/add` 的代码
4. **测试环境** - 是否可以提供一个测试接口用于调试

---

## 建议的修复流程

1. **添加详细日志** - 记录请求数据和每一步操作
2. **验证输入数据** - 检查所有必需字段
3. **检查数据库操作** - 确保 SQL 语句正确
4. **返回具体错误** - 不要只返回 "服务器错误"，返回具体的错误信息
5. **测试修复** - 使用 curl 或 Postman 验证修复
6. **部署更新** - 部署到生产环境

---

## 联系方式

AllinONE 开发团队
