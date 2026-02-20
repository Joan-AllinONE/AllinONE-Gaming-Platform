# AllinONE 登录与同步逻辑修复

## 修复内容

### 1. 正确的逻辑流程

```
用户访问 AllinONE
    ↓
用户未登录 → 显示登录页面
    ↓
用户登录 AllinONE → 存储 currentUser 到 localStorage
    ↓
自动登录 New Day → 获取 New Day token
    ↓
初始化 New Day 集成 → 钱包同步 + 库存同步
    ↓
开始自动同步 (每30秒)
```

### 2. 修复的文件

#### `src/components/NewDayIntegrationInit.tsx`
- 现在正确检查 `localStorage.getItem('currentUser')`
- 只在用户登录后才初始化 New Day 集成
- 使用 Login.tsx 存储的用户信息格式

#### `src/services/inventoryApiService.ts`
- 修复 `getCurrentUser()` 方法，使用 `currentUser` key
- 正确解析用户 ID 和用户名

#### `server.js`
- 恢复 401 认证检查
- 只有登录用户才能访问库存 API

### 3. 数据流

**登录时 (Login.tsx)**:
```javascript
localStorage.setItem('currentUser', JSON.stringify(account));
// account 格式: { id, username, email, profile, ... }
```

**检查登录状态 (NewDayIntegrationInit.tsx)**:
```javascript
const currentUserStr = localStorage.getItem('currentUser');
if (!currentUserStr) {
  console.log('ℹ️ AllinONE 用户未登录，跳过 New Day 集成初始化');
  return;
}
```

**API 调用时 (inventoryApiService.ts)**:
```javascript
const user = this.getCurrentUser(); // 从 currentUser 获取
const token = `user-${user.userId}_${newDayToken}`;
```

## 测试步骤

1. **清除浏览器数据**
   - 清除 localStorage
   - 刷新页面

2. **未登录状态**
   - 应该看到登录页面
   - 控制台应该显示: "ℹ️ AllinONE 用户未登录，跳过 New Day 集成初始化"
   - 不应该有 401 错误 (因为没有调用 API)

3. **登录**
   - 输入用户名密码登录
   - 控制台应该显示:
     - "🚀 AllinONE 用户已登录: {username}"
     - "✅ New Day 自动登录成功"
     - "✅ New Day 集成初始化完成"

4. **同步验证**
   - 进入游戏中心 → New Day
   - 应该看到从 New Day 同步的道具
   - 控制台应该显示: "✅ 从 New Day 获取库存: X 个道具"

## 常见问题

### Q: 登录后仍然显示 "用户未登录"
**A**: 检查 localStorage 中是否有 `currentUser` 项

### Q: New Day 登录失败
**A**: 检查网络连接和 New Day API 状态

### Q: 同步失败 401
**A**: 确保登录后刷新了页面，或者检查 token 是否正确生成
