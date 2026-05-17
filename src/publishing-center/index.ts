/**
 * AllinONE AI驱动发布中心
 * 
 * 统一导出发布中心的所有功能
 */

// ==================== 类型定义 ====================
export * from './types';

// ==================== AI引擎 ====================
export { GameCodeAnalyzer, analyzeGameCode } from './ai/GameCodeAnalyzer';
export { SkillRecommender, getSkillRecommendations } from './ai/SkillRecommender';

// ==================== 核心模块 ====================
export { 
  PublishingPipeline, 
  PublishingPipelineConfig 
} from './core/PublishingPipeline';

// Skill 初始化器 - 发布时自动初始化Skills & 配置生成/注入
export {
  SkillInitializer,
  initializeGameSkills,
  getDefaultSkillConfig,
  checkSkillDependencies,
  // 配置生成与注入（替代 ConfigGenerator + AutoIntegration）
  generateGameConfigFile,
  injectConfigToGamePackage,
  setupGameConfig,
  validateGameConfig,
  type InitializedSkill,
  type SkillInitializationResult,
  type GameConfigFile,
  type ConfigInjectionResult,
} from './core/SkillInitializer';

// 游戏运行时 - 让发布的游戏自动加载Skills
export {
  PublishedGameRuntime,
  createGameRuntime,
  launchGame,
  type RuntimeConfig,
  type RuntimeState,
  type RuntimeUser,
  type GameAPI,
} from './runtime/PublishedGameRuntime';

// ==================== 验证器 ====================
export { StandardGameValidator } from './validator/StandardGameValidator';

// ==================== UI组件 ====================
export { 
  PublishingCenter, 
  PublishingCenterProps 
} from './ui/PublishingCenter';

export {
  SkillConfigWizard,
} from './components/SkillConfigWizard';

// ==================== 标准SDK ====================
export { 
  AllinONEGame, 
  AllinONEConfig,
  GameState,
  GameEventType,
  GameEvent,
  GameEventHandler,
} from './standard-sdk';

export * from './standard-sdk/apis';
export * from './standard-sdk/types';

// ==================== CLI ====================
export { 
  AllinONECLI, 
  runCLI 
} from './cli';

// ==================== 便捷方法 ====================

import { GameCodeAnalyzer } from './ai/GameCodeAnalyzer';
import { SkillRecommender } from './ai/SkillRecommender';
import { StandardGameValidator } from './validator/StandardGameValidator';
import { PublishingPipeline } from './core/PublishingPipeline';
import { PublishedGameRuntime } from './runtime/PublishedGameRuntime';
import { 
  UploadedFile, 
  GameAnalysisResult, 
  RecommendationResult, 
  StandardValidationReport,
  PublishingConfig,
  PublishResult,
  GameType,
} from './types';

/**
 * 完整的游戏分析流程
 * 
 * 1. 分析游戏代码
 * 2. 推荐Skills
 * 3. 验证是否符合标准
 */
export async function analyzeGame(
  files: UploadedFile[]
): Promise<{
  analysis: GameAnalysisResult;
  recommendations: RecommendationResult;
  validation: StandardValidationReport;
}> {
  // 创建分析器
  const analyzer = new GameCodeAnalyzer();
  const recommender = new SkillRecommender();
  const validator = new StandardGameValidator();

  // 并行执行
  const analysis = await analyzer.analyze(files);
  
  const [recommendations, validation] = await Promise.all([
    Promise.resolve(recommender.recommend(analysis)),
    validator.validate(files, analysis),
  ]);

  return {
    analysis,
    recommendations,
    validation,
  };
}

/**
 * 一键发布游戏 - 傻瓜式操作
 * 
 * 完整流程：
 * 1. 分析游戏代码
 * 2. 推荐Skills
 * 3. 自动初始化Skills
 * 4. 构建和部署
 * 5. 注册到平台
 * 
 * @example
 * ```typescript
 * import { oneClickPublish } from '@/publishing-center';
 * 
 * const result = await oneClickPublish({
 *   gameId: 'my-awesome-game',
 *   files: uploadedFiles,
 *   onProgress: (progress, message) => {
 *     console.log(`${progress}%: ${message}`);
 *   },
 * });
 * 
 * if (result.success) {
 *   console.log('游戏发布成功！');
 *   console.log('访问地址:', result.url);
 *   
 *   // 启动游戏
 *   const { runtime, api } = await launchPublishedGame(result.gameId);
 * }
 * ```
 */
export async function oneClickPublish(options: {
  gameId: string;
  files: UploadedFile[];
  gameType?: GameType;
  onProgress?: (progress: number, message: string) => void;
  onStepChange?: (step: string, status: string) => void;
}): Promise<PublishResult> {
  const { gameId, files, gameType = GameType.UNIVERSAL, onProgress, onStepChange } = options;

  console.log('[OneClickPublish] 开始一键发布流程...');

  // 第1步：分析游戏
  onProgress?.(5, '正在分析游戏代码...');
  const { analysis, recommendations } = await analyzeGame(files);

  // 第2步：创建发布配置
  onProgress?.(15, '准备发布配置...');
  const publishConfig: PublishingConfig = {
    gameId,
    gameType,
    analysisResult: analysis,
    skillRecommendations: recommendations.recommendations,
    files,
  };

  // 第3步：执行发布流水线
  onProgress?.(20, '开始发布...');
  const pipeline = new PublishingPipeline({
    onProgress: (progress, message) => {
      // 将20-100映射到实际进度
      const mappedProgress = 20 + (progress * 0.8);
      onProgress?.(mappedProgress, message);
    },
    onStepChange: (state) => {
      onStepChange?.(state.step, state.status);
    },
  });

  const result = await pipeline.publish(publishConfig);

  console.log('[OneClickPublish] 发布流程完成:', result);
  return result;
}

/**
 * 快速发布 - 最简单的发布方式
 * 
 * 只需提供游戏ID和文件，其他全部自动完成
 * 
 * @example
 * ```typescript
 * const result = await quickPublish('my-game', files);
 * if (result.success) {
 *   alert('发布成功！');
 * }
 * ```
 */
export async function quickPublish(
  gameId: string, 
  files: UploadedFile[]
): Promise<PublishResult> {
  return oneClickPublish({ gameId, files });
}

/**
 * 启动已发布的游戏
 * 
 * @example
 * ```typescript
 * const { runtime, api } = await launchPublishedGame('my-game');
 * 
 * // 使用API
 * const user = await api.auth.login();
 * const balance = await api.wallet.getBalance();
 * const items = await api.inventory.getItems();
 * ```
 */
export async function launchPublishedGame(gameId: string): Promise<{
  runtime: PublishedGameRuntime;
  api: any;
}> {
  const runtime = new PublishedGameRuntime({ gameId, debug: true });
  await runtime.initialize();
  
  const api = runtime.getAPI();
  
  // 自动匿名登录
  if (!api.auth.isAuthenticated()) {
    await api.auth.login({ anonymous: true });
  }
  
  return { runtime, api };
}

/**
 * 快速检查是否为标准游戏
 */
export async function isStandardGame(files: UploadedFile[]): Promise<boolean> {
  const validator = new StandardGameValidator();
  const result = await validator.quickCheck(files);
  return result.isStandard;
}

// ==================== 版本信息 ====================

export const PUBLISHING_CENTER_VERSION = '1.0.0';

export default {
  version: PUBLISHING_CENTER_VERSION,
};
