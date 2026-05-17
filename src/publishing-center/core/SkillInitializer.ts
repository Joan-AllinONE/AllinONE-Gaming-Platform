/**
 * SkillInitializer - 游戏Skill自动初始化服务
 * 
 * 职责：
 * 1. 在发布游戏时自动初始化所需的Skills
 * 2. 注册Skills到SkillGateway
 * 3. 配置Skill间的依赖关系
 * 4. 生成游戏运行时的Skill配置
 * 5. 生成并注入 allinone.config.json 到游戏包
 */

import { skillGateway } from '@/skills';
import { AuthSkill } from '@/skills/auth/AuthSkill';
import { WalletSkill } from '@/skills/wallet/WalletSkill';
import { InventorySkill } from '@/skills/inventory/InventorySkill';
import { StoreSkill } from '@/skills/store/StoreSkill';
import type { Skill, SkillConfig } from '@/skills/types';
import type { PublishingConfig, SkillRecommendation, UploadedFile, GameAnalysisResult } from '../types';

export interface InitializedSkill {
  skillId: string;
  skillName: string;
  status: 'initialized' | 'failed' | 'skipped';
  config?: Record<string, any>;
  error?: string;
}

export interface SkillInitializationResult {
  success: boolean;
  gameId: string;
  initializedSkills: InitializedSkill[];
  failedSkills: InitializedSkill[];
  config: Record<string, any>;
}

/**
 * Skill默认配置模板
 */
const SKILL_DEFAULT_CONFIGS: Record<string, (gameId: string) => Record<string, any>> = {
  auth: (gameId) => ({
    gameId,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
    allowAnonymous: true,
    requireAuthForTransactions: true,
  }),
  
  wallet: (gameId) => ({
    gameId,
    defaultCurrency: 'gameCoins',
    currencies: [
      { code: 'gameCoins', name: '游戏币', type: 'virtual' },
      { code: 'newDayGameCoins', name: 'NewDay游戏币', type: 'virtual' },
      { code: 'aCoins', name: 'A币', type: 'premium' },
      { code: 'oCoins', name: 'O币', type: 'premium' },
      { code: 'cash', name: '现金', type: 'fiat' },
    ],
    initialBalance: {
      gameCoins: 1000,
      newDayGameCoins: 0,
      aCoins: 0,
      oCoins: 0,
      cash: 0,
    },
    transactionLogEnabled: true,
    maxTransactionAmount: {
      gameCoins: 1000000,
      aCoins: 10000,
      cash: 10000,
    },
  }),
  
  inventory: (gameId) => ({
    gameId,
    maxSlots: 100,
    maxStackSize: 999,
    categories: ['weapon', 'armor', 'consumable', 'material', 'quest'],
    allowTrading: true,
    autoSync: true,
    syncInterval: 30000, // 30秒
  }),
  
  store: (gameId) => ({
    gameId,
    currency: 'gameCoins',
    allowDiscounts: true,
    allowBundles: true,
    categories: ['featured', 'weapons', 'armor', 'consumables', 'premium'],
    taxRate: 0,
    requireInventory: true,
  }),
  
  leaderboard: (gameId) => ({
    gameId,
    categories: ['score', 'level', 'wins', 'playtime'],
    maxEntries: 100,
    updateInterval: 300000, // 5分钟
    anonymousEntries: false,
  }),
  
  achievements: (gameId) => ({
    gameId,
    categories: ['progress', 'skill', 'social', 'secret'],
    rewardsEnabled: true,
    notifyOnUnlock: true,
  }),
  
  analytics: (gameId) => ({
    gameId,
    trackEvents: ['play', 'purchase', 'level_up', 'achievement'],
    trackSessions: true,
    trackPerformance: true,
  }),
  
  cloudsave: (gameId) => ({
    gameId,
    slots: 3,
    autoSave: true,
    autoSaveInterval: 60000, // 1分钟
    compression: true,
  }),
  
  multiplayer: (gameId) => ({
    gameId,
    maxPlayers: 8,
    matchmakingEnabled: true,
    regions: ['asia', 'na', 'eu'],
  }),
  
  social: (gameId) => ({
    gameId,
    features: ['friends', 'chat', 'guilds', 'share'],
    moderationEnabled: true,
  }),
  
  notification: (gameId) => ({
    gameId,
    channels: ['in_app', 'push', 'email'],
    defaultChannel: 'in_app',
  }),
  
  localization: (gameId) => ({
    gameId,
    defaultLanguage: 'zh-CN',
    supportedLanguages: ['zh-CN', 'en-US', 'ja-JP'],
    fallbackLanguage: 'zh-CN',
  }),
};

/**
 * Skill工厂映射
 */
