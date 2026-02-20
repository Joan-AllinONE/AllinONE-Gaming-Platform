# AllinONE 道具同步到 New Day 需求文档

## 一、需求概述

实现 AllinONE 平台道具到 New Day 游戏的同步功能，采用**非实时、用户主动触发**的同步模式。

## 二、核心原则

1. **非实时同步**：道具默认存储在 AllinONE，不自动同步到 New Day
2. **用户主动触发**：玩家通过点击"同步到 New Day"按钮主动发起同步
3. **数据一致性**：同步成功后，AllinONE 和 New Day 都拥有该道具
4. **错误处理**：同步失败时保留 AllinONE 数据，不影响玩家使用

## 三、需求场景

### 场景 1：AllinONE 官方商店购买 New Day 道具

1. 玩家在 AllinONE 官方商店购买 New Day 道具（如"黎明之剑"）
2. 道具立即添加到 AllinONE 数据库库存
3. 道具在跨游戏库存中显示，标注 `来源: AllinONE 官方商店`
4. 道具卡片显示"同步到 New Day"按钮（可点击）

### 场景 2：玩家主动同步道具到 New Day

1. 玩家在跨游戏库存中找到购买的 New Day 道具
2. 点击"同步到 New Day"按钮
3. 弹出确认对话框：
   ```
   ⚠️ 确认将此道具同步到 New Day 游戏？
   
   道具: [New Day] 黎明之剑
   稀有度: 史诗
   
   同步后：
   • New Day 游戏中将显示此道具
   • 道具可在 New Day 中使用
   • 此操作不可撤销
   
   [取消] [确认同步]
   ```
4. 玩家确认后，调用 New Day API 同步道具
5. 同步成功：
   - 道具在 New Day 中可用
   - AllinONE 中该道具标注"已同步到 New Day"
   - 同步按钮变为灰色（禁用状态），显示"已同步"
6. 同步失败：
   - 显示错误提示："同步失败，请稍后重试"
   - 道具保留在 AllinONE 中
   - 同步按钮仍可点击

### 场景 3：同步状态管理

**未同步状态：**
- 道具卡片显示蓝色按钮"📤 同步到 New Day"
- 鼠标悬停提示："将此道具同步到 New Day 游戏"

**已同步状态：**
- 道具卡片显示灰色标签"✅ 已同步到 New Day"
- 无同步按钮
- 鼠标悬停提示："此道具已同步到 New Day"

**同步中状态：**
- 按钮变为加载状态："🔄 同步中..."
- 道具卡片半透明
- 禁止其他操作

## 四、技术需求

### 4.1 New Day API 新增端点

#### 端点 1：添加道具到 New Day 库存

```typescript
POST /api/allinone/inventory/add

请求头:
  Authorization: Bearer {newDayToken}
  Content-Type: application/json

请求体:
{
  "itemId": "nd_owned_1234567890_abc123",
  "name": "[New Day] 黎明之剑",
  "description": "传说中的黎明之剑，攻击力+50",
  "type": "weapon",
  "rarity": "epic",
  "quantity": 1,
  "stats": {
    "attack": 50
  },
  "originalSource": "allinone_official_store"
}

成功响应 (200):
{
  "success": true,
  "message": "道具添加成功",
  "item": {
    "id": "newday_original_id_123",
    "name": "[New Day] 黎明之剑",
    ...
  }
}

失败响应:
{
  "success": false,
  "message": "添加失败：道具已存在",
  "errorCode": "ITEM_ALREADY_EXISTS"
}
```

#### 端点 2：查询道具同步状态（可选）

```typescript
GET /api/allinone/inventory/sync-status?itemId={itemId}

成功响应:
{
  "success": true,
  "synced": true,
  "syncedAt": "2026-02-09T10:30:00Z"
}
```

### 4.2 AllinONE 前端修改

#### 4.2.1 数据库字段扩展

在 AllinONE 库存表中添加字段：

```sql
ALTER TABLE inventory ADD COLUMN sync_status VARCHAR(20) DEFAULT 'not_synced';
ALTER TABLE inventory ADD COLUMN synced_at TIMESTAMP NULL;
```

**字段说明：**
- `sync_status`: 同步状态，可选值：
  - `not_synced` - 未同步
  - `syncing` - 同步中
  - `synced` - 已同步
  - `failed` - 同步失败
- `synced_at`: 同步完成时间

#### 4.2.2 后端 API 新增

