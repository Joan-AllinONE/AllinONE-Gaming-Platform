# AllinONE Gaming Platform - CloudBase Deployment
# 使用 Node.js 20 作为基础镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建前端
RUN pnpm build:client

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV USE_MEMORY_DB=true

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
