/**
 * Skill 配置生成器演示
 * 
 * 这个文件展示了如何使用生成器完成常见的游戏接入场景
 * 可以在浏览器控制台或 Node.js 环境中运行
 */

import { generateSkill, validateConfig, getDefaultTemplate, getYAMLTemplate } from '../index';

// ==================== 场景 1: 快速创建简单游戏 ====================

export async function demoQuickStart() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  场景 1: 快速创建简单游戏 (1分钟)       ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const config = `
# Skill 配置

## 基础信息
- **游戏ID**: mini_puzzle
- **游戏名称**: 迷你拼图

## 功能
- [x] 钱包系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 500 |
`;

  console.log('📋 配置内容:');
  console.log(config);
  console.log('');

  console.log('⏳ 正在生成 Skill...');
  const result = await generateSkill(config, {
    generateTypes: false,
    autoFix: true,
  });

  if (result.success) {
    console.log('✅ 生成成功!\n');
    console.log('📁 生成的文件:');
    result.files.forEach(f => {
      console.log(`   - ${f.path} (${f.type})`);
    });
    
    console.log('\n📝 代码预览 (前 30 行):');
    const skillFile = result.files.find(f => f.type === 'skill');
    if (skillFile) {
      console.log(skillFile.content.split('\n').slice(0, 30).join('\n'));
    }
  } else {
    console.error('❌ 生成失败:', result.errors);
  }

  return result;
}

// ==================== 场景 2: RPG 游戏完整接入 ====================

export async function demoRPGGame() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  场景 2: RPG 游戏完整接入 (5分钟)       ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const config = `
# Skill 配置 - 勇者传说

## 基础信息
- **游戏ID**: hero_legend_rpg
- **游戏名称**: 勇者传说
- **版本**: 1.0.0

## 功能模块
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步
- [x] 排行榜

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 金币 | ✅ | 1000 |
| 钻石 | ✅ | 100 |
| 算力 | ✅ | 0 |

## 商品列表
| 商品ID | 名称 | 金币 | 钻石 | 类型 |
|--------|------|-----:|-----:|------|
| iron_sword | 铁剑 | 100 | - | 武器 |
| steel_armor | 钢甲 | 200 | - | 防具 |
| hp_potion | 生命药水 | 10 | - | 消耗品 |
| revive_stone | 复活石 | - | 10 | 道具 |
| exp_boost | 经验加成 | - | 50 | 道具 |

## 商店分类
| 分类ID | 名称 | 图标 |
|--------|------|------|
| weapons | 武器 | ⚔️ |
| armors | 防具 | 🛡️ |
| consumables | 消耗品 | 🧪 |
| items | 道具 | 🎁 |

## 库存配置
- **最大槽位**: 50
- **同步模式**: 实时
`;

  console.log('📋 配置内容:');
  console.log(config);
  console.log('');

  console.log('⏳ 正在生成 Skill...');
  const result = await generateSkill(config, {
    generateTypes: true,
    generateTests: true,
    autoFix: true,
  });

  if (result.success) {
    console.log('✅ 生成成功!\n');
    console.log('📊 统计信息:');
    console.log(`   - 生成功能: ${result.files.length} 个文件`);
    console.log(`   - 代码行数: ${result.files[0]?.content.split('\n').length} 行`);
    console.log(`   - 货币种类: 3 种`);
    console.log(`   - 商品数量: 5 个`);
    
    console.log('\n🎮 生成的功能:');
    console.log('   ✓ 钱包: getBalance, addBalance, deductBalance');
    console.log('   ✓ 商店: getProducts, purchase');
    console.log('   ✓ 库存: getInventory, useItem, addItem');
    console.log('   ✓ 数据: getGameData');
  } else {
    console.error('❌ 生成失败:', result.errors);
  }

  return result;
}

// ==================== 场景 3: 休闲游戏接入 ====================

