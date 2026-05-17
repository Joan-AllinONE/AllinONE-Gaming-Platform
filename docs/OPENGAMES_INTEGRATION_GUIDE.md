# AllinONE OpenGames Protocol - 接入指南

选择一种接入方式将你的游戏接入 AllinONE 平台。

---

## 快速比较

| | Mode A (注入适配) | Mode B (标准集成) |
|---|---|---|
| **游戏修改** | 无需任何修改 | 需集成 `@allinone/standard-sdk` |
| **适配模式** | 自动注入 Effect Engine | 轻量协议桥接层 + SDK |
| **效果控制** | RAF/performance.now 拦截 | 游戏方通过 SDK 主动调用 |
| **Schema 扩展** | 有限（全局变量扫描） | 完整支持（协议通信） |
| **适用场景** | 第三方 HTML 游戏、封闭引擎 | 新游戏、定制开发 |
| **集成工作量** | 0 — 零修改 | 1 — 安装 SDK |

---

## Mode A (注入适配) — 零修改接入

**完全不需要修改游戏代码。** 平台自动注入 Effect Engine + 兑换条。

```html
<!-- 你的游戏的 index.html -->
<html>
<head>
  <!-- 平台自动在 <head> 最前插入 AllinONE 协议层 -->
  <!-- Effect Engine 自动拦截帧率/时间，实现道具效果 -->
</head>
<body>
  <!-- 你的游戏逻辑 -->
  <!-- 平台自动在 </body> 前插入兑换条 UI -->
</body>
</html>
```

**玩家族交互流程：**
1. 玩家在平台商店购买道具
2. 获得兑换码（如 `IV-A3F9K2M7`）
3. 在游戏中点击兑换按钮输入兑换码
4. 平台验证后 → REDEEM_RESULT → Effect Engine 自动执行效果

**触发游戏事件**（通过 postMessage 发送到平台，用于奖励系统）：
```javascript
// 在游戏脚本中任意位置
window.parent.postMessage({ type: 'GAME_COMPLETE', data: { score: 1000 } }, '*');
window.parent.postMessage({ type: 'GAME_EVENT', event: 'GAME_WIN', data: {} }, '*');
```

---

## Mode B (标准集成) — SDK 接入

**安装 SDK：**
```bash
npm install @allinone/standard-sdk
```

**在游戏中集成：**
```typescript
import AllinONEGame from '@allinone/standard-sdk';

const game = new AllinONEGame({
  gameId: 'my-game-id',
  debug: true,
  skills: {
    auth: true,
    wallet: true,
    inventory: true,
    store: true,
  },
});

await game.initialize();
await game.start();

// 协议客户端会自动与平台握手
// 支持 Schema 扩展：武器、商店、任务等
```

**监听协议事件：**
```typescript
// 监听协议动作
game.protocol?.on('action:start', (params) => {
  // 平台要求开始游戏
  startGame();
});

game.protocol?.on('action:pause', () => {
  pauseGame();
});

// 监听扩展凭证
game.protocol?.on('voucher', (voucher) => {
  // AI 生成的扩展内容到达
  applyGameExtension(voucher.data);
});
```

**发送游戏事件：**
```typescript
game.protocol?.sendEvent('GAME_COMPLETE', { score: 1000, level: 5 });
```

---

## 发布配置

在 **Publishing Center** 的配置步骤：

1. 如果检测到 `@allinone/standard-sdk` → **自动选择 Mode B**
2. 如果未检测到 → **自动选择 Mode A（默认）**
3. 发布者也可手动切换模式

---

## AI 扩展（Schema 系统）

接入 Mode B 后，游戏可以声明支持的扩展 Schema：

```typescript
game.protocol?.on('init', (message) => {
  // 平台会查询游戏支持的 Schema
  // 内置 Schema: weapon, shop, quest
  // 玩家可以通过 AI 桥梁创建自定义内容
});
```

**AI 桥梁流程：**
1. 玩家说："我想要一把火焰剑"
2. AI 检查游戏支持 weapon Schema
3. AI 填充 `{ name: "烈焰之剑", damage: 85, element: "火" }`
4. 打包为 ExtensionVoucher
5. 下发到游戏中执行

---

## 故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| 兑换后无效果 | Mode A 下 RAF 拦截失败 | 确认游戏使用 requestAnimationFrame |
| 协议未连接 | iframe 未加载完成 | 检查 sandbox 包含 allow-scripts |
| Mode B 无法握手 | SDK 初始化失败 | 确认 import 路径正确 |
