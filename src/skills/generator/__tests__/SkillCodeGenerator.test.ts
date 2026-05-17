/**
 * SkillCodeGenerator 单元测试
 */

import { describe, it, expect } from 'vitest';
import { SkillCodeGenerator } from '../SkillCodeGenerator';
import type { SkillConfig } from '../types';

describe('SkillCodeGenerator', () => {
  const mockConfig: SkillConfig = {
    gameId: 'test_game',
    gameName: '测试游戏',
    name: '测试游戏',
    description: '这是一个测试游戏',
    version: '1.0.0',
    integrationType: 'standard',
    features: ['wallet', 'store', 'inventory'],
    currencies: [
      { id: 'coin', name: '游戏币', type: 'coin', initialBalance: 1000, enabled: true },
      { id: 'gem', name: '钻石', type: 'premium', initialBalance: 10, enabled: true },
    ],
    products: [
      { id: 'sword_001', name: '铁剑', category: 'weapon', price: { coin: 100 }, stock: 999, description: '基础武器' },
      { id: 'potion_001', name: '药水', category: 'consumable', price: { coin: 10, gem: 1 }, stock: 9999, description: '恢复药水' },
    ],
    inventory: {
      enabled: true,
      syncMode: 'realtime',
      maxSlots: 50,
    },
  };

  describe('generate', () => {
    it('应该生成主 Skill 文件', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      
      expect(result.success).toBe(true);
      expect(result.files.some(f => f.type === 'skill')).toBe(true);
    });

    it('应该生成类型定义文件', () => {
      const generator = new SkillCodeGenerator(mockConfig, { generateTypes: true });
      const result = generator.generate();
      
      expect(result.files.some(f => f.type === 'types')).toBe(true);
    });

    it('应该生成测试文件', () => {
      const generator = new SkillCodeGenerator(mockConfig, { generateTests: true });
      const result = generator.generate();
      
      expect(result.files.some(f => f.type === 'test')).toBe(true);
    });

    it('应该生成配置文件', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      
      expect(result.files.some(f => f.type === 'config')).toBe(true);
    });
  });

  describe('生成的代码内容', () => {
    it('应该包含类定义', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain('class TestGameSkill extends BaseSkill');
    });

    it('应该包含钱包功能', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain('handleGetBalance');
      expect(skillFile?.content).toContain('handleAddBalance');
      expect(skillFile?.content).toContain('handleDeductBalance');
    });

    it('应该包含商店功能', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain('handleGetProducts');
      expect(skillFile?.content).toContain('handlePurchase');
    });

    it('应该包含库存功能', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain('handleGetInventory');
      expect(skillFile?.content).toContain('handleUseItem');
    });

    it('应该包含货币初始化', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain("this.data.wallet['coin'] = 1000");
      expect(skillFile?.content).toContain("this.data.wallet['gem'] = 10");
    });

    it('应该包含商品定义', () => {
      const generator = new SkillCodeGenerator(mockConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain("id: 'sword_001'");
      expect(skillFile?.content).toContain("name: '铁剑'");
      expect(skillFile?.content).toContain("price: { coin: 100 }");
    });
  });

  describe('不同配置场景', () => {
    it('应该处理只有钱包的配置', () => {
      const walletOnlyConfig: SkillConfig = {
        ...mockConfig,
        features: ['wallet'],
        products: [],
      };
      
      const generator = new SkillCodeGenerator(walletOnlyConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain('handleGetBalance');
      expect(skillFile?.content).not.toContain('handlePurchase');
    });

    it('应该处理空商品的配置', () => {
      const noProductsConfig: SkillConfig = {
        ...mockConfig,
        products: [],
      };
      
      const generator = new SkillCodeGenerator(noProductsConfig);
      const result = generator.generate();
      
      expect(result.success).toBe(true);
    });

    it('应该处理多种货币的价格', () => {
      const multiCurrencyConfig: SkillConfig = {
        ...mockConfig,
        products: [
          { 
            id: 'item1', 
            name: '商品1', 
            category: 'general', 
            price: { coin: 100, gem: 5 }, 
            stock: 100, 
            description: '' 
          },
        ],
      };
      
      const generator = new SkillCodeGenerator(multiCurrencyConfig);
      const result = generator.generate();
      const skillFile = result.files.find(f => f.type === 'skill');
      
      expect(skillFile?.content).toContain('coin: 100');
      expect(skillFile?.content).toContain('gem: 5');
    });
  });
});
