import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fundPoolService } from '@/services/fundPoolService';
import { computingEconomicService } from '@/services/computingEconomicService';
import { aCoinService } from '@/services/aCoinService';
import { walletService } from '@/services/walletService';
import { FundPoolTransaction, FundPoolBalance, PublicFundPoolData } from '@/types/fundPool';
import { DailySettlementData } from '@/types/computing';

const ACoinData: React.FC = () => {
  const [fundPoolData, setFundPoolData] = useState<PublicFundPoolData | null>(null);
  const [dailySettlement, setDailySettlement] = useState<DailySettlementData | null>(null);
  const [showSettlementDetails, setShowSettlementDetails] = useState(false);
  const [isSettlementProcessing, setIsSettlementProcessing] = useState(false);
  const [settlementResult, setSettlementResult] = useState<{
    success: boolean;
    message: string;
    distributedAmount?: number;
    recipientsCount?: number;
  } | null>(null);
  const [autoSettlementStatus, setAutoSettlementStatus] = useState<{
    lastChecked: Date | null;
    lastSettled: Date | null;
    isEnabled: boolean;
    message: string;
  }>({
    lastChecked: null,
    lastSettled: null,
    isEnabled: true,
    message: '自动结算已启用'
  });

  useEffect(() => {
    loadFundPoolData();
    loadDailySettlementData();
    checkAutoSettlement();
    
    const dataInterval = setInterval(loadFundPoolData, 30000);
    const settlementInterval = setInterval(checkAutoSettlement, 60000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(settlementInterval);
    };
  }, []);

  const checkAutoSettlement = async () => {
    if (!autoSettlementStatus.isEnabled) return;
    
    try {
      setAutoSettlementStatus(prev => ({
        ...prev,
        lastChecked: new Date(),
        message: '正在检查自动结算...'
      }));
      
      const result = await computingEconomicService.checkAndExecuteAutoDailySettlement();
      
      if (result.executed) {
        if (result.result?.success) {
          setAutoSettlementStatus(prev => ({
            ...prev,
            lastSettled: new Date(),
            message: `自动结算成功完成! 发放了 ${result.result?.distributedAmount?.toFixed(2)} A币给 ${result.result?.recipientsCount} 名用户`
          }));
          
          loadDailySettlementData();
          loadFundPoolData();
          
          setSettlementResult({
            success: true,
            message: '每日自动结算成功完成！',
            distributedAmount: result.result?.distributedAmount,
            recipientsCount: result.result?.recipientsCount
          });
        } else {
          setAutoSettlementStatus(prev => ({
            ...prev,
            message: `自动结算失败: ${result.result?.message}`
          }));
        }
      } else {
        setAutoSettlementStatus(prev => ({
          ...prev,
          message: '今日已结算，无需再次结算'
        }));
      }
    } catch (error) {
      console.error('检查自动结算失败:', error);
      setAutoSettlementStatus(prev => ({
        ...prev,
        message: `检查自动结算失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  };
  
  const toggleAutoSettlement = () => {
    setAutoSettlementStatus(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
      message: !prev.isEnabled ? '自动结算已启用' : '自动结算已禁用'
    }));
  };

  const loadFundPoolData = async () => {
    try {
      const publicData = await fundPoolService.getPublicFundPoolData();
      setFundPoolData(publicData);
    } catch (error) {
      console.error('加载资金池数据失败:', error);
    }
  };

  const loadDailySettlementData = async () => {
    try {
      const data = await computingEconomicService.getDailySettlementData();
      setDailySettlement(data);
    } catch (error) {
      console.error('加载每日结算数据失败:', error);
    }
  };

  const handleExecuteSettlement = async () => {
    if (!dailySettlement || dailySettlement.settlementStatus !== 'ready') {
      return;
    }

    setIsSettlementProcessing(true);
    setSettlementResult(null);

    try {
      const updatedSettlement = { ...dailySettlement, settlementStatus: 'processing' as const };
      setDailySettlement(updatedSettlement);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const activeUsers = await computingEconomicService.getActiveUsersWithContributionScores();
      
      const distributionResult = await aCoinService.distributeACoinsByContribution(
        dailySettlement.aCoinDistributionPool,
        activeUsers
      );
      
      const currentUserDistribution = distributionResult.successfulDistributions.find(
        dist => dist.userId === 'current-user'
      );
      
      if (currentUserDistribution) {
        await walletService.distributeACoins(
          currentUserDistribution.amount,
          `每日结算A币奖励 - 贡献分数: ${currentUserDistribution.contributionScore.toFixed(2)}`
        );
      }

      const completedSettlement = { 
        ...updatedSettlement, 
        settlementStatus: 'completed' as const,
        lastSettlementTime: new Date()
      };
      setDailySettlement(completedSettlement);

      const refreshedData = await fundPoolService.getPublicFundPoolData();
      setFundPoolData(refreshedData);

      setSettlementResult({
        success: true,
        message: '结算成功完成！',
        distributedAmount: distributionResult.totalAmount,
        recipientsCount: distributionResult.recipientsCount
      });
    } catch (error) {
      console.error('执行结算失败:', error);
      
      const failedSettlement = { ...dailySettlement, settlementStatus: 'failed' as const };
      setDailySettlement(failedSettlement);
      
      setSettlementResult({
        success: false,
        message: `结算失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setIsSettlementProcessing(false);
    }
  };

  if (!fundPoolData) {
    return (
        <div className="w-full h-64 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-300">加载A币数据中...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-8 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-3xl text-white">🅰️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">A币 (平台币)</h2>
            <p className="text-slate-600 dark:text-slate-400">固定总量10亿，1 A币 = 1 RMB，最小单位0.01元</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/acoin-settlement-test"
            className="px-4 py-2 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors flex items-center gap-1"
          >
            <span>🧮</span>
            A币结算测试
          </Link>
          <Link
            to="/acoin-calculation-test"
            className="px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors flex items-center gap-1"
          >
            <span>📊</span>
            A币计算测试
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">总供应量</div>
          <div className="text-xl font-bold text-purple-600">
            {fundPoolData.aCoinStats.totalSupply.toLocaleString()} A币
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">流通供应量</div>
          <div className="text-xl font-bold text-green-600">
            {fundPoolData.aCoinStats.circulatingSupply.toLocaleString()} A币
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">累计发放</div>
          <div className="text-xl font-bold text-blue-600">
            {fundPoolData.aCoinStats.totalDistributed.toLocaleString()} A币
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">持有者数量</div>
          <div className="text-xl font-bold text-orange-600">
            {fundPoolData.aCoinStats.holdersCount.toLocaleString()} 人
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🧮</span>
            每日结算A币
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettlementDetails(!showSettlementDetails)}
              className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors"
            >
              {showSettlementDetails ? '隐藏详情' : '显示详情'}
            </button>
            <button
              onClick={toggleAutoSettlement}
              className={`px-3 py-1 text-sm ${
                autoSettlementStatus.isEnabled
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } rounded-lg transition-colors`}
            >
              {autoSettlementStatus.isEnabled ? '自动结算: 开' : '自动结算: 关'}
            </button>
            {dailySettlement && dailySettlement.settlementStatus === 'ready' && (
              <button 
                onClick={handleExecuteSettlement}
                disabled={isSettlementProcessing}
                className={`px-3 py-1 text-sm ${
                  isSettlementProcessing 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                } rounded-lg transition-colors flex items-center gap-1`}
              >
                {isSettlementProcessing ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-green-500 rounded-full border-t-transparent"></span>
                    处理中...
                  </>
                ) : '手动结算'}
              </button>
            )}
          </div>
        </div>
        
        <div className={`mb-4 p-3 rounded-lg ${
          autoSettlementStatus.isEnabled 
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${autoSettlementStatus.isEnabled ? 'text-blue-500' : 'text-gray-500'}`}>
                {autoSettlementStatus.isEnabled ? '🔄' : '⏸️'}
              </span>
              <div>
                <h4 className={`font-medium ${autoSettlementStatus.isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {autoSettlementStatus.isEnabled ? '自动结算已启用' : '自动结算已禁用'}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {autoSettlementStatus.message}
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              {autoSettlementStatus.lastChecked && (
                <div>上次检查: {autoSettlementStatus.lastChecked.toLocaleTimeString()}</div>
              )}
              {autoSettlementStatus.lastSettled && (
                <div>上次结算: {autoSettlementStatus.lastSettled.toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        </div>
        
        {dailySettlement ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400">今日结算日期</div>
                <div className="text-lg font-medium">{dailySettlement.date}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600 dark:text-slate-400">结算状态</div>
                <div className={`text-lg font-medium ${
                  dailySettlement.settlementStatus === 'ready' ? 'text-green-600' : 
                  dailySettlement.settlementStatus === 'completed' ? 'text-blue-600' : 
                  dailySettlement.settlementStatus === 'processing' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {
                    dailySettlement.settlementStatus === 'ready' ? '待结算' : 
                    dailySettlement.settlementStatus === 'completed' ? '已完成' : 
                    dailySettlement.settlementStatus === 'processing' ? '处理中' : 
                    dailySettlement.settlementStatus === 'insufficient_income' ? '收入不足' : '失败'
                  }
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">平台净收入</div>
                <div className="text-xl font-bold text-purple-600">¥{dailySettlement.platformNetIncome.toLocaleString()}</div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">A币发放池</div>
                <div className="text-xl font-bold text-blue-600">{dailySettlement.aCoinDistributionPool.toLocaleString()} A币</div>
                <div className="text-xs text-blue-500">平台净收入的40%</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">活跃用户数</div>
                <div className="text-xl font-bold text-green-600">{dailySettlement.totalDailyActivePlayers.toLocaleString()} 人</div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">总贡献分数</div>
                <div className="text-xl font-bold text-orange-600">{dailySettlement.totalContributionScore.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">A币余额 (总量-发放量)</div>
                  <div className="text-xl font-bold text-indigo-600">
                    {(fundPoolData.aCoinStats.totalSupply - fundPoolData.aCoinStats.circulatingSupply).toLocaleString()} A币
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">净值计算</div>
                  <div className="text-sm text-indigo-500">
                    {fundPoolData.aCoinStats.totalSupply.toLocaleString()} - {fundPoolData.aCoinStats.circulatingSupply.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {settlementResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                settlementResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${settlementResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {settlementResult.success ? '✅' : '❌'}
                  </span>
                  <h4 className={`font-medium ${settlementResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {settlementResult.success ? '结算成功' : '结算失败'}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {settlementResult.message}
                </p>
                {settlementResult.success && settlementResult.distributedAmount !== undefined && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">总发放A币</div>
                      <div className="text-lg font-medium text-blue-600">{settlementResult.distributedAmount.toFixed(2)} A币</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">受益用户数</div>
                      <div className="text-lg font-medium text-green-600">{settlementResult.recipientsCount} 人</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {showSettlementDetails && (
              <div className="mt-6 space-y-6">
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">计算过程详解</h4>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第一步：确定发放池</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div>平台净收入 × 40% = A币发放池</div>
                        <div className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {dailySettlement.platformNetIncome} × 0.4 = {dailySettlement.aCoinDistributionPool} A币
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第二步：计算贡献分数</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div>每个用户的贡献分数由三部分组成：</div>
                        <div className="ml-4 space-y-1">
                          <div>• 游戏币获得贡献 (50%权重)</div>
                          <div>• 算力贡献 (30%权重)</div>
                          <div>• 交易活跃度 (20%权重)</div>
                        </div>
                        <div className="mt-2">全网总贡献分数：{dailySettlement.totalContributionScore.toLocaleString()}</div>
                        <div>平均贡献分数：{dailySettlement.averageContributionScore.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第三步：分配A币</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div>个人A币 = (个人贡献分数 ÷ 全网总贡献分数) × 发放池</div>
                        <div className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded mt-2">
                          例如：用户贡献分数为0.5，则获得A币 = (0.5 ÷ {dailySettlement.totalContributionScore}) × {dailySettlement.aCoinDistributionPool} ≈ {((0.5 / dailySettlement.totalContributionScore) * dailySettlement.aCoinDistributionPool).toFixed(2)} A币
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第四步：发放条件</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div>• 平台净收入必须大于0</div>
                        <div>• 个人贡献分数必须大于0.1</div>
                        <div>• 计算结果必须大于最小发放单位0.01 A币</div>
                        <div className="mt-2 font-medium">
                          今日结算状态：
                          <span className={`ml-2 ${
                            dailySettlement.settlementStatus === 'ready' ? 'text-green-600' : 
                            dailySettlement.settlementStatus === 'completed' ? 'text-blue-600' : 
                            dailySettlement.settlementStatus === 'processing' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {
                              dailySettlement.settlementStatus === 'ready' ? '待结算' : 
                              dailySettlement.settlementStatus === 'completed' ? '已完成' : 
                              dailySettlement.settlementStatus === 'processing' ? '处理中' : 
                              dailySettlement.settlementStatus === 'insufficient_income' ? '收入不足' : '失败'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">今日数据统计</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">游戏币分发总量</div>
                      <div className="text-lg font-medium">{dailySettlement.totalDailyGameCoinsDistributed.toLocaleString()} 游戏币</div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">算力总量</div>
                      <div className="text-lg font-medium">{dailySettlement.totalDailyComputingPower.toLocaleString()} 算力</div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">交易总量</div>
                      <div className="text-lg font-medium">{dailySettlement.totalDailyTransactions.toLocaleString()} 笔</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">加载结算数据中...</p>
          </div>
        )}
      </div>
    </div>
  );
}