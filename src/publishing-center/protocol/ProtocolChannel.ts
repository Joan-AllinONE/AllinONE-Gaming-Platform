/**
 * AllinONE OpenGames Protocol - 通信协议定义
 *
 * 标准化平台与游戏之间的通信协议，支持双模式：
 * - Mode A (注入适配): 游戏无需修改，Effect Engine 自动适配
 * - Mode B (标准集成): 游戏主动集成 @allinone/standard-sdk
 * - Hybrid (混合模式): 同时使用两种模式
 *
 * 通信方式：postMessage (iframe)
 */

// ==================== 协议版本 ====================

export const PROTOCOL_VERSION = '1.0.0';
export const PROTOCOL_NAMESPACE = 'ALLINONE_PROTOCOL';

// ==================== 游戏模式 ====================

export type ProtocolMode = 'inject' | 'integrated' | 'hybrid';

// ==================== 下行消息：平台 → 游戏 ====================

export type PlatformToGameMessage =
  /** 协议初始化 */
  | {
      type: 'PROTOCOL:INIT';
      version: string;
      gameId: string;
      config: GameProtocolConfig;
      timestamp: number;
    }
  /** 执行协议动作（平台触发游戏内能力） */
  | {
      type: 'PROTOCOL:EXECUTE';
      action: string;
      params: any;
      requestId: string;
      timestamp: number;
    }
  /** 更新协议配置（运行时动态调整） */
  | {
      type: 'PROTOCOL:CONFIG';
      config: Partial<GameProtocolConfig>;
      timestamp: number;
    }
  /** 兑换结果通知 */
  | {
      type: 'REDEEM_RESULT';
      data: RedeemResultData;
      timestamp: number;
    }
  /** 凭证下发（跨游戏扩展内容） */
  | {
      type: 'EXTENSION_VOUCHER';
      voucher: ExtensionVoucherPayload;
      timestamp: number;
    }
  /** Schema 响应 */
  | {
      type: 'PROTOCOL:SCHEMA_RESPONSE';
      schemaName: string;
      schema: ExtensionSchema;
      requestId: string;
      timestamp: number;
    }
  /** 事件广播 */
  | {
      type: 'PLATFORM_EVENT';
      event: string;
      data: any;
      timestamp: number;
    };

// ==================== 上行消息：游戏 → 平台 ====================

export type GameToPlatformMessage =
  /** 协议就绪，游戏声明自身能力 */
  | {
      type: 'PROTOCOL:READY';
      protocolVersion: string;
      mode: ProtocolMode;
      gameId: string;
      supportedActions: string[];
      supportedSchemas: string[];
      timestamp: number;
    }
  /** 上报协议动作结果 */
  | {
      type: 'PROTOCOL:ACTION_RESULT';
      action: string;
      success: boolean;
      data?: any;
      error?: string;
      requestId: string;
      timestamp: number;
    }
  /** 查询可用 Schema */
  | {
      type: 'PROTOCOL:SCHEMA_QUERY';
      schemaName: string;
      requestId: string;
      timestamp: number;
    }
  /** 游戏内事件上报 */
  | {
      type: 'GAME_EVENT';
      event: string;
      data: any;
      timestamp: number;
    }
  /** 兑换道具（游戏侧发起） */
  | {
      type: 'REDEEM_ITEM';
      data: {
        code: string;
        gameId: string;
      };
      timestamp: number;
    };

// ==================== 协议配置 ====================

export interface GameProtocolConfig {
  /** 协议模式 */
  mode: ProtocolMode;
  /** 游戏ID */
  gameId: string;
  /** 支持的动作列表 */
  supportedActions: string[];
  /** 支持的 Schema 列表 */
  supportedSchemas: string[];
  /** 启用的 Skills */
  skills: string[];
  /** 协议参数 */
  params?: {
    /** 超时时间(ms) */
    timeout?: number;
    /** 心跳间隔(ms) */
    heartbeat?: number;
    /** 是否启用调试日志 */
    debug?: boolean;
  };
}

// ==================== 兑换相关 ====================

export interface RedeemResultData {
  success: boolean;
  itemId?: string;
  itemName?: string;
  effectType?: string;
  quantity?: number;
  effects?: Record<string, any>;
  code?: string;
  message?: string;
}

// ==================== 凭证相关 ====================

export interface ExtensionVoucherPayload {
  id: string;
  type: 'game_extension';
  schemaName: string;
  sourceGameId: string;
  targetGameId?: string;
  data: any;
  signature: string;
  timestamp: number;
  expiresAt?: number;
}

// ==================== Schema 定义 ====================

export interface ExtensionSchema {
  name: string;
  version: string;
  description: string;
  /** AI 可读的输入 Schema */
  inputSchema: JSONSchema;
  /** 生成结果的结构 */
  outputSchema: JSONSchema;
  /** 跨游戏适配规则 */
  adapters?: Record<string, (data: any) => any>;
  /** 示例数据（供 AI 生成参考） */
  examples?: any[];
  /** 标签（用于分类） */
  tags?: string[];
  /** 作者 */
  author?: string;
}

// ==================== JSON Schema 子集 ====================

export interface JSONSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: any;
  description?: string;
  [key: string]: any;
}

// ==================== 协议通道状态 ====================

export interface ProtocolChannelState {
  gameId: string;
  mode: ProtocolMode;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  protocolVersion: string;
  supportedActions: string[];
  supportedSchemas: string[];
  connectedAt: number;
  lastHeartbeat: number;
  skills: string[];
}

// ==================== 事件枚举 ====================

export const ProtocolEvents = {
  /** 协议就绪 */
  READY: 'protocol:ready',
  /** 协议断开 */
  DISCONNECTED: 'protocol:disconnected',
  /** Schema 已注册 */
  SCHEMA_REGISTERED: 'schema:registered',
  /** 游戏事件 */
  GAME_EVENT: 'game:event',
  /** 凭证下发 */
  VOUCHER_ISSUED: 'voucher:issued',
  /** 兑换成功 */
  REDEEM_SUCCESS: 'redeem:success',
  /** 协议错误 */
  ERROR: 'protocol:error',
} as const;

// ==================== 消息创建辅助函数 ====================

/** 创建协议初始化消息 */
export function createInitMessage(gameId: string, config: GameProtocolConfig): PlatformToGameMessage {
  return {
    type: 'PROTOCOL:INIT',
    version: PROTOCOL_VERSION,
    gameId,
    config,
    timestamp: Date.now(),
  };
}

/** 创建协议就绪消息 */
export function createReadyMessage(
  gameId: string,
  mode: ProtocolMode,
  supportedActions: string[],
  supportedSchemas: string[]
): GameToPlatformMessage {
  return {
    type: 'PROTOCOL:READY',
    protocolVersion: PROTOCOL_VERSION,
    mode,
    gameId,
    supportedActions,
    supportedSchemas,
    timestamp: Date.now(),
  };
}

/** 创建扩展凭证下发消息 */
export function createVoucherMessage(voucher: ExtensionVoucherPayload): PlatformToGameMessage {
  return {
    type: 'EXTENSION_VOUCHER',
    voucher,
    timestamp: Date.now(),
  };
}