const SKILL_FACTORIES: Record<string, new (config: any) => Skill> = {
  auth: AuthSkill,
  wallet: WalletSkill,
  inventory: InventorySkill,
  store: StoreSkill,
  // 其他Skills可以在这里添加
};

/**
 * Skill依赖关系图
 */
const SKILL_DEPENDENCIES: Record<string, string[]> = {
  store: ['wallet', 'inventory'],
  inventory: ['auth'],
  wallet: ['auth'],
  leaderboard: ['auth'],
  achievements: ['auth'],
  cloudsave: ['auth'],
  multiplayer: ['auth'],
  social: ['auth'],
  notification: ['auth'],
  analytics: [],
  localization: [],
};

/**
 * Skill初始化器类
 */
export class SkillInitializer {
  private gameId: string;
  private initializedSkills: Map<string, Skill> = new Map();
  private results: InitializedSkill[] = [];

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  /**
   * 初始化游戏所需的所有Skills
   */
  async initializeSkills(
    recommendations: SkillRecommendation[],
    customConfigs?: Record<string, Record<string, any>>
  ): Promise<SkillInitializationResult> {
    console.log(`[SkillInitializer] 开始为游戏 ${this.gameId} 初始化Skills...`);
    
    this.results = [];
    this.initializedSkills.clear();

    // 1. 按依赖顺序排序Skills
    const sortedSkills = this.sortSkillsByDependencies(recommendations);
    
    // 2. 逐个初始化Skills
    for (const skill of sortedSkills) {
      await this.initializeSingleSkill(skill, customConfigs?.[skill.skillId]);
    }

    // 3. 生成配置
    const config = this.generateGameConfig();

    const failedSkills = this.results.filter(r => r.status === 'failed');
    const result: SkillInitializationResult = {
      success: failedSkills.length === 0,
      gameId: this.gameId,
      initializedSkills: this.results.filter(r => r.status === 'initialized'),
      failedSkills,
      config,
    };

    console.log(`[SkillInitializer] 初始化完成:`, {
      total: this.results.length,
      success: result.initializedSkills.length,
      failed: failedSkills.length,
    });

    return result;
  }

