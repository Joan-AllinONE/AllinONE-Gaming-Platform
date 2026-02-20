# AllinONE 数据库设置指南

由于系统中没有找到 psql 命令,我们需要手动创建数据库。请按照以下步骤操作:

## 方法一: 使用 pgAdmin (推荐)

1. 打开 pgAdmin
2. 连接到 PostgreSQL 服务器
3. 右键点击 "Databases",选择 "Create" > "Database"
4. 输入数据库名称: `allinone_db`
5. 点击 "Save"

## 方法二: 使用命令行 (如果有 psql)

1. 打开 PowerShell 或命令提示符
2. 连接到 PostgreSQL:
   ```bash
   psql -U postgres
   ```
3. 创建数据库:
   ```sql
   CREATE DATABASE allinone_db;
   \q
   ```

## 创建数据库后

1. 检查 `.env` 文件中的数据库配置:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=allinone_db
   DB_USER=postgres
   DB_PASSWORD=your_password  <-- 修改为实际密码
   ```

2. 运行数据库初始化脚本:
   ```bash
   node scripts/init-database.cjs
   ```

## 常见问题

### PostgreSQL 服务未启动

1. 打开 Windows 服务管理器
2. 找到 `postgresql-x64-xx` 服务
3. 启动该服务

### 密码错误

1. 修改 `.env` 文件中的 `DB_PASSWORD`
2. 确保与 PostgreSQL 安装时设置的密码一致

## 验证数据库

运行初始化脚本后,应该看到:
```
✅ 数据库连接成功
✅ cross_game_inventory 表创建成功
✅ 索引创建成功
...
✅ 数据库初始化完成!
📊 数据库表列表:
  - cross_game_inventory
  - inventory_sync_log
```
