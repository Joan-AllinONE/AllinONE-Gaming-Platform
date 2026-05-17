# A币电子凭证系统

一个独立、可追溯、可流转的电子凭证管理模块。

## 核心特性

- ✅ **唯一性**: 每个凭证有独立ID，不可复制
- ✅ **可流转**: 凭证可在不同用户间自由交换
- ✅ **历史记录**: 完整记录每次交换的时间、转出方、接收方、备注
- ✅ **多次使用**: 支持持续流转，非一次性消耗品
- ✅ **独立模块**: 与主系统解耦，便于维护和重构

## 技术架构

```
voucher-system/
├── types.ts                    # TypeScript 类型定义
├── index.ts                    # 模块导出
├── storage/
│   └── VoucherDatabase.ts      # 数据持久化层 (localStorage)
├── services/
│   └── VoucherService.ts       # 业务逻辑层
├── components/
│   ├── VoucherCard.tsx         # 凭证卡片组件
│   └── VoucherManager.tsx      # 凭证管理主界面
└── README.md                   # 本文件
```

## 快速开始

### 1. 基础使用

```tsx
import { VoucherService } from '@/voucher-system';

// 创建服务实例
const voucherService = new VoucherService();

// 创建凭证
const voucher = await voucherService.createVoucher({
  issuerId: 'user-001',
  issuerName: '管理员',
  initialHolderId: 'user-002',
  initialHolderName: '张三',
  value: 1000,
  metadata: { note: '奖励凭证' }
});

// 转让凭证
await voucherService.transferVoucher({
  voucherId: voucher.id,
  fromUserId: 'user-002',
  fromUsername: '张三',
  toUserId: 'user-003',
  toUsername: '李四',
  remark: '游戏奖励'
});

// 查询凭证历史
const history = voucherService.getTransactionHistory(voucher.id);
```

### 2. 使用管理界面

```tsx
import { VoucherManager } from '@/voucher-system';

function App() {
  return (
    <VoucherManager
      currentUserId="user-001"
      currentUsername="管理员"
    />
  );
}
```

## API 参考

### VoucherService

#### `createVoucher(input: CreateVoucherInput): Promise<Voucher>`
创建新凭证

#### `transferVoucher(input: TransferVoucherInput): Promise<Voucher>`
转让凭证给其他用户

#### `getVoucherById(id: string): Voucher | null`
根据ID查询凭证

#### `getVouchersByHolder(userId: string): Voucher[]`
查询用户持有的所有凭证

#### `getAllVouchers(): Voucher[]`
查询所有凭证

#### `getTransactionHistory(voucherId: string): VoucherTransaction[]`
查询凭证的流转历史

#### `getStats(): VoucherStats`
获取系统统计信息

## 数据模型

### Voucher (凭证)

```typescript
interface Voucher {
  id: string;                    // 唯一标识符
  value: number;                 // 凭证价值
  status: 'active' | 'locked' | 'revoked';
  issuer: VoucherUser;           // 发行方
  currentHolder: VoucherUser;    // 当前持有人
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
  transferCount: number;         // 流转次数
  metadata?: Record<string, any>;
}
```

### VoucherTransaction (交易记录)

```typescript
interface VoucherTransaction {
  id: string;                    // 交易ID
  voucherId: string;             // 关联凭证ID
  from: VoucherUser;             // 转出方
  to: VoucherUser;               // 接收方
  timestamp: string;             // 交易时间
  remark?: string;               // 备注
}
```

## 安全说明

1. **数据存储**: 当前使用 localStorage 存储，适合演示和轻量使用
2. **防篡改**: 所有交易记录不可修改，确保可追溯性
3. **权限控制**: 只有当前持有人可以转让凭证
4. **总量控制**: 系统限制最大发行量为 10 亿

## 未来扩展

- [ ] 接入后端数据库 (CloudBase/Supabase)
- [ ] 添加数字签名验证
- [ ] 支持凭证锁定/解锁功能
- [ ] 批量转让功能
- [ ] 凭证销毁机制

## 版本历史

- **v1.0.0** - 初始版本，包含基础 CRUD 和流转功能
