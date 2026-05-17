/**
 * AllinONE Skill 系统 - 事件总线
 * 实现 Skill 间的事件驱动通信
 */

import { EventHandler, SkillEvent, SkillContext } from './types';

/**
 * 事件总线类
 * 支持：订阅/发布、一次性监听、命名空间
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();
  private wildcardHandlers: Set<(event: string, data: any, context: SkillContext) => void> = new Set();

  /**
   * 订阅事件
   * @param event 事件名称（支持通配符 *）
   * @param handler 事件处理器
   */
  on(event: string, handler: EventHandler): void {
    if (event === '*') {
      this.wildcardHandlers.add(handler as any);
      return;
    }

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  /**
   * 订阅事件（只触发一次）
   * @param event 事件名称
   * @param handler 事件处理器
   */
  once(event: string, handler: EventHandler): void {
    const wrappedHandler: EventHandler = async (data, context) => {
      this.off(event, wrappedHandler);
      await handler(data, context);
    };

    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }
    this.onceHandlers.get(event)!.add(wrappedHandler);
    this.on(event, wrappedHandler);
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off(event: string, handler: EventHandler): void {
    if (event === '*') {
      this.wildcardHandlers.delete(handler as any);
      return;
    }

    this.handlers.get(event)?.delete(handler);
    this.onceHandlers.get(event)?.delete(handler);
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   * @param context 上下文
   * @param source 来源Skill
   */
  emit(event: string, data: any, context: SkillContext, source?: string): void {
    const skillEvent: SkillEvent = {
      name: event,
      data,
      context,
      timestamp: Date.now(),
      source,
    };

    // 执行精确匹配的处理器
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        this.executeHandler(handler, data, context, event);
      });
    }

    // 执行通配符处理器
    this.wildcardHandlers.forEach(handler => {
      try {
        handler(event, data, context);
      } catch (error) {
        console.error(`[EventBus] 通配符处理器执行失败: ${event}`, error);
      }
    });

    // 执行命名空间匹配（如 wallet.* 匹配 wallet.updated）
    const namespace = event.split('.')[0];
    const namespaceHandlers = this.handlers.get(`${namespace}.*`);
    if (namespaceHandlers) {
      namespaceHandlers.forEach(handler => {
        this.executeHandler(handler, skillEvent, context, event);
      });
    }
  }

  /**
   * 执行处理器（带错误捕获）
   */
  private executeHandler(
    handler: EventHandler,
    data: any,
    context: SkillContext,
    event: string
  ): void {
    Promise.resolve()
      .then(() => handler(data, context))
      .catch(error => {
        console.error(`[EventBus] 事件处理器执行失败: ${event}`, error);
      });
  }

  /**
   * 清除所有事件监听
   */
  clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
    this.wildcardHandlers.clear();
  }

  /**
   * 获取事件监听统计
   */
  getStats(): { event: string; count: number }[] {
    const stats: { event: string; count: number }[] = [];
    this.handlers.forEach((handlers, event) => {
      stats.push({ event, count: handlers.size });
    });
    return stats.sort((a, b) => b.count - a.count);
  }
}

/**
 * 全局事件总线实例
 */
export const globalEventBus = new EventBus();
