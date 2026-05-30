import { 
  PlatformParameter, 
  Vote, 
  VoteDecision, 
  PlatformMember, 
  PlatformData,
  VoteStatus,
  VoteResult,
  VoteRecord
} from '@/types/platformManagement';
// MVP v1.0: testDataService stubbed
const testDataService = { getParameters: () => [], getVotes: () => [], getMembers: () => [], getPlatformData: () => ({}) } as any;
import platformConfigService from './platformConfigService';

/**
 * 平台管理服务
 * 提供平台参数管理、投票系统和数据展示功能
 */
class PlatformManagementService {
  private parameters: PlatformParameter[] = [];
  private votes: Vote[] = [];
  private members: PlatformMember[] = [];
  private platformData: PlatformData | null = null;
  
  constructor() {
    this.initTestData();
  }
  
  /**
   * 初始化测试数据
   */
  private initTestData() {
    this.parameters = testDataService.getParameters();
    this.votes = testDataService.getVotes();
    this.members = testDataService.getMembers();
    this.platformData = testDataService.getPlatformData();
  }
  
  /**
   * 获取所有平台参数
   */
  async getParameters(): Promise<PlatformParameter[]> {
    return [...this.parameters];
  }
  
  /**
   * 获取单个平台参数
   */
  async getParameter(id: string): Promise<PlatformParameter | null> {
    return this.parameters.find(param => param.id === id) || null;
  }
  
  /**
   * 更新平台参数
   */
  async updateParameter(id: string, value: number): Promise<PlatformParameter> {
    const paramIndex = this.parameters.findIndex(param => param.id === id);
    if (paramIndex === -1) {
      throw new Error('参数不存在');
    }
    
    const param = this.parameters[paramIndex];
    if (value < param.minValue || value > param.maxValue) {
      throw new Error(`参数值必须在 ${param.minValue} 和 ${param.maxValue} 之间`);
    }
    
    const updatedParam = {
      ...param,
      currentValue: value,
      lastModified: new Date(),
      modifiedBy: 'system',
      history: [
        ...param.history,
        {
          id: `history-${Date.now()}`,
          parameterId: param.id,
          oldValue: param.currentValue,
          newValue: value,
          modifiedAt: new Date(),
          modifiedBy: 'system',
          reason: '投票决策更新'
        }
      ]
    };
    
    this.parameters[paramIndex] = updatedParam;
    
    // 🔥 关键更新：将参数同步到平台配置服务，使其真实生效
    try {
      platformConfigService.updateParameter(id, value);
      console.log(`[PlatformManagement] 参数 ${id} 已更新为 ${value}，并同步到平台配置`);
    } catch (error) {
      console.error(`[PlatformManagement] 同步参数到平台配置失败:`, error);
    }
    
    return updatedParam;
  }
  
  /**
   * 获取所有投票
   */
  async getVotes(): Promise<Vote[]> {
    return [...this.votes];
  }
  
  /**
   * 获取活跃投票
   */
  async getActiveVotes(): Promise<Vote[]> {
    return this.votes.filter(vote => vote.status === 'active');
  }
  
  /**
   * 获取已结束投票
   */
  async getFinishedVotes(): Promise<Vote[]> {
    return this.votes.filter(vote => vote.status !== 'active');
  }
  
  /**
   * 获取单个投票
   */
  async getVote(id: string): Promise<Vote | null> {
    return this.votes.find(vote => vote.id === id) || null;
  }
  
  /**
   * 创建投票
   */
  async createVote(
    title: string,
    description: string,
    parameterId: string,
    proposedValue: number,
    reason: string,
    proposerId: string
  ): Promise<Vote> {
    const parameter = await this.getParameter(parameterId);
    if (!parameter) {
      throw new Error('参数不存在');
    }
    
    if (proposedValue < parameter.minValue || proposedValue > parameter.maxValue) {
      throw new Error(`提议值必须在 ${parameter.minValue} 和 ${parameter.maxValue} 之间`);
    }
    
    const proposer = this.members.find(member => member.id === proposerId);
    if (!proposer) {
      throw new Error('提议人不存在');
    }
    
    const newVote: Vote = {
      id: `vote-${Date.now()}`,
      title,
      description,
      parameterId,
      currentValue: parameter.currentValue,
      proposedValue,
      proposedBy: proposer.name,
      reason,
      status: 'active',
      createdAt: new Date(),
      voteRecords: []
    };
    
    this.votes.push(newVote);
    return newVote;
  }
  
