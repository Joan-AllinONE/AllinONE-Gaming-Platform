# AllinONE 问题排查指南

## 当前已修复的问题

### ✅ 1. 服务器启动问题
**原因**: `server.js` 使用了 CommonJS 语法,但 `package.json` 设置了 `"type": "module"`
**修复**: 已将 `server.js` 改为 ES 模块语法

### ✅ 2. 401 未授权错误
**原因**: 
- 后端认证中间件过于严格
- 前端 `inventoryApiService` 使用的 token 获取方式不正确

**修复**:
- 后端现在支持多种 token 格式
- 前端现在会尝试从 New Day token 构建 AllinONE token

---

## 如何验证修复

### 步骤 1: 重新启动服务器
```bash
cd "d:\AllinONE Gaming Platform"
npm run dev
```

### 步骤 2: 打开诊断页面
在浏览器中打开 `diagnose-issues.html`

点击以下按钮:
1. **检查 LocalStorage** - 确认 token 存在
2. **检查 Tokens** - 确认认证信息正确
3. **测试后端 API** - 确认服务器运行正常
4. **测试库存同步** - 确认 401 错误已解决

### 步骤 3: 测试应用
1. 访问 http://localhost:3000
2. 登录账号
3. 进入游戏中心 → New Day
4. 打开控制台 (F12) 查看日志

---

## 常见问题

### Q: 仍然看到 401 错误
**A**: 
1. 确保已登录 (localStorage 中有 token)
2. 尝试点击诊断页面的 **修复缺失的 Token**
3. 刷新页面重试

### Q: 服务器无法启动
**A**:
1. 检查端口 3000 是否被占用
2. 确保 PostgreSQL 正在运行
3. 查看控制台错误信息

### Q: New Day 道具没有同步
**A**:
1. 确保 New Day token 有效
2. 检查控制台同步日志
3. 手动触发同步: 在控制台执行 `newDayInventorySyncService.manualSync()`

### Q: 数据库连接失败
**A**:
1. 确保 PostgreSQL 服务正在运行
2. 检查 `.env` 文件中的密码是否为 `allinone`
3. 重新运行 `node scripts/init-database.cjs`

---

## 文件说明

### 诊断工具
- `diagnose-issues.html` - 可视化诊断工具
- `fix-auth-issues.mjs` - 自动修复脚本

### 关键文件
- `server.js` - 后端服务器 (已修复)
- `src/services/inventoryApiService.ts` - 库存 API 服务 (已修复)
- `.env` - 环境变量配置

---

## 联系支持

如果问题仍然存在,请提供:
1. 浏览器控制台截图
2. 服务器控制台输出
3. 诊断页面的检查结果
