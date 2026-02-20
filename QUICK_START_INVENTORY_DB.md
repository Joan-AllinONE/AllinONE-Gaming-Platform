# 数据库库存方案 - 快速开始

## 🚀 3 步部署

### 1. 执行 SQL（1 分钟）
```bash
psql -d allinone_db -f database-schema-inventory.sql
```

### 2. 启动后端（1 分钟）
```typescript
// server.ts
import inventoryRouter from './api/inventory';
app.use('/api/inventory', inventoryRouter);
```

### 3. 部署前端（1 分钟）
```bash
npm run build
```

---

## 📊 数据流向

```
New Day 库存 → AllinONE API → PostgreSQL 数据库 → 前端展示
     ↑                                              ↓
     └────────── 全量同步 (每30秒) ←────────────────┘
```

---

## 🔑 API 端点

| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/inventory` | 获取库存列表 |
| GET | `/api/inventory/summary` | 获取汇总统计 |
| POST | `/api/inventory` | 添加道具 |
| POST | `/api/inventory/sync` | 全量同步 |
| DELETE | `/api/inventory/:id` | 移除道具 |
| GET | `/api/inventory/sync-history` | 同步历史 |

---

## ✅ 验证成功

打开浏览器控制台，应该看到：
```
🔄 开始全量同步 New Day 库存到 AllinONE 数据库...
✅ 全量同步完成: { newDayTotal: X, newlySynced: Y, duration: "Zms" }
📦 初始化完成: { newDay: X, allinone: Y, total: Z }
```

**清除浏览器缓存后重新登录，道具仍然存在！** 🎉

---

## 🆘 常见问题

**Q: 道具没有同步？**  
A: 检查控制台是否有 401 错误，token 可能过期了

**Q: 数据库连接失败？**  
A: 检查 `pool` 配置和数据库服务状态

**Q: 如何手动触发同步？**  
A: 调用 `newDayInventorySyncService.manualSync()`

---

**辛苦你了！有问题随时找我！** 💪
