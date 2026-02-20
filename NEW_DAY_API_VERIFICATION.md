# New Day API 验证指南

**更新日期**: 2026-01-29
**状态**: ✅ New Day 团队已完成修复，等待验证

---

## 📋 API 端点列表

### 共享 API（无需认证）

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/shared/marketplace` | GET | 获取市场列表 | ⏳ 待测试 |
| `/api/shared/marketplace` | POST | 上架道具到市场 | ⏳ 待测试 |
| `/api/shared/wallet/{userId}` | GET | 获取钱包信息 | ⏳ 待测试 |
| `/api/shared/marketplace/{id}/purchase` | POST | 购买道具 | ⏳ 待测试 |

### AllinONE API（需要认证）

#### 认证

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/allinone/auth/login` | POST | 登录获取 token | ⏳ 待测试 |

**请求格式**:
```json
{
  "allinoneUserId": "uuid",
  "allinoneUsername": "username"
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "userId": "allinone-user-id",
    "playerId": "new-day-player-id"
  }
}
```

#### 库存

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/allinone/inventory` | GET | 获取库存列表 | ⏳ 待测试 |

**请求头**:
```
Authorization: Bearer {token}
```

#### 市场

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/allinone/market/list` | GET | 获取市场列表 | ⏳ 待测试 |
| `/api/allinone/market/items` | GET | 获取市场物品 | ⏳ 待测试 |
| `/api/allinone/market/list` | POST | 上架道具 | ⏳ 待测试 |
| `/api/allinone/market/purchase` | POST | 购买道具 | ⏳ 待测试 |
| `/api/allinone/market/transfer` | POST | 转移道具 | ⏳ 待测试 |

#### 钱包

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/allinone/wallet/balance` | GET | 获取钱包余额 | ⏳ 待测试 |

---

## 🧪 验证步骤

### 方法 1: PowerShell 诊断脚本（推荐）

**优势**:
- 绕过 CORS 限制
- 测试所有端点
- 自动汇总结果
- 彩色输出，易于阅读

**运行方法**:
```powershell
powershell -ExecutionPolicy Bypass -File diagnose-newday-api-issues.ps1
```

或使用快速启动器:
```bash
run-api-diagnosis.bat
```

选择 [1] 运行 PowerShell 脚本

**预期结果**:
- 成功率 ≥ 80%
- 所有关键端点应该通过

---

### 方法 2: 浏览器验证工具

**优势**:
- 测试 CORS 配置
- 可视化界面
- 显示钱包和库存数据

**运行方法**:
```bash
start test-newday-integration.html
```

或使用快速启动器:
```bash
run-api-diagnosis.bat
```

选择 [3] 打开浏览器工具

**预期结果**:
- 所有 8 项测试应该通过
- 显示 New Day 的钱包和库存数据

---

### 方法 3: 手动测试

#### 测试 1: 共享市场 API
```bash
curl "https://yxp6y2qgnh.coze.site/api/shared/marketplace"
```

**预期**: 返回市场列表

#### 测试 2: 共享钱包 API
```bash
curl "https://yxp6y2qgnh.coze.site/api/shared/wallet/test-user-id"
```

**预期**: 返回钱包信息

#### 测试 3: AllinONE 登录
```bash
curl -X POST "https://yxp6y2qgnh.coze.site/api/allinone/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}'
```

**预期**: 返回 token 和用户信息

#### 测试 4: 使用 token 访问受保护的端点
```bash
# 首先获取 token
TOKEN="your-token-here"

# 获取库存
curl "https://yxp6y2qgnh.coze.site/api/allinone/inventory" \
  -H "Authorization: Bearer $TOKEN"

# 获取钱包
curl "https://yxp6y2qgnh.coze.site/api/allinone/wallet/balance" \
  -H "Authorization: Bearer $TOKEN"

# 获取市场列表
curl "https://yxp6y2qgnh.coze.site/api/allinone/market/list" \
  -H "Authorization: Bearer $TOKEN"