  /**
   * 提交投票
   */
  async submitVote(voteId: string, memberId: string, decision: VoteDecision, comment?: string): Promise<Vote> {
    const voteIndex = this.votes.findIndex(vote => vote.id === voteId);
    if (voteIndex === -1) {
      throw new Error('投票不存在');
    }
    
    const vote = this.votes[voteIndex];
    if (vote.status !== 'active') {
      throw new Error('该投票已结束');
    }
    
    const member = this.members.find(m => m.id === memberId);
    if (!member) {
      throw new Error('成员不存在');
    }
    
    // 检查是否已经投票
    if (vote.voteRecords.some(record => record.memberId === memberId)) {
      throw new Error('您已经对此提案投过票');
    }
    
    // 检查是否有否决权
    if (decision === 'veto' && !member.hasVetoRight) {
      throw new Error('您没有否决权');
    }
    
    const voteRecord: VoteRecord = {
      id: `vr-${Date.now()}`,
      voteId,
      memberId,
      decision,
      comment: comment || '',
      votedAt: new Date()
    };
    
    const updatedVote = {
      ...vote,
      voteRecords: [...vote.voteRecords, voteRecord]
    };
    
    // 如果是否决票，直接结束投票
    if (decision === 'veto') {
      updatedVote.status = 'vetoed';
      updatedVote.endedAt = new Date();
      updatedVote.result = this.calculateVoteResult(updatedVote);
    }
    
    this.votes[voteIndex] = updatedVote;
    return updatedVote;
  }
  
  /**
   * 结束投票
   */
  async finalizeVote(voteId: string): Promise<Vote> {
    const voteIndex = this.votes.findIndex(vote => vote.id === voteId);
    if (voteIndex === -1) {
      throw new Error('投票不存在');
    }
    
    const vote = this.votes[voteIndex];
    if (vote.status !== 'active') {
      throw new Error('该投票已结束');
    }
    
    const result = this.calculateVoteResult(vote);
    const updatedVote = {
      ...vote,
      status: result.finalStatus,
      endedAt: new Date(),
      result
    };
    
    // 如果投票通过，更新参数
    if (updatedVote.status === 'passed') {
      await this.updateParameter(vote.parameterId, vote.proposedValue);
      updatedVote.result.implementedAt = new Date();
      updatedVote.result.implementedBy = 'system';
    }
    
    this.votes[voteIndex] = updatedVote;
    return updatedVote;
  }
  
  /**
   * 否决投票
   */
  async vetoVote(voteId: string, memberId: string): Promise<Vote> {
    const member = this.members.find(m => m.id === memberId);
    if (!member || !member.hasVetoRight) {
      throw new Error('您没有否决权');
    }
    
    return this.submitVote(voteId, memberId, 'veto', '创始人否决');
  }
  
  /**
   * 计算投票结果
   */
  private calculateVoteResult(vote: Vote): VoteResult {
    const approveCount = vote.voteRecords.filter(r => r.decision === 'approve').length;
    const rejectCount = vote.voteRecords.filter(r => r.decision === 'reject').length;
    const abstainCount = vote.voteRecords.filter(r => r.decision === 'abstain').length;
    const vetoCount = vote.voteRecords.filter(r => r.decision === 'veto').length;
    
    const founderVeto = vote.voteRecords.some(r => {
      const member = this.members.find(m => m.id === r.memberId);
      return member?.role === 'founder' && r.decision === 'veto';
    });
    
    let finalStatus: VoteStatus = 'active';
    
    if (vetoCount > 0) {
      finalStatus = 'vetoed';
    } else if (approveCount > rejectCount) {
      finalStatus = 'passed';
    } else {
      finalStatus = 'rejected';
    }
    
    return {
      approveCount,
      rejectCount,
      abstainCount,
      founderVeto,
      finalStatus,
      implementedAt: undefined,
      implementedBy: undefined
    };
  }
  
  /**
   * 获取所有成员
   */
  async getMembers(): Promise<PlatformMember[]> {
    return [...this.members];
  }
  
  /**
   * 获取单个成员
   */
  async getMember(id: string): Promise<PlatformMember | null> {
    return this.members.find(member => member.id === id) || null;
  }
  
  /**
   * 获取平台数据
   */
  async getPlatformData(): Promise<PlatformData | null> {
    return this.platformData;
  }
}

export default new PlatformManagementService();