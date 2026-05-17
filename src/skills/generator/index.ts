/**
 * Skill 生成器主入口
 * 提供完整的配置解析 -> 验证 -> 代码生成流程
 */

import { SkillConfigParser } from './SkillConfigParser';
import { SkillCodeGenerator } from './SkillCodeGenerator';
import { ConfigValidator } from './ConfigValidator';
import type { 
  SkillConfig, 
  GenerateOptions, 
  GenerationResult,
  ValidationResult,
} from './types';

export { SkillConfigParser, SkillCodeGenerator, ConfigValidator };
export * from './types';

/**
 * Skill 生成器选项
 */
export interface GeneratorOptions extends GenerateOptions {
  /** 是否自动修复配置错误 */
  autoFix?: boolean;
  /** 验证级别: strict | normal | loose */
  validationLevel?: 'strict' | 'normal' | 'loose';
}

/**
 * 完整的 Skill 生成流程
 * 
 * @param configContent Markdown/YAML 格式的配置内容
 * @param options 生成选项
 * @returns 生成结果
 * 
 * @example
 * ```typescript
 * const markdown = `
 * # 我的游戏
 * ## 基础信息
 * 游戏ID: my-game
 * - [x] 钱包系统
 * `;
 * 
 * const result = await generateSkill(markdown);
 * console.log(result.files);
 * ```
 */
export async function generateSkill(
  configContent: string,
  options: GeneratorOptions = {}
): Promise<GenerationResult & { validation: ValidationResult }> {
  const opts: GeneratorOptions = {
    autoFix: true,
    validationLevel: 'normal',
    ...options,
  };

  try {
    // 1. 解析配置
    let config: SkillConfig;
    
    if (configContent.trim().startsWith('---') || configContent.includes('gameId:')) {
      // YAML 格式
      config = SkillConfigParser.parseYAML(configContent);
    } else {
      // Markdown 格式
      config = SkillConfigParser.parseMarkdown(configContent);
    }

    // 2. 验证配置
    let validation = ConfigValidator.validate(config);

    // 3. 自动修复（如果启用）
    if (!validation.valid && opts.autoFix) {
      const fixed = ConfigValidator.autoFix(config);
      config = fixed as SkillConfig;
      validation = ConfigValidator.validate(config);
    }

    // 4. 严格模式：验证失败不生成
    if (opts.validationLevel === 'strict' && !validation.valid) {
      return {
        success: false,
        files: [],
        errors: validation.errors.map(e => ({ type: 'validation', message: e })),
        warnings: validation.warnings,
        validation,
      };
    }

    // 5. 生成代码
    const generator = new SkillCodeGenerator(config, opts);
    const result = generator.generate();

    return {
      ...result,
      warnings: [...result.warnings, ...validation.warnings],
      validation,
    };

  } catch (error) {
    return {
      success: false,
      files: [],
      errors: [{
        type: 'parse',
        message: error instanceof Error ? error.message : '配置解析失败',
      }],
      warnings: [],
      validation: { valid: false, errors: [], warnings: [] },
    };
  }
}

/**
 * 从配置文件生成 Skill
 */
export async function generateSkillFromFile(
  filePath: string,
  options: GeneratorOptions = {}
): Promise<GenerationResult & { validation: ValidationResult }> {
  // 注意：实际使用时需要文件系统支持
  // 这里仅作为接口定义
  throw new Error('File system access not implemented in browser environment');
}

/**
 * 批量生成 Skills
 */
export async function batchGenerateSkills(
  configs: string[],
  options: GeneratorOptions = {}
): Promise<(GenerationResult & { validation: ValidationResult })[]> {
  return Promise.all(configs.map(config => generateSkill(config, options)));
}

/**
 * 验证配置（不生成代码）
 */
export function validateConfig(configContent: string): ValidationResult {
  try {
    let config: SkillConfig;
    
    if (configContent.trim().startsWith('---') || configContent.includes('gameId:')) {
      config = SkillConfigParser.parseYAML(configContent);
    } else {
      config = SkillConfigParser.parseMarkdown(configContent);
    }

    return ConfigValidator.validate(config);
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : '配置解析失败'],
      warnings: [],
    };
  }
}

/**
 * 获取默认配置模板
 */
export function getDefaultTemplate(): string {
  return `# 我的游戏 - Skill 配置

## 基础信息
- **游戏ID**: my-awesome-game
- **游戏名称**: 我的游戏
- **接入类型**: 标准接入

## 功能开关
- [x] 钱包系统
- [x] 商店系统
- [x] 库存同步
- [ ] 排行榜
- [ ] 成就系统

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|------|--------|
| 游戏币 | ✅ | 1000 |
| 金币 | ✅ | 0 |

## 商品列表
| 商品ID | 名称 | 价格(游戏币) | 类型 |
|-------|------|-------------|------|
| sword_001 | 新手剑 | 100 | 武器 |
| shield_001 | 木盾 | 80 | 防具 |
| hp_potion | 生命药水 | 10 | 消耗品 |
`;
}

/**
 * 获取 YAML 配置模板
 */
export function getYAMLTemplate(): string {
  return `game:
  id: my-awesome-game
  name: 我的游戏
  description: 一款精彩的游戏
  version: 1.0.0

features:
  - wallet
  - store
  - inventory

wallet:
  enabled: true
  currencies:
    - id: game_coin
      name: 游戏币
      type: coin
      initialBalance: 1000
    - id: gold
      name: 金币
      type: premium
      initialBalance: 0

store:
  enabled: true
  categories:
    - id: weapons
      name: 武器
    - id: consumables
      name: 消耗品
  
  products:
    - id: sword_001
      name: 新手剑
      category: weapons
      price:
        game_coin: 100
      stock: 999
      description: 新手冒险者的首选武器
    
    - id: hp_potion
      name: 生命药水
      category: consumables
      price:
        game_coin: 10
      stock: 9999
      description: 恢复50点生命值

inventory:
  enabled: true
  syncMode: realtime
  maxSlots: 50
`;
}

// 默认导出
export default {
  generateSkill,
  generateSkillFromFile,
  batchGenerateSkills,
  validateConfig,
  getDefaultTemplate,
  getYAMLTemplate,
  SkillConfigParser,
  SkillCodeGenerator,
  ConfigValidator,
};
