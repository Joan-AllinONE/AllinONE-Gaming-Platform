# 生产环境修复执行清单

**日期**: 2026-01-29
**状态**: ⏳ 等待执行

---

## 问题诊断

### ✅ 已完成的修复

- [x] 本地数据库外键约束已移除
- [x] 本地 API 可以创建 AllinONE 用户钱包
- [x] 数据库可以直接创建 AllinONE 用户钱包

### ⚠️ 发现的问题

- [ ] 生产环境 API 仍然返回外键约束错误
- [ ] 生产环境和本地环境很可能使用不同的数据库实例

---

## 执行步骤

### 步骤 1: 在生产环境数据库执行修复

```sql
-- 1.1 查询当前外键约束
SELECT tc.constraint_name, tc.table_name, kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'wallets';

-- 1.2 移除外键约束
ALTER TABLE wallets DROP CONSTRAINT wallets_user_id_players_id_fk;

-- 1.3 验证修复（应该无记录返回）
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_name = 'wallets' AND tc.constraint_type = 'FOREIGN KEY';
```

**执行后勾选**: [ ]

---

### 步骤 2: 测试生产环境 API

```bash
curl "https://yxp6y2qgnh.coze.site/api/shared/wallet/allinone-prod-test-123"
```

**预期返回**:
```json
{
  "wallet": {
    "id": "uuid-here",
    "userId": "allinone-prod-test-123",
    "gameCoins": 1000,
    "cashBalance": 0,
    "computingPower": 0
  },
  "isNewWallet": true
}
```

**测试通过后勾选**: [ ]

---

### 步骤 3: 运行完整集成测试

1. 打开 `test-newday-integration.html`
2. 点击"开始测试"按钮
3. 所有测试应显示为绿色 ✅

**测试通过后勾选**: [ ]

---

### 步骤 4: 如果步骤 2 失败，重新部署应用

如果执行数据库修复后，API 仍然返回错误，需要重新部署应用以清除缓存。

**执行后勾选**: [ ]

---

## 问题回答

### Q1: 生产环境和本地开发环境是否使用同一个数据库？

**答案**: ❌ **很可能使用不同的数据库实例**

**证据**:
- ✅ 本地 API (localhost:5000) 可以创建 AllinONE 用户钱包
- ❌ 生产环境 API (yxp6y2qgnh.coze.site) 无法创建 AllinONE 用户钱包
- ✅ 数据库外键约束已移除
- ❌ 生产环境 API 仍然返回外键约束错误

---

### Q2: 如果不同，请在生产环境数据库执行修复 SQL

**答案**: ✅ **是的，需要执行**

**SQL 命令**:
```sql
ALTER TABLE wallets DROP CONSTRAINT wallets_user_id_players_id_fk;
```

---

### Q3: 或者需要重新部署生产环境应用吗？

**答案**: ⏳ **取决于测试结果**

- 如果执行 SQL 后 API 正常工作：❌ **不需要重新部署**
- 如果执行 SQL 后 API 仍然失败：✅ **需要重新部署**

---

## 执行记录

| 步骤 | 状态 | 时间 | 备注 |
|------|------|------|------|
| 步骤 1: 执行数据库修复 | ⏳ 待执行 | | 在生产环境数据库执行 SQL |
| 步骤 2: 测试生产环境 API | ⏳ 待执行 | | 测试 AllinONE 用户钱包创建 |
| 步骤 3: 运行完整集成测试 | ⏳ 待执行 | | 所有测试应通过 |
| 步骤 4: 重新部署应用 | ⏳ 待执行 | | 仅在步骤 2 失败时执行 |

---

## 联系方式

如有问题，请联系：
- **AllinONE 集成团队**
- **New Day 开发团队**

---

**最后更新**: 2026-01-29
**版本**: 1.0
