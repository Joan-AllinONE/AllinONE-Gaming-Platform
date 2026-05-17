/**
 * 凭证事件总线
 * 提供类型安全的事件发布/订阅机制
 */

/**
 * 凭证事件类型
 */
export enum VoucherEventType {
  // 游戏事件
  GAME_COMPLETE = 'game_complete',
  GAME_WIN = 'game_win',
  GAME_LOSE = 'game_lose',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  TASK_COMPLETE = 'task_complete',
  LEVEL_UP = 'level_up',

  // 用户行为事件
  DAILY_CHECKIN = 'daily_checkin',
  USER_REFERRAL = 'user_referral',
  USER_REGISTER = 'user_register',

  // 凭证流转事件
  VOUCHER_TRANSFER = 'voucher_transfer',
  VOUCHER_CREATE = 'voucher_create',
  VOUCHER_DESTROY = 'voucher_destroy',
  VOUCHER_FREEZE = 'voucher_freeze',

  // 交易事件
  EXCHANGE_EXECUTE = 'exchange_execute',
  PURCHASE_COMPLETE = 'purchase_complete',

  // 定时事件
  SCHEDULE_TRIGGER = 'schedule_trigger',

  // 平台事件
  PLATFORM_EVENT = 'platform_event',
  SPECIAL_EVENT = 'special_event',
}

/**
 * 事件载荷
 */
export interface VoucherEventPayload {
  userId: string;
  userName?: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * 事件处理器类型
 */
type EventHandler = (payload: VoucherEventPayload) => void;

/**
 * 事件总线
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private listeners: Map<VoucherEventType, Set<EventHandler>>;

  private constructor() {
    this.listeners = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 订阅事件
   */
  on(type: VoucherEventType, handler: EventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  /**
   * 订阅事件（on 的别名）
   */
  subscribe(type: VoucherEventType, handler: EventHandler): () => void {
    return this.on(type, handler);
  }

  /**
   * 订阅一次性事件
   */
  once(type: VoucherEventType, handler: EventHandler): void {
    const onceHandler = (payload: VoucherEventPayload) => {
      this.off(type, onceHandler);
      handler(payload);
    };
    this.on(type, onceHandler);
  }

  /**
   * 取消订阅
   */
  off(type: VoucherEventType, handler: EventHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  /**
   * 触发事件
   */
  emit(type: VoucherEventType, payload: VoucherEventPayload): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] 事件处理器出错 (${type}):`, error);
        }
      });
    }
  }

  /**
   * 触发事件（异步）
   */
  async emitAsync(type: VoucherEventType, payload: VoucherEventPayload): Promise<void> {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const promises = Array.from(handlers).map(async handler => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(`[EventBus] 异步事件处理器出错 (${type}):`, error);
        }
      });
      await Promise.all(promises);
    }
  }

  /**
   * 获取监听器数量
   */
  listenerCount(type: VoucherEventType): number {
    return this.listeners.get(type)?.size || 0;
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(type?: VoucherEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.removeAllListeners();
    EventBus.instance = null;
  }
}

// 导出单例
export const eventBus = EventBus.getInstance();
