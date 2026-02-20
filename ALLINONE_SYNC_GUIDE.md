# AllinONE 数据同步指南

## 概述

本系统支持两种同步模式：
1. **本地模拟同步** (`local`) - 用于开发和测试
2. **真实 API 同步** (`real`) - 用于生产环境

## 快速开始

### 1. 配置同步模式

创建 `.env` 文件（复制 `.env.example`）：

```bash
# 本地模拟模式（默认）
VITE_ALLINONE_SYNC_MODE=local

# 或真实 API 模式
VITE_ALLINONE_SYNC_MODE=real
VITE_ALLINONE_API_URL=https://yxp6y2qgnh.coze.site/api/allinone
```

### 2. 使用同步服务

```typescript
import { allinoneSyncService, SyncItem } from '@/services/allinoneSyncService';

// 同步单个道具
const item: SyncItem = {
  id: 'item-001',
  name: '魔法剑',
  description: '一把强力的魔法剑',
  type: 'weapon',
  rarity: 'rare',
  stats: { attack: 10, defense: 5 },
  quantity: 1,
  obtainedAt: Date.now(),
  source: 'newday'
};

const result = await allinoneSyncService.syncPurchaseToAllinONE('user-001', item);

if (result.success) {
  console.log('同步成功:', result.message);
} else {
  console.error('同步失败:', result.message);
}
```

### 3. 批量同步

```typescript
const items: SyncItem[] = [item1, item2, item3];
const results = await allinoneSyncService.syncBatchToAllinONE('user-001', items);

const successCount = results.filter(r => r.success).length;
console.log(`成功同步 ${successCount}/${items.length} 个道具`);
```

## 两种模式详解

### 本地模拟模式 (`local`)

**适用场景**: 开发、测试、演示

**工作原理**:
- 将道具数据保存到浏览器的 `localStorage`
- 数据格式与真实 API 一致
- 支持库存查询、更新、删除

**数据存储位置**:
```
localStorage key: allinone_inventory_{userId}
```

**优点**:
- ✅ 无需后端服务
- ✅ 即时响应
- ✅ 数据持久化（浏览器本地）
- ✅ 适合开发和演示

**缺点**:
- ❌ 数据仅在当前浏览器
- ❌ 无法跨设备同步
- ❌ 重启浏览器后数据可能丢失（如果清除缓存）

### 真实 API 模式 (`real`)

**适用场景**: 生产环境

**工作原理**:
- 调用 AllinONE 后端 API
- 使用 Bearer Token 认证
- 支持重试机制和降级

**API 端点**:
```
POST /api/allinone/inventory/sync
```

**请求格式**:
```json
{
  "userId": "user-001",
  "item": {
    "id": "item-001",
    "name": "魔法剑",
    "description": "一把强力的魔法剑",
    "type": "weapon",
    "rarity": "rare",
    "stats": { "attack": 10 },
    "quantity": 1,
    "source": "newday",
    "obtainedAt": 1234567890
  }
}
```

**优点**:
- ✅ 数据持久化存储
- ✅ 跨设备同步
- ✅ 支持并发和事务
- ✅ 数据安全备份

**缺点**:
- ❌ 需要网络连接
- ❌ 有 API 延迟
- ❌ 依赖后端服务可用性

## 高级配置

### 动态切换模式

```typescript
import { allinoneSyncService } from '@/services/allinoneSyncService';

// 切换到真实模式
allinoneSyncService.setMode('real');

// 切换到本地模式
allinoneSyncService.setMode('local');

// 获取当前模式
const currentMode = allinoneSyncService.getMode();
```

### 自定义配置

```typescript
import { AllinONESyncService } from '@/services/allinoneSyncService';

// 创建自定义配置的实例
const customSyncService = new AllinONESyncService({
  mode: 'real',
  apiBaseUrl: 'https://custom-api.example.com',
  timeout: 15000,      // 15秒超时
  retryCount: 5        // 重试5次
});
```

### 测试 API 连接

```typescript
const connectionTest = await allinoneSyncService.testConnection();

if (connectionTest.success) {
  console.log('API 连接正常');
} else {
  console.error('API 连接失败:', connectionTest.message);
}
```

## 事件监听

同步完成后会触发事件，可以监听这些事件来更新 UI：

```typescript
// 监听同步完成事件
window.addEventListener('allinoneSyncCompleted', (event) => {
  const { userId, item, mode, syncId } = event.detail;
  console.log(`道具 ${item.name} 已通过 ${mode} 模式同步`);
  
  // 刷新库存显示
  refreshInventory();
});
```

## 错误处理

### 真实模式下的降级

当真实 API 调用失败时，系统会自动降级到本地模式：

```typescript
// 配置为真实模式
VITE_ALLINONE_SYNC_MODE=real

// 如果 API 调用失败（网络问题、服务不可用等）
// 系统会自动降级到本地模式，确保用户体验不中断
```

### 重试机制

真实模式下支持自动重试：
- 默认重试 3 次
- 每次重试间隔递增（1秒、2秒、3秒）
- 可配置重试次数

## 最佳实践

### 1. 开发阶段
```
VITE_ALLINONE_SYNC_MODE=local
```
- 快速迭代
- 无需网络
- 即时反馈

### 2. 测试阶段
```
VITE_ALLINONE_SYNC_MODE=real
VITE_ALLINONE_API_URL=https://staging-api.example.com
```
- 验证 API 集成
- 测试网络异常处理
- 性能测试

### 3. 生产阶段
```
VITE_ALLINONE_SYNC_MODE=real
VITE_ALLINONE_API_URL=https://api.example.com
VITE_ALLINONE_RETRY_COUNT=5
```
- 使用生产 API
- 增加重试次数
- 监控同步成功率

## 故障排查

### 问题: 同步失败

**本地模式**:
1. 检查 localStorage 是否可用
2. 检查浏览器存储空间是否已满
3. 检查用户 ID 是否正确

**真实模式**:
1. 检查网络连接
2. 检查 API URL 配置
3. 检查认证 token 是否有效
4. 查看浏览器控制台错误信息

### 问题: 数据不一致

1. 检查同步模式是否一致
2. 清除浏览器缓存重试
3. 手动触发重新同步

## API 文档

详细 API 文档请参考：
- [ALLINONE_API.md](./ALLINONE_API.md)
- [NEW_DAY_API_FIXED_SUMMARY.md](./NEW_DAY_API_FIXED_SUMMARY.md)

## 技术支持

如有问题，请联系：
- AllinONE 团队
- New Day 团队
