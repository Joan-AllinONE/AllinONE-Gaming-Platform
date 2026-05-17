/**
 * 算法凭证管理组件
 * 用于管理计算分配型凭证模板和结算周期
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  algorithmVoucherService,
  settlementScheduler,
  SettlementCycleType,
  type AlgorithmVoucherTemplate,
  type SettlementCycle,
  type ContributionLeaderboardItem,
} from '../index';
import { SettlementStatus } from '../types/algorithm';

interface AlgorithmVoucherManagerProps {
  userId: string;
  userName: string;
  isAdmin?: boolean;
}

export const AlgorithmVoucherManager: React.FC<AlgorithmVoucherManagerProps> = ({
  userId,
  userName,
  isAdmin = false,
}) => {
  // 状态管理
  const [templates, setTemplates] = useState<AlgorithmVoucherTemplate[]>([]);
  const [cycles, setCycles] = useState<SettlementCycle[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'templates' | 'cycles' | 'leaderboard'>('templates');
  const [leaderboard, setLeaderboard] = useState<ContributionLeaderboardItem[]>([]);
  
  // 表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    settlementCycle: 'daily' as SettlementCycleType,
    settlementTime: '00:00',
    minDenomination: 0.0001,
    gameCoinsWeight: 0.5,
    computingPowerWeight: 0.3,
    transactionWeight: 0.2,
    poolRatio: 0.4,
    calculationMode: 'auto' as 'auto' | 'fixed',
    fixedTotalSupply: 500,
    gamePools: [] as Array<{
      gameId: string;
      gameName: string;
      calculationMode: 'auto' | 'fixed';
      fixedTotalSupply?: number;
      allocationMode: 'fixed' | 'ratio' | 'formula';
      fixedAmount?: number;
      ratio?: number;
      formula?: string;
    }>,
  });

  // 加载数据
  const loadData = useCallback(() => {
    setTemplates(algorithmVoucherService.getTemplates());
    setCycles(algorithmVoucherService.getSettlementCycles());
  }, []);

  useEffect(() => {
    loadData();
    
    // 定时刷新
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // 加载排行榜
  const loadLeaderboard = async (templateId: string) => {
    if (!templateId) return;
    const data = await algorithmVoucherService.getContributionLeaderboard(templateId, undefined, 50);
    setLeaderboard(data);
  };

  // 创建模板
  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      setMessage('请输入模板名称');
      return;
    }

    try {
      const template = algorithmVoucherService.createTemplate(
        {
          name: newTemplate.name,
          description: newTemplate.description,
          minDenomination: newTemplate.minDenomination,
          denominationUnit: 'ACOIN',
          settlementCycle: newTemplate.settlementCycle,
          settlementTime: newTemplate.settlementTime,
          algorithm: {
            weights: {
              gameCoins: newTemplate.gameCoinsWeight,
              computingPower: newTemplate.computingPowerWeight,
              transactionVolume: newTemplate.transactionWeight,
            },
          },
          poolConfig: {
            source: 'platform_net_income',
            ratio: newTemplate.poolRatio,
            minDistributionAmount: 0.0001,
            carryOverEnabled: true,
            calculationMode: newTemplate.calculationMode,
            ...(newTemplate.calculationMode === 'fixed' ? { fixedTotalSupply: newTemplate.fixedTotalSupply } : {}),
            gamePools: newTemplate.gamePools.map(gp => ({
              gameId: gp.gameId,
              gameName: gp.gameName,
              calculationMode: gp.calculationMode,
              ...(gp.calculationMode === 'fixed' ? { fixedTotalSupply: gp.fixedTotalSupply } : {}),
              allocation: {
                mode: gp.allocationMode,
                ...(gp.allocationMode === 'fixed' ? { fixedAmount: gp.fixedAmount } : {}),
                ...(gp.allocationMode === 'ratio' ? { ratio: gp.ratio } : {}),
                ...(gp.allocationMode === 'formula' ? { formula: gp.formula } : {}),
              },
            })),
          },
        },
        userId,
        userName
      );

      setMessage(`模板 "${template.name}" 创建成功！`);
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        description: '',
        settlementCycle: 'daily',
        settlementTime: '00:00',
        minDenomination: 0.0001,
        gameCoinsWeight: 0.5,
        computingPowerWeight: 0.3,
        transactionWeight: 0.2,
        poolRatio: 0.4,
        calculationMode: 'auto',
        fixedTotalSupply: 500,
        gamePools: [],
      });
      loadData();
    } catch (error) {
      setMessage(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 手动触发结算
  const handleTriggerSettlement = async (templateId: string) => {
    if (!isAdmin) {
      setMessage('只有管理员可以手动触发结算');
      return;
    }

    setIsLoading(true);
    try {
      await algorithmVoucherService.triggerSettlement(
        templateId,
        undefined,
        undefined,
        userId
      );
      setMessage('结算触发成功！');
      loadData();
    } catch (error) {
      setMessage(`结算失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换模板状态
  const handleToggleTemplate = (templateId: string, isActive: boolean) => {
    algorithmVoucherService.updateTemplate(templateId, { isActive: !isActive });
    loadData();
  };

  // 删除模板
  const handleDeleteTemplate = (templateId: string, templateName: string, isActive: boolean) => {
    const confirmed = window.confirm(
      `确定要删除模板「${templateName}」吗？\n\n` +
      `${isActive ? '⚠️ 该模板当前已启用，删除后将自动停用。\n' : ''}` +
      `此操作不可撤销，但已发行的凭证不受影响。`
    );
    if (!confirmed) return;

    try {
      const success = algorithmVoucherService.deleteTemplate(templateId);
      if (success) {
        setMessage(`模板「${templateName}」已成功删除`);
        loadData();
      } else {
        setMessage(`删除失败：模板「${templateName}」存在进行中的结算周期，请先完成或等待结算结束后再试`);
      }
    } catch (error) {
      setMessage(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: SettlementStatus) => {
    const labels: Record<string, string> = {
      pending: '待结算',
      collecting: '数据收集中',
      calculating: '计算中',
      issuing: '发行中',
      completed: '已完成',
      failed: '失败',
    };
    return labels[status] || status;
  };

  // 获取周期类型标签
  const getCycleTypeLabel = (type: SettlementCycleType) => {
    const labels: Record<string, string> = {
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      custom: '自定义',
    };
    return labels[type] || type;
  };

  return (
    <div className="algorithm-voucher-manager">
      <style>{`
        .algorithm-voucher-manager {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .manager-title {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
        .tab-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .tab-button {
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .tab-button.active {
          background: #1890ff;
          color: white;
          border-color: #1890ff;
        }
        .create-button {
          padding: 10px 20px;
          background: #52c41a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .message {
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 4px;
          background: #e6f7ff;
          border: 1px solid #91d5ff;
          color: #1890ff;
        }
        .template-list, .cycle-list {
          background: white;
          border-radius: 8px;
          padding: 15px;
        }
        .template-item, .cycle-item {
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .template-header, .cycle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .template-name, .cycle-name {
          font-weight: bold;
          font-size: 16px;
        }
        .template-status, .cycle-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .status-active {
          background: #f6ffed;
          color: #52c41a;
        }
        .status-inactive {
          background: #fff1f0;
          color: #ff4d4f;
        }
        .template-details, .cycle-details {
          color: #666;
          font-size: 14px;
          line-height: 1.8;
        }
        .template-actions, .cycle-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        .action-button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
        }
        .action-button.primary {
          background: #1890ff;
          color: white;
          border-color: #1890ff;
        }
        .action-button.danger {
          background: #ff4d4f;
          color: white;
          border-color: #ff4d4f;
        }
        .create-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .weight-inputs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .leaderboard {
          background: white;
          border-radius: 8px;
          padding: 15px;
        }
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
        }
        .leaderboard-table th, .leaderboard-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .leaderboard-table th {
          font-weight: bold;
          background: #fafafa;
        }
        .rank-1 { color: #ffd700; font-weight: bold; }
        .rank-2 { color: #c0c0c0; font-weight: bold; }
        .rank-3 { color: #cd7f32; font-weight: bold; }
      `}</style>

      <div className="manager-header">
        <h2 className="manager-title">算法凭证管理系统</h2>
        {isAdmin && (
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '取消' : '创建模板'}
          </button>
        )}
      </div>

      {message && (
        <div className="message" onClick={() => setMessage('')}>
          {message}
        </div>
      )}

      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          凭证模板 ({templates.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'cycles' ? 'active' : ''}`}
          onClick={() => setActiveTab('cycles')}
        >
          结算周期 ({cycles.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('leaderboard');
            if (templates.length > 0 && leaderboard.length === 0) {
              loadLeaderboard(templates[0].id);
            }
          }}
        >
          排行榜
        </button>
      </div>

      {showCreateForm && isAdmin && (
        <div className="create-form">
          <h3>创建新模板</h3>
          <div className="form-group">
            <label>模板名称 *</label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              placeholder="如：A币日结凭证"
            />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="模板描述..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>结算周期</label>
            <select
              value={newTemplate.settlementCycle}
              onChange={(e) => setNewTemplate({ ...newTemplate, settlementCycle: e.target.value as SettlementCycleType })}
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div className="form-group">
            <label>结算时间 (HH:MM)</label>
            <input
              type="text"
              value={newTemplate.settlementTime}
              onChange={(e) => setNewTemplate({ ...newTemplate, settlementTime: e.target.value })}
              placeholder="00:00"
            />
          </div>
          <div className="form-group">
            <label>最小面值</label>
            <input
              type="number"
              step="0.0001"
              value={newTemplate.minDenomination}
              onChange={(e) => setNewTemplate({ ...newTemplate, minDenomination: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>贡献度权重配置</label>
            <div className="weight-inputs">
              <div>
                <label>游戏币权重</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemplate.gameCoinsWeight}
                  onChange={(e) => setNewTemplate({ ...newTemplate, gameCoinsWeight: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label>算力权重</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemplate.computingPowerWeight}
                  onChange={(e) => setNewTemplate({ ...newTemplate, computingPowerWeight: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label>交易额权重</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemplate.transactionWeight}
                  onChange={(e) => setNewTemplate({ ...newTemplate, transactionWeight: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>发放池计算模式</label>
            <select
              value={newTemplate.calculationMode}
              onChange={(e) => setNewTemplate({ ...newTemplate, calculationMode: e.target.value as 'auto' | 'fixed' })}
            >
              <option value="auto">自动（基于平台净收入比例）</option>
              <option value="fixed">固定总量</option>
            </select>
          </div>

          {newTemplate.calculationMode === 'auto' && (
            <div className="form-group">
              <label>发放池比例 (平台净收入的百分比)</label>
              <input
                type="number"
                step="0.1"
                max="1"
                min="0"
                value={newTemplate.poolRatio}
                onChange={(e) => setNewTemplate({ ...newTemplate, poolRatio: parseFloat(e.target.value) })}
              />
            </div>
          )}

          {newTemplate.calculationMode === 'fixed' && (
            <div className="form-group">
              <label>固定发放总量</label>
              <input
                type="number"
                step="1"
                min="1"
                value={newTemplate.fixedTotalSupply}
                onChange={(e) => setNewTemplate({ ...newTemplate, fixedTotalSupply: parseFloat(e.target.value) })}
              />
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                每个结算周期最多可发放的凭证总金额。TestAcoin 建议设为 500。
              </div>
            </div>
          )}

          {/* 游戏奖池配置 */}
          <div className="form-group">
            <label>游戏奖池配置（可选）</label>
            <div style={{ marginBottom: '10px', fontSize: '13px', color: '#666' }}>
              每个游戏奖池独立分发给该游戏的玩家，不参与平台池统一分配
            </div>
            {newTemplate.gamePools.map((pool, index) => (
              <div key={index} style={{ padding: '12px', border: '1px solid #e8e8e8', borderRadius: '6px', marginBottom: '10px', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>游戏奖池 #{index + 1}</strong>
                  <button
                    className="action-button danger"
                    style={{ fontSize: '12px', padding: '2px 8px' }}
                    onClick={() => {
                      const pools = [...newTemplate.gamePools];
                      pools.splice(index, 1);
                      setNewTemplate({ ...newTemplate, gamePools: pools });
                    }}
                  >
                    移除
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px' }}>游戏ID</label>
                    <input
                      style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      type="text"
                      value={pool.gameId}
                      onChange={(e) => {
                        const pools = [...newTemplate.gamePools];
                        pools[index] = { ...pools[index], gameId: e.target.value };
                        setNewTemplate({ ...newTemplate, gamePools: pools });
                      }}
                      placeholder="如: match3"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px' }}>游戏名称</label>
                    <input
                      style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      type="text"
                      value={pool.gameName}
                      onChange={(e) => {
                        const pools = [...newTemplate.gamePools];
                        pools[index] = { ...pools[index], gameName: e.target.value };
                        setNewTemplate({ ...newTemplate, gamePools: pools });
                      }}
                      placeholder="如: 消消乐"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px' }}>计算模式</label>
                    <select
                      style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      value={pool.calculationMode}
                      onChange={(e) => {
                        const pools = [...newTemplate.gamePools];
                        pools[index] = { ...pools[index], calculationMode: e.target.value as 'auto' | 'fixed' };
                        setNewTemplate({ ...newTemplate, gamePools: pools });
                      }}
                    >
                      <option value="auto">自动计算</option>
                      <option value="fixed">固定总量</option>
                    </select>
                  </div>
                  {pool.calculationMode === 'fixed' ? (
                    <div>
                      <label style={{ fontSize: '12px' }}>固定总量（A币）</label>
                      <input
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                        type="number"
                        step="0.01"
                        value={pool.fixedTotalSupply || ''}
                        onChange={(e) => {
                          const pools = [...newTemplate.gamePools];
                          pools[index] = { ...pools[index], fixedTotalSupply: parseFloat(e.target.value) || 0 };
                          setNewTemplate({ ...newTemplate, gamePools: pools });
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '12px' }}>分配方式</label>
                      <select
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                        value={pool.allocationMode}
                        onChange={(e) => {
                          const pools = [...newTemplate.gamePools];
                          pools[index] = { ...pools[index], allocationMode: e.target.value as 'fixed' | 'ratio' | 'formula' };
                          setNewTemplate({ ...newTemplate, gamePools: pools });
                        }}
                      >
                        <option value="fixed">固定金额</option>
                        <option value="ratio">收入比例</option>
                        <option value="formula">自定义公式</option>
                      </select>
                    </div>
                  )}
                </div>
                {pool.calculationMode !== 'fixed' && (
                  <div style={{ marginTop: '8px' }}>
                    {pool.allocationMode === 'fixed' && (
                      <div>
                        <label style={{ fontSize: '12px' }}>固定金额（A币）</label>
                        <input
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                          type="number"
                          step="0.01"
                          value={pool.fixedAmount || ''}
                          onChange={(e) => {
                            const pools = [...newTemplate.gamePools];
                            pools[index] = { ...pools[index], fixedAmount: parseFloat(e.target.value) || 0 };
                            setNewTemplate({ ...newTemplate, gamePools: pools });
                          }}
                        />
                      </div>
                    )}
                    {pool.allocationMode === 'ratio' && (
                      <div>
                        <label style={{ fontSize: '12px' }}>游戏收入提成比例</label>
                        <input
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                          type="number"
                          step="0.01"
                          max="1"
                          min="0"
                          value={pool.ratio || ''}
                          onChange={(e) => {
                            const pools = [...newTemplate.gamePools];
                            pools[index] = { ...pools[index], ratio: parseFloat(e.target.value) || 0 };
                            setNewTemplate({ ...newTemplate, gamePools: pools });
                          }}
                        />
                      </div>
                    )}
                    {pool.allocationMode === 'formula' && (
                      <div>
                        <label style={{ fontSize: '12px' }}>自定义公式</label>
                        <input
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                          type="text"
                          value={pool.formula || ''}
                          onChange={(e) => {
                            const pools = [...newTemplate.gamePools];
                            pools[index] = { ...pools[index], formula: e.target.value };
                            setNewTemplate({ ...newTemplate, gamePools: pools });
                          }}
                          placeholder="如: gameRevenue * 0.3"
                        />
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                          可用变量: gameRevenue, playerCount, gameSessions, totalScore, averageScore
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              className="action-button"
              onClick={() => {
                setNewTemplate({
                  ...newTemplate,
                  gamePools: [
                    ...newTemplate.gamePools,
                    {
                      gameId: '',
                      gameName: '',
                      calculationMode: 'auto',
                      allocationMode: 'ratio',
                      ratio: 0.3,
                    },
                  ],
                });
              }}
            >
              + 添加游戏奖池
            </button>
          </div>

          <div className="form-actions">
            <button className="action-button primary" onClick={handleCreateTemplate}>
              创建模板
            </button>
            <button className="action-button" onClick={() => setShowCreateForm(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="template-list">
          {templates.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>暂无模板</p>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="template-item">
                <div className="template-header">
                  <span className="template-name">{template.name}</span>
                  <span className={`template-status ${template.isActive ? 'status-active' : 'status-inactive'}`}>
                    {template.isActive ? '已启用' : '已停用'}
                  </span>
                </div>
                <div className="template-details">
                  <p>{template.description || '无描述'}</p>
                  <p>
                    <strong>结算周期:</strong> {getCycleTypeLabel(template.settlementCycle)} @ {template.settlementTime} | 
                    <strong> 最小面值:</strong> {template.minDenomination} {template.denominationUnit}
                  </p>
                  <p>
                    <strong>发放模式:</strong> {template.poolConfig.calculationMode === 'fixed' ? '固定总量' : '自动计算'} | 
                    {template.poolConfig.calculationMode === 'fixed' && template.totalSupply ? (
                      <><strong> 总量:</strong> {template.totalSupply.toLocaleString()} 个 | <strong> 总价值:</strong> {template.totalValue} {template.denominationUnit}</>
                    ) : (
                      <><strong> 发放比例:</strong> {(template.poolConfig.ratio * 100).toFixed(0)}%</>
                    )}
                  </p>
                  {template.poolConfig.gamePools && template.poolConfig.gamePools.length > 0 && (
                    <p>
                      <strong>游戏奖池:</strong> {template.poolConfig.gamePools.map(gp => 
                        `${gp.gameName}(${gp.allocation.mode === 'fixed' ? '固定' : gp.allocation.mode === 'ratio' ? `${(gp.allocation.ratio || 0) * 100}%提成` : '公式'})`
                      ).join(', ')}
                    </p>
                  )}
                  <p>
                    <strong>权重:</strong> 游戏币 {(template.algorithm.weights.gameCoins * 100).toFixed(0)}% / 
                    算力 {(template.algorithm.weights.computingPower * 100).toFixed(0)}% / 
                    交易额 {(template.algorithm.weights.transactionVolume * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="template-actions">
                  {isAdmin && (
                    <>
                      <button 
                        className="action-button primary"
                        onClick={() => handleTriggerSettlement(template.id)}
                        disabled={isLoading || !template.isActive}
                      >
                        {isLoading ? '结算中...' : '立即结算'}
                      </button>
                      <button 
                        className="action-button"
                        onClick={() => handleToggleTemplate(template.id, template.isActive)}
                      >
                        {template.isActive ? '停用' : '启用'}
                      </button>
                      <button 
                        className="action-button danger"
                        onClick={() => handleDeleteTemplate(template.id, template.name, template.isActive)}
                      >
                        删除
                      </button>
                    </>
                  )}
                  <button 
                    className="action-button"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      loadLeaderboard(template.id);
                      setActiveTab('leaderboard');
                    }}
                  >
                    查看排行榜
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'cycles' && (
        <div className="cycle-list">
          {cycles.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>暂无结算周期</p>
          ) : (
            cycles.map((cycle) => (
              <div key={cycle.id} className="cycle-item">
                <div className="cycle-header">
                  <span className="cycle-name">
                    {cycle.templateName} - 周期 #{cycle.cycleNumber}
                  </span>
                  <span className="cycle-status">
                    {getStatusLabel(cycle.status)}
                  </span>
                </div>
                <div className="cycle-details">
                  <p>
                    <strong>结算日期:</strong> {cycle.settlementDate} | 
                    <strong> 时间范围:</strong> {cycle.startDate} ~ {cycle.endDate}
                  </p>
                  {cycle.result && (
                    <p>
                      <strong>参与用户:</strong> {cycle.result.totalParticipants} | 
                      <strong> 总发放:</strong> {cycle.result.totalDistributed.toFixed(4)} | 
                      <strong> 凭证数量:</strong> {cycle.result.totalVouchersIssued} | 
                      <strong> 人均:</strong> {cycle.result.averagePerUser.toFixed(4)}
                    </p>
                  )}
                  {/* 多奖池信息展示 */}
                  {cycle.networkSnapshot?.gamePoolDetails && cycle.networkSnapshot.gamePoolDetails.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#f0f5ff', borderRadius: '4px', fontSize: '13px' }}>
                      <strong style={{ color: '#1890ff' }}>🎯 多奖池详情:</strong>
                      {cycle.networkSnapshot.gamePoolDetails.map((pool, i) => (
                        <p key={i} style={{ margin: '4px 0', color: '#555' }}>
                          • {pool.gameName}: <strong>{pool.amount.toFixed(4)} A币</strong>
                          <span style={{ color: '#999', marginLeft: '8px', fontSize: '12px' }}>({pool.calculationDetail})</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {cycle.errorMessage && (
                    <p style={{ color: '#ff4d4f' }}>
                      <strong>错误:</strong> {cycle.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard">
          <div style={{ marginBottom: '15px' }}>
            <label>选择模板: </label>
            <select 
              value={selectedTemplate} 
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                loadLeaderboard(e.target.value);
              }}
              style={{ padding: '8px', marginLeft: '10px' }}
            >
              <option value="">请选择</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>暂无数据</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th>贡献分数</th>
                  <th>占比</th>
                  <th>奖励金额</th>
                  <th>凭证数量</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.userId}>
                    <td className={`rank-${item.rank <= 3 ? item.rank : ''}`}>
                      {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : item.rank}
                    </td>
                    <td>{item.userName}</td>
                    <td>{item.contributionScore.toFixed(4)}</td>
                    <td>{(item.contributionRatio * 100).toFixed(2)}%</td>
                    <td>{item.rewardAmount.toFixed(4)}</td>
                    <td>{item.voucherCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
