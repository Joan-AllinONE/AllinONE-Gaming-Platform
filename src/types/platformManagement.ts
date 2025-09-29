/**
 * 平台参数类别
 */
export type ParameterCategory = 
  | 'acoin_allocation' 
  | 'ocoin_allocation' 
  | 'income_distribution' 
  | 'dividend_weights' 
  | 'exchange_rates'
  | 'ocoin_performance'     // O币绩效权重
  | 'dividend_performance'; // 分红绩效权重

/**
 * 平台参数历史记录
 */
export interface ParameterHistory {
  id: string;
  parameterId: string;
  oldValue: number;
  newValue: number;
  modifiedAt: Date;
  modifiedBy: string;
  reason: string;
}

/**
 * 平台参数
 */
export interface PlatformParameter {
  id: string;
  name: string;
  description: string;
  category: ParameterCategory;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  unit: string;
  lastModified: Date;
  modifiedBy: string;
  history: ParameterHistory[];
}

/**
 * 投票决定
 */
export type VoteDecision = 'approve' | 'reject' | 'abstain' | 'veto';

/**
 * 投票状态
 */
export type VoteStatus = 'active' | 'passed' | 'rejected' | 'vetoed';

/**
 * 投票记录
 */
export interface VoteRecord {
  id: string;
  voteId: string;
  memberId: string;
  decision: VoteDecision;
  comment: string;
  votedAt: Date;
}

/**
 * 投票结果
 */
export interface VoteResult {
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
  founderVeto: boolean;
  finalStatus: VoteStatus;
  implementedAt?: Date;
  implementedBy?: string;
}

/**
 * 投票
 */
export interface Vote {
  id: string;
  title: string;
  description: string;
  parameterId: string;
  currentValue: number;
  proposedValue: number;
  proposedBy: string;
  reason: string;
  status: VoteStatus;
  createdAt: Date;
  endedAt?: Date;
  voteRecords: VoteRecord[];
  result?: VoteResult;
}

/**
 * 平台成员角色
 */
export type MemberRole = 'founder' | 'platform_manager' | 'community_representative';

/**
 * 平台成员
 */
export interface PlatformMember {
  id: string;
  name: string;
  role: MemberRole;
  avatar: string;
  hasVetoRight: boolean;
  joinedAt: Date;
  isActive: boolean;
}

/**
 * 游戏数据
 */
export interface GameData {
  id: string;
  name: string;
  activeUsers: number;
  dailyRevenue: number;
  computingPowerGenerated: number;
}

/**
 * 平台数据
 */
export interface PlatformData {
  acoinBalance: number;
  ocoinBalance: number;
  ocoinPrice: number;
  totalComputingPower: number;
  dailyIncome: number;
  dailyExpense: number;
  activeUsers: number;
  newUsers: number;
  gameData: GameData[];
  updatedAt: Date;
}