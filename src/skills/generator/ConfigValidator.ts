/**
 * Skill 配置验证器
 * 验证配置文件的完整性和合法性
 */

import type { SkillConfig, ValidationResult, CurrencyConfig, ProductConfig } from './types';

export class ConfigValidator {
  /**
   * 验证完整配置
   */
  static validate(config: Partial<SkillConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段验证
    this.validateRequiredFields(config, errors);

    // 货币配置验证
    if (config.currencies) {
      this.validateCurrencies(config.currencies, errors, warnings);
    }

    // 商品配置验证
    if (config.products) {
      this.validateProducts(config.products, errors, warnings);
    }

    // 功能依赖验证
    this.validateFeatureDependencies(config, errors, warnings);

    // ID 格式验证
    this.validateIdFormat(config, errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证必填字段
   */
  private static validateRequiredFields(config: Partial<SkillConfig>, errors: string[]): void {
    const requiredFields = [
      { field: 'gameId', name: '游戏ID' },
      { field: 'gameName', name: '游戏名称' },
    ];

    for (const { field, name } of requiredFields) {
      if (!config[field as keyof SkillConfig]) {
        errors.push(`缺少必填字段: ${name} (${field})`);
      }
    }

    // gameId 格式检查
    if (config.gameId) {
      if (!/^[a-z][a-z0-9_-]*$/i.test(config.gameId)) {
        errors.push('游戏ID格式错误: 必须以字母开头，只能包含字母、数字、下划线和连字符');
      }
      if (config.gameId.length < 3) {
        errors.push('游戏ID长度不足: 至少需要3个字符');
      }
    }
  }

  /**
   * 验证货币配置
   */
  private static validateCurrencies(
    currencies: CurrencyConfig[],
    errors: string[],
    warnings: string[]
  ): void {
    if (currencies.length === 0) {
      warnings.push('未配置任何货币，将使用默认配置');
      return;
    }

    const ids = new Set<string>();
    
    for (const currency of currencies) {
      // ID 唯一性
      if (ids.has(currency.id)) {
        errors.push(`货币ID重复: ${currency.id}`);
      }
      ids.add(currency.id);

      // 必填字段
      if (!currency.name) {
        errors.push(`货币 ${currency.id}: 缺少名称`);
      }

      // 初始余额
      if (currency.initialBalance === undefined || currency.initialBalance === null) {
        errors.push(`货币 ${currency.id}: 缺少初始余额`);
      } else if (currency.initialBalance < 0) {
        errors.push(`货币 ${currency.id}: 初始余额不能为负数`);
      } else if (currency.initialBalance > 1000000000) {
        warnings.push(`货币 ${currency.id}: 初始余额过大 (${currency.initialBalance})`);
      }
    }
  }

  /**
   * 验证商品配置
   */
  private static validateProducts(
    products: ProductConfig[],
    errors: string[],
    warnings: string[]
  ): void {
    const ids = new Set<string>();
    
    for (const product of products) {
      // ID 唯一性
      if (ids.has(product.id)) {
        errors.push(`商品ID重复: ${product.id}`);
      }
      ids.add(product.id);

      // 必填字段
      if (!product.name) {
        errors.push(`商品 ${product.id}: 缺少名称`);
      }

      // 价格验证
      if (!product.price || Object.keys(product.price).length === 0) {
        errors.push(`商品 ${product.id}: 缺少价格配置`);
      } else {
        for (const [currency, price] of Object.entries(product.price)) {
          if (price < 0) {
            errors.push(`商品 ${product.id}: 价格不能为负数 (${currency}: ${price})`);
          }
          if (price === 0) {
            warnings.push(`商品 ${product.id}: 价格为0（免费商品）`);
          }
          if (price > 1000000) {
            warnings.push(`商品 ${product.id}: 价格过高 (${currency}: ${price})`);
          }
        }
      }

      // 库存验证
      if (product.stock === undefined || product.stock === null) {
        errors.push(`商品 ${product.id}: 缺少库存配置`);
      } else if (product.stock < 0) {
        errors.push(`商品 ${product.id}: 库存不能为负数`);
      } else if (product.stock === 0) {
        warnings.push(`商品 ${product.id}: 库存为0（缺货状态）`);
      }
    }
  }

  /**
   * 验证功能依赖
   */
  private static validateFeatureDependencies(
    config: Partial<SkillConfig>,
    errors: string[],
    warnings: string[]
  ): void {
    const features = config.features || [];

    // 商店依赖钱包
    if (features.includes('store') && !features.includes('wallet')) {
      warnings.push('商店功能需要钱包功能支持，建议同时启用');
    }

    // 库存依赖商店
    if (features.includes('inventory') && !features.includes('store')) {
      warnings.push('库存功能通常需要商店功能配合使用');
    }

    // 货币配置与钱包功能一致性
    if (features.includes('wallet') && (!config.currencies || config.currencies.length === 0)) {
      warnings.push('启用了钱包功能但未配置货币');
    }

    // 商品配置与商店功能一致性
    if (features.includes('store') && (!config.products || config.products.length === 0)) {
      warnings.push('启用了商店功能但未配置商品');
    }
  }

  /**
   * 验证 ID 格式
   */
  private static validateIdFormat(config: Partial<SkillConfig>, errors: string[]): void {
    const idPattern = /^[a-z][a-z0-9_]*$/;

    // 验证货币 ID
    config.currencies?.forEach(currency => {
      if (!idPattern.test(currency.id)) {
        errors.push(`货币ID格式错误: ${currency.id} (应为小写字母开头，只能包含小写字母、数字、下划线)`);
      }
    });

    // 验证商品 ID
    config.products?.forEach(product => {
      if (!idPattern.test(product.id)) {
        errors.push(`商品ID格式错误: ${product.id} (应为小写字母开头，只能包含小写字母、数字、下划线)`);
      }
    });
  }

  /**
   * 自动修复配置
   */
  static autoFix(config: Partial<SkillConfig>): Partial<SkillConfig> {
    const fixed = { ...config };

    // 修复 gameId 格式
    if (fixed.gameId) {
      fixed.gameId = fixed.gameId
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/^[0-9_-]+/, '');
      
      if (fixed.gameId.length < 3) {
        fixed.gameId = `game_${fixed.gameId}`;
      }
    }

    // 修复货币 ID 格式
    if (fixed.currencies) {
      fixed.currencies = fixed.currencies.map(c => ({
        ...c,
        id: c.id
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/^[0-9_]+/, 'currency_'),
      }));
    }

    // 修复商品 ID 格式
    if (fixed.products) {
      fixed.products = fixed.products.map(p => ({
        ...p,
        id: p.id
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/^[0-9_]+/, 'item_'),
      }));
    }

    // 确保有默认货币
    if (!fixed.currencies || fixed.currencies.length === 0) {
      fixed.currencies = [{
        id: 'game_coin',
        name: '游戏币',
        type: 'coin',
        initialBalance: 1000,
        enabled: true,
      }];
    }

    // 确保有默认功能
    if (!fixed.features || fixed.features.length === 0) {
      fixed.features = ['wallet'];
    }

    return fixed;
  }

  /**
   * 生成验证报告
   */
  static generateReport(result: ValidationResult): string {
    const lines: string[] = ['# Skill 配置验证报告\n'];

    if (result.valid) {
      lines.push('✅ **配置验证通过**\n');
    } else {
      lines.push('❌ **配置验证失败**\n');
    }

    if (result.errors.length > 0) {
      lines.push('## 错误 (' + result.errors.length + ')');
      result.errors.forEach(error => {
        lines.push(`- ❌ ${error}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('## 警告 (' + result.warnings.length + ')');
      result.warnings.forEach(warning => {
        lines.push(`- ⚠️ ${warning}`);
      });
      lines.push('');
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      lines.push('🎉 没有发现任何问题！');
    }

    return lines.join('\n');
  }
}

export default ConfigValidator;
