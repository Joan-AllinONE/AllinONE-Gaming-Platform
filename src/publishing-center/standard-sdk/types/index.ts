/**
 * @allinone/standard-sdk 类型定义
 */

// ==================== 通用类型 ====================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== 用户类型 ====================

export interface UserProfile {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  bio?: string;
  level?: number;
  exp?: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserStats {
  gamesPlayed: number;
  totalPlayTime: number; // minutes
  achievementsUnlocked: number;
  friendsCount: number;
}

// ==================== 游戏类型 ====================

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  cover?: string;
  genre: string;
  framework: string;
  version: string;
  rating?: number;
  playCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 平台类型 ====================

export interface PlatformConfig {
  environment: 'development' | 'staging' | 'production';
  apiEndpoint: string;
  cdnEndpoint: string;
  wsEndpoint?: string;
}

// ==================== 错误类型 ====================

export class AllinONEError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AllinONEError';
  }
}

// ==================== 事件类型 ====================

export interface EventPayload {
  type: string;
  timestamp: number;
  gameId: string;
  userId?: string;
  sessionId?: string;
  data?: any;
}
