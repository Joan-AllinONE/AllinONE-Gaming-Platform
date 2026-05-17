/**
 * @allinone/standard-sdk - Protocol Client
 *
 * 游戏端的协议客户端，Mode B（标准集成）的核心组件。
 * 负责在 game 与平台之间建立标准化的协议通信。
 *
 * 使用方式（游戏开发方）：
 * ```typescript
 * import { ProtocolClient } from '@allinone/standard-sdk/protocol';
 *
 * const client = new ProtocolClient({
 *   gameId: 'my-game',
 *   supportedActions: ['start', 'pause', 'resume'],
 *   supportedSchemas: ['weapon', 'shop'],
 * });
 * await client.initialize();
 * ```
 */

import type {
  GameToPlatformMessage,
  PlatformToGameMessage,
  ProtocolMode,
} from '../../../protocol/ProtocolChannel';

import {
  PROTOCOL_VERSION,
  createReadyMessage,
} from '../../../protocol/ProtocolChannel';

// ==================== 配置 ====================

export interface ProtocolClientConfig {
  /** 游戏 ID */
  gameId: string;
  /** 协议模式 */
  mode?: ProtocolMode;
  /** 支持的动作列表 */
  supportedActions?: string[];
  /** 支持的 Schema 列表 */
  supportedSchemas?: string[];
  /** 调试模式 */
  debug?: boolean;
  /** 自动初始化（默认 true） */
  autoInit?: boolean;
}

// ==================== ProtocolClient ====================

export class ProtocolClient {
  private config: Required<ProtocolClientConfig>;
  private initialized = false;
  private parentOrigin = '*';
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private boundHandleMessage: (event: MessageEvent) => void;

  constructor(config: ProtocolClientConfig) {
    this.config = {
      mode: 'integrated',
      supportedActions: [],
      supportedSchemas: [],
      debug: false,
      autoInit: true,
      ...config,
    };

    this.boundHandleMessage = this.handleMessage.bind(this);
  }

  /**
   * 初始化协议客户端
   * 1. 声明游戏能力（支持的 Schema、动作）
   * 2. 监听平台消息
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 监听平台消息
    window.addEventListener('message', this.boundHandleMessage);

    // 发送协议就绪消息
    this.sendToParent(
      createReadyMessage(
        this.config.gameId,
        this.config.mode,
        this.config.supportedActions,
        this.config.supportedSchemas
      )
    );

    this.initialized = true;
    this.log('ProtocolClient 已就绪');
  }

  // ==================== 事件监听 ====================

  /**
   * 监听协议消息
   */
  on(event: string, handler: (data: any) => void): void {
    this.messageHandlers.set(event, handler);
  }

  /**
   * 取消监听
   */
  off(event: string): void {
    this.messageHandlers.delete(event);
  }

  // ==================== 发送消息 ====================

  /**
   * 发送游戏事件到平台
   */
  sendEvent(event: string, data: any): void {
    this.sendToParent({
      type: 'GAME_EVENT',
      event,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 发送协议动作结果
   */
  sendActionResult(action: string, success: boolean, data?: any, error?: string): void {
    this.sendToParent({
      type: 'PROTOCOL:ACTION_RESULT',
      action,
      success,
      data,
      error,
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    });
  }

  /**
   * 查询 Schema
   */
  querySchema(schemaName: string, callback: (schema: any) => void): void {
    const requestId = `qs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    this.on(`schema:${requestId}`, (schema) => {
      callback(schema);
      this.off(`schema:${requestId}`);
    });

    this.sendToParent({
      type: 'PROTOCOL:SCHEMA_QUERY',
      schemaName,
      requestId,
      timestamp: Date.now(),
    });
  }

  /**
   * 兑换道具
   */
  redeemItem(code: string): Promise<any> {
    return new Promise((resolve) => {
      const handler = (data: any) => {
        resolve(data);
        this.off('REDEEM_RESULT', handler);
      };
      this.on('REDEEM_RESULT', handler);

      this.sendToParent({
        type: 'REDEEM_ITEM',
        data: { code, gameId: this.config.gameId },
        timestamp: Date.now(),
      });
    });
  }

  // ==================== 消息处理 ====================

  private handleMessage(event: MessageEvent): void {
    const message = event.data as PlatformToGameMessage;
    if (!message || !message.type) return;

    this.log('收到平台消息:', message.type);

    switch (message.type) {
      case 'PROTOCOL:INIT':
        this.handleInit(message);
        this.emit('init', message);
        break;

      case 'PROTOCOL:EXECUTE':
        this.emit(`action:${message.action}`, message.params);
        this.emit('execute', message);
        break;

      case 'PROTOCOL:CONFIG':
        this.emit('config', message.config);
        break;

      case 'PROTOCOL:SCHEMA_RESPONSE':
        this.emit(`schema:${message.requestId}`, message.schema);
        break;

      case 'REDEEM_RESULT':
        this.emit('REDEEM_RESULT', message.data);
        break;

      case 'EXTENSION_VOUCHER':
        this.emit('voucher', message.voucher);
        break;

      case 'PLATFORM_EVENT':
        this.emit(message.event, message.data);
        this.emit('platform_event', { event: message.event, data: message.data });
        break;
    }
  }

  private handleInit(message: any): void {
    // 处理平台初始化指令
    this.parentOrigin = '*'; // 生产环境应验证来源
    this.log('平台初始化完成:', message.gameId);
  }

  // ==================== 内部方法 ====================

  private sendToParent(message: GameToPlatformMessage): void {
    try {
      window.parent.postMessage(message, this.parentOrigin);
    } catch (error) {
      console.error('[ProtocolClient] 发送消息失败:', error);
    }
  }

  private emit(event: string, data: any): void {
    const handler = this.messageHandlers.get(event);
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error(`[ProtocolClient] 事件处理错误 (${event}):`, error);
      }
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[ProtocolClient]', ...args);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    window.removeEventListener('message', this.boundHandleMessage);
    this.messageHandlers.clear();
    this.initialized = false;
  }
}

export default ProtocolClient;
