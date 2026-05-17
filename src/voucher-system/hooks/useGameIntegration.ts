/**
 * 游戏集成 Hook
 * 将平台游戏事件与凭证规则引擎连接
 */

import { useEffect, useCallback } from 'react';
import { voucherRuleEngine, VoucherRuleEngine } from '../engine/RuleEngine';
import { EventBus, VoucherEventType, VoucherEventPayload } from '../engine/EventBus';

/**
 * 游戏完成数据
 */
export interface GameCompleteData {
  gameId: string;
  gameName?: string;
  score?: number;
  duration?: number; // 游戏时长（秒）
  difficulty?: 'easy' | 'normal' | 'hard' | number;
  baseReward?: number;
  bonusMultiplier?: number;
  level?: number;
}

/**
 * 成就数据
 */
export interface AchievementData {
  achievementId: string;
  achievementName: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 任务数据
 */
export interface TaskData {
  taskId: string;
  taskName: string;
  taskType: string;
  difficulty?: number;
}

/**
 * 使用游戏集成
 */
export function useGameIntegration(userId: string, userName?: string) {
  const eventBus = EventBus.getInstance();

  /**
   * 触发游戏完成事件
   */
  const triggerGameComplete = useCallback((data: GameCompleteData) => {
    const payload: VoucherEventPayload = {
      userId,
      userName,
      timestamp: Date.now(),
      data: {
        ...data,
        eventName: 'game_complete',
      },
    };

    eventBus.emit(VoucherEventType.GAME_COMPLETE, payload);

    if (data.score && data.score > 0) {
      // 高分额外触发胜利事件
      eventBus.emit(VoucherEventType.GAME_WIN, {
        ...payload,
        data: { ...data, eventName: 'game_win' },
      });
    }
  }, [userId, userName, eventBus]);

  /**
   * 触发成就解锁事件
   */
  const triggerAchievement = useCallback((data: AchievementData) => {
    const payload: VoucherEventPayload = {
      userId,
      userName,
      timestamp: Date.now(),
      data: {
        ...data,
        eventName: 'achievement_unlock',
      },
    };

    eventBus.emit(VoucherEventType.ACHIEVEMENT_UNLOCK, payload);
  }, [userId, userName, eventBus]);

  /**
   * 触发任务完成事件
   */
  const triggerTaskComplete = useCallback((data: TaskData) => {
    const payload: VoucherEventPayload = {
      userId,
      userName,
      timestamp: Date.now(),
      data: {
        ...data,
        eventName: 'task_complete',
      },
    };

    eventBus.emit(VoucherEventType.TASK_COMPLETE, payload);
  }, [userId, userName, eventBus]);

  /**
   * 触发每日签到事件
   */
  const triggerDailyCheckin = useCallback(() => {
    const payload: VoucherEventPayload = {
      userId,
      userName,
      timestamp: Date.now(),
      data: {
        eventName: 'daily_checkin',
        consecutiveDays: 1, // 可以传入连续签到天数
      },
    };

    eventBus.emit(VoucherEventType.DAILY_CHECKIN, payload);
  }, [userId, userName, eventBus]);

  /**
   * 触发邀请奖励事件
   */
  const triggerReferral = useCallback((referredUserId: string) => {
    const payload: VoucherEventPayload = {
      userId,
      userName,
      timestamp: Date.now(),
      data: {
        eventName: 'user_referral',
        referredUserId,
      },
    };

    eventBus.emit(VoucherEventType.USER_REFERRAL, payload);
  }, [userId, userName, eventBus]);

  /**
   * 触发升级事件
   */
  const triggerLevelUp = useCallback((level: number) => {
    const payload: VoucherEventPayload = {
      userId,
      userName,
      timestamp: Date.now(),
      data: {
        eventName: 'level_up',
        level,
      },
    };

    eventBus.emit(VoucherEventType.LEVEL_UP, payload);
  }, [userId, userName, eventBus]);

  return {
    triggerGameComplete,
    triggerAchievement,
    triggerTaskComplete,
    triggerDailyCheckin,
    triggerReferral,
    triggerLevelUp,
  };
}

/**
 * 初始化凭证规则引擎
 * 在应用启动时调用
 */
export function initializeVoucherEngine(): () => void {
  // 每次初始化都重新设置事件监听器（确保 EventBus 重置后监听仍然有效）
  const engine = VoucherRuleEngine.getInstance();

  console.log('[VoucherSystem] 凭证规则引擎已初始化');

  // 返回清理函数
  return () => {
    // 清理时只销毁引擎实例，不影响 EventBus
    engine.destroy();
    console.log('[VoucherSystem] 凭证规则引擎已销毁');
  };
}

/**
 * 模拟游戏完成（用于测试）
 */
export function simulateGameComplete(
  userId: string,
  gameData: Partial<GameCompleteData> = {}
): void {
  const defaultData: GameCompleteData = {
    gameId: 'test_game',
    gameName: '测试游戏',
    score: 1000,
    duration: 300,
    difficulty: 'normal',
    baseReward: 100,
    bonusMultiplier: 1.5,
    level: 5,
    ...gameData,
  };

  const payload: VoucherEventPayload = {
    userId,
    timestamp: Date.now(),
    data: defaultData,
  };

  EventBus.getInstance().emit(VoucherEventType.GAME_COMPLETE, payload);
}

/**
 * 模拟每日签到（用于测试）
 */
export function simulateDailyCheckin(userId: string): void {
  const payload: VoucherEventPayload = {
    userId,
    timestamp: Date.now(),
    data: {
      eventName: 'daily_checkin',
      consecutiveDays: 1,
    },
  };

  EventBus.getInstance().emit(VoucherEventType.DAILY_CHECKIN, payload);
}
