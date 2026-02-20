# AllinONE 启动指南

## 问题诊断

从日志可以看到:
1. ✅ New Day 登录成功 (获取到 token)
2. ✅ 从 New Day 获取到 1 个道具
3. ❌ 后端服务器连接被拒绝 (ERR_CONNECTION_REFUSED)
4. ❌ 前端开发服务器 WebSocket 连接失败

**结论**: 服务器在运行过程中停止了

## 解决方案

### 方法 1: 分别启动前后端 (推荐)

**步骤 1: 启动后端服务器**

双击运行 `start-backend.bat`

或者在命令行中:
```bash
cd "d:\AllinONE Gaming Platform"
node server.js
```

等待看到以下输出:
```
🚀 AllinONE 服务器已启动！
地址: http://localhost:3000
API:  http://localhost:3000/api/inventory
✅ 数据库连接成功
```

**步骤 2: 启动前端开发服务器**

打开**另一个**命令行窗口,运行:
```bash
cd "d:\AllinONE Gaming Platform"
npm run dev:client
```

或者双击 `start-frontend.bat`

等待看到:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3001/
➜  Network: http://192.168.x.x:3001/
```

**步骤 3: 访问应用**

打开浏览器访问: http://localhost:3001

---

### 方法 2: 使用 concurrently (如果稳定的话)

```bash
cd "d:\AllinONE Gaming Platform"
npm run dev
```

---

## 验证服务器状态

### 测试后端 API
在浏览器中访问: http://localhost:3000/api/health

应该返回:
```json
{
  "status": "ok",
  "timestamp": "2026-01-31T...",
  "database": "connected"
}
```

### 测试前端
访问: http://localhost:3001

应该能看到登录页面

---

## 常见问题

### Q: 后端启动后立即退出
**A**: 
1. 检查端口 3000 是否被占用
2. 检查数据库是否运行
3. 查看 `.env` 配置是否正确

### Q: 前端显示 "无法连接"
**A**: 
1. 确保后端已先启动
2. 检查 `VITE_API_BASE_URL` 配置
3. 查看浏览器控制台错误

### Q: 401 错误仍然存在
**A**: 
1. 确保已登录
2. 检查 localStorage 中是否有 token
3. 刷新页面重试

---

## 端口配置

默认端口:
- 后端: 3000
- 前端: 3001

如果端口被占用,可以修改 `.env` 文件:
```env
PORT=3000
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 启动顺序

**重要**: 必须先启动后端,再启动前端!

1. ✅ 启动后端 (start-backend.bat)
2. ✅ 等待后端启动完成
3. ✅ 启动前端 (start-frontend.bat)
4. ✅ 访问 http://localhost:3001

---

## 调试技巧

### 查看后端日志
后端窗口会显示:
- 数据库连接状态
- API 请求日志
- 错误信息

### 查看前端日志
按 F12 打开浏览器开发者工具,查看 Console 标签

### 测试 API
使用 diagnose-issues.html 页面测试各个功能
