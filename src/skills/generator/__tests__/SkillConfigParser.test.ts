/**
 * SkillConfigParser 单元测试
 */

import { describe, it, expect } from 'vitest';
import { SkillConfigParser } from '../SkillConfigParser';
import type { SkillConfig } from '../types';

describe('SkillConfigParser', () => {
  describe('parseMarkdown', () => {
    it('应该解析基础信息', () => {
      const markdown = `
# Skill 配置

## 基础信息
- **游戏ID**: my_test_game
- **游戏名称**: 测试游戏
`;
      const config = SkillConfigParser.parseMarkdown(markdown);
      
      expect(config.gameId).toBe('my_test_game');
      expect(config.gameName).toBe('测试游戏');
    });

    it('应该解析功能开关', () => {
      const markdown = `
# Skill 配置

## 功能开关
- [x] 钱包系统
- [x] 商店系统
- [ ] 库存同步
`;
      const config = SkillConfigParser.parseMarkdown(markdown);
      
      expect(config.features).toContain('wallet');
      expect(config.features).toContain('store');
      expect(config.features).not.toContain('inventory');
    });

    it('应该解析货币设置表格', () => {
      const markdown = `
# Skill 配置

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 游戏币 | ✅ | 1000 |
| 金币 | ⬜ | 0 |
`;
      const config = SkillConfigParser.parseMarkdown(markdown);
      
      expect(config.currencies).toHaveLength(2);
      expect(config.currencies[0].name).toBe('游戏币');
      expect(config.currencies[0].initialBalance).toBe(1000);
      expect(config.currencies[1].enabled).toBe(false);
    });

    it('应该解析商品列表', () => {
      const markdown = `
# Skill 配置

## 商品列表
| 商品ID | 名称 | 价格 | 类型 |
|--------|------|-----:|------|
| sword_001 | 铁剑 | 100 | 武器 |
| potion_001 | 药水 | 10 | 消耗品 |
`;
      const config = SkillConfigParser.parseMarkdown(markdown);
      
      expect(config.products).toHaveLength(2);
      expect(config.products[0].id).toBe('sword_001');
      expect(config.products[0].name).toBe('铁剑');
      expect(config.products[0].price).toHaveProperty('default');
    });

    it('应该应用默认值', () => {
      const markdown = `# Skill 配置`;
      const config = SkillConfigParser.parseMarkdown(markdown);
      
      expect(config.gameId).toBeTruthy();
      expect(config.features).toContain('wallet');
      expect(config.currencies).toHaveLength(1);
      expect(config.inventory.enabled).toBe(true);
    });

    it('应该处理特殊字符', () => {
      const markdown = `
# Skill 配置

## 基础信息
- **游戏ID**: game-with-special-chars
- **游戏名称**: 游戏《测试》"V1.0"
`;
      const config = SkillConfigParser.parseMarkdown(markdown);
      
      expect(config.gameId).toBe('game-with-special-chars');
      expect(config.gameName).toBe('游戏《测试》"V1.0"');
    });
  });

  describe('parseYAML', () => {
    it('应该解析 YAML 配置', () => {
      const yaml = `
game:
  id: yaml_game
  name: YAML游戏
  version: 2.0.0

features:
  - wallet
  - store

wallet:
  currencies:
    - id: gold
      name: 金币
      initialBalance: 500
`;
      const config = SkillConfigParser.parseYAML(yaml);
      
      expect(config.gameId).toBe('yaml_game');
      expect(config.gameName).toBe('YAML游戏');
      expect(config.version).toBe('2.0.0');
      expect(config.features).toContain('wallet');
    });

    it('应该处理嵌套结构', () => {
      const yaml = `
game:
  id: nested_game
  name: 嵌套游戏

wallet:
  enabled: true
  currencies:
    - id: coin
      name: 游戏币
      type: basic
      initialBalance: 1000
`;
      const config = SkillConfigParser.parseYAML(yaml);
      
      expect(config.wallet).toBeDefined();
      expect(config.wallet?.currencies).toHaveLength(1);
    });
  });
});