```typescript
// src/services/inventoryApiService.ts

/**
 * 更新道具同步状态
 */
async updateSyncStatus(itemId: string, status: string, syncedAt?: Date): Promise<void> {
  const response = await this.request<any>(`/inventory/${itemId}/sync-status`, {
    method: 'PATCH',
    body: JSON.stringify({
      syncStatus: status,
      syncedAt: syncedAt?.toISOString(),
    }),
  });
  return response.data;
}
```

#### 4.2.3 前端 UI 组件修改

**组件：** `CrossGameInventory.tsx`

```typescript
interface InventoryItemWithSync extends CrossGameInventoryItem {
  syncStatus?: 'not_synced' | 'syncing' | 'synced' | 'failed';
  syncedAt?: Date;
}

// 同步到 New Day 方法
const syncToNewDay = async (item: InventoryItemWithSync) => {
  if (item.syncStatus === 'synced') {
    alert('此道具已同步到 New Day');
    return;
  }

  const confirmed = confirm(
    `⚠️ 确认将此道具同步到 New Day 游戏？\n\n` +
    `道具: ${item.name}\n` +
    `稀有度: ${item.rarity}\n\n` +
    `同步后：\n` +
    `• New Day 游戏中将显示此道具\n` +
    `• 道具可在 New Day 中使用\n` +
    `• 此操作不可撤销`
  );

  if (!confirmed) return;

  try {
    // 1. 更新状态为同步中
    await inventoryApiService.updateSyncStatus(item.id, 'syncing');
    setItems(items.map(i => 
      i.id === item.id ? { ...i, syncStatus: 'syncing' } : i
    ));

    // 2. 调用 New Day API 同步道具
    const result = await newDayApiService.addItemToNewDay({
      itemId: item.id,
      name: item.name,
      description: item.description,
      type: item.category,
      rarity: item.rarity,
      quantity: 1,
      stats: item.stats,
      originalSource: 'allinone_official_store'
    });

    if (result.success) {
      // 3. 更新状态为已同步
      await inventoryApiService.updateSyncStatus(
        item.id,
        'synced',
        new Date()
      );
      setItems(items.map(i => 
        i.id === item.id 
          ? { ...i, syncStatus: 'synced', syncedAt: new Date() } 
          : i
      ));
      alert('✅ 同步成功！道具已添加到 New Day 游戏');
    } else {
      throw new Error(result.message || '同步失败');
    }
  } catch (error: any) {
    console.error('❌ 同步到 New Day 失败:', error);
    
    // 4. 更新状态为失败
    await inventoryApiService.updateSyncStatus(item.id, 'failed');
    setItems(items.map(i => 
      i.id === item.id ? { ...i, syncStatus: 'failed' } : i
    ));
    
    alert(`❌ 同步失败: ${error.message}`);
  }
};
```

**UI 显示逻辑：**

```tsx
<div className="inventory-item-card">
  <div className="item-header">
    <h3>{item.name}</h3>
    {item.gameSource === 'newday' && item.syncStatus && (
      <SyncBadge status={item.syncStatus} />
    )}
  </div>
  
  {/* 同步按钮 */}
  {item.gameSource === 'newday' && 
   item.syncStatus === 'not_synced' && (
    <button 
      onClick={() => syncToNewDay(item)}
      className="btn-sync"
    >
      📤 同步到 New Day
    </button>
  )}
  
  {item.gameSource === 'newday' && 
   item.syncStatus === 'syncing' && (
    <button disabled className="btn-sync disabled">
      🔄 同步中...
    </button>
  )}
  
  {item.gameSource === 'newday' && 
   item.syncStatus === 'failed' && (
    <button 
      onClick={() => syncToNewDay(item)}
      className="btn-sync retry"
    >
      🔄 重试同步
    </button>
  )}
</div>

// 同步状态徽章组件
function SyncBadge({ status }: { status: string }) {
  switch (status) {
    case 'synced':
      return (
        <span className="badge synced" title="已同步到 New Day">
          ✅ 已同步到 New Day
        </span>
      );
    case 'failed':
      return (
        <span className="badge failed" title="同步失败">
          ❌ 同步失败
        </span>
      );
    default:
      return null;
  }
}
```

### 4.3 `newDayApiService.ts` 新增方法

