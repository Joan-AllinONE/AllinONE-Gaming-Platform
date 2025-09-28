import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import platformManagementService from '@/services/platformManagementService';
import platformConfigService from '@/services/platformConfigService';
import { 
  PlatformParameter, 
  Vote, 
  VoteDecision, 
  PlatformMember, 
  PlatformData 
} from '@/types/platformManagement';

interface PlatformManagementContextType {
  platformData: PlatformData | null;
  parameters: PlatformParameter[];
  activeVotes: Vote[];
  finishedVotes: Vote[];
  members: PlatformMember[];
  currentUser: PlatformMember | null;
  loading: boolean;
  createVote: (
    title: string,
    description: string,
    parameterId: string,
    proposedValue: number,
    reason: string,
    proposerId: string
  ) => Promise<Vote>;
  submitVote: (voteId: string, decision: VoteDecision, comment?: string) => Promise<void>;
  finalizeVote: (voteId: string) => Promise<void>;
  vetoVote: (voteId: string) => Promise<void>;
  selectUser: (userId: string) => void;
}

const PlatformManagementContext = createContext<PlatformManagementContextType | undefined>(undefined);

export const PlatformManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [parameters, setParameters] = useState<PlatformParameter[]>([]);
  const [activeVotes, setActiveVotes] = useState<Vote[]>([]);
  const [finishedVotes, setFinishedVotes] = useState<Vote[]>([]);
  const [members, setMembers] = useState<PlatformMember[]>([]);
  const [currentUser, setCurrentUser] = useState<PlatformMember | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        
        const [
          platformDataResult,
          parametersResult,
          activeVotesResult,
          finishedVotesResult,
          membersResult
        ] = await Promise.all([
          platformManagementService.getPlatformData(),
          platformManagementService.getParameters(),
          platformManagementService.getActiveVotes(),
          platformManagementService.getFinishedVotes(),
          platformManagementService.getMembers()
        ]);
        
        setPlatformData(platformDataResult);
        setParameters(parametersResult);
        setActiveVotes(activeVotesResult);
        setFinishedVotes(finishedVotesResult);
        setMembers(membersResult);
        
        // 🔥 同步参数到平台配置服务，使其在整个平台生效
        const paramUpdates: Record<string, number> = {};
        parametersResult.forEach(param => {
          paramUpdates[param.id] = param.currentValue;
        });
        platformConfigService.batchUpdateParameters(paramUpdates);
        console.log('[平台管理] 已同步参数到平台配置:', paramUpdates);
        
        // 默认选择第一个成员作为当前用户
        if (membersResult.length > 0) {
          setCurrentUser(membersResult[0]);
        }
      } catch (error) {
        console.error('初始化平台管理数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, []);
  
  // 创建投票
  const createVote = async (
    title: string,
    description: string,
    parameterId: string,
    proposedValue: number,
    reason: string,
    proposerId: string
  ) => {
    const newVote = await platformManagementService.createVote(
      title,
      description,
      parameterId,
      proposedValue,
      reason,
      proposerId
    );
    
    setActiveVotes(prev => [...prev, newVote]);
    return newVote;
  };
  
  // 提交投票
  const submitVote = async (voteId: string, decision: VoteDecision, comment?: string) => {
    if (!currentUser) return;
    
    const updatedVote = await platformManagementService.submitVote(
      voteId,
      currentUser.id,
      decision,
      comment
    );
    
    // 如果投票状态改变，更新投票列表
    if (updatedVote.status !== 'active') {
      setActiveVotes(prev => prev.filter(vote => vote.id !== voteId));
      setFinishedVotes(prev => [...prev, updatedVote]);
    } else {
      setActiveVotes(prev => 
        prev.map(vote => vote.id === voteId ? updatedVote : vote)
      );
    }
  };
  
  // 结束投票
  const finalizeVote = async (voteId: string) => {
    const updatedVote = await platformManagementService.finalizeVote(voteId);
    
    setActiveVotes(prev => prev.filter(vote => vote.id !== voteId));
    setFinishedVotes(prev => [...prev, updatedVote]);
    
    // 如果投票通过，更新参数列表
    if (updatedVote.status === 'passed') {
      const updatedParam = await platformManagementService.getParameter(updatedVote.parameterId);
      if (updatedParam) {
        setParameters(prev => 
          prev.map(param => param.id === updatedParam.id ? updatedParam : param)
        );
      }
    }
  };
  
  // 否决投票
  const vetoVote = async (voteId: string) => {
    if (!currentUser || !currentUser.hasVetoRight) return;
    
    const updatedVote = await platformManagementService.vetoVote(voteId, currentUser.id);
    
    setActiveVotes(prev => prev.filter(vote => vote.id !== voteId));
    setFinishedVotes(prev => [...prev, updatedVote]);
  };
  
  // 选择用户
  const selectUser = (userId: string) => {
    const user = members.find(member => member.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };
  
  const value = {
    platformData,
    parameters,
    activeVotes,
    finishedVotes,
    members,
    currentUser,
    loading,
    createVote,
    submitVote,
    finalizeVote,
    vetoVote,
    selectUser
  };
  
  return (
    <PlatformManagementContext.Provider value={value}>
      {children}
    </PlatformManagementContext.Provider>
  );
};

export const usePlatformManagement = () => {
  const context = useContext(PlatformManagementContext);
  if (context === undefined) {
    throw new Error('usePlatformManagement must be used within a PlatformManagementProvider');
  }
  return context;
};