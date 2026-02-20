import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { computingEconomicService } from '@/services/computingEconomicService';
import { fundPoolService } from '@/services/fundPoolService';
import { DailySettlementData } from '@/types/computing';
import { PublicFundPoolData } from '@/types/fundPool';
import ACoinCalculationResults from '@/components/ACoinCalculationResults';

// A币计算结果接口
interface ACoinCalculationResult {
  step1: {
    personalComputingPower: number;
    personalGameCoins: number;
    personalTransactionVolume: number;
    personalContributionScore: number;
  };
  step2: {
    networkComputingPower: number;
    networkGameCoins: number;
    networkTransactionVolume: number;
    totalNetworkContributionScore: number;
  };
  step3: {
    personalRatio: number;
    dailyACoinPool: number;
    calculatedACoin: number;
    actualDistributed: number;
    platformNetIncome: number;
  };
}

export default function ACoinCalculationTest() {
  const [loading, setLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState<ACoinCalculationResult | null>(null);
  const [fundPoolData, setFundPoolData] = useState<PublicFundPoolData | null>(null);
  const [dailySettlement, setDailySettlement] = useState<DailySettlementData | null>(null);
  const [userBalance, setUserBalance] = useState({
    aCoins: 0,
    computing: 1200,
    gameCoins: 850,
    transactionVolume: 2500
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [fundData, settlementData] = await Promise.all([
        fundPoolService.getPublicFundPoolData(),
        computingEconomicService.getDailySettlementData()
      ]);
      setFundPoolData(fundData);
      setDailySettlement(settlementData);
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  };

  const calculateACoin = async () => {
    if (!dailySettlement || !fundPoolData) {
      alert('请先加载基础数据');
      return;
    }

    setLoading(true);
    
    try {
      // 第一步：获取个人数据作为分子
      const personalComputingPower = userBalance.computing;
      const personalGameCoins = userBalance.gameCoins;
      const personalTransactionVolume = userBalance.transactionVolume;
      
      // 计算个人贡献分数（按照约定的权重）
      const personalContributionScore = 
        (personalGameCoins * 0.5) + 
        (personalComputingPower * 0.3) + 
        (personalTransactionVolume * 0.2);

      // 第二步：获取全网数据作为分母
      const networkComputingPower = dailySettlement.totalDailyComputingPower;
      const networkGameCoins = dailySettlement.totalDailyGameCoinsDistributed;
      const networkTransactionVolume = 50000; // 模拟全网交易量
      
      // 计算全网总贡献分数
      const totalNetworkContributionScore = 
        (networkGameCoins * 0.5) + 
        (networkComputingPower * 0.3) + 
        (networkTransactionVolume * 0.2);

      // 第三步：计算A币发放
      const platformNetIncome = dailySettlement.platformNetIncome;
      const dailyACoinPool = platformNetIncome > 0 ? platformNetIncome * 0.4 : 0; // 40%转化为A币
      
      const personalRatio = personalContributionScore / totalNetworkContributionScore;
      const calculatedACoin = dailyACoinPool * personalRatio;
      
      // 最小发放单位检查
      const actualDistributed = calculatedACoin >= 0.01 ? calculatedACoin : 0;

      const result: ACoinCalculationResult = {
        step1: {
          personalComputingPower,
          personalGameCoins,
          personalTransactionVolume,
          personalContributionScore
        },
        step2: {
          networkComputingPower,
          networkGameCoins,
          networkTransactionVolume,
          totalNetworkContributionScore
        },
        step3: {
          personalRatio,
          dailyACoinPool,
          calculatedACoin,
          actualDistributed,
          platformNetIncome
        }
      };

      setCalculationResult(result);

      // 如果有A币发放，更新用户余额
      if (actualDistributed > 0) {
        setUserBalance(prev => ({
          ...prev,
          aCoins: prev.aCoins + actualDistributed
        }));
        
        // 模拟更新资金池数据（A币总量减少）
        if (fundPoolData) {
          const updatedFundData = {
            ...fundPoolData,
            currentBalance: {
              ...fundPoolData.currentBalance,
              aCoins: Math.max(0, fundPoolData.currentBalance.aCoins - actualDistributed)
            },
            aCoinStats: {
              ...fundPoolData.aCoinStats,
              circulatingSupply: fundPoolData.aCoinStats.circulatingSupply + actualDistributed,
              totalDistributed: fundPoolData.aCoinStats.totalDistributed + actualDistributed
            }
          };
          setFundPoolData(updatedFundData);
        }
      }

    } catch (error) {
      console.error('A币计算失败:', error);
      alert('A币计算失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setCalculationResult(null);
    setUserBalance({
      aCoins: 0,
      computing: 1200,
      gameCoins: 850,
      transactionVolume: 2500
    });
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              A币计算与发放测试
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              按照约定算法测试A币的计算与发放流程
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/computing-dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回算力中心
            </Link>
            <button
              onClick={resetTest}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              重置测试
            </button>
          </div>
        </div>

        {/* 用户当前数据 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            个人中心数据
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{userBalance.computing}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">实时算力</div>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{userBalance.gameCoins}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">游戏币</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">¥{userBalance.transactionVolume.toLocaleString()}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">交易金额</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{userBalance.aCoins.toFixed(2)} A币</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">当前A币余额</div>
            </div>
          </div>
        </div>

        {/* 全网数据 */}
        {dailySettlement && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              全网每日数据 ({dailySettlement.date})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dailySettlement.totalDailyComputingPower.toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">全网算力</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{dailySettlement.totalDailyGameCoinsDistributed.toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">游戏币发放</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">¥50,000</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">全网交易额</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">¥{dailySettlement.platformNetIncome.toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">平台净收入</div>
              </div>
            </div>
          </div>
        )}

        {/* 计算按钮 */}
        <div className="text-center mb-8">
          <button
            onClick={calculateACoin}
            disabled={loading || !dailySettlement || !fundPoolData}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '计算中...' : '🧮 开始A币计算与发放'}
          </button>
        </div>

        {/* 计算结果 */}
        {calculationResult && (
          <ACoinCalculationResults 
            calculationResult={calculationResult} 
            fundPoolData={fundPoolData} 
          />
        )}
      </div>
    </div>
  );
}