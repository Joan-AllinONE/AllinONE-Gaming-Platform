# New Day × AllinONE 集成 API 文档

## 概述

New Day游戏已成功集成AllinONE平台API，提供跨平台认证、道具交易、钱包管理等功能。

## API 基础信息

- **基础URL**: `https://yxp6y2qgnh.coze.site/api/allinone`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **CORS**: 已启用（允许跨域访问）

## API 端点列表

### 1. 认证 API

#### 登录/注册
- **端点**: `POST /auth/login`
- **描述**: 用户登录或注册，获取访问令牌
- **请求体**:
```json
{
  "userId": "string",
  "username": "string",
  "platform": "allinone" | "newday" | "direct"
}
```
- **响应**:
```json
{
  "success": true,
  "token": "nd_token_xxx",
  "userId": "string",
  "username": "string",
  "expiresAt": 1770075976906
}
```

### 2. 钱包 API

#### 获取余额
- **端点**: `GET /wallet/balance`
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "success": true,
  "balance": {
    "cash": 0,
    "gameCoins": 1000,
    "computingPower": 100,
    "newDayCoins": 100,
    "aCoins": 50
  }
}
```

### 3. 库存 API

#### 获取库存
- **端点**: `GET /inventory`
- **认证**: 需要 Bearer Token
- **响应**:
```json
{
  "success": true,
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "string",
      "rarity": "string",
      "stats": {},
      "obtainedAt": 1234567890,
      "quantity": 1,
      "userId": "string"
    }
  ]
}
```

### 4. 市场 API

#### 获取市场列表
- **端点**: `GET /market/items`
- **查询参数**:
  - `platform`: allinone | newday (可选)
  - `itemType`: string (可选)
  - `sortBy`: listed_desc | price_asc (默认: listed_desc)
  - `page`: number (默认: 1)
  - `limit`: number (默认: 100)
- **响应**:
```json
{
  "success": true,
  "items": [],
  "total": 0
}
```

#### 上架道具
- **端点**: `POST /market/list`
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "name": "string",
  "description": "string",
  "platform": "allinone" | "newday",
  "itemType": "string",
  "imageUrl": "string (可选)",
  "price": {
    "cash": 0,
    "gameCoins": 0,
    "computingPower": 0,
    "newDayCoins": 0
  }
}
```

#### 购买道具
- **端点**: `POST /market/purchase`
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "itemId": "string",
  "currencyType": "string",
  "quantity": 1
}
```

#### 转移道具
- **端点**: `POST /market/transfer`
- **认证**: 需要 Bearer Token
- **请求体**:
```json
{
  "itemId": "string",
  "targetUserId": "string",
  "quantity": 1
}
```

## 使用示例

### JavaScript/TypeScript

```typescript
// 1. 登录获取token
const loginResponse = await fetch('https://yxp6y2qgnh.coze.site/api/allinone/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_001',
    username: 'PlayerName',
    platform: 'newday'
  })
});
const { token } = await loginResponse.json();

// 2. 使用token访问其他API
const balanceResponse = await fetch('https://yxp6y2qgnh.coze.site/api/allinone/wallet/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { balance } = await balanceResponse.json();

console.log('余额:', balance);
```

### cURL

```bash
# 登录
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001","username":"PlayerName","platform":"newday"}' \
  https://yxp6y2qgnh.coze.site/api/allinone/auth/login

# 获取余额（需要token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yxp6y2qgnh.coze.site/api/allinone/wallet/balance
```

## 错误处理

所有API返回统一的错误格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

常见HTTP状态码：
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权（token无效或过期）
- `404`: 资源不存在
- `500`: 服务器错误

## 注意事项

1. **Token有效期**: 7天
2. **数据存储**: 当前使用内存存储，重启服务器后数据会丢失
3. **生产环境**: 建议使用真实数据库替代内存存储
4. **CORS**: 已配置允许跨域访问，适合前端直接调用

## 集成文件位置

- **核心逻辑**: `src/lib/allinone/`
- **API路由**: `src/app/api/allinone/`
- **文档**: `ALLINONE_API.md`
