/**
 * 游戏提案测试数据生成器
 * 提供预设的测试提案场景和初始化数据
 */
import { gameProposalService } from './gameProposalService';
import {
  GameProposal,
  GameProposalType,
  GameProposalPayload,
  GameVoteThreshold,
  ProposalStatus,
  VoteStakeholderType,
  GameProposalTypeLabel,
} from '@/types/gameProposal';
import { getPublishedGames, type PublishedGame } from './publishedGameService';

/**
 * 预设的游戏投票门槛配置
 */
export const PRESET_GAME_THRESHOLDS: Record<string, GameVoteThreshold> = {
  // ===== 太空探险 - 严格治理 =====
  'game-1': {
    gameId: 'game-1',
    weights: {
      gameDeveloper: 0.40,
      playerCommunity: 0.35,
      platform: 0.25,
    },
    minVoteDurationHours: 48,
    maxVoteDurationHours: 168,
    quorumRate: 0.6,
    passThreshold: 0.6,
    vetoEnabled: true,
    vetoByFounderOnly: true,
    autoExecute: true,
    requiresPlatformReview: true,
    penaltyRules: {
      enabled: true,
      maxRefusalCount: 3,
      penalties: [
        { type: 'warning', description: '第一次警告通知' },
        { type: 'freeze_assets', durationHours: 72, description: '冻结游戏资产72小时' },
        { type: 'traffic_limit', durationHours: 168, description: '限制流量50%持续7天' },
      ],
    },
  },
  // ===== 魔法世界 - 宽松治理 =====
  'game-2': {
    gameId: 'game-2',
    weights: {
      gameDeveloper: 0.50,
      playerCommunity: 0.30,
      platform: 0.20,
    },
    minVoteDurationHours: 24,
    maxVoteDurationHours: 120,
    quorumRate: 0.4,
    passThreshold: 0.5,
    vetoEnabled: false,
    vetoByFounderOnly: false,
    autoExecute: true,
    requiresPlatformReview: false,
    penaltyRules: {
      enabled: true,
      maxRefusalCount: 5,
      penalties: [
        { type: 'warning', description: '警告通知' },
        { type: 'freeze_assets', durationHours: 48, description: '冻结资产48小时' },
      ],
    },
  },
  // ===== 赛车竞技 - 玩家主导 =====
  'game-3': {
    gameId: 'game-3',
    weights: {
      gameDeveloper: 0.30,
      playerCommunity: 0.50,
      platform: 0.20,
    },
    minVoteDurationHours: 24,
    maxVoteDurationHours: 72,
    quorumRate: 0.5,
    passThreshold: 0.55,
    vetoEnabled: true,
    vetoByFounderOnly: false,
    autoExecute: true,
    requiresPlatformReview: false,
    penaltyRules: {
      enabled: true,
      maxRefusalCount: 2,
      penalties: [
        { type: 'freeze_assets', durationHours: 96, description: '冻结资产96小时' },
        { type: 'force_delist', description: '强制下架游戏' },
      ],
    },
  },
};

/**
 * 为所有已发布游戏初始化投票门槛
 */
export function initializeGameVoteThresholds(): void {
  const games = getPublishedGames();
  for (const game of games) {
    if (PRESET_GAME_THRESHOLDS[game.id]) {
      gameProposalService.updateGameVoteThreshold(game.id, PRESET_GAME_THRESHOLDS[game.id]);
    } else {
      gameProposalService.updateGameVoteThreshold(game.id, gameProposalService.getGameVoteThreshold(game.id));
    }
  }
  console.log(`[TestData] 已初始化 ${games.length} 个游戏的投票门槛`);
}

/**
 * 生成预设测试提案
 */
