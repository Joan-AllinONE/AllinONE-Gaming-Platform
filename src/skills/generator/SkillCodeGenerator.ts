/**
 * Skill 代码生成器
 * 根据配置生成完整的 Skill TypeScript 代码
 */

import type { 
  SkillConfig, 
  CurrencyConfig, 
  ProductConfig,
  GenerateOptions,
  GenerationResult,
  GeneratedFile,
  GenerationError,
} from './types';

export class SkillCodeGenerator {
  private config: SkillConfig;
  private options: GenerateOptions;

  constructor(config: SkillConfig, options: GenerateOptions = {}) {
    this.config = config;
    this.options = {
      outputDir: './src/skills/generated',
      generateTypes: true,
      generateTests: false,
      format: true,
      ...options,
    };
  }

  /**
   * 生成完整的 Skill 代码
   */
  generate(): GenerationResult {
    const result: GenerationResult = {
      success: true,
      files: [],
      errors: [],
      warnings: [],
    };

    try {
      // 1. 生成主 Skill 类
      const skillFile = this.generateSkillFile();
      result.files.push(skillFile);

      // 2. 生成类型定义文件
      if (this.options.generateTypes) {
        const typesFile = this.generateTypesFile();
        result.files.push(typesFile);
      }

      // 3. 生成测试文件
      if (this.options.generateTests) {
        const testFile = this.generateTestFile();
        result.files.push(testFile);
      }

      // 4. 生成配置文件
      const configFile = this.generateConfigFile();
      result.files.push(configFile);

    } catch (error) {
      result.success = false;
      result.errors.push({
        type: 'generation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * 生成主 Skill 类文件
   */
  private generateSkillFile(): GeneratedFile {
    const className = this.toPascalCase(this.config.gameId) + 'Skill';
    const features = this.config.features;

    const code = `/**
 * ${this.config.gameName} - 自动生成的 Skill
 * 版本: ${this.config.version}
 * 生成时间: ${new Date().toISOString()}
 * 
 * 功能: ${features.join(', ')}
 */

import { BaseSkill } from '../BaseSkill';
import type { ActionContext, ActionHandler } from '../types';

// ==================== 类型定义 ====================

${this.generateTypesSection()}

// ==================== Skill 类 ====================

export class ${className} extends BaseSkill {
  private data: GameData = {
    wallet: {},
    inventory: [],
    stats: { createdAt: Date.now() },
  };

  constructor() {
    super({
      name: '${this.config.gameId}',
      displayName: '${this.config.gameName}',
      version: '${this.config.version}',
      description: '${this.config.description}',
    });
  }

  // ==================== 生命周期 ====================

  protected async onInitialize(): Promise<void> {
    this.log('🎮', '${this.config.gameName} Skill 初始化中...');
    
    // 加载本地数据
    this.loadData();
    
    // 初始化钱包
    ${features.includes('wallet') ? this.generateWalletInitCode() : '// 钱包功能未启用'}
    
    // 初始化库存
    ${features.includes('inventory') ? this.generateInventoryInitCode() : '// 库存功能未启用'}
    
    // 注册动作处理器
    this.registerActions();
    
    this.log('✅', '${this.config.gameName} Skill 初始化完成');
  }

  protected async onDispose(): Promise<void> {
    this.saveData();
    this.log('👋', '${this.config.gameName} Skill 已关闭');
  }

  // ==================== 动作注册 ====================

  private registerActions(): void {
${this.generateActionRegistrations()}
  }

  // ==================== 功能实现 ====================

${this.generateFeatureImplementations()}

  // ==================== 数据持久化 ====================

  private loadData(): void {
    try {
      const saved = localStorage.getItem(\`\${this.config.name}_data\`);
      if (saved) {
        this.data = JSON.parse(saved);
        this.log('📂', '已加载存档数据');
      } else {
        // 初始化默认值
        this.initializeDefaultData();
      }
    } catch (e) {
      this.log('⚠️', '加载数据失败，使用默认数据');
      this.initializeDefaultData();
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(\`\${this.config.name}_data\`, JSON.stringify(this.data));
    } catch (e) {
      this.log('⚠️', '保存数据失败');
    }
  }

  private initializeDefaultData(): void {
    // 初始化货币余额
${this.config.currencies.map(c => `    this.data.wallet['${c.id}'] = ${c.initialBalance};`).join('\n')}
    
    this.log('🆕', '已创建新的游戏数据');
  }

  // ==================== 辅助方法 ====================

  private log(emoji: string, message: string): void {
    console.log(\`[\${this.config.displayName}] \${emoji} \${message}\`);
  }
}

export default ${className};
`;

    return {
      path: `${this.options.outputDir}/${className}.ts`,
      content: code,
      type: 'skill',
    };
  }

  /**
   * 生成类型定义部分
   */
  private generateTypesSection(): string {
    const currencyIds = this.config.currencies.map(c => `'${c.id}'`).join(' | ');
    const categoryIds = [...new Set(this.config.products.map(p => p.category))].map(c => `'${c}'`).join(' | ') || 'string';

    return `
export interface Currency {
  id: ${currencyIds || 'string'};
  name: string;
  balance: number;
}

export interface Product {
  id: string;
  name: string;
  category: ${categoryIds};
  price: Record<string, number>;
  stock: number;
  description: string;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  acquiredAt: number;
}

export interface GameData {
  wallet: Record<string, number>;
  inventory: InventoryItem[];
  stats: {
    createdAt: number;
    lastLogin?: number;
    totalPurchases?: number;
    playTime?: number;
  };
}

// 动作参数类型
${this.generateActionParamTypes()}
`;
  }

  /**
   * 生成动作参数类型
   */
  private generateActionParamTypes(): string {
    const types: string[] = [];

    if (this.config.features.includes('wallet')) {
      types.push(`
export interface GetBalanceParams {
  currency?: string;
}

export interface AddBalanceParams {
  currency: string;
  amount: number;
  reason?: string;
}

export interface DeductBalanceParams {
  currency: string;
  amount: number;
  reason?: string;
}`);
    }

    if (this.config.features.includes('store')) {
      types.push(`
export interface PurchaseParams {
  productId: string;
  quantity?: number;
  currency?: string;
}

export interface GetProductsParams {
  category?: string;
  page?: number;
  limit?: number;
}`);
    }

    if (this.config.features.includes('inventory')) {
      types.push(`
export interface AddItemParams {
  productId: string;
  quantity: number;
}

export interface UseItemParams {
  itemId: string;
  quantity?: number;
}

export interface TransferItemParams {
  itemId: string;
  toPlayerId: string;
  quantity?: number;
}`);
    }

    return types.join('\n\n');
  }

  /**
   * 生成钱包初始化代码
   */
  private generateWalletInitCode(): string {
    return `
    // 确保所有货币都有初始值
    ${this.config.currencies.map(c => `
    if (this.data.wallet['${c.id}'] === undefined) {
      this.data.wallet['${c.id}'] = ${c.initialBalance};
    }`).join('')}
    `;
  }

  /**
   * 生成库存初始化代码
   */
  private generateInventoryInitCode(): string {
    return `
    // 初始化库存数组
    if (!this.data.inventory) {
      this.data.inventory = [];
    }
    `;
  }

  /**
   * 生成动作注册代码
   */
  private generateActionRegistrations(): string {
    const registrations: string[] = [];

    if (this.config.features.includes('wallet')) {
      registrations.push(`
    // 钱包相关动作
    this.registerAction('getBalance', this.handleGetBalance.bind(this), {
      description: '获取货币余额',
    });
    this.registerAction('addBalance', this.handleAddBalance.bind(this), {
      description: '增加货币余额',
    });
    this.registerAction('deductBalance', this.handleDeductBalance.bind(this), {
      description: '扣除货币余额',
    });`);
    }

    if (this.config.features.includes('store')) {
      registrations.push(`
    // 商店相关动作
    this.registerAction('getProducts', this.handleGetProducts.bind(this), {
      description: '获取商品列表',
    });
    this.registerAction('purchase', this.handlePurchase.bind(this), {
      description: '购买商品',
    });`);
    }

    if (this.config.features.includes('inventory')) {
      registrations.push(`
    // 库存相关动作
    this.registerAction('getInventory', this.handleGetInventory.bind(this), {
      description: '获取库存列表',
    });
    this.registerAction('useItem', this.handleUseItem.bind(this), {
      description: '使用物品',
    });`);
    }

    // 通用动作
    registrations.push(`
    // 通用动作
    this.registerAction('getGameData', this.handleGetGameData.bind(this), {
      description: '获取完整游戏数据',
    });`);

    return registrations.join('\n');
  }

  /**
   * 生成功能实现代码
   */
  private generateFeatureImplementations(): string {
    const implementations: string[] = [];

    if (this.config.features.includes('wallet')) {
      implementations.push(this.generateWalletImplementations());
    }

    if (this.config.features.includes('store')) {
      implementations.push(this.generateStoreImplementations());
    }

    if (this.config.features.includes('inventory')) {
      implementations.push(this.generateInventoryImplementations());
    }

    // 通用实现
    implementations.push(`
  // 获取完整游戏数据
  private async handleGetGameData(_params: any, context: ActionContext): Promise<GameData> {
    this.data.stats.lastLogin = Date.now();
    this.saveData();
    return this.data;
  }`);

    return implementations.join('\n\n');
  }

  /**
   * 生成钱包功能实现
   */
  private generateWalletImplementations(): string {
    return `
  // ========== 钱包功能 ==========

  private async handleGetBalance(params: GetBalanceParams): Promise<{ currency: string; balance: number }> {
    const currency = params.currency || '${this.config.currencies[0]?.id || 'default'}';
    const balance = this.data.wallet[currency] || 0;
    return { currency, balance };
  }

  private async handleAddBalance(params: AddBalanceParams, context: ActionContext): Promise<{ success: boolean; newBalance: number }> {
    const { currency, amount, reason } = params;
    
    if (!this.data.wallet[currency]) {
      this.data.wallet[currency] = 0;
    }
    
    this.data.wallet[currency] += amount;
    this.saveData();
    
    this.log('💰', \`增加 \${amount} \${currency}\` + (reason ? \` (\${reason})\` : ''));
    
    return { success: true, newBalance: this.data.wallet[currency] };
  }

  private async handleDeductBalance(params: DeductBalanceParams, context: ActionContext): Promise<{ success: boolean; newBalance: number }> {
    const { currency, amount, reason } = params;
    const current = this.data.wallet[currency] || 0;
    
    if (current < amount) {
      throw new Error(\`余额不足: 需要 \${amount}, 只有 \${current}\`);
    }
    
    this.data.wallet[currency] = current - amount;
    this.saveData();
    
    this.log('💸', \`扣除 \${amount} \${currency}\` + (reason ? \` (\${reason})\` : ''));
    
    return { success: true, newBalance: this.data.wallet[currency] };
  }`;
  }

  /**
   * 生成商店功能实现
   */
  private generateStoreImplementations(): string {
    const productsArray = JSON.stringify(this.config.products, null, 2)
      .replace(/"/g, "'")
      .replace(/\n/g, '\n    ');

    return `
  // ========== 商店功能 ==========

  private products: Product[] = ${productsArray};

  private async handleGetProducts(params: GetProductsParams): Promise<{ products: Product[]; total: number }> {
    const { category, page = 1, limit = 50 } = params;
    
    let filtered = this.products;
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    
    return { products: paginated, total: filtered.length };
  }

  private async handlePurchase(params: PurchaseParams, context: ActionContext): Promise<{ success: boolean; item: InventoryItem }> {
    const { productId, quantity = 1, currency } = params;
    
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error(\`商品不存在: \${productId}\`);
    }
    
    if (product.stock < quantity) {
      throw new Error(\`库存不足: 只有 \${product.stock}\`);
    }
    
    // 计算价格
    const paymentCurrency = currency || Object.keys(product.price)[0];
    const totalPrice = (product.price[paymentCurrency] || 0) * quantity;
    
    // 扣款
    const current = this.data.wallet[paymentCurrency] || 0;
    if (current < totalPrice) {
      throw new Error(\`余额不足: 需要 \${totalPrice}, 只有 \${current}\`);
    }
    
    this.data.wallet[paymentCurrency] = current - totalPrice;
    
    // 减少库存
    product.stock -= quantity;
    
    // 添加到库存
    const item: InventoryItem = {
      productId,
      quantity,
      acquiredAt: Date.now(),
    };
    this.data.inventory.push(item);
    
    // 更新统计
    this.data.stats.totalPurchases = (this.data.stats.totalPurchases || 0) + quantity;
    this.saveData();
    
    this.log('🛒', \`购买成功: \${product.name} x\${quantity}\`);
    
    return { success: true, item };
  }`;
  }

  /**
   * 生成库存功能实现
   */
  private generateInventoryImplementations(): string {
    return `
  // ========== 库存功能 ==========

  private async handleGetInventory(): Promise<{ items: InventoryItem[]; totalSlots: number; usedSlots: number }> {
    return {
      items: this.data.inventory,
      totalSlots: ${this.config.inventory.maxSlots},
      usedSlots: this.data.inventory.length,
    };
  }

  private async handleUseItem(params: UseItemParams): Promise<{ success: boolean; remaining: number }> {
    const { itemId, quantity = 1 } = params;
    
    const index = this.data.inventory.findIndex(item => item.productId === itemId);
    if (index === -1) {
      throw new Error(\`物品不存在: \${itemId}\`);
    }
    
    const item = this.data.inventory[index];
    if (item.quantity < quantity) {
      throw new Error(\`数量不足: 只有 \${item.quantity}\`);
    }
    
    item.quantity -= quantity;
    if (item.quantity === 0) {
      this.data.inventory.splice(index, 1);
    }
    
    this.saveData();
    
    this.log('🎒', \`使用物品: \${itemId} x\${quantity}\`);
    
    return { success: true, remaining: item.quantity };
  }

  private async handleAddItem(params: AddItemParams): Promise<{ success: boolean }> {
    const { productId, quantity } = params;
    
    const existing = this.data.inventory.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.data.inventory.push({
        productId,
        quantity,
        acquiredAt: Date.now(),
      });
    }
    
    this.saveData();
    
    this.log('📦', \`添加物品: \${productId} x\${quantity}\`);
    
    return { success: true };
  }`;
  }

  /**
   * 生成类型定义文件
   */
  private generateTypesFile(): GeneratedFile {
    const className = this.toPascalCase(this.config.gameId);

    const code = `/**
 * ${this.config.gameName} - 类型定义
 * 版本: ${this.config.version}
 * 自动生成，请勿手动修改
 */

// 游戏配置
export interface ${className}Config {
  gameId: '${this.config.gameId}';
  gameName: '${this.config.gameName}';
  version: '${this.config.version}';
  features: ${this.config.features.map(f => `'${f}'`).join(' | ')}[];
}

// 货币类型
export type CurrencyType = ${this.config.currencies.map(c => `'${c.id}'`).join(' | ')};

// 货币定义
export interface Currency {
${this.config.currencies.map(c => `  ${c.id}: { name: '${c.name}'; initialBalance: ${c.initialBalance} };`).join('\n')}
}

// 商品定义
export interface Product {
${this.config.products.map(p => `  ${p.id}: { name: '${p.name}'; category: '${p.category}'; price: ${JSON.stringify(p.price)} };`).join('\n')}
}

// Skill 实例类型（从主文件导入）
export type { ${className}Skill } from './${className}Skill';
`;

    return {
      path: `${this.options.outputDir}/${className}Types.ts`,
      content: code,
      type: 'types',
    };
  }

  /**
   * 生成测试文件
   */
  private generateTestFile(): GeneratedFile {
    const className = this.toPascalCase(this.config.gameId);

    const code = `/**
 * ${this.config.gameName} - 测试文件
 */

import { ${className}Skill } from './${className}Skill';

describe('${className}Skill', () => {
  let skill: ${className}Skill;

  beforeEach(async () => {
    skill = new ${className}Skill();
    await skill.initialize();
  });

  afterEach(async () => {
    await skill.dispose();
  });

${this.config.features.includes('wallet') ? `
  describe('钱包功能', () => {
    test('获取初始余额', async () => {
      const result = await skill.execute('getBalance', {});
      expect(result.balance).toBe(${this.config.currencies[0]?.initialBalance || 0});
    });

    test('增加余额', async () => {
      await skill.execute('addBalance', { currency: '${this.config.currencies[0]?.id}', amount: 100 });
      const result = await skill.execute('getBalance', { currency: '${this.config.currencies[0]?.id}' });
      expect(result.balance).toBe(${this.config.currencies[0]?.initialBalance || 0} + 100);
    });
  });
` : ''}

${this.config.features.includes('store') ? `
  describe('商店功能', () => {
    test('获取商品列表', async () => {
      const result = await skill.execute('getProducts', {});
      expect(result.products.length).toBeGreaterThan(0);
    });
  });
` : ''}
});
`;

    return {
      path: `${this.options.outputDir}/${className}Skill.test.ts`,
      content: code,
      type: 'test',
    };
  }

  /**
   * 生成配置文件
   */
  private generateConfigFile(): GeneratedFile {
    const code = `/**
 * ${this.config.gameName} - 配置文件
 */

export default ${JSON.stringify({
      gameId: this.config.gameId,
      gameName: this.config.gameName,
      version: this.config.version,
      features: this.config.features,
      currencies: this.config.currencies,
      products: this.config.products,
      inventory: this.config.inventory,
    }, null, 2)};
`;

    return {
      path: `${this.options.outputDir}/${this.config.gameId}.config.ts`,
      content: code,
      type: 'config',
    };
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toUpperCase());
  }
}

export default SkillCodeGenerator;
