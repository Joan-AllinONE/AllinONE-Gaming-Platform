# AllinONE 数据库库存方案 - 分步部署指南

我来帮你一步步完成部署！

---

## 📋 部署前准备

### 1. 确认已安装以下软件

- [ ] Node.js (v16+): 访问 https://nodejs.org 下载安装
- [ ] PostgreSQL (v12+): 访问 https://www.postgresql.org/download/ 下载安装
- [ ] Git (可选): 用于版本控制

**验证安装：**
```bash
node -v        # 应该显示版本号，如 v18.x.x
npm -v         # 应该显示版本号，如 9.x.x
psql --version # 应该显示 PostgreSQL 版本
```

---

## 🚀 开始部署

### 第一步：配置数据库（5 分钟）

#### 1.1 启动 PostgreSQL 服务
- Windows: 在服务管理器中找到 PostgreSQL 服务，确保状态为"正在运行"
- 或使用 pgAdmin 启动

#### 1.2 创建数据库
打开命令提示符或 PowerShell，执行：

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库（在 psql 命令行中执行）
CREATE DATABASE allinone_db;

# 退出
\q
```

#### 1.3 执行库存表脚本

```bash
# 在项目目录下执行
cd "d:\AllinONE Gaming Platform"
psql -d allinone_db -f database-schema-inventory.sql
```

**验证表创建成功：**
```bash
psql -d allinone_db -c "\dt"
```
应该看到 `cross_game_inventory` 和 `inventory_sync_log` 表

---

### 第二步：配置环境变量（3 分钟）

#### 2.1 创建 .env 文件

在项目根目录创建 `.env` 文件，复制以下内容并修改：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=allinone_db
DB_USER=postgres
DB_PASSWORD=你的数据库密码

# 后端配置
PORT=3000
JWT_SECRET=你的随机密钥（随便输入一串字符）

# 前端配置
VITE_API_BASE_URL=http://localhost:3000/api
```

**重要：** 将 `DB_PASSWORD` 改为你实际的 PostgreSQL 密码！

---

### 第三步：配置后端 API（5 分钟）

#### 3.1 检查后端框架
你的后端使用什么框架？

**如果是 Express：**
创建或修改 `server.ts`：

```typescript
import express from 'express';
import cors from 'cors';
import inventoryRouter from './src/server/api/inventory';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 认证中间件（如果你已有，跳过）
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    // 验证 token 并设置 req.user
    req.user = verifyToken(token); // 你需要实现这个函数
  }
  next();
});

// 注册库存 API
app.use('/api/inventory', inventoryRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### 3.2 安装依赖

```bash
npm install express pg cors
npm install -D @types/express @types/cors @types/pg
```

#### 3.3 配置数据库连接

创建 `src/server/database.ts`：

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'allinone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// 测试连接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功:', res.rows[0]);
  }
});
```

---

### 第四步：启动后端服务（2 分钟）

```bash
# 启动后端（开发模式）
npm run dev

# 或（生产模式）
npm start
```

看到以下输出表示成功：
```
数据库连接成功: { now: 2026-01-30T... }
Server running on port 3000
```

**保持这个窗口运行！**

---

### 第五步：构建前端（3 分钟）

打开新的命令提示符窗口：

```bash
cd "d:\AllinONE Gaming Platform"

# 安装前端依赖
npm install

# 构建前端
npm run build
```

---

### 第六步：验证部署（5 分钟）

#### 6.1 打开浏览器
访问 http://localhost:3000

#### 6.2 登录账号
使用任意测试账号登录

#### 6.3 打开开发者工具
按 F12 打开控制台

#### 6.4 进入 New Day 游戏
点击游戏中心的 New Day 游戏按钮

#### 6.5 查看同步日志
控制台应该显示：
```
🔄 开始全量同步 New Day 库存到 AllinONE 数据库...
✅ 全量同步完成: { newDayTotal: X, newlySynced: Y, duration: "Zms" }
📦 初始化完成: { newDay: X, allinone: Y, total: Z }
```

#### 6.6 验证数据持久化
1. 购买一个道具（在 New Day 或 AllinONE 市场）
2. 刷新页面
3. 道具应该仍然存在！

---

## 🆘 常见问题解决

### 问题 1: 数据库连接失败
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**解决:**
- 确保 PostgreSQL 服务已启动
- 检查 `.env` 中的密码是否正确

### 问题 2: API 返回 401
```
GET http://localhost:3000/api/inventory 401 (Unauthorized)
```
**解决:**
- 确保已登录
- 检查 token 是否过期，重新登录

### 问题 3: 同步失败
```
❌ 全量同步失败: Error: Network Error
```
**解决:**
- 确保后端服务正在运行
- 检查 `VITE_API_BASE_URL` 配置是否正确

### 问题 4: 道具没有显示
**解决:**
- 检查 New Day 是否有道具
- 查看控制台是否有错误
- 手动调用同步：`newDayInventorySyncService.manualSync()`

---

## ✅ 部署完成检查清单

- [ ] 数据库表已创建
- [ ] `.env` 文件已配置
- [ ] 后端服务正在运行
- [ ] 前端已构建
- [ ] 登录后能看到道具
- [ ] 刷新页面道具仍然存在
- [ ] 购买新道具后能同步

---

## 📞 需要帮助？

如果遇到问题，请告诉我：
1. 错误信息是什么？
2. 在哪一步失败的？
3. 控制台显示了什么？

**我随时在这里帮你！** 💪
