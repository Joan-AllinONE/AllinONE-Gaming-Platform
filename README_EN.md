# AllinONE Platform Website

AllinONE is an open gaming platform integrating game development, item trading, and community incentives, aiming to build a Play2Earn gaming economy featuring co-creation, sharing, governance, interconnectivity, mutual benefit, and win-win.

AllinONE is a comprehensive platform for games and community ecosystems, providing modules for platform management, fund pool settlement, wallet and currency system, marketplace & store, game center, and community rewards. The project is built with React + Vite + TypeScript for rapid development and cross-platform builds.

## Brand

- Brand: AllinONE
- Positioning: Integrate platform governance, virtual economy, and player ecosystem into one product, balancing efficiency and transparency
- Design Style: Modern, dark-theme friendly, emphasizing data visualization and interactive feedback

## Features Overview

- Platform Management System
  - Platform dashboard (key metrics, trends)
  - Parameter management (adjust platform parameters via voting)
  - Voting decisions (submit/vote/reject/effective)
  - Member management (roles and permissions simulation)
  - Performance management (dividend weight calculation and cash dividend execution, with idempotency and dedup protection)
- Fund Pool & Economic System
  - Income/expense, categories and currency-dimensional statistics
  - Net income and total value calculation (cash, game coin, computing power, A-Coin, O-Coin)
  - A-Coin/O-Coin distribution and dividends (simulation), recorded to fund pool and wallet
- Wallet System
  - Supports five asset types: cash, game coin, computing power, A-Coin, O-Coin
  - Transaction records and stats (today/week/month/total)
  - Currency exchange (with rates), event-driven refresh for options unlocking
  - Idempotency: cash dividend for the same period is credited only once
- Marketplace & Store
  - Official store purchase flow and commission records
  - Simulated player-to-player marketplace
- Games & Community
  - Game center and personal center (asset overview, transaction records)
  - Community rewards (A-Coin/O-Coin rewards and dividend demos)
- Additional demo pages
  - Fund pool demo, open economy, team demo, etc.

## Tech Stack

- Frontend: React 18, React Router
- Build: Vite 6, TypeScript, PostCSS, Tailwind CSS
- Animations & Forms: Framer Motion, React Hook Form, Zod
- UI Assets: Font Awesome
- Data & Events: localStorage, CustomEvent (wallet/dividend update notifications)

## Run & Build

### Requirements
- Node.js 18+
- pnpm (recommended)

### Install & Develop
```bash
pnpm install
pnpm dev           # or pnpm dev:client (vite --host --port 3000)
# Visit http://localhost:3000
```

### Build
Cross-platform build scripts for Windows / macOS / Linux:
```bash
pnpm build         # clean dist, build to dist/static, copy package.json, generate build.flag
# Output is in dist/static
```

Build only frontend static assets:
```bash
pnpm build:client  # only runs vite build --outDir dist/static
```

## Deployment

This project is a pure frontend static site. After building, it can be hosted on any static hosting service.

- Local / Simple static hosting
  1. Run `pnpm build`
  2. Copy the contents of `dist/static` to your server site directory (e.g., `C:/inetpub/wwwroot` or `/var/www/html`)
  3. Start with any static server (e.g., `npx serve dist/static`) or IIS/Apache/Node static hosting

- Nginx (Linux example)
  ```
  server {
    listen 80;
    server_name your.domain.com;
    root /var/www/allinone/dist/static;
    index index.html;
    location / {
      try_files $uri $uri/ /index.html;
    }
    # If you have an API, configure reverse proxy to backend
    # location /api/ { proxy_pass http://localhost:3001/; }
  }
  ```
  1. Upload `dist/static` to `/var/www/allinone/dist/static`
  2. Reload Nginx: `sudo nginx -s reload`

- GitHub Pages
  1. Push the contents of `dist/static` to the root of the `gh-pages` branch
  2. In repository Settings -> Pages, select `gh-pages` as source

- Vercel/Netlify
  1. Connect the repository, set build command `pnpm build:client`, output directory `dist/static`
  2. Deploy with one click to get a hosted domain

- Optional Backend API
  - `src/services/realWalletService.ts` uses `window.REACT_APP_API_URL || 'http://localhost:3001/api'` as the real API base URL
  - To enable, deploy the backend to the corresponding address and inject global `REACT_APP_API_URL` on the page, or modify the service configuration

## Screenshots Directory Convention

- Recommended to place product screenshots and copy materials under `docs/screenshots/`
  - Example: `docs/screenshots/platform-dashboard.png`
  - Subdirectories by module: `docs/screenshots/platform/`, `docs/screenshots/wallet/`, `docs/screenshots/fund-pool/`, etc.
- Reference in README:
  ```
  ![Platform Management Dashboard](docs/screenshots/platform/dashboard.png)
  ```

## Project Structure

```
src/
  components/platform/       # Platform management UI components
  contexts/                  # Global contexts (platform management, etc.)
  data/                      # Demo/mock data
  hooks/                     # Custom hooks (wallet, etc.)
  pages/                     # Pages (PlatformManagement, FundPool, GamePersonalCenter, etc.)
  services/                  # Core business services (wallet, fund pool, dividends, marketplace, store, options, etc.)
  types/                     # Type definitions
  utils/                     # Utility functions (duplicate transaction cleanup, etc.)

Top-level:
  package.json               # Scripts & dependencies
  vite.config.ts             # Vite config
  tailwind.config.js         # Tailwind config
  index.html                 # Entry template
  docs/screenshots/          # Screenshots & doc assets (recommended to create)
```

## Core Modules

- src/services/walletService.ts
  - Local storage key: `wallet_data`
  - Unified transaction crediting `addTransaction`: updates balances, stats, total value
  - Idempotency: `distributeCashDividend(periodId)` only credits once for the same dividend period (`relatedId=periodId`, `category=dividend`)
  - Options unlock & event notification: dispatches `wallet-updated` event for UI refresh

- src/services/dividendWeightService.ts
  - Weight calculation: based on historical performance (decay factor, configurable weights)
  - Storage keys: `dividend_weights` / `dividend_records`
  - Dedup logic:
    - When saving weight/dividend records, the same `userId+periodId` overwrites previous values
    - Before executing dividends, deduplicate by user and latest `calculationDate`, then distribute in loop
  - Events: `dividend-weights-calculated` / `cash-dividend-distributed`

- src/services/fundPoolService.ts
  - Platform net income, A-Coin/O-Coin distribution and dividends (simulation)
  - Transaction categories and balance statistics supporting chart data needs

- Other Services
  - oCoinService: O-Coin trading, options, dividend records
  - marketplaceService / officialStoreService: marketplace & store transaction crediting and commissions
  - optionsManagementService: option unlock records

## Data & Events

- Data storage: localStorage (for demo and reset convenience)
- Event-driven:
  - `wallet-updated`: wallet update notification
  - `dividend-weights-calculated`: dividend weight calculation complete
  - `cash-dividend-distributed`: cash dividend execution complete

## Contributing
Next, AllinONE will continue to improve platform security, account settings, game features, etc. I also hope people can join in the construction.
Please refer to contributing guidelines for more details.

## License

This project is for demo and internal development purposes, with no public license set. For open-sourcing or authorization, please contact the maintainers first.