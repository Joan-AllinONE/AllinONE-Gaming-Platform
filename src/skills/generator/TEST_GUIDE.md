# Skill 配置生成器 - 测试指南

本文档提供完整的测试步骤，包括单元测试、集成测试、端到端测试和手动测试。

## 测试环境准备

### 1. 安装依赖

```bash
cd "d:/AllinONE Gaming Platform"
npm install
```

### 2. 确保测试框架就绪

```bash
# 检查 vitest 是否安装
npx vitest --version

# 如果没有安装
npm install -D vitest
```

## 一、自动化测试

### 1. 运行所有测试

```bash
# 运行生成器相关测试
npx vitest src/skills/generator/__tests__

# 运行所有测试
npx vitest

# 带覆盖率报告
npx vitest --coverage
```

### 2. 运行特定测试文件

```bash
# 单元测试 - 配置解析器
npx vitest src/skills/generator/__tests__/SkillConfigParser.test.ts

# 单元测试 - 配置验证器
npx vitest src/skills/generator/__tests__/ConfigValidator.test.ts

# 单元测试 - 代码生成器
npx vitest src/skills/generator/__tests__/SkillCodeGenerator.test.ts

# 集成测试
npx vitest src/skills/generator/__tests__/integration.test.ts

# 端到端测试
npx vitest src/skills/generator/__tests__/e2e.test.ts
```

### 3. 测试输出说明

```
 ✓ src/skills/generator/__tests__/SkillConfigParser.test.ts (8 tests)
 ✓ src/skills/generator/__tests__/ConfigValidator.test.ts (9 tests)
 ✓ src/skills/generator/__tests__/SkillCodeGenerator.test.ts (10 tests)
 ✓ src/skills/generator/__tests__/integration.test.ts (6 tests)
 ✓ src/skills/generator/__tests__/e2e.test.ts (6 tests)

Test Files  5 passed (5)
     Tests  39 passed (39)
```

## 二、手动测试步骤

### 测试 1: 基础配置解析

**目的**: 验证 Markdown 配置解析功能

**步骤**:

1. 在浏览器控制台或 Node.js 环境中运行：

```typescript
import { SkillConfigParser } from '@/skills/generator';

const markdown = `
# Skill 配置

## 基础信息
- **游戏ID**: test_game
- **游戏名称**: 测试游戏

## 功能开关
- [x] 钱包系统
- [x] 商店系统

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 1000 |
| 钻石 | ✅ | 100 |

## 商品列表
| 商品ID | 名称 | 价格 | 类型 |
|--------|------|-----:|------|
| sword_001 | 铁剑 | 100 | 武器 |
| potion_001 | 药水 | 10 | 消耗品 |
`;

const config = SkillConfigParser.parseMarkdown(markdown);

// 验证结果
console.log('游戏ID:', config.gameId);  // 期望: test_game
console.log('游戏名称:', config.gameName);  // 期望: 测试游戏
console.log('功能:', config.features);  // 期望: ['wallet', 'store']
console.log('货币数量:', config.currencies.length);  // 期望: 2
console.log('商品数量:', config.products.length);  // 期望: 2
```

**预期结果**:
- `gameId` 为 `test_game`
- `gameName` 为 `测试游戏`
- `features` 包含 `wallet` 和 `store`
- `currencies` 有 2 个货币配置
- `products` 有 2 个商品配置

### 测试 2: YAML 配置解析

**目的**: 验证 YAML 配置解析功能

**步骤**:

```typescript
import { SkillConfigParser } from '@/skills/generator';

const yaml = `
game:
  id: yaml_game
  name: YAML游戏
  version: 2.0.0

features:
  - wallet
  - store
  - inventory

wallet:
  currencies:
    - id: gold
      name: 金币
      initialBalance: 500
`;

const config = SkillConfigParser.parseYAML(yaml);

console.log('游戏ID:', config.gameId);
console.log('版本:', config.version);
console.log('功能:', config.features);
```

**预期结果**:
- 正确解析所有字段
- 嵌套结构正常

### 测试 3: 配置验证

**目的**: 验证配置验证和自动修复功能

