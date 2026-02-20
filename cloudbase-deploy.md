# AllinONE Gaming Platform - CloudBase 部署指南

## 方式一：使用 CloudBase CLI 部署（推荐）

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录 CloudBase

```bash
tcb login
```

### 3. 创建环境（如还没有）

```bash
tcb env:create env-allinone
```

### 4. 部署到 CloudRun

```bash
# 设置环境变量
export CLOUDBASE_ENV_ID=your-env-id

# 部署容器服务
tcb cloudrun:deploy --serviceName allinone-gaming \
  --containerPort 3000 \
  --cpu 0.5 \
  --mem 1 \
  --minNum 1 \
  --maxNum 10 \
  --envParams '{"NODE_ENV":"production","USE_MEMORY_DB":"true"}'
```

## 方式二：使用腾讯云控制台部署

### 1. 准备代码包

```bash
# 在项目根目录执行
pnpm build:client

# 创建部署压缩包（排除 node_modules 和 dist）
zip -r allinone-deploy.zip . -x "node_modules/*" -x "dist/*" -x ".git/*"
```

### 2. 控制台部署步骤

1. 登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 进入 **云托管 (CloudRun)**
4. 点击 **新建服务**
5. 选择 **容器类型**
6. 上传代码包或连接 Git 仓库
7. 配置参数：
   - 服务名称：`allinone-gaming`
   - 端口：`3000`
   - CPU：0.5 核
   - 内存：1 GB
   - 最小实例数：1
   - 最大实例数：10
   - 环境变量：
     - `NODE_ENV` = `production`
     - `USE_MEMORY_DB` = `true`

### 3. 访问服务

部署完成后，控制台会显示访问地址，类似：
```
https://allinone-gaming-xxx-xxx.gz.apigw.tencentcs.com
```

## 方式三：静态托管部署（仅前端）

如果只需要部署前端静态页面：

```bash
# 构建前端
pnpm build:client

# 部署到静态托管
tcb hosting:deploy dist/static -e your-env-id
```

## 数据库说明

本项目使用内存数据库模式 (`USE_MEMORY_DB=true`)，无需配置外部数据库。数据会在服务重启后重置，适合演示和测试环境。

如需持久化存储，建议：
1. 在 CloudBase 控制台启用 **MySQL 数据库**
2. 修改环境变量 `USE_MEMORY_DB=false`
3. 添加数据库连接环境变量（`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`）

## 注意事项

1. **冷启动时间**：容器型服务有冷启动时间，最小实例数设置为 1 可以减少延迟
2. **费用**：按量付费模式下，服务运行会产生费用。测试环境建议在不使用时缩容到 0
3. **日志**：在 CloudBase 控制台可以查看服务日志和监控
4. **自定义域名**：可以在控制台配置自定义域名
