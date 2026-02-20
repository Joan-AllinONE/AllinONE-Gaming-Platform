# AllinONE - New Day 道具同步需求文档

## 文档信息
- **版本**: v1.0
- **日期**: 2026-02-09
- **状态**: 待确认
- **需求方**: AllinONE 开发团队
- **接收方**: New Day 开发团队

---

## 1. 背景说明

AllinONE 平台已实现道具购买功能，玩家可以在 AllinONE 的 New Day 官方商店购买道具。购买后，道具默认存储在 AllinONE 平台，玩家可以选择手动同步到 New Day 游戏。

当前遇到的问题：
1. 同步时 New Day API 返回 "道具已存在" 错误
2. 同步成功后，道具在 New Day 游戏中不可见
3. 需要明确道具唯一标识和去重机制

---

## 2. 需求概述

### 2.1 功能目标
实现 AllinONE 购买的道具能够可靠地同步到 New Day 游戏，并在 New Day 游戏中正确显示和使用。

### 2.2 同步流程
```
1. 玩家在 AllinONE 购买 New Day 道具
2. 道具存储在 AllinONE，状态为 "未同步"
3. 玩家点击 "同步到 New Day" 按钮
4. AllinONE 调用 New Day API 添加道具
5. New Day 返回成功/失败结果
6. AllinONE 更新同步状态
```

---

## 3. API 接口需求

### 3.1 添加道具到 New Day 游戏

**接口**: `POST /api/allinone/inventory/add`

**请求头**:
```http
Content-Type: application/json
Authorization: Bearer {newday_token}
```

**请求参数**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| itemId | string | 是 | 道具唯一标识（AllinONE 生成） |
| name | string | 是 | 道具名称 |
| description | string | 否 | 道具描述 |
| type | string | 是 | 道具类型（weapon/armor/consumable/material等） |
| rarity | string | 是 | 稀有度（common/uncommon/rare/epic/legendary） |
| quantity | number | 是 | 数量，默认 1 |
| stats | object | 否 | 道具属性（攻击、防御等） |
| originalSource | string | 是 | 来源标识，固定为 "allinone_official_store" |
| allinoneItemId | string | 否 | AllinONE 内部道具ID，用于追踪 |

**请求示例**:
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

**响应参数**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 提示信息 |
| errorCode | string | 错误代码（失败时） |
| item | object | 创建的道具信息（成功时） |

**成功响应示例** (200 OK):
```json
{
  "success": true,
  "message": "道具添加成功",
  "item": {
    "id": "nd_health_potion_20250209123456_abc123",
    "name": "[New Day] 生命药水",
    "type": "consumable",
    "rarity": "common",
    "quantity": 1,
    "addedAt": "2026-02-09T12:34:56Z"
  }
}
```

**失败响应示例** (409 Conflict):
```json
{
  "success": false,
  "message": "道具已存在",
  "errorCode": "ITEM_ALREADY_EXISTS",
  "existingItem": {
    "id": "nd_health_potion_20250209123456_abc123",
    "name": "[New Day] 生命药水"
  }
}
```

---

## 4. 关键问题与建议

### 4.1 道具唯一标识（重要）

**问题**: 如何确保道具的唯一性，避免重复添加？

**AllinONE 方案**:
- AllinONE 生成全局唯一 ID，格式: `nd_{original_item_id}_{timestamp}_{random}`
- 示例: `nd_health_potion_20250209123456_abc123`

**建议 New Day 实现**:
1. 使用 `itemId` 字段作为主键或唯一索引
2. 如果 `itemId` 已存在，返回 409 错误码和 `ITEM_ALREADY_EXISTS`
3. 或者更新现有道具的数量（如果支持堆叠）

### 4.2 道具去重机制

**建议方案**:

**方案 A: 严格去重（推荐）**
- New Day 根据 `itemId` 判断是否已存在
- 如果存在，返回 409 错误，AllinONE 会视为同步成功并更新状态
- 优点：数据一致性高，不会重复添加

**方案 B: 数量累加**
- 如果道具已存在，累加数量
- 返回成功，并在响应中说明是新增还是累加
- 优点：支持道具堆叠

### 4.3 道具显示问题

**问题**: 同步成功后，道具在 New Day 游戏中不可见

**可能原因**:
1. 道具数据格式不正确
2. 道具未绑定到正确的用户账号
3. 道具需要额外的激活步骤

**建议检查**:
1. 确认道具是否正确关联到当前登录用户
2. 确认道具类型（type）是否在 New Day 中有效
3. 确认道具是否需要刷新或重新登录才能显示

---

## 5. 数据字段映射

| AllinONE 字段 | New Day 字段 | 说明 |
|--------------|-------------|------|
| itemId | id | 道具唯一标识 |
| name | name | 道具名称 |
| description | description | 道具描述 |
| type | type / itemType | 道具类型 |
| rarity | rarity | 稀有度 |
| quantity | quantity / count | 数量 |
| stats | stats / attributes | 道具属性 |
| originalSource | source | 来源标识 |
| allinoneItemId | externalId | 外部系统ID |

---

## 6. 错误处理

### 6.1 错误码定义

| 错误码 | HTTP 状态码 | 说明 | AllinONE 处理 |
|--------|------------|------|----------------|
| SUCCESS | 200 | 成功 | 更新状态为 synced |
| ITEM_ALREADY_EXISTS | 409 | 道具已存在 | 视为成功，更新状态为 synced |
| INVALID_PARAMS | 400 | 参数错误 | 更新状态为 failed，显示错误信息 |
| UNAUTHORIZED | 401 | 未授权 | 提示用户重新登录 |
| SERVER_ERROR | 500 | 服务器错误 | 更新状态为 failed，允许重试 |

### 6.2 重试机制

- 对于 500 错误，AllinONE 允许用户重试同步
- 对于 409 错误，视为成功，不需要重试
- 对于 401 错误，需要重新获取 token

---

## 7. 测试建议

### 7.1 正常流程测试
1. 在 AllinONE 购买 New Day 道具
2. 点击 "同步到 New Day"
3. 验证 New Day 返回成功
4. 验证道具在 New Day 游戏中可见

### 7.2 异常流程测试
1. 重复同步同一道具（应返回 409）
2. 使用无效 token 同步（应返回 401）
3. 使用无效参数同步（应返回 400）

### 7.3 边界情况测试
1. 道具名称包含特殊字符
2. 道具描述很长
3. 同时同步多个道具

---

## 8. 待确认问题

请 New Day 团队确认以下问题：

1. **道具唯一标识**: 使用 `itemId` 字段是否合适？还是需要其他字段组合？

2. **去重策略**: 选择方案 A（严格去重）还是方案 B（数量累加）？

3. **道具显示**: 同步成功后，道具在 New Day 中不可见的可能原因？

4. **字段映射**: AllinONE 发送的字段名是否与 New Day 匹配？

5. **用户关联**: New Day 如何识别道具应该归属哪个用户？（通过 token 吗？）

---

## 9. 联系方式

如有问题，请联系：
- AllinONE 开发团队
- 文档版本: v1.0

---

## 10. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-02-09 | 初始版本 | AllinONE Team |