**步骤**:

```typescript
import { ConfigValidator } from '@/skills/generator';

// 测试无效配置
const invalidConfig = {
  gameId: '123-invalid!!!',
  gameName: '',
  currencies: [
    { id: 'coin', name: '游戏币', initialBalance: -100, enabled: true }
  ]
};

const result = ConfigValidator.validate(invalidConfig);

console.log('验证结果:', result.valid);  // 期望: false
console.log('错误:', result.errors);
console.log('警告:', result.warnings);

// 测试自动修复
const fixed = ConfigValidator.autoFix(invalidConfig);
console.log('修复后的 ID:', fixed.gameId);  // 期望: 修复为合法格式
```

**预期结果**:
- 检测到多个错误
- 自动修复后配置合法

### 测试 4: 代码生成

**目的**: 验证代码生成功能

**步骤**:

```typescript
import { generateSkill } from '@/skills/generator';

const config = `
# Skill 配置
## 基础信息
- **游戏ID**: hero_game
- **游戏名称**: 英雄游戏

## 功能
- [x] 钱包系统
- [x] 商店系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |

## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item1 | 道具1 | 50 |
`;

const result = await generateSkill(config, {
  generateTypes: true,
  autoFix: true
});

console.log('生成成功:', result.success);
console.log('文件数量:', result.files.length);
console.log('验证通过:', result.validation.valid);

// 查看生成的代码
const skillFile = result.files.find(f => f.type === 'skill');
console.log('Skill 代码预览:', skillFile?.content.substring(0, 500));
```

**预期结果**:
- 生成成功
- 生成 4 个文件（skill + types + test + config）
- 包含类定义、钱包功能、商店功能

### 测试 5: 可视化配置向导

**目的**: 测试 SkillConfigWizard 组件

**步骤**:

1. 在项目中引入组件：

```tsx
import { SkillConfigWizard } from '@/publishing-center';

function TestPage() {
  return (
    <SkillConfigWizard
      onGenerate={(result) => {
        console.log('生成结果:', result);
        if (result.success) {
          alert('生成成功！');
        }
      }}
    />
  );
}
```

2. 在浏览器中打开页面

3. 按照向导步骤操作：
   - **步骤 1**: 填写游戏ID和名称
   - **步骤 2**: 勾选需要的功能（钱包、商店、库存）
   - **步骤 3**: 配置货币（添加/删除/修改）
   - **步骤 4**: 配置商品（添加/删除/修改）
   - **步骤 5**: 点击生成代码

4. 验证：
   - 步骤导航正常工作
   - 表单验证正确
   - 生成的代码可以复制
   - 验证结果显示正确

### 测试 6: 完整工作流程

**目的**: 模拟真实的游戏接入流程

**步骤**:

1. **创建游戏配置**（模拟开发者填写）:

```typescript
const gameConfig = `
# Skill 配置 - 我的 RPG 游戏

## 基础信息
- **游戏ID**: my_rpg_game
- **游戏名称**: 我的 RPG 游戏
- **版本**: 1.0.0

## 功能模块
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 金币 | ✅ | 500 |
| 钻石 | ✅ | 50 |
| 算力 | ✅ | 0 |

## 商品列表
| 商品ID | 名称 | 价格(金币) | 库存 | 类型 |
|--------|------|-----------:|-----:|------|
| iron_sword | 铁剑 | 100 | 999 | 武器 |
| wooden_shield | 木盾 | 80 | 999 | 防具 |
| hp_potion | 生命药水 | 10 | 9999 | 消耗品 |
| mp_potion | 魔法药水 | 15 | 9999 | 消耗品 |
| exp_boost | 经验加成 | 100 | 100 | 道具 |

## 商店分类
| 分类ID | 分类名称 | 图标 |
|--------|---------|------|
| weapons | 武器 | ⚔️ |
| armors | 防具 | 🛡️ |
| consumables | 消耗品 | 🧪 |
| items | 道具 | 🎁 |
`;
```

2. **生成 Skill 代码**:

```typescript
const result = await generateSkill(gameConfig, {
  outputDir: './src/skills/generated',
  generateTypes: true,
  autoFix: true
});

if (!result.success) {
  console.error('生成失败:', result.errors);
  return;
}

console.log('✅ 生成成功!');
console.log('生成的文件:');
result.files.forEach(f => console.log(`  - ${f.path}`));
```

3. **验证生成的代码**:

```typescript
const skillFile = result.files.find(f => f.type === 'skill');

// 验证包含必要内容
const checks = [
  { name: '类定义', test: () => skillFile?.content.includes('class MyRpgGameSkill') },
  { name: '钱包功能', test: () => skillFile?.content.includes('handleGetBalance') },
  { name: '商店功能', test: () => skillFile?.content.includes('handlePurchase') },
  { name: '库存功能', test: () => skillFile?.content.includes('handleGetInventory') },
  { name: '货币初始化', test: () => skillFile?.content.includes('金币') },
  { name: '商品定义', test: () => skillFile?.content.includes('iron_sword') },
];

checks.forEach(check => {
  console.log(`${check.test() ? '✅' : '❌'} ${check.name}`);
});
```

4. **模拟使用 Skill**:

```typescript
// 注意：这里只是模拟，实际需要在真实环境中测试
console.log('模拟调用 Skill 动作:');
console.log('  1. getBalance({ currency: "金币" })');
console.log('  2. getProducts({ category: "weapons" })');
console.log('  3. purchase({ productId: "iron_sword" })');
console.log('  4. getInventory()');
```

### 测试 7: 边界情况测试

**目的**: 测试极端情况和错误处理

**步骤**:

1. **空配置**:

```typescript
const emptyResult = await generateSkill('# 空配置', { autoFix: true });
console.log('空配置生成:', emptyResult.success);
```

2. **超大配置**:

```typescript
// 生成大量商品
let largeConfig = '# 大配置\n## 基础信息\n- **游戏ID**: large_game\n## 货币\n| 货币 | 初始值 |\n|------|-------:|\n| coin | 1000 |\n## 商品\n| 商品ID | 名称 | 价格 |\n|--------|------|-----:|';

for (let i = 1; i <= 100; i++) {
  largeConfig += `\n| item_${i} | 商品${i} | ${i * 10} |`;
}

const largeResult = await generateSkill(largeConfig);
console.log('大配置生成:', largeResult.success);
console.log('商品数量:', largeResult.files[0]?.content.match(/id: 'item_/g)?.length);
```

3. **特殊字符**:

```typescript
const specialConfig = `
# 特殊字符测试
## 基础信息
- **游戏ID**: special_test
- **游戏名称**: 游戏《测试》"V1.0" - 中文版

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币💰 | 1000 |
| 钻石💎 | 100 |
`;

const specialResult = await generateSkill(specialConfig, { autoFix: true });
console.log('特殊字符处理:', specialResult.success);
```

## 三、性能测试

### 测试 8: 生成性能

**目的**: 测试代码生成性能

**步骤**:

```typescript
import { generateSkill } from '@/skills/generator';

async function performanceTest() {
  const configs = [
    { name: '极简配置', size: 'small', config: getMinimalConfig() },
    { name: '标准配置', size: 'medium', config: getStandardConfig() },
    { name: '复杂配置', size: 'large', config: getComplexConfig() },
  ];

  for (const { name, config } of configs) {
    const start = performance.now();
    const result = await generateSkill(config);
    const end = performance.now();
    
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    console.log(`  生成成功: ${result.success}`);
    console.log(`  文件数量: ${result.files.length}`);
    console.log(`  代码大小: ${result.files[0]?.content.length} 字符`);
  }
}

function getMinimalConfig() {
  return `
# 极简
## 基础信息
- **游戏ID**: mini
- **游戏名称**: 迷你游戏
## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |
`;
}

function getStandardConfig() {
  return `
# 标准
## 基础信息
- **游戏ID**: standard
- **游戏名称**: 标准游戏
## 功能
- [x] 钱包系统
- [x] 商店系统
## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |
| gem | 100 |
## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item1 | 道具1 | 50 |
| item2 | 道具2 | 100 |
| item3 | 道具3 | 150 |
`;
}

function getComplexConfig() {
  let config = `
