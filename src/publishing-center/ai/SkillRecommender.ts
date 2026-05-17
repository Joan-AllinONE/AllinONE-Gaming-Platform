/**
 * AI技能推荐引擎
 * 
 * 基于游戏代码分析结果，智能推荐所需的AllinONE Skills
 * 计算推荐置信度，提供自动配置建议
 */

import {
  GameFramework,
  GameGenre,
  GameAnalysisResult,
  FeatureDetectionResult,
  SkillRecommendation,
  RecommendationResult,
} from '../types';

// ==================== Skill定义 ====================

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'gameplay' | 'social' | 'monetization';
  required: boolean; // 是否是必需Skill
  applicableFrameworks: GameFramework[];
  applicableGenres: GameGenre[];
  featureTriggers: string[]; // 触发该推荐的功能特征
  autoConfigRules?: AutoConfigRule[];
}

interface AutoConfigRule {
  condition: (analysis: GameAnalysisResult) => boolean;
  config: Record<string, unknown>;
}

// ==================== Skills知识库 ====================

const SKILLS_DATABASE: SkillDefinition[] = [
  {
    id: 'auth',
    name: '用户认证 (Auth)',
    description: '提供玩家登录、注册、身份验证功能',
    category: 'core',
    required: true,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: Object.values(GameGenre),
    featureTriggers: [],
    autoConfigRules: [
      {
        condition: (a) => a.features.find(f => f.feature === 'multiplayer')?.detected || false,
        config: { requireAuth: true, allowGuest: false },
      },
      {
        condition: () => true,
        config: { requireAuth: true, allowGuest: true },
      },
    ],
  },
  {
    id: 'wallet',
    name: '钱包系统 (Wallet)',
    description: '管理游戏币、算力等虚拟货币',
    category: 'core',
    required: true,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: Object.values(GameGenre),
    featureTriggers: [],
    autoConfigRules: [
      {
        condition: (a) => a.features.find(f => f.feature === 'in_app_purchase')?.detected || false,
        config: { currencies: ['gameCoins', 'computingPower', 'diamonds'], exchangeEnabled: true },
      },
      {
        condition: () => true,
        config: { currencies: ['gameCoins', 'computingPower'], exchangeEnabled: true },
      },
    ],
  },
  {
    id: 'inventory',
    name: '道具库存 (Inventory)',
    description: '管理游戏道具、装备、资源',
    category: 'core',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: [GameGenre.RPG, GameGenre.ACTION, GameGenre.ADVENTURE, GameGenre.STRATEGY, GameGenre.SIMULATION],
    featureTriggers: ['in_app_purchase'],
    autoConfigRules: [
      {
        condition: (a) => a.framework.framework === GameFramework.RPG_MAKER,
        config: { syncMode: 'automatic', itemCategories: ['weapon', 'armor', 'item', 'key'] },
      },
      {
        condition: () => true,
        config: { syncMode: 'manual', itemCategories: ['item', 'equipment', 'material'] },
      },
    ],
  },
  {
    id: 'store',
    name: '游戏商店 (Store)',
    description: '提供游戏内购买、道具商店功能',
    category: 'monetization',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: Object.values(GameGenre),
    featureTriggers: ['in_app_purchase'],
    autoConfigRules: [
      {
        condition: (a) => a.features.find(f => f.feature === 'in_app_purchase')?.detected || false,
        config: { enabled: true, paymentMethods: ['wallet', 'cash'] },
      },
    ],
  },
  {
    id: 'leaderboard',
    name: '排行榜 (Leaderboard)',
    description: '玩家分数排名、竞技排行',
    category: 'social',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: [GameGenre.ACTION, GameGenre.SHOOTER, GameGenre.RACING, GameGenre.PUZZLE, GameGenre.CASUAL],
    featureTriggers: ['leaderboard'],
    autoConfigRules: [
      {
        condition: () => true,
        config: { global: true, weekly: true, daily: false, maxEntries: 100 },
      },
    ],
  },
  {
    id: 'achievements',
    name: '成就系统 (Achievements)',
    description: '游戏成就、徽章、奖杯',
    category: 'gameplay',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: [GameGenre.RPG, GameGenre.ACTION, GameGenre.ADVENTURE, GameGenre.STRATEGY],
    featureTriggers: ['achievement_system'],
    autoConfigRules: [
      {
        condition: () => true,
        config: { autoSync: true, displayToast: true },
      },
    ],
  },
  {
    id: 'analytics',
    name: '数据分析 (Analytics)',
    description: '玩家行为分析、游戏数据统计',
    category: 'core',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: Object.values(GameGenre),
    featureTriggers: ['analytics'],
    autoConfigRules: [
      {
        condition: () => true,
        config: { trackSessions: true, trackEvents: true, trackEconomy: true },
      },
    ],
  },
  {
    id: 'multiplayer',
    name: '多人游戏 (Multiplayer)',
    description: '实时对战、协作模式、PVP',
    category: 'gameplay',
    required: false,
    applicableFrameworks: [GameFramework.PHASER, GameFramework.UNITY_WEBGL, GameFramework.GODOT, GameFramework.COCOS_CREATOR],
    applicableGenres: [GameGenre.ACTION, GameGenre.SHOOTER, GameGenre.RACING, GameGenre.STRATEGY],
    featureTriggers: ['multiplayer'],
    autoConfigRules: [
      {
        condition: () => true,
        config: { maxPlayers: 4, matchmaking: true },
      },
    ],
  },
  {
    id: 'cloudsave',
    name: '云存档 (Cloud Save)',
    description: '游戏进度云端同步、跨设备续玩',
    category: 'core',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: [GameGenre.RPG, GameGenre.ADVENTURE, GameGenre.SIMULATION, GameGenre.STRATEGY],
    featureTriggers: ['save_load'],
    autoConfigRules: [
      {
        condition: (a) => a.features.find(f => f.feature === 'save_load')?.detected || false,
        config: { autoSync: true, slots: 3 },
      },
    ],
  },
  {
    id: 'social',
    name: '社交分享 (Social)',
    description: '分享成绩、邀请好友、社区功能',
    category: 'social',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: [GameGenre.CASUAL, GameGenre.PUZZLE, GameGenre.SPORTS],
    featureTriggers: [],
    autoConfigRules: [
      {
        condition: () => true,
        config: { platforms: ['wechat', 'qq', 'weibo'] },
      },
    ],
  },
  {
    id: 'notification',
    name: '推送通知 (Notifications)',
    description: '游戏内消息、活动提醒',
    category: 'gameplay',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: Object.values(GameGenre),
    featureTriggers: [],
    autoConfigRules: [
      {
        condition: () => true,
        config: { dailyReminder: true, eventNotify: true },
      },
    ],
  },
  {
    id: 'localization',
    name: '多语言 (Localization)',
    description: '游戏界面多语言支持',
    category: 'core',
    required: false,
    applicableFrameworks: Object.values(GameFramework),
    applicableGenres: Object.values(GameGenre),
    featureTriggers: ['localization'],
    autoConfigRules: [
      {
        condition: (a) => a.features.find(f => f.feature === 'localization')?.detected || false,
        config: { languages: ['zh-CN', 'en-US'], fallback: 'zh-CN' },
      },
    ],
  },
];

