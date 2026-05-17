/**
 * Skill 配置生成器类型定义
 */

/** 游戏功能类型 */
export type GameFeature = 'wallet' | 'store' | 'inventory' | 'leaderboard' | 'achievements' | 'custom';

/** 接入类型 */
export type IntegrationType = 'minimal' | 'standard' | 'full';

/** 同步模式 */
export type SyncMode = 'realtime' | 'manual' | 'hourly';

/** 货币配置 */
export interface CurrencyConfig {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  enabled: boolean;
  exchangeable?: boolean;
  icon?: string;
}

/** 商品价格 */
export interface ProductPrice {
  [currencyId: string]: number;
}

/** 商品配置 */
export interface ProductConfig {
  id: string;
  name: string;
  category: string;
  price: ProductPrice;
  stock: number;
  description: string;
  icon?: string;
  effects?: Record<string, any>;
  requirements?: Record<string, any>;
}

/** 库存配置 */
export interface InventoryConfig {
  enabled: boolean;
  syncMode: SyncMode;
  maxSlots: number;
  categories?: string[];
}

/** 奖励配置 */
export interface RewardConfig {
  trigger: string;
  reward: Record<string, number>;
  conditions?: Record<string, any>;
}

/** 商店分类配置 */
export interface StoreCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

/** 商店配置 */
export interface StoreConfig {
  enabled: boolean;
  categories: StoreCategory[];
  products: ProductConfig[];
  template?: string;
}

/** 钱包配置 */
export interface WalletConfig {
  enabled: boolean;
  currencies: CurrencyConfig[];
  rewards?: RewardConfig[];
}

/** Skill 完整配置 */
export interface SkillConfig {
  /** 游戏唯一ID */
  gameId: string;
  /** 游戏名称 */
  gameName: string;
  /** Skill 名称 */
  name: string;
  /** 游戏描述 */
  description: string;
  /** 版本号 */
  version: string;
  /** 接入类型 */
  integrationType: IntegrationType;
  /** 启用的功能列表 */
  features: GameFeature[];
  /** 货币配置 */
  currencies: CurrencyConfig[];
  /** 商品列表 */
  products: ProductConfig[];
  /** 库存配置 */
  inventory: InventoryConfig;
  /** 钱包配置（详细） */
  wallet?: WalletConfig;
  /** 商店配置（详细） */
  store?: StoreConfig;
  /** 自定义钩子代码 */
  hooks?: Record<string, string>;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/** 生成选项 */
export interface GenerateOptions {
  /** 输出目录 */
  outputDir?: string;
  /** 是否生成类型定义文件 */
  generateTypes?: boolean;
  /** 是否生成测试文件 */
  generateTests?: boolean;
  /** 是否格式化代码 */
  format?: boolean;
  /** 模板覆盖 */
  templateOverrides?: Record<string, string>;
}

/** 生成结果 */
export interface GenerationResult {
  success: boolean;
  files: GeneratedFile[];
  errors: GenerationError[];
  warnings: string[];
}

/** 生成的文件 */
export interface GeneratedFile {
  path: string;
  content: string;
  type: 'skill' | 'types' | 'test' | 'config';
}

/** 生成错误 */
export interface GenerationError {
  type: 'parse' | 'validation' | 'generation';
  message: string;
  location?: string;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
