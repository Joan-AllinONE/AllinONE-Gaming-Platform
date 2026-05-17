/**
 * ProtocolClient 配置类型
 * （占位文件，Phase 2 实现 ProtocolClient 时使用）
 *
 * 此类型定义了游戏侧 SDK (ProtocolClient) 的配置结构，
 * Phase 2 将在 publishing-center/standard-sdk/protocol/ 下完整实现。
 */

import type { ProtocolMode } from '../ProtocolChannel';

export interface ProtocolClientConfig {
  /** 协议模式 */
  mode: ProtocolMode;

  /** 游戏 ID */
  gameId: string;

  /** 支持的动作列表 */
  supportedActions: string[];

  /** 支持的 Schema 列表 */
  supportedSchemas: string[];

  /** 调试模式 */
  debug?: boolean;

  /** 自动初始化（默认 true） */
  autoInit?: boolean;

  /** 初始化超时（ms） */
  initTimeout?: number;
}