// ==================== 推荐规则 ====================

interface RecommendationRule {
  id: string;
  priority: number;
  condition: (analysis: GameAnalysisResult) => boolean;
  action: (analysis: GameAnalysisResult, currentRecs: Map<string, SkillRecommendation>) => void;
}

const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    id: 'always_auth',
    priority: 100,
    condition: () => true,
    action: (analysis, recs) => {
      addRecommendation(recs, 'auth', 100, '所有游戏都需要用户认证', true, analysis);
    },
  },
  {
    id: 'always_wallet',
    priority: 99,
    condition: () => true,
    action: (analysis, recs) => {
      addRecommendation(recs, 'wallet', 100, '所有游戏都需要钱包系统', true, analysis);
    },
  },
  {
    id: 'rpg_inventory',
    priority: 80,
    condition: (a) => a.framework.framework === GameFramework.RPG_MAKER || 
                      a.features.some(f => f.feature === 'in_app_purchase' && f.detected),
    action: (analysis, recs) => {
      const confidence = analysis.framework.framework === GameFramework.RPG_MAKER ? 95 : 75;
      addRecommendation(recs, 'inventory', confidence, 'RPG/冒险类游戏通常需要道具系统', false, analysis);
    },
  },
  {
    id: 'iap_store',
    priority: 80,
    condition: (a) => a.features.some(f => f.feature === 'in_app_purchase' && f.detected),
    action: (analysis, recs) => {
      addRecommendation(recs, 'store', 85, '检测到内购相关代码，建议启用商店', false, analysis);
    },
  },
  {
    id: 'multiplayer_support',
    priority: 70,
    condition: (a) => a.features.some(f => f.feature === 'multiplayer' && f.detected),
    action: (analysis, recs) => {
      addRecommendation(recs, 'multiplayer', 90, '检测到多人游戏代码，已启用多人Skill', false, analysis);
      // 多人游戏通常需要强制登录
      const authRec = recs.get('auth');
      if (authRec) {
        authRec.autoConfig = { requireAuth: true, allowGuest: false };
        authRec.reason += ' (多人模式需要强制登录)';
      }
    },
  },
  {
    id: 'leaderboard_feature',
    priority: 60,
    condition: (a) => a.features.some(f => f.feature === 'leaderboard' && f.detected),
    action: (analysis, recs) => {
      addRecommendation(recs, 'leaderboard', 85, '检测到排行榜功能代码', false, analysis);
    },
  },
  {
    id: 'achievements_feature',
    priority: 60,
    condition: (a) => a.features.some(f => f.feature === 'achievement_system' && f.detected),
    action: (analysis, recs) => {
      addRecommendation(recs, 'achievements', 85, '检测到成就系统代码', false, analysis);
    },
  },
  {
    id: 'save_cloud',
    priority: 65,
    condition: (a) => a.features.some(f => f.feature === 'save_load' && f.detected),
    action: (analysis, recs) => {
      addRecommendation(recs, 'cloudsave', 80, '检测到存档功能，建议启用云存档', false, analysis);
    },
  },
  {
    id: 'analytics_auto',
    priority: 50,
    condition: (a) => a.fileStructure.totalFiles > 50,
    action: (analysis, recs) => {
      addRecommendation(recs, 'analytics', 70, '项目规模较大，建议启用数据分析', false, analysis);
    },
  },
  {
    id: 'social_casual',
    priority: 40,
    condition: (a) => a.framework.framework === GameFramework.CONSTRUCT ||
                      a.framework.framework === GameFramework.COCOS_CREATOR,
    action: (analysis, recs) => {
      addRecommendation(recs, 'social', 60, '休闲游戏适合社交分享功能', false, analysis);
    },
  },
  {
    id: 'localization_detected',
    priority: 45,
    condition: (a) => a.features.some(f => f.feature === 'localization' && f.detected),
    action: (analysis, recs) => {
      addRecommendation(recs, 'localization', 85, '检测到多语言支持', false, analysis);
    },
  },
];