export async function demoCasualGame() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  场景 3: 休闲游戏接入 (消消乐类型)      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const config = `
# Skill 配置 - 糖果消消乐

## 基础信息
- **游戏ID**: candy_match_3
- **游戏名称**: 糖果消消乐

## 功能
- [x] 钱包系统
- [x] 商店系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 5000 |
| 体力 | 100 |
| 星星 | 0 |

## 商品
| 商品ID | 名称 | 金币 | 效果 |
|--------|------|-----:|------|
| hammer | 锤子道具 | 50 | 消除单个 |
| bomb | 炸弹道具 | 100 | 消除3x3 |
| rainbow | 彩虹糖 | 200 | 消除同色 |
| shuffle | 重置 | 30 | 重新排列 |
| extra_time | 加时 | 80 | +30秒 |
| life_pack | 体力包 | - | 恢复5点体力 |
`;

  console.log('⏳ 正在生成 Skill...');
  const result = await generateSkill(config, { autoFix: true });

  if (result.success) {
    console.log('✅ 生成成功!');
    console.log('🎮 这是一个典型的休闲游戏配置:');
    console.log('   - 多种道具支持不同策略');
    console.log('   - 体力系统限制游戏时长');
    console.log('   - 星星作为成就货币');
  }

  return result;
}

// ==================== 场景 4: 错误处理演示 ====================

export async function demoErrorHandling() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  场景 4: 错误处理和自动修复             ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 有错误的配置
  const badConfig = `
# 有问题的配置

## 基础信息
- **游戏ID**: 123-INVALID-ID!!!
- **游戏名称**: 

## 货币
| 货币 | 初始值 |
|------|-------:|
| Invalid-Coin | -100 |

## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
|  | 无名商品 | -50 |
`;

  console.log('📋 有问题的配置:');
  console.log(badConfig);
  console.log('');

  console.log('🔍 验证配置（不自动修复）...');
  const validation1 = validateConfig(badConfig);
  console.log('验证结果:', validation1.valid ? '✅ 通过' : '❌ 失败');
  console.log('错误数:', validation1.errors.length);
  console.log('警告数:', validation1.warnings.length);
  
  if (validation1.errors.length > 0) {
    console.log('\n❌ 检测到的错误:');
    validation1.errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  }

  console.log('\n🔧 使用自动修复生成...');
  const result = await generateSkill(badConfig, { autoFix: true });
  
  if (result.success) {
    console.log('✅ 自动修复成功!');
    console.log('修复后的配置已生成');
    
    const configFile = result.files.find(f => f.type === 'config');
    if (configFile) {
      console.log('\n📄 修复后的配置:');
      console.log(configFile.content.substring(0, 500));
    }
  } else {
    console.error('❌ 即使自动修复也失败:', result.errors);
  }

  return result;
}

// ==================== 场景 5: YAML 配置 ====================

export async function demoYAMLConfig() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  场景 5: 使用 YAML 格式配置             ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const yamlConfig = `
game:
  id: magic_academy_yaml
  name: 魔法学院
  description: 学习魔法，成为最强法师
  version: 2.0.0

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
      exchangeable: false
    - id: magic_stone
      name: 魔法石
      type: premium
      initialBalance: 10
      exchangeable: true
    - id: mana
      name: 魔力值
      type: energy
      initialBalance: 100
      exchangeable: false

store:
  enabled: true
  categories:
    - id: spell_books
      name: 魔法书
      description: 各类魔法咒语书
    - id: wands
      name: 法杖
      description: 施法工具
    - id: potions
      name: 魔药
      description: 恢复和增益药水
  
  products:
    - id: fire_ball_spell
      name: 火球术
      category: spell_books
      price:
        gold: 500
      stock: 100
      description: 基础攻击魔法
      
    - id: ice_shard_spell
      name: 冰锥术
      category: spell_books
      price:
        gold: 600
        magic_stone: 2
      stock: 80
      description: 冰冻攻击魔法
      
    - id: beginner_wand
      name: 新手法杖
      category: wands
      price:
        gold: 200
      stock: 50
      description: 新手法师入门装备
      
    - id: master_wand
      name: 大师法杖
      category: wands
      price:
        gold: 5000
        magic_stone: 50
      stock: 5
      description: 高阶法师专用
      
    - id: mana_potion
      name: 魔力药水
      category: potions
      price:
        gold: 50
      stock: 9999
      description: 恢复50点魔力
      
    - id: power_elixir
      name: 力量药剂
      category: potions
      price:
        magic_stone: 5
      stock: 100
      description: 1小时内魔法伤害+20%

inventory:
  enabled: true
  syncMode: realtime
  maxSlots: 30
  categories:
    - spell_books
    - wands
    - potions
    - materials
`;

  console.log('📋 YAML 配置（节选）:');
  console.log(yamlConfig.substring(0, 800) + '...\n');

  console.log('⏳ 正在生成 Skill...');
  const result = await generateSkill(yamlConfig, { autoFix: true });

  if (result.success) {
    console.log('✅ YAML 配置生成成功!');
    console.log('🎮 这是一个复杂的魔法主题 RPG 配置:');
    console.log('   - 3 种货币：金币、魔法石、魔力值');
    console.log('   - 3 个商品分类');
    console.log('   - 6 种商品，支持多货币定价');
    console.log('   - 详细的商品描述和效果');
  }

  return result;
}

