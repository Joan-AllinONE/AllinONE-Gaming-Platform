/**
 * 投票通知提示组件
 * 
 * 全局监听投票凭证系统的自定义事件，通过 sonner toast 向用户推送通知。
 * 在 App.tsx 中挂载一次即可，整个应用共享。
 * 
 * 监听事件：
 *   - vote-cycle-started  → 新投票已开始
 *   - vote-cast           → 投票成功确认
 *   - vote-cycle-settled  → 投票结果公布
 */

import { useEffect } from 'react';
import { toast } from 'sonner';

// ==================== 事件类型 ====================

interface VoteCycleStartedDetail {
  cycle: {
    proposalTitle: string;
    gameName: string;
    voteVoucherIds: string[];
  };
  voterCount: number;
  proposalId: string;
}

interface VoteCastDetail {
  proposalId: string;
  voterId: string;
  decision: 'approve' | 'reject' | 'abstain';
  voucherId: string;
}

interface VoteCycleSettledDetail {
  cycle: {
    proposalTitle: string;
    gameName: string;
    result?: {
      finalStatus: string;
      weightedApproveScore: number;
      participationRate: number;
    };
  };
  result?: {
    finalStatus: string;
    weightedApproveScore: number;
    participationRate: number;
  };
  proposalId: string;
}

// ==================== 组件 ====================

export default function VoteNotifications() {
  useEffect(() => {
    // --- 投票周期启动 ---
    const handleCycleStarted = (e: Event) => {
      const detail = (e as CustomEvent<VoteCycleStartedDetail>).detail;
      if (!detail) return;

      toast.info(
        `🔔 新投票已开始：「${detail.cycle.proposalTitle}」`,
        {
          description: `${detail.cycle.gameName} · ${detail.voterCount} 位选民获得投票权`,
          duration: 5000,
        },
      );
    };

    // --- 投票提交成功 ---
    const handleVoteCast = (e: Event) => {
      const detail = (e as CustomEvent<VoteCastDetail>).detail;
      if (!detail) return;

      const decisionLabel =
        detail.decision === 'approve' ? '👍 赞成' :
        detail.decision === 'reject' ? '👎 反对' : '🤝 弃权';

      toast.success('投票成功', {
        description: `你投了 ${decisionLabel}`,
        duration: 3000,
      });
    };

    // --- 投票结算完成 ---
    const handleCycleSettled = (e: Event) => {
      const detail = (e as CustomEvent<VoteCycleSettledDetail>).detail;
      if (!detail) return;

      const result = detail.result || detail.cycle.result;
      if (!result) return;

      const passed = result.finalStatus === 'passed';
      const approvePercent = Math.round(result.weightedApproveScore * 100);
      const participationPercent = Math.round(result.participationRate * 100);

      toast(
        `📊 投票结束：「${detail.cycle.proposalTitle}」${passed ? '已通过 ✅' : '被拒绝 ❌'}`,
        {
          description: passed
            ? `赞成率 ${approvePercent}% · 参与率 ${participationPercent}%`
            : `赞成率 ${approvePercent}%（未达通过阈值）· 参与率 ${participationPercent}%`,
          duration: 6000,
        },
      );
    };

    // 注册监听
    window.addEventListener('vote-cycle-started', handleCycleStarted);
    window.addEventListener('vote-cast', handleVoteCast);
    window.addEventListener('vote-cycle-settled', handleCycleSettled);

    return () => {
      window.removeEventListener('vote-cycle-started', handleCycleStarted);
      window.removeEventListener('vote-cast', handleVoteCast);
      window.removeEventListener('vote-cycle-settled', handleCycleSettled);
    };
  }, []);

  // 无 UI，纯副作用组件
  return null;
}