# 复杂
## 基础信息
- **游戏ID**: complex
- **游戏名称**: 复杂游戏
## 功能
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步
- [x] 排行榜
- [x] 成就系统
## 货币
| 货币 | 初始值 |
|------|-------:|
| copper | 1000 |
| silver | 100 |
| gold | 10 |
| diamond | 0 |
| power | 0 |
## 商品
| 商品ID | 名称 | 价格 | 类型 |
|--------|------|-----:|------|`;

  for (let i = 1; i <= 50; i++) {
    config += `\n| item_${i} | 商品${i} | ${i * 10} | type${i % 5} |`;
  }
  
  return config;
}

performanceTest();
```

**预期结果**:
- 极简配置: < 100ms
- 标准配置: < 200ms
- 复杂配置: < 500ms

## 四、测试检查清单

### 功能测试

- [ ] Markdown 配置解析正确
- [ ] YAML 配置解析正确
- [ ] 功能开关解析正确
- [ ] 货币表格解析正确
- [ ] 商品表格解析正确
- [ ] 配置验证能检测错误
- [ ] 自动修复能修复常见问题
- [ ] 代码生成成功
- [ ] 生成的代码包含所有功能
- [ ] 类型定义文件生成正确
- [ ] 配置文件导出正确

### 边界测试

- [ ] 空配置处理
- [ ] 超大配置处理
- [ ] 特殊字符处理
- [ ] 无效 ID 自动修复
- [ ] 负数价格检测
- [ ] 重复 ID 检测

### 性能测试

- [ ] 小配置生成时间 < 100ms
- [ ] 中配置生成时间 < 200ms
- [ ] 大配置生成时间 < 500ms
- [ ] 内存使用合理

### UI 测试

- [ ] 向导步骤导航正常
- [ ] 表单验证正确
- [ ] 动态添加/删除货币正常
- [ ] 动态添加/删除商品正常
- [ ] 代码预览正常
- [ ] 复制功能正常

## 五、常见问题排查

### 问题 1: 测试运行失败

**症状**: `npx vitest` 报错

**解决**:
```bash
# 清除缓存
npx vitest --clearCache

# 重新安装依赖
rm -rf node_modules
npm install

# 再次运行
npx vitest
```

### 问题 2: 导入路径错误

**症状**: `Cannot find module '@/skills/generator'`

**解决**: 确保 `tsconfig.json` 中配置了正确的路径映射：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 问题 3: 生成的代码有语法错误

**症状**: TypeScript 编译错误

**解决**:
1. 检查配置中的特殊字符
2. 验证商品 ID 格式
3. 确保货币 ID 唯一
4. 使用 `autoFix: true` 自动修复

## 六、测试报告模板

```markdown
# Skill 生成器测试报告

## 测试日期
2024-XX-XX

## 测试环境
- Node.js: v18.x
- TypeScript: 5.x
- Vitest: 1.x

## 测试结果

### 单元测试
| 模块 | 测试数 | 通过 | 失败 |
|------|-------:|-----:|-----:|
| SkillConfigParser | 8 | 8 | 0 |
| ConfigValidator | 9 | 9 | 0 |
| SkillCodeGenerator | 10 | 10 | 0 |

### 集成测试
| 场景 | 结果 |
|------|------|
| Markdown 配置流程 | ✅ 通过 |
| YAML 配置流程 | ✅ 通过 |
| 错误处理流程 | ✅ 通过 |

### 端到端测试
| 场景 | 结果 |
|------|------|
| RPG 游戏完整接入 | ✅ 通过 |
| 休闲游戏快速接入 | ✅ 通过 |
| 配置错误处理 | ✅ 通过 |

### 性能测试
| 配置大小 | 生成时间 | 结果 |
|---------|---------|------|
| 小 | 50ms | ✅ 通过 |
| 中 | 120ms | ✅ 通过 |
| 大 | 350ms | ✅ 通过 |

## 结论
所有测试通过，系统可正常使用。
```

---

按照以上步骤进行测试，确保 Skill 配置生成器的各项功能正常工作。
