# 快速参考：New Day API 验证

## 🚀 立即执行

```bash
# 运行诊断工具（推荐）
run-api-diagnosis.bat

# 或直接运行 PowerShell
powershell -ExecutionPolicy Bypass -File diagnose-newday-api-issues.ps1

# 或打开浏览器工具
start test-newday-integration.html
```

---

## 📋 API 端点速查

### 共享 API（无需认证）

```bash
GET    /api/shared/marketplace          # 获取市场
POST   /api/shared/marketplace          # 上架道具
GET    /api/shared/wallet/{userId}      # 获取钱包
POST   /api/shared/marketplace/{id}/purchase  # 购买
```

### AllinONE API（需要认证）

```bash
# 认证
POST   /api/allinone/auth/login         # 登录
# Body: { allinoneUserId, allinoneUsername }

# 库存
GET    /api/allinone/inventory         # 获取库存
# Header: Authorization: Bearer {token}

# 市场
GET    /api/allinone/market/list       # 获取市场
GET    /api/allinone/market/items      # 获取物品
POST   /api/allinone/market/list       # 上架
POST   /api/allinone/market/purchase  # 购买
POST   /api/allinone/market/transfer  # 转移

# 钱包
GET    /api/allinone/wallet/balance    # 获取余额
```

---

## ✅ 成功标准

- [ ] PowerShell 脚本成功率 ≥ 80%
- [ ] 浏览器工具无 CORS 错误
- [ ] 登录返回有效 token
- [ ] 受保护的端点使用 token 正常工作
- [ ] 显示 New Day 的钱包和库存数据

---

## 📁 重要文件

| 文件 | 用途 |
|------|------|
| `run-api-diagnosis.bat` | **快速启动器** |
| `NEW_DAY_API_VERIFICATION.md` | **验证指南** |
| `NEW_DAY_API_FIXED_SUMMARY.md` | 修复总结 |
| `test-newday-integration.html` | 浏览器工具 |

---

## 🎯 验证通过后

```bash
# 启动 AllinONE
npm run dev

# 访问集成测试页
http://localhost:5173/newday-integration-test
```

---

## ⚠️ 遇到问题？

查看 `NEW_DAY_API_VERIFICATION.md` 中的故障排除章节

---

**最后更新**: 2026-01-29
