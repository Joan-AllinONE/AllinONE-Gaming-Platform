/**
 * 集成测试 - 完整流程测试
 * 
 * 测试从配置解析到代码生成的完整流程
 */

import { describe, it, expect } from 'vitest';
import { generateSkill, validateConfig } from '../index';
import { SkillConfigParser } from '../SkillConfigParser';
import { ConfigValidator } from '../ConfigValidator';
import { SkillCodeGenerator } from '../SkillCodeGenerator';

describe('集成测试 - 完整流程', () => {
  describe('Markdown 配置流程', () => {
    it('应该从 Markdown 生成完整的 Skill 代码', async () => {
      const markdown = `
# Skill 配置 - 勇者传说

## 基础信息
- **游戏ID**: hero_legend
- **游戏名称**: 勇者传说
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

## 商品列表
| 商品ID | 名称 | 价格(金币) | 库存 | 类型 |
|--------|------|-----------:|-----:|------|
| iron_sword | 铁剑 | 100 | 999 | 武器 |
| wooden_shield | 木盾 | 80 | 999 | 防具 |
| hp_potion | 生命药水 | 10 | 9999 | 消耗品 |
`;

      const result = await generateSkill(markdown, {
        generateTypes: true,
        autoFix: true,
      });

      // 验证生成结果
      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.files).toHaveLength(4); // skill + types + test + config

      // 验证 Skill 文件
      const skillFile = result.files.find(f => f.type === 'skill');
      expect(skillFile).toBeDefined();
      expect(skillFile?.content).toContain('class HeroLegendSkill extends BaseSkill');
      expect(skillFile?.content).toContain('handleGetBalance');
      expect(skillFile?.content).toContain('handlePurchase');

      // 验证类型文件
      const typesFile = result.files.find(f => f.type === 'types');
      expect(typesFile).toBeDefined();
      expect(typesFile?.content).toContain('HeroLegendConfig');
    });
  });

  describe('YAML 配置流程', () => {
    it('应该从 YAML 生成完整的 Skill 代码', async () => {
      const yaml = `
game:
  id: magic_academy
  name: 魔法学院
  description: 学习魔法，成为最强法师
  version: 2.0.0

features:
  - wallet
  - store

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
  products:
    - id: fire_ball_spell
      name: 火球术
      category: spell_books
      price:
        gold: 500
      stock: 100
    - id: beginner_wand
      name: 新手法杖
      category: wands
      price:
        gold: 200
      stock: 50
`;

      const result = await generateSkill(yaml, {
        generateTypes: true,
        autoFix: true,
      });

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);

      const skillFile = result.files.find(f => f.type === 'skill');
      expect(skillFile?.content).toContain('class MagicAcademySkill');
      expect(skillFile?.content).toContain('fire_ball_spell');
      expect(skillFile?.content).toContain('beginner_wand');
    });
  });

  describe('错误处理流程', () => {
    it('应该处理无效配置并返回错误', async () => {
      const invalidConfig = `
# 无效配置
## 基础信息
- **游戏ID**: 123-invalid!!!
- **游戏名称**: 
`;

      const result = await generateSkill(invalidConfig, {
        autoFix: false,
        validationLevel: 'strict',
      });

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该自动修复配置错误', async () => {
      const configWithErrors = `
# 有错误的配置
## 基础信息
- **游戏ID**: INVALID-ID
- **游戏名称**: 测试游戏

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| INVALID-Coin | ✅ | 100 |
`;

      const result = await generateSkill(configWithErrors, {
        autoFix: true,
      });

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
    });
  });

  describe('多种游戏类型测试', () => {
    it('应该处理 RPG 游戏配置', async () => {
      const rpgConfig = `
# RPG 游戏
## 基础信息
- **游戏ID**: dragon_quest
- **游戏名称**: 龙之 quest

## 功能
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步
- [x] 排行榜
- [x] 成就系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 500 |
| 钻石 | 0 |
| 算力 | 0 |

## 商品
| 商品ID | 名称 | 金币 | 钻石 |
|--------|------|-----:|-----:|
| sword | 铁剑 | 100 | - |
| revive | 复活石 | - | 10 |
`;

      const result = await generateSkill(rpgConfig);
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(4);
    });

    it('应该处理休闲游戏配置', async () => {
      const casualConfig = `
# 休闲游戏
## 基础信息
- **游戏ID**: candy_match
- **游戏名称**: 糖果消消乐

## 功能
- [x] 钱包系统
- [x] 商店系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 1000 |
| 体力 | 100 |

## 商品
| 商品ID | 名称 | 金币 | 效果 |
|--------|------|-----:|------|
| hammer | 锤子 | 50 | 消除单个 |
| bomb | 炸弹 | 100 | 消除3x3 |
`;

      const result = await generateSkill(casualConfig);
      expect(result.success).toBe(true);
    });

    it('应该处理简单游戏配置', async () => {
      const simpleConfig = `
# 简单游戏
## 基础信息
- **游戏ID**: mini_game
- **游戏名称**: 迷你游戏

## 功能
- [x] 钱包系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 游戏币 | 1000 |
`;

      const result = await generateSkill(simpleConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('模块协作测试', () => {
    it('解析器 -> 验证器 -> 生成器 应该协同工作', () => {
      const markdown = `
# Skill 配置
## 基础信息
- **游戏ID**: test_flow
- **游戏名称**: 流程测试

## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |

## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item1 | 道具1 | 50 |
`;

      // 1. 解析
      const config = SkillConfigParser.parseMarkdown(markdown);
      expect(config.gameId).toBe('test_flow');

      // 2. 验证
      const validation = ConfigValidator.validate(config);
      expect(validation.valid).toBe(true);

      // 3. 生成
      const generator = new SkillCodeGenerator(config);
      const result = generator.generate();
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });
  });
});
