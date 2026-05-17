/**
 * ConfigValidator 单元测试
 */

import { describe, it, expect } from 'vitest';
import { ConfigValidator } from '../ConfigValidator';
import type { SkillConfig, CurrencyConfig, ProductConfig } from '../types';

describe('ConfigValidator', () => {
  describe('validate', () => {
    it('应该验证必填字段', () => {
      const config: Partial<SkillConfig> = {
        gameId: '',
        gameName: '',
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少必填字段: 游戏ID (gameId)');
      expect(result.errors).toContain('缺少必填字段: 游戏名称 (gameName)');
    });

    it('应该验证 gameId 格式', () => {
      const config: Partial<SkillConfig> = {
        gameId: '123-invalid',
        gameName: '测试游戏',
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.errors.some(e => e.includes('游戏ID格式错误'))).toBe(true);
    });

    it('应该验证货币配置', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'test_game',
        gameName: '测试游戏',
        currencies: [
          { id: 'coin', name: '游戏币', type: 'coin', initialBalance: -100, enabled: true },
        ],
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.errors.some(e => e.includes('初始余额不能为负数'))).toBe(true);
    });

    it('应该验证商品配置', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'test_game',
        gameName: '测试游戏',
        products: [
          { id: 'item1', name: '商品1', category: 'general', price: { coin: -50 }, stock: 100, description: '' },
        ],
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.errors.some(e => e.includes('价格不能为负数'))).toBe(true);
    });

    it('应该验证货币ID唯一性', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'test_game',
        gameName: '测试游戏',
        currencies: [
          { id: 'coin', name: '游戏币1', type: 'coin', initialBalance: 100, enabled: true },
          { id: 'coin', name: '游戏币2', type: 'coin', initialBalance: 200, enabled: true },
        ],
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.errors.some(e => e.includes('货币ID重复'))).toBe(true);
    });

    it('应该通过有效配置', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'valid_game',
        gameName: '有效游戏',
        version: '1.0.0',
        features: ['wallet', 'store'],
        currencies: [
          { id: 'coin', name: '游戏币', type: 'coin', initialBalance: 1000, enabled: true },
        ],
        products: [
          { id: 'item1', name: '商品1', category: 'general', price: { coin: 100 }, stock: 999, description: '测试商品' },
        ],
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测功能依赖警告', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'test_game',
        gameName: '测试游戏',
        features: ['store'],  // 只有商店，没有钱包
        currencies: [],
      };
      
      const result = ConfigValidator.validate(config);
      
      expect(result.warnings.some(w => w.includes('商店功能需要钱包功能支持'))).toBe(true);
    });
  });

  describe('autoFix', () => {
    it('应该修复 gameId 格式', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'INVALID-Game-123!!!',
        gameName: '测试游戏',
      };
      
      const fixed = ConfigValidator.autoFix(config);
      
      expect(fixed.gameId).toMatch(/^[a-z][a-z0-9_]*$/);
    });

    it('应该修复货币 ID 格式', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'test_game',
        gameName: '测试游戏',
        currencies: [
          { id: 'INVALID-Coin', name: '游戏币', type: 'coin', initialBalance: 100, enabled: true },
        ],
      };
      
      const fixed = ConfigValidator.autoFix(config);
      
      expect(fixed.currencies![0].id).toMatch(/^[a-z][a-z0-9_]*$/);
    });

    it('应该添加默认货币', () => {
      const config: Partial<SkillConfig> = {
        gameId: 'test_game',
        gameName: '测试游戏',
        currencies: [],
      };
      
      const fixed = ConfigValidator.autoFix(config);
      
      expect(fixed.currencies).toHaveLength(1);
      expect(fixed.currencies![0].id).toBe('game_coin');
    });
  });

  describe('generateReport', () => {
    it('应该生成验证报告', () => {
      const result = ConfigValidator.generateReport({
        valid: false,
        errors: ['错误1', '错误2'],
        warnings: ['警告1'],
      });
      
      expect(result).toContain('❌ **配置验证失败**');
      expect(result).toContain('错误1');
      expect(result).toContain('警告1');
    });

    it('应该生成通过报告', () => {
      const result = ConfigValidator.generateReport({
        valid: true,
        errors: [],
        warnings: [],
      });
      
      expect(result).toContain('✅ **配置验证通过**');
    });
  });
});
