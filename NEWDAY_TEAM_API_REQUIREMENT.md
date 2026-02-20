# New Day 团队开发需求文档 - 道具同步 API

## 一、需求概述

AllinONE 平台需要将玩家购买的 New Day 道具同步到 New Day 游戏。采用**非实时、用户主动触发**的同步模式。

## 二、核心原则

1. **非实时同步**：玩家在 AllinONE 购买道具后，默认只存在 AllinONE
2. **用户主动触发**：玩家点击"同步到 New Day"按钮后，AllinONE 调用 New Day API 添加道具
3. **数据独立性**：同步后，AllinONE 和 New Day 各自维护道具副本

## 三、需要实现的 API 端点

### 端点 1: 添加道具到 New Day 库存

**URL**: `POST /api/allinone/inventory/add`

**功能**: 接收从 AllinONE 同步过来的道具，添加到 New Day 游戏库存

**请求头**:
```http
Authorization: Bearer {newDayToken}
Content-Type: application/json
```

**请求体**:
```json
{
  "itemId": "nd_owned_1234567890_abc123",
  "name": "[New Day] 黎明之剑",
  "description": "传说中的黎明之剑，攻击力+50",
  "type": "weapon",
  "rarity": "epic",
  "quantity": 1,
  "stats": {
    "attack": 50
  },
  "originalSource": "allinone_official_store"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | string | 是 | AllinONE 的道具 ID（用于去重） |
| name | string | 是 | 道具名称 |
| description | string | 否 | 道具描述 |
| type | string | 是 | 道具类型：`weapon`/`armor`/`consumable`/`material`/`special`/`skin`/`pet` |
| rarity | string | 是 | 稀有度：`common`/`uncommon`/`rare`/`epic`/`legendary` |
| quantity | number | 是 | 数量，目前固定为 1 |
| stats | object | 否 | 道具属性（攻击力、防御力等） |
| originalSource | string | 否 | 来源标识，固定为 `allinone_official_store` |

**成功响应 (200)**:
```json
{
  "success": true,
  "message": "道具添加成功",
  "item": {
    "id": "newday_item_123",
    "name": "[New Day] 黎明之剑",
    "description": "传说中的黎明之剑，攻击力+50",
    "type": "weapon",
    "rarity": "epic",
    "quantity": 1,
    "stats": {
      "attack": 50
    },
    "obtainedAt": 1770596447478
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "message": "道具已存在",
  "errorCode": "ITEM_ALREADY_EXISTS"
}
```

**错误码说明**:
| 错误码 | 说明 |
|--------|------|
| `ITEM_ALREADY_EXISTS` | 该道具已存在于 New Day 库存中 |
| `INVALID_TOKEN` | 认证失败，token 无效或过期 |
| `INVALID_ITEM_TYPE` | 道具类型无效 |
| `INVALID_RARITY` | 稀有度无效 |

---

### 端点 2: 查询道具同步状态（可选，推荐实现）

**URL**: `GET /api/allinone/inventory/sync-status?itemId={itemId}`

**功能**: 查询指定道具是否已从 AllinONE 同步到 New Day

**请求头**:
```http
Authorization: Bearer {newDayToken}
```

**成功响应 (200)**:
```json
{
  "success": true,
  "synced": true,
  "syncedAt": "2026-02-09T10:30:00Z"
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| synced | boolean | 是否已同步 |
| syncedAt | string | 同步时间（ISO 8601 格式） |

---

## 四、去重逻辑

### 方案 A: 基于 itemId 去重（推荐）

```javascript
// 检查道具是否已存在
const existingItem = await db.inventory.findOne({
  where: { 
    metadata: { 
      like: '%"originalSource":"allinone_official_store"%' 
    }
  }
});

if (existingItem) {
  // 提取原 AllinONE itemId
  const originalId = existingItem.metadata?.allinoneItemId;
  
  if (originalId === request.itemId) {
    return {
      success: false,
      message: '道具已存在',
      errorCode: 'ITEM_ALREADY_EXISTS'
    };
  }
}
```

### 方案 B: 基于数据库关联表

创建关联表记录同步关系：

```sql
CREATE TABLE allinone_sync_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  allinone_item_id VARCHAR(100) NOT NULL,
  newday_item_id INT NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(50) NOT NULL,
  UNIQUE KEY uk_allinone_item (allinone_item_id)
);
```

---

## 五、测试用例

### 用例 1: 首次同步道具
```bash
curl -X POST https://yxp6y2qgnh.coze.site/api/allinone/inventory/add \
  -H "Authorization: Bearer nd_token_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "nd_owned_12345",
    "name": "[New Day] 黎明之剑",
    "type": "weapon",
    "rarity": "epic",
    "quantity": 1
  }'
```

**预期结果**: 返回 success: true，道具添加到 New Day 库存

---

### 用例 2: 重复同步相同道具
```bash
# 同一个 itemId 重复调用
curl -X POST https://yxp6y2qgnh.coze.site/api/allinone/inventory/add \
  -H "Authorization: Bearer nd_token_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "nd_owned_12345",
    "name": "[New Day] 黎明之剑",
    "type": "weapon",
    "rarity": "epic",
    "quantity": 1
  }'
```

**预期结果**: 返回 success: false, errorCode: "ITEM_ALREADY_EXISTS"

---

### 用例 3: 无效的 token
```bash
curl -X POST https://yxp6y2qgnh.coze.site/api/allinone/inventory/add \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"itemId": "test", "name": "test", "type": "weapon", "rarity": "common", "quantity": 1}'
```

**预期结果**: 返回 401 Unauthorized

---

### 用例 4: 查询同步状态
```bash
curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory/sync-status?itemId=nd_owned_12345" \
  -H "Authorization: Bearer nd_token_xxx"
```

**预期结果**: 返回 success: true, synced: true

---

## 六、推荐的数据存储方案

### 方案 1: 在道具表添加元数据字段

```sql
ALTER TABLE inventory ADD COLUMN metadata TEXT;

-- 使用 JSON 存储额外信息
UPDATE inventory 
SET metadata = JSON_OBJECT(
  'allinoneItemId', 'nd_owned_12345',
  'originalSource', 'allinone_official_store',
  'syncedAt', NOW()
)
WHERE id = 123;
```

### 方案 2: 创建同步记录表（推荐）

```sql
CREATE TABLE sync_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  allinone_item_id VARCHAR(100) NOT NULL COMMENT 'AllinONE 道具 ID',
  newday_item_id INT NOT NULL COMMENT 'New Day 道具 ID',
  user_id VARCHAR(50) NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_status ENUM('success', 'failed') DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_allinone_item_id (allinone_item_id)
);
```

---

## 七、安全建议

1. **验证用户所有权**: 确保用户只能同步自己的道具
   ```javascript
   const user = await verifyToken(request.headers.authorization);
   const existingSync = await db.sync_records.findOne({
     where: { allinoneItemId: request.itemId, userId: user.id }
   });
   ```

2. **限流保护**: 防止恶意刷道具
   ```javascript
   const syncCount = await redis.get(`sync_count:${user.id}:today`);
   if (syncCount >= 10) {
     return { success: false, message: '今日同步次数已达上限' };
   }
   ```

3. **审计日志**: 记录所有同步操作
   ```javascript
   await db.audit_log.insert({
     action: 'sync_from_allinone',
     userId: user.id,
     itemId: request.itemId,
     timestamp: new Date(),
     ip: request.ip
   });
   ```

---

## 八、实施优先级

### P0（必须实现）
- [ ] `POST /api/allinone/inventory/add` 端点
- [ ] 道具去重逻辑
- [ ] 用户认证和授权验证

### P1（推荐实现）
- [ ] `GET /api/allinone/inventory/sync-status` 端点
- [ ] 同步记录表
- [ ] 审计日志

### P2（可选优化）
- [ ] 限流保护
- [ ] 批量同步支持

---

## 九、联络与测试

### 测试环境
- **API 基础路径**: `https://yxp6y2qgnh.coze.site/api/allinone`
- **测试账号**: 联系 AllinONE 团队获取

### 联系方式
- **AllinONE 团队**: （提供联系方式）
- **问题反馈**: 通过 GitHub Issues 或项目群反馈

---

## 十、验收标准

- [ ] `POST /api/allinone/inventory/add` 端点正常工作
- [ ] 重复添加相同道具返回 `ITEM_ALREADY_EXISTS` 错误码
- [ ] 无效 token 返回 401 错误
- [ ] 道具成功添加后可在 New Day 游戏中看到
- [ ] AllinONE 前端测试同步功能通过

---

**文档版本**: 1.0  
**创建日期**: 2026-02-09  
**负责人**: New Day 开发团队