export function generateTestProposals(): GameProposal[] {
  const games = getPublishedGames();
  if (games.length === 0) {
    console.warn('[TestData] 暂无已发布游戏，跳过测试提案生成');
    return [];
  }

  const proposals: GameProposal[] = [];
  let createdCount = 0;

  // 场景1: 太空探险 - VIP玩家发起限量联名道具提案
  const game1 = games.find(g => g.id === 'game-1') || games[0];
  if (game1) {
    const payload1: GameProposalPayload = {
      proposalType: GameProposalType.NEW_ITEM,
      itemTemplate: {
        name: '星际探索者·联名皮肤',
        description: '限量100件，《星际迷航》官方联名皮肤，附带特殊粒子特效',
        itemType: 'permanent',
        rarity: 'legendary',
        pricing: { price: 500, currency: 'ACOIN' },
        gameEffect: { itemId: 'skin_star_explorer', quantity: 1 },
        supplyPolicy: 'limited',
        totalSupply: 100,
        mintCount: 100,
      },
    };

    const proposal1 = gameProposalService.createProposal({
      gameId: game1.id,
      gameName: game1.name,
      title: '【限量联名】发布"星际探索者"传说皮肤',
      description: '与知名IP联名，限量发行100件"星际探索者"传说皮肤',
      reason: '与《星际迷航》联名合作，为太空探险玩家提供独特的收藏价值，提升游戏热度',
      proposalType: GameProposalType.NEW_ITEM,
      payload: payload1,
      proposerId: 'player-vip-001',
      proposerName: 'VIP_暗夜猎手',
      proposerType: VoteStakeholderType.PLAYER_COMMUNITY,
      voteDurationHours: 72,
      revenueSharing: {
        gameShare: 0.4,
        platformShare: 0.3,
        creatorShare: 0.3,
      },
    });
    proposals.push(proposal1);
    createdCount++;

    // 模拟一些投票
    simulateVotes(proposal1.id, [
      { voterId: 'dev-001', voterName: 'GameDev_张三', type: VoteStakeholderType.GAME_DEVELOPER, decision: 'approve' },
      { voterId: 'player-vip-001', voterName: 'VIP_暗夜猎手', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'approve' },
      { voterId: 'player-vip-002', voterName: 'VIP_星辰大海', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'approve' },
      { voterId: 'player-active-001', voterName: '活跃玩家_雷霆', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'approve' },
      { voterId: 'player-active-002', voterName: '活跃玩家_破晓', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'approve' },
      { voterId: 'platform-admin-001', voterName: '平台管理_审核官', type: VoteStakeholderType.PLATFORM, decision: 'approve' },
      { voterId: 'platform-rep-001', voterName: '社区代表_周', type: VoteStakeholderType.PLATFORM, decision: 'approve' },
    ]);
  }

  // 场景2: 魔法世界 - 游戏方发起新增玩法提案
  const game2 = games.find(g => g.id === 'game-2') || (games.length > 1 ? games[1] : null);
  if (game2) {
    const payload2: GameProposalPayload = {
      proposalType: GameProposalType.NEW_GAMEPLAY,
      contentData: {
        type: 'new_gameplay',
        name: '公会战争',
        description: '50v50实时对战，争夺魔法领地控制权',
        configJson: {
          maxPlayers: 100,
          matchDuration: 30,
          rewardPool: 10000,
        },
      },
    };

    const proposal2 = gameProposalService.createProposal({
      gameId: game2.id,
      gameName: game2.name,
      title: '新增"公会战争"多人对战玩法',
      description: '50v50大规模公会战争，争夺魔法领地',
      reason: '提升玩家互动和留存率，增加游戏深度和策略性',
      proposalType: GameProposalType.NEW_GAMEPLAY,
      payload: payload2,
      proposerId: 'dev-003',
      proposerName: 'GameDev_王五',
      proposerType: VoteStakeholderType.GAME_DEVELOPER,
      voteDurationHours: 48,
    });
    proposals.push(proposal2);
    createdCount++;

    // 模拟投票
    simulateVotes(proposal2.id, [
      { voterId: 'dev-003', voterName: 'GameDev_王五', type: VoteStakeholderType.GAME_DEVELOPER, decision: 'approve' },
      { voterId: 'dev-004', voterName: 'GameDev_赵六', type: VoteStakeholderType.GAME_DEVELOPER, decision: 'approve' },
      { voterId: 'player-vip-003', voterName: 'VIP_极速风暴', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'approve' },
      { voterId: 'player-active-003', voterName: '活跃玩家_疾风', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'approve' },
      { voterId: 'platform-admin-002', voterName: '平台管理_运营官', type: VoteStakeholderType.PLATFORM, decision: 'approve' },
    ]);
  }

  // 场景3: 赛车竞技 - 平台发起价格调整提案（模拟已拒绝的场景）
  const game3 = games.find(g => g.id === 'game-3') || (games.length > 2 ? games[2] : null);
  if (game3) {
    const payload3: GameProposalPayload = {
      proposalType: GameProposalType.ADJUST_PRICE,
      configChanges: {
        exchangeRate: 120,
        oldExchangeRate: 100,
        reason: '市场失衡，需调整兑换比例',
      },
    };

    const proposal3 = gameProposalService.createProposal({
      gameId: game3.id,
      gameName: game3.name,
      title: '调整游戏币兑换比例',
      description: '将游戏币兑换比例从 1:100 调整为 1:120',
      reason: '当前兑换比例导致市场失衡，玩家购买力不足，需要适度调整',
      proposalType: GameProposalType.ADJUST_PRICE,
      payload: payload3,
      proposerId: 'platform-admin-002',
      proposerName: '平台管理_运营官',
      proposerType: VoteStakeholderType.PLATFORM,
      voteDurationHours: 48,
    });
    proposals.push(proposal3);
    createdCount++;

    // 模拟投票 - 游戏方和平台赞成，但玩家社区大量反对
    simulateVotes(proposal3.id, [
      { voterId: 'dev-005', voterName: 'GameDev_陈七', type: VoteStakeholderType.GAME_DEVELOPER, decision: 'approve' },
      { voterId: 'platform-admin-001', voterName: '平台管理_审核官', type: VoteStakeholderType.PLATFORM, decision: 'approve' },
      { voterId: 'platform-admin-002', voterName: '平台管理_运营官', type: VoteStakeholderType.PLATFORM, decision: 'approve' },
      { voterId: 'player-vip-004', voterName: 'VIP_烈焰战神', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'reject', comment: '贬值太快，无法接受' },
      { voterId: 'player-vip-005', voterName: 'VIP_冰霜女皇', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'reject', comment: '损害玩家利益' },
      { voterId: 'player-active-004', voterName: '活跃玩家_龙魂', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'reject' },
      { voterId: 'player-active-005', voterName: '活跃玩家_天启', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'reject' },
      { voterId: 'player-active-006', voterName: '活跃玩家_赤焰', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'reject' },
      { voterId: 'player-normal-001', voterName: '普通玩家_001', type: VoteStakeholderType.PLAYER_COMMUNITY, decision: 'reject' },
    ]);

    // 最终化提案使其变为 REJECTED 状态
    gameProposalService.finalizeProposal(proposal3.id);
    const finalized = gameProposalService.getProposal(proposal3.id);
    if (finalized) {
      const idx = proposals.findIndex(p => p.id === proposal3.id);
      if (idx >= 0) proposals[idx] = finalized;
    }
  }

  // 场景4: 已完成执行的提案示例
  if (game1) {
    // 手动创建一个已通过并执行的提案（直接操作 proposals 数据）
    const pastProposal: GameProposal = {
      id: 'proposal-past-001',
      gameId: game1.id,
      gameName: game1.name,
      title: '【已完成】发布"能量核心"稀有道具',
      description: '为太空探险增加稀有能量核心道具，提升玩家战力',
      reason: '丰富道具体系，增加玩法深度',
      proposalType: GameProposalType.NEW_ITEM,
      payload: {
        proposalType: GameProposalType.NEW_ITEM,
        itemTemplate: {
          name: '能量核心',
          description: '稀有品质，大幅提升战舰能量',
          itemType: 'consumable',
          rarity: 'rare',
          pricing: { price: 200, currency: 'ACOIN' },
          gameEffect: { itemId: 'energy_core', quantity: 1 },
          supplyPolicy: 'limited',
          totalSupply: 500,
          mintCount: 500,
        },
      },
      status: ProposalStatus.EXECUTED,
      proposerId: 'dev-001',
      proposerName: 'GameDev_张三',
      proposerType: VoteStakeholderType.GAME_DEVELOPER,
      voteThreshold: PRESET_GAME_THRESHOLDS['game-1'] || gameProposalService.getGameVoteThreshold(game1.id),
      voteDurationHours: 72,
      votingStartAt: Date.now() - 14 * 24 * 3600000,
      votingEndAt: Date.now() - 7 * 24 * 3600000,
      voteRecords: [],
      createdAt: Date.now() - 14 * 24 * 3600000,
      executedAt: Date.now() - 6 * 24 * 3600000,
      result: {
        gameDeveloperVotes: { approve: 2, reject: 0, abstain: 0 },
        playerCommunityVotes: { approve: 25, reject: 3, abstain: 7 },
        platformVotes: { approve: 8, reject: 0, abstain: 2 },
        weightedApproveScore: 0.72,
        weightedRejectScore: 0.18,
        totalEligibleVoters: 50,
        totalVoted: 47,
        participationRate: 0.94,
        finalStatus: ProposalStatus.EXECUTED,
        passedAt: Date.now() - 7 * 24 * 3600000,
        executedAt: Date.now() - 6 * 24 * 3600000,
        executedBy: '系统自动执行',
      },
    };
    proposals.push(pastProposal);
  }

  console.log(`[TestData] 已生成 ${createdCount} 个活跃测试提案 + 1 个历史提案`);
  return proposals;
}

/**
 * 为提案模拟投票
 */
function simulateVotes(
  proposalId: string,
  votes: Array<{ voterId: string; voterName: string; type: VoteStakeholderType; decision: 'approve' | 'reject'; comment?: string }>
): void {
  for (const vote of votes) {
    gameProposalService.submitProposalVote(
      proposalId,
      vote.voterId,
      vote.voterName,
      vote.type,
      vote.decision,
      vote.comment,
    );
  }
}

/**
 * 统一初始化：投票门槛 + 测试提案
 */
export function initializeAllProposalData(): GameProposal[] {
  initializeGameVoteThresholds();
  return generateTestProposals();
}

/**
 * 获取提案类型的中文标签
 */
export function getProposalTypeLabel(type: GameProposalType): string {
  return GameProposalTypeLabel[type] || type;
}

/**
 * 判断提案是否为已结束状态
 */
export function isProposalFinished(status: ProposalStatus): boolean {
  return [
    ProposalStatus.PASSED,
    ProposalStatus.REJECTED,
    ProposalStatus.VETOED,
    ProposalStatus.EXPIRED,
    ProposalStatus.EXECUTED,
    ProposalStatus.EXECUTION_FAILED,
  ].includes(status);
}
