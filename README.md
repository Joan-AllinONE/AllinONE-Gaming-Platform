# AllinONE 平台网站

AllinONE 是集游戏开发、道具交易与社区激励于一体的开放式游戏平台，致力于打造“共建、共享、共治，互通、互惠、互利”的 Play2Earn 游戏经济生态。

AllinONE 是一个面向游戏与社区生态的综合平台，提供平台管理、资金池结算、钱包与币种体系、市场与商店、游戏中心、社区奖励等模块。项目采用 React + Vite + TypeScript 构建，支持快速开发与跨平台构建。

## 公司与品牌

- 品牌名：AllinONE
- 品牌定位：将平台治理、虚拟经济与玩家生态整合在同一产品中，兼顾效率与透明度
- 设计风格：现代、暗色主题友好、强调数据展示与交互反馈

## 网站功能总览

- 平台管理系统
  - 平台数据仪表盘（关键指标、趋势）
  - 参数管理（通过投票调整平台参数）
  - 投票决策（提交/投票/否决/生效）
  - 成员管理（角色与权限模拟）
  - 绩效管理（分红权重计算与现金分红执行，含幂等与去重保护）
- 资金池与经济系统
  - 收入/支出、类别与货币维度统计
  - 净收入与总价值计算（现金、游戏币、算力、A币、O币）
  - A币/O币分发与分红（模拟），并记录到资金池与钱包
- 钱包系统
  - 支持现金、游戏币、算力、A币、O币五种资产
  - 交易记录与统计（今日/周/月/累计）
  - 货币兑换（含汇率）、期权解禁事件驱动刷新
  - 幂等保护：同一分红周期的现金分红仅入账一次
- 市场与商店
  - 官方商店购买流程与佣金记录
  - 交易市场模拟（玩家间交易）
- 游戏与社区
  - 游戏中心与个人中心（资产概览、交易记录）
  - 社区奖励（A币/O币奖励与分红演示）
- 其他演示页面
  - 资金池演示、开放经济、团队演示等

## 技术栈

- 前端框架：React 18、React Router
- 构建工具：Vite 6、TypeScript、PostCSS、Tailwind CSS
- 动效与表单：Framer Motion、React Hook Form、Zod
- UI 资源：Font Awesome
- 数据与事件：localStorage、CustomEvent（钱包/分红更新通知）

## 运行与构建

### 环境要求
- Node.js 18+
- pnpm（推荐）

### 安装与开发
```bash
pnpm install
pnpm dev           # 或 pnpm dev:client (vite --host --port 3000)
# 访问 http://localhost:3000
```

### 构建
项目已适配 Windows / macOS / Linux 的跨平台构建脚本：
```bash
pnpm build         # 清理 dist、构建到 dist/static、复制 package.json、生成 build.flag
# 产物位于 dist/static
```

如需仅构建前端静态资源：
```bash
pnpm build:client  # 仅执行 vite build --outDir dist/static
```

## 部署流程

本项目为纯前端静态站点，构建后可直接托管到任意静态资源服务。

- 本地/简易静态部署
  1. 执行 `pnpm build`
  2. 将 `dist/static` 目录内容复制到服务器的站点目录（如 `C:/inetpub/wwwroot` 或 `/var/www/html`）
  3. 用任意静态服务器（如 `npx serve dist/static`）或 IIS/Apache/Node 静态服务启动

- Nginx 部署（Linux 示例）
  ```
  server {
    listen 80;
    server_name your.domain.com;
    root /var/www/allinone/dist/static;
    index index.html;
    location / {
      try_files $uri $uri/ /index.html;
    }
    # 如有 API，配置反向代理到后端
    # location /api/ { proxy_pass http://localhost:3001/; }
  }
  ```
  1. 将 `dist/static` 上传到 `/var/www/allinone/dist/static`
  2. 重载 Nginx：`sudo nginx -s reload`

- GitHub Pages
  1. 将 `dist/static` 内容推送到仓库的 `gh-pages` 分支根目录
  2. 在仓库 Settings -> Pages 选择 `gh-pages` 分支作为来源

- Vercel/Netlify
  1. 连接仓库，设置构建命令 `pnpm build:client`，输出目录 `dist/static`
  2. 一键部署并获得托管域名

- 可选后端 API
  - `src/services/realWalletService.ts` 中使用 `window.REACT_APP_API_URL || 'http://localhost:3001/api'` 作为真实 API 基址
  - 如需启用，请将后端部署到对应地址，并在页面注入全局变量 `REACT_APP_API_URL` 或修改服务配置

## 截图目录约定

- 推荐将产品截图与文案素材放在 `docs` 目录
  
## 目录结构

```
src/
  components/platform/       # 平台管理相关 UI 组件
  contexts/                  # 全局上下文（平台管理等）
  data/                      # 演示/模拟数据
  hooks/                     # 自定义钩子（钱包等）
  pages/                     # 页面（PlatformManagement, FundPool, GamePersonalCenter 等）
  services/                  # 核心业务服务（钱包、资金池、分红、市场、商店、期权等）
  types/                     # 类型定义
  utils/                     # 工具函数（重复交易清理等）

顶层：
  package.json               # 脚本与依赖
  vite.config.ts             # Vite 配置
  tailwind.config.js         # Tailwind 配置
  index.html                 # 入口模板
  docs/screenshots/          # 截图与文档素材（建议创建）
```

## 核心模块说明

- src/services/walletService.ts
  - 本地存储键：`wallet_data`
  - 交易入账 `addTransaction`：统一更新余额、统计、总价值
  - 幂等保护：`distributeCashDividend(periodId)` 对同一分红周期（`relatedId=periodId`、`category=dividend`）仅入账一次
  - 期权解禁与事件通知：触发 `wallet-updated` 事件供 UI 刷新

- src/services/dividendWeightService.ts
  - 权重计算：基于历史绩效（衰减因子、可配置权重）
  - 记录存储键：`dividend_weights` / `dividend_records`
  - 去重逻辑：
    - 保存权重/分红记录时同一 `userId+periodId` 覆盖旧值
    - 执行分红前按用户与最新 `calculationDate` 去重，再循环发放
  - 事件通知：`dividend-weights-calculated` / `cash-dividend-distributed`

- src/services/fundPoolService.ts
  - 平台净收入、A币/O币分发与分红（模拟）
  - 交易类别与余额统计，支持图表展示所需数据

- 其他服务
  - oCoinService：O币买卖、期权、分红记录
  - marketplaceService / officialStoreService：市场与商店的交易入账与佣金
  - optionsManagementService：期权解锁记录

## 数据与事件

- 数据存储：localStorage（便于演示与重置）
- 事件驱动：
  - `wallet-updated`：钱包更新通知
  - `dividend-weights-calculated`：分红权重计算完成
  - `cash-dividend-distributed`：现金分红执行完成

## 贡献

下一步，AllinONE将继续完善平台的安全问题、账户设置、游戏功能等等。
详情请见CONTRIBUTING.md
欢迎提交 PR，也欢迎提出建议与意见。

## 网站地址
https://joan-allinone.github.io/AllinONE-Gaming-Platform/

## 许可证

本项目为演示与内部开发用途，未设置公开许可证；如需开源或授权，请先与维护者确认。
