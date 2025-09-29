import React, { useState, useEffect } from 'react';
import { aCoinService, ACoinDistributionRecord } from '@/services/aCoinService';

interface Props {
  userId: string;
}

export default function ACoinDistributionHistory({ userId }: Props) {
  const [records, setRecords] = useState<ACoinDistributionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistributionHistory();
  }, [userId]);

  const loadDistributionHistory = async () => {
    try {
      setLoading(true);
      const userRecords = aCoinService.getUserDistributionHistory(userId);
      setRecords(userRecords);
    } catch (error) {
      console.error('加载A币发放历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'insufficient':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '发放成功';
      case 'failed':
        return '发放失败';
      case 'insufficient':
        return '金额不足';
      default:
        return '未知状态';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-2"></div>
        <div className="text-slate-400">加载A币发放记录中...</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🅰️</div>
        <div className="text-slate-400 mb-2">暂无A币发放记录</div>
        <div className="text-sm text-slate-500">完成游戏和算力贡献后可获得A币发放</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-indigo-400">A币发放记录</h4>
        <button
          onClick={loadDistributionHistory}
          className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-400">🅰️</span>
                </div>
                <div>
                  <div className="font-medium text-white">
                    A币发放 - {record.date}
                  </div>
                  <div className={`text-sm ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-400">
                  +{record.actualDistributed.toFixed(2)} A币
                </div>
                <div className="text-sm text-slate-400">
                  ≈ ¥{record.actualDistributed.toFixed(2)}
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">个人贡献分数:</span>
                  <span className="text-white">{record.personalContributionScore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">全网贡献分数:</span>
                  <span className="text-white">{record.networkContributionScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">个人占比:</span>
                  <span className="text-white">{(record.personalRatio * 100).toFixed(4)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">平台净收入:</span>
                  <span className="text-white">¥{record.platformNetIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">发放池总额:</span>
                  <span className="text-white">{record.distributionPool.toFixed(2)} A币</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">计算金额:</span>
                  <span className="text-white">{record.calculatedAmount.toFixed(4)} A币</span>
                </div>
              </div>
            </div>

            {/* 失败原因 */}
            {record.reason && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                <div className="text-sm text-yellow-400">
                  <span className="font-medium">说明：</span>
                  {record.reason}
                </div>
              </div>
            )}

            {/* 时间戳 */}
            <div className="mt-3 text-xs text-slate-500">
              发放时间: {new Date(record.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-400/20 rounded-lg">
        <h5 className="font-medium text-indigo-400 mb-3">发放统计</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">
              {records.filter(r => r.status === 'success').length}
            </div>
            <div className="text-sm text-slate-400">成功次数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {records.reduce((sum, r) => sum + r.actualDistributed, 0).toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">累计获得</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {records.length > 0 ? (records.reduce((sum, r) => sum + r.actualDistributed, 0) / records.filter(r => r.status === 'success').length || 0).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-slate-400">平均发放</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {records.length > 0 ? records[0].date : '-'}
            </div>
            <div className="text-sm text-slate-400">最近发放</div>
          </div>
        </div>
      </div>
    </div>
  );
}