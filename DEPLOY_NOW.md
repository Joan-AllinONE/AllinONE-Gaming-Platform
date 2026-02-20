# 🚀 立即部署指南

**我来帮你完成部署！跟着下面的步骤操作：**

---

## 📋 第 0 步：确认环境

确保以下软件已安装：
- ✅ Node.js (v16+) - https://nodejs.org
- ✅ PostgreSQL (v12+) - https://www.postgresql.org/download/

---

## 🔧 第 1 步：配置环境变量

在项目根目录创建 `.env` 文件：

1. 打开文件资源管理器
2. 进入 `d:\AllinONE Gaming Platform`
3. 创建新文本文件，重命名为 `.env`（注意没有后缀）
4. 粘贴以下内容并保存：

```env
# 数据库配置（修改密码为你的）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=allinone_db
DB_USER=postgres
DB_PASSWORD=你的数据库密码

# 后端配置
PORT=3000
JWT_SECRET=random-secret-key-123456

# 前端配置
VITE_API_BASE_URL=http://localhost:3000/api
```

**⚠️ 重要：将 `DB_PASSWORD` 改为你安装 PostgreSQL 时设置的密码！**

---

## 🗄️ 第 2 步：创建数据库

打开 PowerShell 或命令提示符，执行：

```powershell
# 进入项目目录
cd "d:\AllinONE Gaming Platform"

# 安装依赖
npm install

# 创建数据库表
npm run setup:db
```

如果 `npm run setup:db` 失败，手动执行：
```powershell
psql -U postgres -c "CREATE DATABASE allinone_db;"
psql -d allinone_db -f database-schema-inventory.sql
```

---

## ▶️ 第 3 步：启动服务器

**在同一个 PowerShell 窗口中执行：**

```powershell
npm start
```

看到以下输出表示成功：
```
╔════════════════════════════════════════════════╗
║   🚀 AllinONE 服务器已启动！                    ║
║   地址: http://localhost:3000                   ║
╚════════════════════════════════════════════════╝
✅ 数据库连接成功
```

**保持这个窗口运行！不要关闭！**

---

## 🌐 第 4 步：启动前端

**打开新的 PowerShell 窗口**，执行：

```powershell
cd "d:\AllinONE Gaming Platform"
npm run dev:client
```

看到以下输出表示成功：
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: http://192.168.x.x:3001/
```

---

## ✅ 第 5 步：验证部署

1. 打开浏览器，访问 http://localhost:3001
2. 登录你的账号
3. 按 F12 打开开发者工具 → Console（控制台）
4. 点击游戏中心 → New Day 游戏
5. 查看控制台输出：

```
🔄 开始全量同步 New Day 库存到 AllinONE 数据库...
✅ 全量同步完成: { newDayTotal: X, newlySynced: Y, duration: "Zms" }
📦 初始化完成: { newDay: X, allinone: Y, total: Z }
```

6. **购买一个道具，刷新页面，确认道具仍然存在！**

---

## 🎉 部署完成！

如果看到上面的日志，说明部署成功！

### 接下来你可以：
- 在 New Day 购买道具，会自动同步到 AllinONE
- 清除浏览器缓存后重新登录，数据仍然存在
- 换台电脑登录，道具数据保持一致

---

## 🆘 遇到问题？

### 问题 1："无法找到模块 'express'"
```bash
npm install
```

### 问题 2："数据库连接失败"
- 检查 PostgreSQL 服务是否启动（任务管理器 → 服务 → postgresql）
- 检查 `.env` 中的密码是否正确
- 检查数据库 `allinone_db` 是否存在

### 问题 3："端口 3000 被占用"
```bash
# 修改 .env 中的 PORT
PORT=3002
```

### 问题 4：同步失败
- 检查后端服务是否运行（http://localhost:3000/api/health 应该返回 {"status":"ok"}）
- 检查控制台是否有 401 错误（需要重新登录）

---

## 📞 需要我远程协助？

如果以上步骤无法解决问题，请告诉我：
1. 在哪一步出错了？
2. 错误信息是什么？
3. 控制台显示了什么？

我可以帮你进一步排查！

---

**现在就开始第 1 步吧！加油！** 💪
