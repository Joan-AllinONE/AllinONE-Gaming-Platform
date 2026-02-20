# 生产环境修复指南 - Wallet 外键约束

**状态**: ⏳ 等待执行
**风险**: 低
**预计时间**: 5 分钟

---

## 简要说明

New Day 团队已完成本地环境修复，现在需要**在生产环境数据库执行相同的 SQL**。

---

## 生产环境修复步骤

### 步骤 1: 备份数据库（强烈推荐）

```bash
pg_dump -h <生产数据库主机> -U <用户名> -d <数据库名> > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步骤 2: 执行修复 SQL

连接到生产环境数据库，执行以下命令：

```sql
-- 查询当前外键约束（确认约束名称）
SELECT tc.constraint_name, tc.table_name, kcu.column_name,
       ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'wallets';

-- 移除外键约束
ALTER TABLE wallets DROP CONSTRAINT wallets_user_id_players_id_fk;

-- 验证修复（应该无记录返回）
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_name = 'wallets' AND tc.constraint_type = 'FOREIGN KEY';
```

### 步骤 3: 测试验证

```bash
# 测试 AllinONE 用户钱包创建
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

### 步骤 4: 通知 AllinONE 团队

修复完成后，通知 AllinONE 团队重新运行集成测试：
- 打开 `test-newday-integration.html`
- 点击"开始测试"
- 所有测试应显示为绿色 ✅

---

## 回滚方案（如果需要）

```sql
ALTER TABLE wallets
ADD CONSTRAINT wallets_user_id_players_id_fk
FOREIGN KEY (user_id) REFERENCES players(id)
ON DELETE CASCADE;
```

---

## 安全性说明

### ✅ 保留的约束

- **PRIMARY KEY**: `id` - 仍在
- **UNIQUE**: `user_id` - 仍在（确保每个用户只有一个钱包）

### ⚠️ 移除的约束

- **FOREIGN KEY**: `user_id → players(id)` - 已移除

### 数据一致性保障

- `user_id` 的唯一约束仍在
- 防止数据重复
- 应用层可添加额外验证

---

## 影响

### ✅ 不受影响

- New Day 玩家钱包功能完全正常
- 现有钱包数据不受影响
- 市场交易功能正常
- 其他功能不受影响

### ✅ 新增功能

- AllinONE 用户可以独立拥有钱包
- 支持跨平台集成
- 提高系统灵活性

---

## 完成检查清单

- [ ] 数据库备份完成
- [ ] 外键约束已移除
- [ ] 验证查询返回空（无外键约束）
- [ ] AllinONE 用户钱包创建成功
- [ ] 已通知 AllinONE 团队
- [ ] AllinONE 团队确认测试通过

---

**联系**: 如有问题，请联系 AllinONE 集成团队