  /**
   * 按依赖顺序排序Skills
   */
  private sortSkillsByDependencies(recommendations: SkillRecommendation[]): SkillRecommendation[] {
    const skillIds = recommendations.map(r => r.skillId);
    const sorted: SkillRecommendation[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (skillId: string) => {
      if (visited.has(skillId)) return;
      if (visiting.has(skillId)) {
        throw new Error(`检测到循环依赖: ${skillId}`);
      }

      visiting.add(skillId);

      // 先处理依赖
      const deps = SKILL_DEPENDENCIES[skillId] || [];
      for (const dep of deps) {
        if (skillIds.includes(dep)) {
          visit(dep);
        }
      }

      visiting.delete(skillId);
      visited.add(skillId);

      const skill = recommendations.find(r => r.skillId === skillId);
      if (skill) {
        sorted.push(skill);
      }
    };

    for (const skill of recommendations) {
      visit(skill.skillId);
    }

    return sorted;
  }

  /**
   * 初始化单个Skill
   */
  private async initializeSingleSkill(
    recommendation: SkillRecommendation,
    customConfig?: Record<string, any>
  ): Promise<void> {
    const { skillId, skillName } = recommendation;

    try {
      // 检查是否已经初始化
      if (this.initializedSkills.has(skillId)) {
        this.results.push({
          skillId,
          skillName,
          status: 'skipped',
          error: '已经初始化',
        });
        return;
      }

      // 检查是否有工厂
      const SkillClass = SKILL_FACTORIES[skillId];
      if (!SkillClass) {
        // 对于未实现的Skills，记录为跳过
        this.results.push({
          skillId,
          skillName,
          status: 'skipped',
          error: '该Skill尚未实现',
        });
        return;
      }

      // 合并默认配置和自定义配置
      const defaultConfig = SKILL_DEFAULT_CONFIGS[skillId]?.(this.gameId) || { gameId: this.gameId };
      const config = { ...defaultConfig, ...customConfig };

      // 创建并注册Skill
      const skill = new SkillClass(config);
      await skillGateway.registerSkill(skill, config);
      
      // 存储初始化结果
      this.initializedSkills.set(skillId, skill);
      this.results.push({
        skillId,
        skillName,
        status: 'initialized',
        config,
      });

      console.log(`[SkillInitializer] ✓ Skill "${skillName}" 初始化成功`);
    } catch (error) {
      console.error(`[SkillInitializer] ✗ Skill "${skillName}" 初始化失败:`, error);
      this.results.push({
        skillId,
        skillName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 生成游戏运行时配置
   */
  private generateGameConfig(): Record<string, any> {
    const skillConfigs: Record<string, any> = {};
    
    for (const result of this.results) {
      if (result.status === 'initialized' && result.config) {
        skillConfigs[result.skillId] = result.config;
      }
    }

    return {
      gameId: this.gameId,
      initializedAt: new Date().toISOString(),
      skills: skillConfigs,
      gateway: {
        endpoint: '/api/skills',
        version: 'v1',
      },
    };
  }

  /**
   * 获取已初始化的Skill实例
   */
  getSkill(skillId: string): Skill | undefined {
    return this.initializedSkills.get(skillId);
  }

  /**
   * 检查Skill是否已初始化
   */
  isSkillInitialized(skillId: string): boolean {
    return this.initializedSkills.has(skillId);
  }

  /**
   * 获取所有已初始化的Skills
   */
  getAllInitializedSkills(): Map<string, Skill> {
    return new Map(this.initializedSkills);
  }
}

/**
 * 便捷函数：快速初始化游戏Skills
 */
export async function initializeGameSkills(
  gameId: string,
  recommendations: SkillRecommendation[],
  customConfigs?: Record<string, Record<string, any>>
): Promise<SkillInitializationResult> {
  const initializer = new SkillInitializer(gameId);
  return initializer.initializeSkills(recommendations, customConfigs);
}

/**
 * 便捷函数：为单个游戏获取默认Skill配置
 */
export function getDefaultSkillConfig(skillId: string, gameId: string): Record<string, any> {
  const configFn = SKILL_DEFAULT_CONFIGS[skillId];
  return configFn ? configFn(gameId) : { gameId };
}

/**
 * 便捷函数：检查Skill依赖是否满足
 */
export function checkSkillDependencies(
  skillId: string,
  initializedSkills: string[]
): { satisfied: boolean; missing: string[] } {
  const deps = SKILL_DEPENDENCIES[skillId] || [];
  const missing = deps.filter(dep => !initializedSkills.includes(dep));
  return {
    satisfied: missing.length === 0,
    missing,
  };
}

// ==================== 配置生成与注入（替代原 ConfigGenerator + AutoIntegration）====================

/**
 * 游戏配置生成器 - 生成 allinone.config.json 内容
 */
export interface GameConfigFile {
  version: string;
  gameId: string;
  game: {
    name: string;
    type: 'standard' | 'universal';
    framework: string;
    entryPoint: string;
  };
  skills: Record<string, any>;
  runtime: {
    sdkVersion: string;
    apiEndpoint: string;
    wsEndpoint?: string;
  };
  generatedAt: string;
  generatedBy: string;
}

/**
 * 生成 allinone.config.json 配置文件内容
 */
export function generateGameConfigFile(
  gameId: string,
  gameName: string,
  gameType: 'standard' | 'universal',
  framework: string,
  entryPoint: string,
  skillConfigs: Record<string, any>,
  options?: {
    sdkVersion?: string;
    apiEndpoint?: string;
    wsEndpoint?: string;
  }
): GameConfigFile {
  return {
    version: '1.0.0',
    gameId,
    game: {
      name: gameName,
      type: gameType,
      framework,
      entryPoint,
    },
    skills: skillConfigs,
    runtime: {
      sdkVersion: options?.sdkVersion || '1.0.0',
      apiEndpoint: options?.apiEndpoint || '/api/skills',
      wsEndpoint: options?.wsEndpoint,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: 'AllinONE-Publishing-Center',
  };
}

/**
 * 配置注入结果
 */
export interface ConfigInjectionResult {
  success: boolean;
  injected: boolean;
  configPath: string;
  modifiedFiles: string[];
  error?: string;
}

/**
 * 将 allinone.config.json 注入游戏包
 * 
 * 策略：
 * 1. 直接注入：添加 allinone.config.json 到根目录
 * 2. HTML 修改：在入口 HTML 中添加 config 全局变量或脚本引用
 */
export function injectConfigToGamePackage(
  files: UploadedFile[],
  config: GameConfigFile,
  options?: {
    injectMode?: 'file' | 'inline' | 'both';
    globalVarName?: string;
  }
): ConfigInjectionResult {
  const result: ConfigInjectionResult = {
    success: true,
    injected: false,
    configPath: 'allinone.config.json',
    modifiedFiles: [],
  };

  try {
    const injectMode = options?.injectMode || 'both';
    const globalVarName = options?.globalVarName || '__ALLINONE_CONFIG__';

    // 1. 添加配置文件
    if (injectMode === 'file' || injectMode === 'both') {
      const configFile: UploadedFile = {
        name: 'allinone.config.json',
        path: '/allinone.config.json',
        size: JSON.stringify(config).length,
        type: 'application/json',
        content: JSON.stringify(config, null, 2),
      };
      files.push(configFile);
      result.modifiedFiles.push('allinone.config.json');
    }

    // 2. 查找并修改入口 HTML 文件
    if (injectMode === 'inline' || injectMode === 'both') {
      const htmlFiles = files.filter(f => f.name.endsWith('.html'));
      
      for (const htmlFile of htmlFiles) {
        let htmlContent = typeof htmlFile.content === 'string' 
          ? htmlFile.content 
          : new TextDecoder().decode(htmlFile.content);

        // 检查是否已注入
        if (htmlContent.includes(globalVarName)) {
          continue;
        }

        // 在 <head> 或 <body> 开始处注入配置脚本
        const configScript = `<script>window.${globalVarName} = ${JSON.stringify(config)};</script>`;
        
        if (htmlContent.includes('<head>')) {
          htmlContent = htmlContent.replace('<head>', `<head>\n  ${configScript}`);
        } else if (htmlContent.includes('<body>')) {
          htmlContent = htmlContent.replace('<body>', `<body>\n  ${configScript}`);
        } else {
          htmlContent = configScript + '\n' + htmlContent;
        }

        // 更新文件内容
        htmlFile.content = htmlContent;
        htmlFile.size = htmlContent.length;
        result.modifiedFiles.push(htmlFile.name);
      }
    }

    result.injected = result.modifiedFiles.length > 0;
    console.log(`[SkillInitializer] 配置注入完成:`, {
      mode: injectMode,
      modifiedFiles: result.modifiedFiles,
    });

  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`[SkillInitializer] 配置注入失败:`, error);
  }

  return result;
}

/**
 * 完整配置流程：生成并注入配置到游戏包
 * 
 * 这是替代原 ConfigGenerator + AutoIntegration 的统一接口
 */
export async function setupGameConfig(
  gameId: string,
  gameName: string,
  gameType: 'standard' | 'universal',
  framework: string,
  entryPoint: string,
  files: UploadedFile[],
  recommendations: SkillRecommendation[],
  customConfigs?: Record<string, Record<string, any>>
): Promise<{
  initializationResult: SkillInitializationResult;
  configFile: GameConfigFile;
  injectionResult: ConfigInjectionResult;
}> {
  console.log(`[SkillInitializer] 开始配置游戏: ${gameName} (${gameId})`);

  // 1. 初始化 Skills（原有的核心逻辑）
  const initializationResult = await initializeGameSkills(
    gameId,
    recommendations,
    customConfigs
  );

  if (!initializationResult.success) {
    console.warn(`[SkillInitializer] Skill 初始化部分失败，继续生成配置...`);
  }

  // 2. 生成配置文件
  const configFile = generateGameConfigFile(
    gameId,
    gameName,
    gameType,
    framework,
    entryPoint,
    initializationResult.config.skills || {},
    {
      sdkVersion: '1.0.0',
      apiEndpoint: '/api/skills',
    }
  );

  // 3. 注入配置到游戏包
  const injectionResult = injectConfigToGamePackage(files, configFile, {
    injectMode: 'both',
    globalVarName: '__ALLINONE_CONFIG__',
  });

  console.log(`[SkillInitializer] 游戏配置完成:`, {
    gameId,
    skillsInitialized: initializationResult.initializedSkills.length,
    configGenerated: true,
    configInjected: injectionResult.injected,
  });

  return {
    initializationResult,
    configFile,
    injectionResult,
  };
}

/**
 * 验证游戏包是否包含 AllinONE 配置
 */
export function validateGameConfig(files: UploadedFile[]): {
  hasConfig: boolean;
  configPath?: string;
  hasInlineConfig: boolean;
  entryHtml?: string;
} {
  const result = {
    hasConfig: false,
    hasInlineConfig: false,
  } as {
    hasConfig: boolean;
    configPath?: string;
    hasInlineConfig: boolean;
    entryHtml?: string;
  };

  // 检查配置文件
  const configFile = files.find(f => f.name === 'allinone.config.json');
  if (configFile) {
    result.hasConfig = true;
    result.configPath = configFile.path;
  }

  // 检查 HTML 内联配置
  const htmlFiles = files.filter(f => f.name.endsWith('.html'));
  for (const htmlFile of htmlFiles) {
    const content = typeof htmlFile.content === 'string' 
      ? htmlFile.content 
      : new TextDecoder().decode(htmlFile.content);
    
    if (content.includes('__ALLINONE_CONFIG__')) {
      result.hasInlineConfig = true;
      result.entryHtml = htmlFile.name;
      break;
    }
  }

  return result;
}

export default SkillInitializer;
