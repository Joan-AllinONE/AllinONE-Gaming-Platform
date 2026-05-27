/**
 * 投票凭证系统 - 类型定义
 * 混合型凭证：即时发放投票权 + 计算型结算投票结果
 * 
 * 每个提案为每位合格选民发行一张投票凭证，不可转让。
 * 投票凭证面额为动态投票权重，投票后凭证被消耗结算。
 */

import type { VoteStakeholderType, ProposalVoteDecision, ProposalStatus } from '@/types/gameProposal';

// ============ 投票凭证结算状态 ============

export enum VoteSettlementStatus {
  PENDING = 'pending',   // 待投票（凭证已发行，尚未投票）
  CAST = 'cast',         // 已投票（凭证已消耗，等待结算）
  SETTLED = 'settled',   // 已结算（投票结果已计入）
}

// ============ 投票周期状态 ============

export enum VoteCycleStatus {
  ISSUING = 'issuing',           // 投票权发放中
  ACTIVE = 'active',             // 投票进行中
  SETTLING = 'settling',         // 结算中
  COMPLETED = 'completed',       // 已完成
  FAILED = 'failed',             // 失败
}

// ============ 投票凭证特有信息（嵌入 Voucher.metadata.customData）============

export interface VoteVoucherInfo {
  /** 所属提案ID */
  proposalId: string;
  /** 提案标题 */
  proposalTitle: string;
  /** 游戏ID */
  gameId: string;
  /** 游戏名称 */
  gameName: string;

  /** 投票截止时间戳（用于UI展示倒计时） */
  votingEndAt: number;
  /** 提案类型标签（中文，如"发布新道具"） */
  proposalType: string;
  /** 提案简述（截取前80字） */
  proposalDescription: string;

  /** 投票者利益方类型 */
  voterType: VoteStakeholderType;
  /** 基础投票权重 */
  baseVoteWeight: number;

  /** 动态权重快照（投票时记录） */
  dynamicWeightSnapshot?: {
    activeDaysLast30: number;
    acoinBalance: number;
    voucherCount: number;
    voteParticipationRate: number;
    communityReputation: number;
  };

  /** 投票决策 */
  decision?: ProposalVoteDecision;
  votedAt?: number;
  voteComment?: string;

  /** 结算状态 */
  settlementStatus: VoteSettlementStatus;
  settledAt?: number;
}

// ============ 投票周期（对标 SettlementCycle）============

export interface VoteCycle {
  id: string;                     // = proposalId
  gameId: string;
  gameName: string;
  proposalTitle: string;
  proposalDescription: string;

  /** 时间范围 */
  startDate: number;              // 投票开始时间戳
  endDate: number;                // 投票截止时间戳
  settlementDate?: string;        // 结算日期 YYYY-MM-DD

  /** 状态 */
  status: VoteCycleStatus;

  /** 关联的提案ID */
  proposalId: string;

  /** 发行的投票凭证ID列表 */
  voteVoucherIds: string[];

  /** 投票门槛快照 */
  thresholdSnapshot: {
    weights: { gameDeveloper: number; playerCommunity: number; platform: number };
    quorumRate: number;
    passThreshold: number;
    vetoEnabled: boolean;
    autoExecute: boolean;
  };

  /** 结算结果 */
  result?: VoteSettlementResult;

  createdAt: number;
  completedAt?: number;
}

// ============ 投票结算结果（对标 SettlementResult）============

export interface VoteSettlementResult {
  /** 三方分别统计 */
  gameDeveloperVotes: { approve: number; reject: number; abstain: number };
  playerCommunityVotes: { approve: number; reject: number; abstain: number };
  platformVotes: { approve: number; reject: number; abstain: number };

  /** 加权总分 */
  weightedApproveScore: number;
  weightedRejectScore: number;

  /** 参与度 */
  totalEligibleVoters: number;
  totalVoted: number;
  participationRate: number;

  /** 最终结果 */
  finalStatus: ProposalStatus;
  passedAt?: number;
  executedAt?: number;

  /** 计算时间 */
  calculatedAt: number;
}