```

**预期**: 返回对应的数据

---

## ✅ 验证成功标准

### 关键端点必须通过

1. ✅ 共享市场 API - CORS 配置正确
2. ✅ 共享钱包 API - CORS 配置正确
3. ✅ AllinONE 登录 - 返回有效 token
4. ✅ AllinONE 钱包 - 使用 token 获取余额
5. ✅ AllinONE 库存 - 使用 token 获取库存
6. ✅ AllinONE 市场 - 使用 token 获取市场列表

### 预期成功率

- **最低要求**: 80% (6/8)
- **理想状态**: 100% (8/8)

### CORS 配置验证

从浏览器访问时，控制台**不应该**出现：
```
No 'Access-Control-Allow-Origin' header is present
```

---

## 🔍 如果测试失败

### 情况 1: CORS 错误

**症状**: 浏览器测试显示 CORS 错误

**解决方案**:
1. 检查 New Day 服务器是否已重启
2. 检查 CORS 配置是否正确添加到所有端点
3. 使用 PowerShell 脚本绕过 CORS 确认端点功能

### 情况 2: 登录失败 (400 错误)

**症状**: `/api/allinone/auth/login` 返回 400

**解决方案**:
1. 确认参数格式: `{ allinoneUserId, allinoneUsername }`
2. 检查 New Day 日志查看详细错误
3. 确认用户数据是否正确创建

### 情况 3: 认证失败 (401 错误)

**症状**: 使用 token 访问时返回 401

**解决方案**:
1. 确认 token 格式: `Bearer {token}`
2. 检查 token 是否过期
3. 检查 token 验证逻辑

### 情况 4: 方法错误 (405 错误)

**症状**: API 返回 405 Method Not Allowed

**解决方案**:
1. 确认正确的 HTTP 方法（GET/POST）
2. 检查端点是否实现

---

## 📊 测试结果记录

请将测试结果记录在下面：

### PowerShell 诊断脚本结果

```
日期: ___________
总计: ___ 个测试
成功: ___ 个
失败: ___ 个
成功率: ___%

详细结果:
[ ] 1. 共享市场 API
[ ] 2. 共享钱包 API
[ ] 3. AllinONE 登录
[ ] 4. AllinONE 钱包 API
[ ] 5. AllinONE 库存 API
[ ] 6. AllinONE 市场列表 API (GET)
[ ] 7. AllinONE 市场物品 API (GET)
[ ] 8. AllinONE 道具购买
[ ] 9. AllinONE 道具转移
```

### 浏览器验证工具结果

```
日期: ___________
测试通过率: ___%

详细测试:
[ ] 1. 共享市场 API 连接
[ ] 2. 共享钱包 API 连接
[ ] 3. AllinONE 登录认证
[ ] 4. 获取钱包余额
[ ] 5. 获取库存列表
[ ] 6. 获取市场列表
[ ] 7. 测试道具购买
[ ] 8. 测试道具转移

CORS 状态: [ ] 正常 [ ] 有错误

钱包数据显示:
- Cash: ___
- GameCoins: ___
- ComputingPower: ___

库存数据显示:
- New Day 道具: ___ 个
- 总道具: ___ 个
```

---

## 🎯 验证通过后的下一步

### 1. 启动 AllinONE 应用

```bash
npm run dev
```

### 2. 访问集成测试页面

```
http://localhost:5173/newday-integration-test
```

### 3. 测试所有功能

- ✅ 登录认证
- ✅ 钱包同步
- ✅ 库存同步
- ✅ 市场功能
- ✅ 道具购买
- ✅ 道具转移

### 4. 开始正常使用

- 访问个人中心查看合并的库存
- 访问市场查看跨平台道具
- 测试购买和转移功能

---

## 📞 联系方式

### 如果遇到问题

1. **保存错误日志**: 截图或复制错误信息
2. **记录测试环境**: 浏览器、操作系统、时间
3. **联系 New Day 团队**: 发送详细的错误报告

### 验证成功

请通知 AllinONE 开发团队，验证已完成，可以正式部署使用。

---

**最后更新**: 2026-01-29
**版本**: 2.0
**状态**: ⏳ 等待验证