// ==================== SkillRecommender 类 ====================

export class SkillRecommender {
  private skillsDb: Map<string, SkillDefinition>;

  constructor() {
    this.skillsDb = new Map(SKILLS_DATABASE.map(s => [s.id, s]));
  }

  /**
   * 基于分析结果推荐Skills
   */
  recommend(analysis: GameAnalysisResult): RecommendationResult {
    const recommendations = new Map<string, SkillRecommendation>();

    // 按优先级排序执行推荐规则
    const sortedRules = [...RECOMMENDATION_RULES].sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      try {
        if (rule.condition(analysis)) {
          rule.action(analysis, recommendations);
        }
      } catch (error) {
        console.warn(`[SkillRecommender] 规则 ${rule.id} 执行失败:`, error);
      }
    }

    // 转换为数组
    const recArray = Array.from(recommendations.values());
    const requiredSkills = recArray.filter(r => r.required).map(r => r.skillId);
    const optionalSkills = recArray.filter(r => !r.required).map(r => r.skillId);

    // 计算总体置信度
    const totalConfidence = recArray.length > 0
      ? recArray.reduce((sum, r) => sum + r.confidence, 0) / recArray.length
      : 0;

    return {
      recommendations: recArray,
      requiredSkills,
      optionalSkills,
      totalConfidence: Math.round(totalConfidence),
    };
  }

  /**
   * 获取特定Skill的详细信息
   */
  getSkillInfo(skillId: string): SkillDefinition | undefined {
    return this.skillsDb.get(skillId);
  }

  /**
   * 获取所有可用的Skills
   */
  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skillsDb.values());
  }

  /**
   * 生成Skill配置
   */
  generateSkillConfig(skillId: string, analysis: GameAnalysisResult): Record<string, unknown> {
    const skill = this.skillsDb.get(skillId);
    if (!skill || !skill.autoConfigRules) {
      return {};
    }

    // 找到第一个匹配的规则
    for (const rule of skill.autoConfigRules) {
      if (rule.condition(analysis)) {
        return { ...rule.config };
      }
    }

    return {};
  }

  /**
   * 批量生成所有推荐Skill的配置
   */
  generateAllConfigs(recommendation: RecommendationResult, analysis: GameAnalysisResult): Record<string, Record<string, unknown>> {
    const configs: Record<string, Record<string, unknown>> = {};

    for (const rec of recommendation.recommendations) {
      configs[rec.skillId] = rec.autoConfig || this.generateSkillConfig(rec.skillId, analysis);
    }

    return configs;
  }
}

// ==================== 辅助函数 ====================

function addRecommendation(
  recs: Map<string, SkillRecommendation>,
  skillId: string,
  confidence: number,
  reason: string,
  required: boolean,
  analysis: GameAnalysisResult
): void {
  const recommender = new SkillRecommender();
  const skill = recommender.getSkillInfo(skillId);
  
  if (!skill) return;

  // 检查框架兼容性
  if (!skill.applicableFrameworks.includes(analysis.framework.framework)) {
    confidence -= 20;
    reason += ' (框架兼容性警告)';
  }

  // 如果已经存在，保留更高置信度的
  const existing = recs.get(skillId);
  if (existing && existing.confidence >= confidence) {
    return;
  }

  // 生成自动配置
  const autoConfig = recommender.generateSkillConfig(skillId, analysis);

  recs.set(skillId, {
    skillId,
    skillName: skill.name,
    confidence: Math.max(0, Math.min(100, confidence)),
    reason,
    required,
    autoConfig,
  });
}

/**
 * 快速获取技能推荐
 */
export function getSkillRecommendations(analysis: GameAnalysisResult): RecommendationResult {
  const recommender = new SkillRecommender();
  return recommender.recommend(analysis);
}

export default SkillRecommender;
