/**
 * Skill 生成器使用示例
 * 
 * 展示如何使用配置生成完整的 Skill 代码
 */

import { generateSkill, validateConfig, getDefaultTemplate, getYAMLTemplate } from './index';

// ==================== 示例 1: 极简配置 ====================

const minimalConfig = `
# Skill 配置 - 极简版

## 基础信息
- **游戏ID**: mini-game
- **游戏名称**: 迷你小游戏

## 功能开关
- [x] 钱包系统
- [x] 商店系统

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 1000 |

## 商品列表
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item_001 | 新手礼包 | 0 |
| item_002 | 双倍卡 | 50 |
`;

async function example1_Minimal() {
  console.log('=== 示例 1: 极简配置 ===\n');
  
  const result = await generateSkill(minimalConfig, {
    outputDir: './src/skills/generated',
    generateTypes: true,
    autoFix: true,
  });

  console.log('生成结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('生成文件:', result.files.map(f => f.path));
  console.log('验证结果:', result.validation.valid ? '✅ 通过' : '❌ 失败');
  
  if (result.validation.warnings.length > 0) {
    console.log('警告:', result.validation.warnings);
  }
}

// ==================== 示例 2: 标准配置 ====================

const standardConfig = `
# Skill 配置 - 标准版

## 基础信息
- **游戏ID**: rpg_adventure
- **游戏名称**: 勇者传说
- **接入类型**: 标准接入

## 功能模块
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 500 |
| 算力 | ✅ | 0 |
| A币 | ✅ | 0 |

## 商品列表
| 商品ID | 名称 | 价格(游戏币) | 库存 | 类型 |
|--------|------|-------------:|-----:|------|
| sword_001 | 铁剑 | 100 | 999 | 武器 |
| shield_001 | 木盾 | 80 | 999 | 防具 |
| hp_potion | 生命药水 | 10 | 9999 | 消耗品 |
| mp_potion | 魔法药水 | 15 | 9999 | 消耗品 |

## 商店分类
| 分类ID | 分类名称 | 图标 |
|--------|---------|------|
| weapons | 武器装备 | ⚔️ |
| armors | 防具装备 | 🛡️ |
| consumables | 消耗品 | 🧪 |

## 库存配置
- **同步模式**: 实时同步
- **最大槽位**: 50
`;

async function example2_Standard() {
  console.log('\n=== 示例 2: 标准配置 ===\n');
  
  const result = await generateSkill(standardConfig, {
    outputDir: './src/skills/generated',
    generateTypes: true,
    generateTests: true,
    autoFix: true,
  });

  console.log('生成结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('生成文件:');
  result.files.forEach(f => {
    console.log(`  - ${f.type}: ${f.path}`);
  });
  
  if (result.errors.length > 0) {
    console.log('错误:', result.errors);
  }
}

// ==================== 示例 3: YAML 配置 ====================

const yamlConfig = `
game:
  id: magic_academy
  name: 魔法学院
  description: 学习魔法，成为最强法师
  version: 1.0.0

features:
  - wallet
  - store
  - inventory

wallet:
  enabled: true
  currencies:
    - id: gold
      name: 金币
      type: coin
      initialBalance: 1000
    - id: magic_stone
      name: 魔法石
      type: premium
      initialBalance: 10

store:
  enabled: true
  categories:
    - id: spell_books
      name: 魔法书
    - id: wands
      name: 法杖
    - id: potions
      name: 魔药
  
  products:
    - id: fire_ball_spell
      name: 火球术魔法书
      category: spell_books
      price:
        gold: 500
      stock: 100
      description: 学习基础火球术
      
    - id: beginner_wand
      name: 新手法杖
      category: wands
      price:
        gold: 200
      stock: 50
      description: 新手法师的入门法杖
      
    - id: mana_potion
      name: 魔力药水
      category: potions
      price:
        gold: 50
      stock: 9999
      description: 恢复100点魔力值

inventory:
  enabled: true
  syncMode: realtime
  maxSlots: 30
`;

async function example3_YAML() {
  console.log('\n=== 示例 3: YAML 配置 ===\n');
  
  const result = await generateSkill(yamlConfig, {
    outputDir: './src/skills/generated',
    generateTypes: true,
    autoFix: true,
  });

  console.log('生成结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('生成的类名:', 'MagicAcademySkill');
  
  // 打印生成的代码预览
  const skillFile = result.files.find(f => f.type === 'skill');
  if (skillFile) {
    console.log('\n代码预览 (前50行):');
    console.log(skillFile.content.split('\n').slice(0, 50).join('\n'));
  }
}

// ==================== 示例 4: 验证配置 ====================

async function example4_Validation() {
  console.log('\n=== 示例 4: 配置验证 ===\n');
  
  // 有错误的配置
  const badConfig = `
# 有问题的配置

## 基础信息
- **游戏ID**: 123-invalid-id!!!
- **游戏名称**: 

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | -100 |

## 商品列表
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
|  | 无名商品 | -50 |
`;

  const result = validateConfig(badConfig);
  
  console.log('验证结果:', result.valid ? '✅ 通过' : '❌ 失败');
  console.log('\n错误列表:');
  result.errors.forEach(e => console.log(`  ❌ ${e}`));
  console.log('\n警告列表:');
  result.warnings.forEach(w => console.log(`  ⚠️ ${w}`));
}

// ==================== 示例 5: 大模型生成 ====================

/**
 * 大模型 Prompt 示例
 * 
 * 将以下内容提供给 AI，即可自动生成配置
 */
const aiPromptTemplate = `
你是一个 AllinONE 游戏平台配置助手。

请根据以下游戏需求，生成标准化的 Skill 配置：

【用户需求】
游戏名称: {gameName}
游戏类型: {gameType}
需要的功能: {features}
货币体系: {currencies}
商品需求: {products}

【输出要求】
1. 使用 Markdown 格式
2. 包含完整的基础信息、货币设置、商品列表
3. 游戏ID使用小写下划线格式
4. 价格合理（新手商品便宜，高级商品贵）

【输出格式】
\`\`\`markdown
# Skill 配置

## 基础信息
- **游戏ID**: xxx
- **游戏名称**: xxx
...
\`\`\`
`;

async function example5_AIGeneration() {
  console.log('\n=== 示例 5: AI 生成配置 ===\n');
  
  // 模拟 AI 生成的配置
  const aiGeneratedConfig = `
# Skill 配置 - AI生成

## 基础信息
- **游戏ID**: space_explorer
- **游戏名称**: 太空探险家
- **接入类型**: 标准接入

## 功能模块
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 | 说明 |
|---------|:----:|-------:|------|
| 星币 | ✅ | 1000 | 基础货币 |
| 能源 | ✅ | 100 | 行动消耗 |
| 晶体 | ✅ | 0 | 稀有货币 |

## 商品列表
| 商品ID | 名称 | 价格(星币) | 类型 | 效果 |
|--------|------|-----------:|------|------|
| repair_kit | 维修包 | 50 | 消耗品 | 恢复50%船体 |
| fuel_cell | 燃料棒 | 30 | 消耗品 | +100能源 |
| shield_boost | 护盾增强 | 200 | 道具 | 护盾+20% |
| warp_drive | 跃迁引擎 | 5000 | 装备 | 解锁跃迁 |

## 商店分类
| 分类ID | 分类名称 |
|--------|---------|
| supplies | 补给物资 |
| equipment | 装备配件 |
| upgrades | 飞船升级 |

## 每日奖励
| 触发条件 | 星币 | 能源 |
|---------|-----:|-----:|
| 每日登录 | 100 | 20 |
| 探索新星系 | 500 | 50 |
`;

  console.log('AI 生成的配置:');
  console.log(aiGeneratedConfig);
  
  const result = await generateSkill(aiGeneratedConfig, {
    outputDir: './src/skills/generated',
    autoFix: true,
  });
  
  console.log('\n生成结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('生成文件数:', result.files.length);
}

// ==================== 示例 6: 批量生成 ====================

async function example6_BatchGeneration() {
  console.log('\n=== 示例 6: 批量生成 ===\n');
  
  const configs = [
    // 游戏 1
    `
# 游戏1: 农场物语
- **游戏ID**: farm_life
- **游戏名称**: 农场物语
## 货币: 金币 初始: 500
## 商品: 种子、工具
    `,
    // 游戏 2
    `
# 游戏2: 城市建造
- **游戏ID**: city_builder
- **游戏名称**: 城市建造者
## 货币: 资金 初始: 10000
## 商品: 建筑材料、土地
    `,
    // 游戏 3
    `
# 游戏3: 宠物养成
- **游戏ID**: pet_world
- **游戏名称**: 宠物世界
## 货币: 金币 初始: 1000
## 商品: 宠物粮、玩具
    `,
  ];

  console.log(`批量生成 ${configs.length} 个游戏 Skill...\n`);
  
  for (let i = 0; i < configs.length; i++) {
    const result = await generateSkill(configs[i], {
      outputDir: `./src/skills/generated/game${i + 1}`,
      autoFix: true,
    });
    
    console.log(`游戏 ${i + 1}:`, result.success ? '✅' : '❌', 
      result.files.map(f => f.path.split('/').pop()).join(', '));
  }
}

// ==================== 运行所有示例 ====================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Skill 生成器 - 使用示例           ║');
  console.log('╚════════════════════════════════════════╝\n');

  await example1_Minimal();
  await example2_Standard();
  await example3_YAML();
  await example4_Validation();
  await example5_AIGeneration();
  await example6_BatchGeneration();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         所有示例运行完成!             ║');
  console.log('╚════════════════════════════════════════╝');
}

// 获取模板
export function showTemplates() {
  console.log('=== 默认 Markdown 模板 ===\n');
  console.log(getDefaultTemplate());
  
  console.log('\n\n=== 默认 YAML 模板 ===\n');
  console.log(getYAMLTemplate());
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).SkillGeneratorExamples = {
    runAll: runAllExamples,
    showTemplates,
    generateSkill,
    validateConfig,
  };
  console.log('Skill Generator Examples 已加载到 window.SkillGeneratorExamples');
}

export default {
  runAllExamples,
  showTemplates,
};
