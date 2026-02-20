# New Day 库存 API 问题需求文档

## 问题描述

AllinONE 平台调用 New Day 的 `/inventory` 端点获取用户库存时，返回的道具数量不正确。

## 环境

- **AllinONE 调用的端点**: `https://yxp6y2qgnh.coze.site/api/allinone/inventory`
- **HTTP 方法**: GET
- **认证方式**: Bearer Token（在 Authorization header 中传递）
- **实际用户库存**: 9 个道具
- **API 返回数量**: 1 个道具

## 请求信息

### 请求头

```
Content-Type: application/json
Authorization: Bearer nd_token_xxxxx
```

### 请求示例

```bash
curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nd_token_xxxxx"
```

## 当前响应

### HTTP 状态码
```
200 OK
```

### 响应体示例

```json
{
  "success": true,
  "items": [
    {
      "id": "item_001",
      "name": "道具名称",
      "description": "道具描述",
      "type": "weapon",
      "rarity": "rare",
      "stats": {...},
      "quantity": 1,
      "obtainedAt": 1234567890
    }
  ],
  "timestamp": "2026-02-08T11:30:38.986Z"
}
```

## 问题描述

### 预期行为
- 返回该用户的所有道具（共 9 个）

### 实际行为
- 只返回了 1 个道具（最近购买的）

### 可能原因

1. **分页问题**
   - 如果端点支持分页，默认 `page=1` 且 `limit` 较小
   - 需要传递 `page=1&limit=100` 等参数获取全部数据

2. **查询条件问题**
   - 后端可能有过滤条件（如只显示最近获得的道具）
   - 需要传递参数移除过滤条件

3. **数据库查询问题**
   - SQL 查询可能有 `LIMIT 1` 或类似的限制
   - 需要检查数据库查询代码

4. **用户绑定问题**
   - 可能 token 关联的用户 ID 不正确
   - 需要验证 token 中的用户信息

## 需求

### 优先级：P0（紧急）

请 New Day 团队检查 `/inventory` 端点的以下内容：

1. **数据库查询逻辑**
   - 确认查询语句是否正确（是否有 `LIMIT` 限制）
   - 确认是否查询了该用户的所有道具

2. **分页参数支持**
   - 确认是否支持 `page` 和 `limit` 参数
   - 如果支持，请在文档中说明
   - 如果不支持，请返回所有道具或提供默认返回数量

3. **过滤条件**
   - 确认是否有默认过滤条件（如只返回最近 N 个）
   - 如果有，请提供参数移除过滤

### 期望的 API 规范

#### 方案 A：支持分页参数

**请求**
```
GET /api/allinone/inventory?page=1&limit=100
```

**响应**
```json
{
  "success": true,
  "items": [...],  // 所有 9 个道具
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 9,
    "totalPages": 1
  },
  "timestamp": "2026-02-08T11:30:38.986Z"
}
```

#### 方案 B：返回所有道具（推荐）

**请求**
```
GET /api/allinone/inventory
```

**响应**
```json
{
  "success": true,
  "items": [...],  // 所有 9 个道具
  "total": 9,
  "timestamp": "2026-02-08T11:30:38.986Z"
}
```

#### 方案 C：提供完整数据端点

**请求**
```
GET /api/allinone/inventory/all
```

**响应**
```json
{
  "success": true,
  "items": [...],  // 所有 9 个道具
  "total": 9,
  "timestamp": "2026-02-08T11:30:38.986Z"
}
```

## 测试步骤

修复后，请按以下步骤测试：

1. **使用相同的 token 调用 API**
   ```bash
   curl -X GET "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer nd_token_xxxxx"
   ```

2. **验证响应**
   - HTTP 状态码应为 200
   - `success` 应为 `true`
   - `items` 数组应包含 9 个道具
   - 每个道具应包含 `id`, `name`, `description`, `type`, `rarity`, `quantity`, `obtainedAt` 字段

3. **验证道具内容**
   - 确认返回的道具与 New Day 游戏中实际显示的道具一致
   - 确认道具数量、名称、类型等信息正确

## 联系方式

- **AllinONE 负责人**: [你的姓名]
- **问题创建时间**: 2026-02-08
- **期望解决时间**: [填写期望时间]

## 附件

- AllinONE 控制台日志截图
- API 调用示例代码

---

**文档版本**: 1.0
**最后更新**: 2026-02-08