```typescript
/**
 * 添加道具到 New Day 库存
 * @param item 道具信息
 * @returns 同步结果
 */
async addItemToNewDay(item: {
  itemId: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  quantity: number;
  stats?: any;
  originalSource?: string;
}): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    console.log('📤 添加道具到 New Day:', item);
    
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.API_BASE}/inventory/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    });

    console.log('📥 New Day API 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ New Day API 返回错误:', response.status, errorText);
      return {
        success: false,
        message: `添加失败: ${response.status} ${errorText}`
      };
    }

    const data = await response.json();
    console.log('✅ New Day 添加道具成功:', data);
    
    return {
      success: data.success || false,
      message: data.message,
      data: data.item
    };
  } catch (error: any) {
    console.error('❌ 添加道具到 New Day 异常:', error);
    return {
      success: false,
      message: error?.message || '网络错误'
    };
  }
}

/**
 * 查询道具同步状态（可选）
 */
async getSyncStatus(itemId: string): Promise<{ success: boolean; synced?: boolean; syncedAt?: string }> {
  try {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE}/inventory/sync-status?itemId=${itemId}`,
      { headers }
    );

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      synced: data.synced,
      syncedAt: data.syncedAt
    };
  } catch (error) {
    console.error('❌ 查询同步状态失败:', error);
    return { success: false };
  }
}
```

### 4.4 数据库初始化脚本

```sql
-- 为现有道具添加默认同步状态
UPDATE inventory 
SET sync_status = 'not_synced' 
WHERE game_source = 'newday' 
  AND sync_status IS NULL;

-- 添加索引优化查询
CREATE INDEX idx_inventory_sync_status ON inventory(sync_status);
CREATE INDEX idx_inventory_game_source ON inventory(game_source);
```

## 五、实施步骤

### 阶段一：New Day 后端开发

- [ ] 实现 `POST /api/allinone/inventory/add` 端点
- [ ] 实现 `GET /api/allinone/inventory/sync-status` 端点（可选）
- [ ] 添加道具去重逻辑（避免重复添加）
- [ ] 单元测试

### 阶段二：AllinONE 后端开发

- [ ] 数据库添加 `sync_status` 和 `synced_at` 字段
- [ ] 实现 `PATCH /api/inventory/{itemId}/sync-status` 端点
- [ ] `inventoryApiService` 添加 `updateSyncStatus` 方法
- [ ] API 测试

### 阶段三：AllinONE 前端开发

- [ ] `CrossGameInventory.tsx` 添加同步状态显示
- [ ] 实现同步按钮 UI（未同步/同步中/已同步/失败）
- [ ] 实现确认对话框
- [ ] `newDayApiService` 添加 `addItemToNewDay` 方法
- [ ] 错误处理和重试逻辑
- [ ] UI 样式优化

### 阶段四：测试与优化

- [ ] 端到端测试（购买 → 同步 → 验证）
- [ ] 边界测试（网络异常、重复同步等）
- [ ] 性能优化
- [ ] 文档完善

## 六、注意事项

### 6.1 数据一致性

- 同步成功后，AllinONE 和 New Day 应各自维护道具副本
- 后续修改（如升级、交易）不影响另一端的道具
- 建议在道具描述中标注"从 AllinONE 同步"

### 6.2 错误处理

- 网络超时：提示玩家检查网络，保留重试选项
- 重复添加：New Day 后端返回 `ITEM_ALREADY_EXISTS` 错误码
- 认证失败：提示玩家重新登录 New Day

### 6.3 性能考虑

- 批量同步：如果玩家有多道具待同步，支持批量操作（后期优化）
- 状态缓存：同步状态缓存 5 分钟，减少重复查询
- 按钮防抖：避免重复点击

### 6.4 安全考虑

- 验证用户所有权：只有道具所有者才能同步
- 防止伪造：验证请求来源为 AllinONE 官方
- 记录审计日志：记录所有同步操作

## 七、验收标准

- [ ] 玩家购买 New Day 道具后，道具只在 AllinONE 显示
- [ ] 未同步道具显示"📤 同步到 New Day"按钮
- [ ] 点击同步按钮弹出确认对话框
- [ ] 确认后成功同步到 New Day 游戏
- [ ] 同步成功后按钮变为"✅ 已同步到 New Day"标签
- [ ] 同步失败时道具保留在 AllinONE，支持重试
- [ ] 已同步道具无法重复同步

## 八、附录

### 8.1 相关文件

- New Day API: `https://yxp6y2qgnh.coze.site/api/allinone`
- AllinONE 前端组件: `src/components/CrossGameInventory.tsx`
- AllinONE API 服务: `src/services/newDayApiService.ts`
- AllinONE 库存服务: `src/services/inventoryApiService.ts`

### 8.2 联系方式

如有疑问，请联系：
- AllinONE 开发团队
- New Day 开发团队

---

**文档版本:** 1.0  
**创建日期:** 2026-02-09  
**最后更新:** 2026-02-09
