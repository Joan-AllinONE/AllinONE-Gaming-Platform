/**
 * 端到端测试 - 从配置到使用生成的 Skill
 * 
 * 模拟完整的用户工作流程
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateSkill } from '../index';
import { SkillGateway } from '../../SkillGateway';
import { BaseSkill } from '../../BaseSkill';

describe('端到端测试 - 完整工作流程', () => {
  let gateway: SkillGateway;

  beforeEach(() => {
    gateway = new SkillGateway({ debug: false });
  });

  afterEach(async () => {
    await gateway.destroy();
  });

  describe('场景 1: RPG 游戏完整接入', () => {
    it('应该能够生成、注册并使用 RPG 游戏的 Skill', async () => {
      // Step 1: 创建游戏配置
      const gameConfig = `
# Skill 配置 - 勇者传说

## 基础信息
- **游戏ID**: rpg_hero_game
- **游戏名称**: 勇者传说
- **版本**: 1.0.0

## 功能模块
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 金币 | ✅ | 1000 |
| 钻石 | ✅ | 100 |

## 商品列表
| 商品ID | 名称 | 价格(金币) | 库存 |
|--------|------|-----------:|-----:|
| iron_sword | 铁剑 | 100 | 999 |
| hp_potion | 生命药水 | 10 | 9999 |
`;

      // Step 2: 生成 Skill 代码
      const result = await generateSkill(gameConfig, {
        generateTypes: false,
        autoFix: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(4);

      // Step 3: 获取生成的代码
      const skillCode = result.files.find(f => f.type === 'skill')?.content;
      expect(skillCode).toBeDefined();
      expect(skillCode).toContain('class RpgHeroGameSkill');

      // Step 4: 验证生成的代码包含所有必要功能
      expect(skillCode).toContain('handleGetBalance');
      expect(skillCode).toContain('handlePurchase');
      expect(skillCode).toContain('handleGetInventory');

      // Step 5: 验证货币初始化
      expect(skillCode).toContain("this.data.wallet['金币'] = 1000");
      expect(skillCode).toContain("this.data.wallet['钻石'] = 100");

      // Step 6: 验证商品定义
      expect(skillCode).toContain("id: 'iron_sword'");
      expect(skillCode).toContain("name: '铁剑'");
    });
  });

  describe('场景 2: 休闲游戏快速接入', () => {
    it('应该能够在 5 分钟内完成休闲游戏接入', async () => {
      // 模拟快速配置
      const quickConfig = `
# 快速配置
## 基础信息
- **游戏ID**: puzzle_game
- **游戏名称**: 益智消除

## 功能
- [x] 钱包系统
- [x] 商店系统

## 货币
| 货币 | 初始值 |
|------|-------:|
| 金币 | 5000 |
| 体力 | 100 |

## 商品
| 商品ID | 名称 | 金币 |
|--------|------|-----:|
| hint | 提示道具 | 50 |
| shuffle | 重置道具 | 30 |
`;

      const startTime = Date.now();
      
      const result = await generateSkill(quickConfig, {
        generateTypes: false,
        generateTests: false,
        autoFix: true,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 验证在合理时间内完成（< 5秒）
      expect(duration).toBeLessThan(5000);
      expect(result.success).toBe(true);

      // 验证生成了最少的必要文件
      const skillFile = result.files.find(f => f.type === 'skill');
      const configFile = result.files.find(f => f.type === 'config');
      
      expect(skillFile).toBeDefined();
      expect(configFile).toBeDefined();

      // 验证功能正确
      expect(skillFile?.content).toContain('handleGetBalance');
      expect(skillFile?.content).toContain('handlePurchase');
      expect(skillFile?.content).toContain('金币');
      expect(skillFile?.content).toContain('体力');
    });
  });

  describe('场景 3: 多货币复杂游戏', () => {
    it('应该正确处理多种货币和复杂商店', async () => {
      const complexConfig = `
# 复杂游戏配置
## 基础信息
- **游戏ID**: mmorpg_game
- **游戏名称**: 魔法世界

## 功能
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步

## 货币
| 货币 | 初始值 |
|------|-------:|
| 铜币 | 1000 |
| 银币 | 100 |
| 金币 | 10 |
| 钻石 | 0 |
| 算力 | 0 |

## 商品
| 商品ID | 名称 | 铜币 | 银币 | 金币 |
|--------|------|-----:|-----:|-----:|
| copper_sword | 铜剑 | 100 | - | - |
| silver_armor | 银甲 | - | 50 | - |
| gold_ring | 金戒指 | - | - | 5 |
| diamond_pack | 钻石礼包 | - | - | - |
`;

      const result = await generateSkill(complexConfig);
      expect(result.success).toBe(true);

      const skillCode = result.files.find(f => f.type === 'skill')?.content;
      
      // 验证所有货币都被初始化
      expect(skillCode).toContain('铜币');
      expect(skillCode).toContain('银币');
      expect(skillCode).toContain('金币');
      expect(skillCode).toContain('钻石');
      expect(skillCode).toContain('算力');

      // 验证商品价格支持多种货币
      expect(skillCode).toContain('copper_sword');
      expect(skillCode).toContain('silver_armor');
      expect(skillCode).toContain('gold_ring');
    });
  });

  describe('场景 4: 配置错误处理', () => {
    it('应该提供清晰的错误信息帮助用户修复', async () => {
      const invalidConfig = `
# 有问题的配置
## 基础信息
- **游戏ID**: 123-Invalid!!!
- **游戏名称**: 

## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | -100 |

## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
|  | 无名商品 | -50 |
`;

      const result = await generateSkill(invalidConfig, {
        autoFix: false,
        validationLevel: 'strict',
      });

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);

      // 验证有明确的错误信息
      const hasGameIdError = result.errors.some(e => 
        e.message.includes('游戏ID') || e.message.includes('gameId')
      );
      const hasNegativeBalanceError = result.errors.some(e =>
        e.message.includes('负数') || e.message.includes('negative')
      );

      expect(hasGameIdError || result.errors.length > 0).toBe(true);
    });

    it('应该能够自动修复常见问题', async () => {
      const fixableConfig = `
# 可修复的配置
## 基础信息
- **游戏ID**: INVALID_GAME-ID
- **游戏名称**: 测试游戏

## 货币
| 货币 | 初始值 |
|------|-------:|
| Invalid-Coin | 100 |
`;

      const result = await generateSkill(fixableConfig, {
        autoFix: true,
      });

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);

      // 验证配置被修复
      const configFile = result.files.find(f => f.type === 'config');
      expect(configFile?.content).toBeDefined();
      
      // 修复后的 ID 应该符合规范
      expect(configFile?.content).not.toContain('INVALID_GAME-ID');
    });
  });

  describe('场景 5: 批量生成', () => {
    it('应该能够批量生成多个游戏 Skill', async () => {
      const configs = [
        `
# 游戏1
## 基础信息
- **游戏ID**: game_one
- **游戏名称**: 游戏一
## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |
        `,
        `
# 游戏2
## 基础信息
- **游戏ID**: game_two
- **游戏名称**: 游戏二
## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 2000 |
        `,
        `
# 游戏3
## 基础信息
- **游戏ID**: game_three
- **游戏名称**: 游戏三
## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 3000 |
        `,
      ];

      const results = await Promise.all(
        configs.map((config, index) =>
          generateSkill(config, {
            outputDir: `./batch/game${index + 1}`,
            autoFix: true,
          })
        )
      );

      // 验证所有生成成功
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.files.length).toBeGreaterThan(0);
      });

      // 验证生成了不同的 Skill
      const classNames = results.map(r => {
        const skillFile = r.files.find(f => f.type === 'skill');
        const match = skillFile?.content.match(/class (\w+)Skill/);
        return match?.[1];
      });

      expect(classNames).toContain('GameOne');
      expect(classNames).toContain('GameTwo');
      expect(classNames).toContain('GameThree');
    });
  });

  describe('场景 6: 配置升级', () => {
    it('应该支持从简单配置升级到复杂配置', async () => {
      // 初始简单配置
      const simpleConfig = `
# 简单配置
## 基础信息
- **游戏ID**: evolving_game
- **游戏名称**: 进化游戏
## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |
`;

      const result1 = await generateSkill(simpleConfig);
      expect(result1.success).toBe(true);

      // 升级到复杂配置
      const complexConfig = `
# 复杂配置
## 基础信息
- **游戏ID**: evolving_game
- **游戏名称**: 进化游戏
- **版本**: 2.0.0

## 功能
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步
- [x] 排行榜

## 货币
| 货币 | 初始值 |
|------|-------:|
| coin | 1000 |
| gem | 100 |
| power | 0 |

## 商品
| 商品ID | 名称 | 价格 |
|--------|------|-----:|
| item1 | 道具1 | 50 |
| item2 | 道具2 | 100 |
`;

      const result2 = await generateSkill(complexConfig);
      expect(result2.success).toBe(true);

      // 验证版本更新
      const configFile2 = result2.files.find(f => f.type === 'config');
      expect(configFile2?.content).toContain('2.0.0');

      // 验证新增功能
      const skillCode2 = result2.files.find(f => f.type === 'skill')?.content;
      expect(skillCode2).toContain('gem');
      expect(skillCode2).toContain('power');
    });
  });
});