// ==================== 场景 6: 模板使用 ====================

export async function demoTemplates() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  场景 6: 使用预设模板                   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log('📄 可用模板:');
  console.log('');
  
  console.log('1️⃣ 极简模板 (minimal.skill.md):');
  console.log('   适合: 快速接入、简单游戏');
  console.log('   配置项: 基础信息 + 1-2 个功能');
  console.log('   预计时间: 1 分钟\n');
  
  console.log('2️⃣ 标准模板 (standard.skill.md):');
  console.log('   适合: 大多数游戏场景');
  console.log('   配置项: 完整功能 + 多货币 + 商品分类');
  console.log('   预计时间: 5 分钟\n');
  
  console.log('3️⃣ 完整模板 (full.skill.yaml):');
  console.log('   适合: 复杂游戏、精细控制');
  console.log('   配置项: 所有功能 + 高级配置 + 事件钩子');
  console.log('   预计时间: 15 分钟\n');

  console.log('💡 获取模板:');
  const mdTemplate = getDefaultTemplate();
  const yamlTemplate = getYAMLTemplate();
  
  console.log(`   - Markdown 模板: ${mdTemplate.split('\n').length} 行`);
  console.log(`   - YAML 模板: ${yamlTemplate.split('\n').length} 行`);
  
  console.log('\n✅ 模板文件已创建在: src/skills/templates/');
}

// ==================== 运行所有演示 ====================

export async function runAllDemos() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║     🎮 Skill 配置生成器 - 完整演示                    ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const demos = [
    { name: '快速开始', fn: demoQuickStart },
    { name: 'RPG 游戏', fn: demoRPGGame },
    { name: '休闲游戏', fn: demoCasualGame },
    { name: '错误处理', fn: demoErrorHandling },
    { name: 'YAML 配置', fn: demoYAMLConfig },
    { name: '模板使用', fn: demoTemplates },
  ];

  const results = [];

  for (const demo of demos) {
    try {
      const result = await demo.fn();
      results.push({ name: demo.name, success: true, result });
    } catch (error) {
      console.error(`❌ ${demo.name} 演示失败:`, error);
      results.push({ name: demo.name, success: false, error });
    }
    
    // 演示之间添加停顿
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 总结
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                     演示总结                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const successCount = results.filter(r => r.success).length;
  console.log(`完成演示: ${successCount}/${results.length}\n`);

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
  });

  console.log('\n✨ 所有演示完成！');
  console.log('📖 详细文档请参考: src/skills/generator/README.md');
  console.log('🧪 测试指南请参考: src/skills/generator/TEST_GUIDE.md\n');

  return results;
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  (window as any).SkillGeneratorDemos = {
    demoQuickStart,
    demoRPGGame,
    demoCasualGame,
    demoErrorHandling,
    demoYAMLConfig,
    demoTemplates,
    runAllDemos,
  };
  console.log('演示函数已加载到 window.SkillGeneratorDemos');
  console.log('运行: await SkillGeneratorDemos.runAllDemos()');
}

export default {
  demoQuickStart,
  demoRPGGame,
  demoCasualGame,
  demoErrorHandling,
  demoYAMLConfig,
  demoTemplates,
  runAllDemos,
};
