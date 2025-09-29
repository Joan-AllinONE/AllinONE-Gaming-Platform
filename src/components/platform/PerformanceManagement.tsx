import React, { useState, useEffect } from 'react';
import oCoinPerformanceService from '@/services/oCoinPerformanceService';
import dividendWeightService from '@/services/dividendWeightService';
import optionsManagementService from '@/services/optionsManagementService';
import oCoinService from '@/services/oCoinService';

/**
 * 绩效管理组件
 * 管理O币绩效分配、期权管理和分红权重计算
 */
const PerformanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ocoin' | 'options' | 'dividend'>('ocoin');
  const [loading, setLoading] = useState(false);
  
  // O币绩效数据
  const [oCoinStats, setOCoinStats] = useState({
    totalOCoinAllocated: 0,
    totalUsers: 0,
    averageScore: 0,
    topPerformers: [] as Array<{userId: string, score: number, amount: number}>
  });
  
  // 计算过程显示
  const [calculationProcess, setCalculationProcess] = useState<Array<{
    userId: string;
    details: {
      revenue: number;
      referrals: number;
      development: number;
      management: number;
      marketing: number;
      totalScore: number;
      oCoinAmount: number;
    };
  }>>([]);
  const [showCalculation, setShowCalculation] = useState(false);
  
  // 期权管理数据
  const [optionsStats, setOptionsStats] = useState({
    totalOptionsGranted: 0,
    totalUsers: 0,
    totalVested: 0,
    totalExercised: 0,
    averageStrikePrice: 0,
    topOptionHolders: [] as Array<{userId: string, totalOptions: number, vestedOptions: number, strikePrice: number}>
  });
  const [dividendStats, setDividendStats] = useState({
    totalDistributed: 0,
    totalRecipients: 0,
    averageDividend: 0,
    topRecipients: [] as Array<{userId: string, totalReceived: number, weight: number}>
  });
  
  // 示例用户列表
  const testUsers = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = () => {
    try {
      const oCoinData = oCoinPerformanceService.getPlatformPerformanceStats();
      setOCoinStats(oCoinData);
      
      // 获取真实的期权管理数据
      const optionsPoolStats = optionsManagementService.getOptionsPoolStats();
      const topOptionHolders = optionsManagementService.getTopOptionHolders(3);
      
      const optionsData = {
        totalOptionsGranted: optionsPoolStats.totalGranted,
        totalUsers: optionsPoolStats.participatingUsers,
        totalVested: optionsPoolStats.totalVested,
        totalExercised: optionsPoolStats.totalExercised,
        averageStrikePrice: optionsPoolStats.averageStrikePrice,
        topOptionHolders: topOptionHolders
      };
      setOptionsStats(optionsData);
      
      const dividendData = dividendWeightService.getDividendStats();
      setDividendStats(dividendData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };
  
  /**
   * O币授予计算并显示计算过程（仅计算，不授予）
   */
  const handleOCoinGrantCalculation = async () => {
    setLoading(true);
    try {
      const periodId = `period-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const contributions = testUsers.map(userId => 
        oCoinPerformanceService.generateMockPerformanceData(userId, periodId)
      );
      
      // 生成详细的计算过程
      const calculationDetails = contributions.map(contribution => {
        const revenue = contribution.revenueContribution * 0.4; // 收入贡献权重40%
        const referrals = contribution.playerReferralCount * 0.2; // 推荐权重20%
        const development = contribution.developmentScore * 0.15; // 开发贡献权重15%
        const management = contribution.managementScore * 0.15; // 管理贡献权重15%
        const marketing = contribution.marketingScore * 0.1; // 营销贡献权重10%
        
        const totalScore = revenue + referrals + development + management + marketing;
        const oCoinAmount = Math.floor(totalScore * 100); // 每分转换为100个O币
        
        return {
          userId: contribution.userId,
          details: {
            revenue: contribution.revenueContribution,
            referrals: contribution.playerReferralCount,
            development: contribution.developmentScore,
            management: contribution.managementScore,
            marketing: contribution.marketingScore,
            totalScore: totalScore,
            oCoinAmount: oCoinAmount
          }
        };
      });
      
      setCalculationProcess(calculationDetails);
      setShowCalculation(true);
      
      // 🔄 修改：仅计算，不自动授予期权
      const totalCalculated = calculationDetails.reduce((sum, calc) => sum + calc.details.oCoinAmount, 0);
      
      alert(`✅ O币绩效计算完成！\n\n📊 计算结果：共为 ${contributions.length} 个用户计算出 ${totalCalculated.toLocaleString()} 个待授予O币。\n\n👉 请在“期权管理”标签页查看详细信息并确认授予。`);
    } catch (error) {
      console.error('O币计算失败:', error);
      alert('❌ O币计算失败，请检查控制台错误信息。');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 授予期权（基于当期计算结果）
   */
  const handleGrantOptions = async () => {
    setLoading(true);
    try {
      // 检查是否有计算结果
      if (calculationProcess.length === 0) {
        alert('⚠️ 请先执行"O币授予计算"，生成绩效计算结果后再进行期权授予。');
        return;
      }
      
      const totalPendingOptions = calculationProcess.reduce((sum, calc) => sum + calc.details.oCoinAmount, 0);
      const affectedUsers = calculationProcess.length;
      
      // 确认授予
      const confirmed = confirm(
        `确认授予期权吗？\n\n` +
        `📊 待授予期权总数：${totalPendingOptions.toLocaleString()} 个\n` +
        `👥 涉及用户数量：${affectedUsers} 个\n` +
        `💰 执行价格：市价95%折扣\n` +
        `🗺️ 归属期：365天\n\n` +
        `此操作将正式授予期权，不可撤销。`
      );
      
      if (!confirmed) {
        return;
      }
      
      // 基于计算结果授予期权
      const grantResults = calculationProcess.map(calc => ({
        userId: calc.userId,
        oCoinAmount: calc.details.oCoinAmount,
        totalScore: calc.details.totalScore
      }));
      
      const currentPrice = oCoinService.getOCoinMarketData().currentPrice;
      const optionGrantResult = await optionsManagementService.grantOptionsFromPerformance(
        grantResults,
        currentPrice
      );
      
      // 清空当期计算结果（已授予）
      setCalculationProcess([]);
      setShowCalculation(false);
      
      loadStats(); // 重新加载统计数据
      
      alert(`✅ 期权授予完成！\n\n🎁 共授予 ${optionGrantResult.totalGranted.toLocaleString()} 个期权给 ${optionGrantResult.grantedUsers} 个用户。\n💰 平均执行价：¥${optionGrantResult.details.length > 0 ? optionGrantResult.details[0].strikePrice : 0}\n\n期权将在未来365天内逐渐成熟，成熟后可以进行行权操作。`);
    } catch (error) {
      console.error('期权授予失败:', error);
      alert('❌ 期权授予失败，请检查控制台错误信息。');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 行权操作（增强版条件验证）
   */
  const handleExerciseOptions = async () => {
    setLoading(true);
    try {
      // 首先处理期权成熟
      const vestingResult = await optionsManagementService.processVesting();
      
      if (vestingResult.totalVested > 0) {
        console.log(`✨ 处理期权成熟：${vestingResult.totalVested} 个期权已成熟，影响 ${vestingResult.affectedUsers} 个用户`);
        console.log(`💰 共发放 ${vestingResult.totalUnlocked} 个O币到个人账户`);
      }
      
      // 获取当前市价和市场数据
      const marketData = oCoinService.getOCoinMarketData();
      const currentPrice = marketData.currentPrice;
      
      // 模拟为第一个有期权的用户行权（实际上应该由用户选择）
      const topHolders = optionsManagementService.getTopOptionHolders(1);
      
      if (topHolders.length === 0) {
        alert('⚠️ 没有找到有期权的用户。请先执行绩效计算和期权授予。');
        return;
      }
      
      const targetUser = topHolders[0];
      const exerciseAmount = Math.min(targetUser.vestedOptions, 1000); // 行权部分已成熟期权
      
      // 🔥 增强条件验证
      if (exerciseAmount <= 0) {
        alert('⚠️ 选中的用户没有已成熟的期权可行权。\n\n💡 提示：期权需要经过成熟期才能行权，请耐心等待或联系管理员。');
        return;
      }
      
      // 检查市价是否有利于行权
      if (currentPrice <= targetUser.strikePrice) {
        const confirmUnprofitable = confirm(
          `⚠️ 行权条件提醒\n\n` +
          `📈 当前市价：¥${currentPrice.toFixed(2)}\n` +
          `🎯 执行价格：¥${targetUser.strikePrice.toFixed(2)}\n` +
          `📊 潜在损失：¥${((targetUser.strikePrice - currentPrice) * exerciseAmount).toFixed(2)}\n\n` +
          `当前市价低于执行价格，行权将产生损失。\n是否确认继续行权？`
        );
        
        if (!confirmUnprofitable) {
          return;
        }
      }
      
      // 最终确认
      const finalConfirm = confirm(
        `🚀 确认期权行权\n\n` +
        `👤 用户：${targetUser.userId}\n` +
        `💰 行权数量：${exerciseAmount.toLocaleString()} 个\n` +
        `📈 当前市价：¥${currentPrice.toFixed(2)}\n` +
        `🎯 执行价格：¥${targetUser.strikePrice.toFixed(2)}\n` +
        `💵 预期收益：¥${Math.max(0, (currentPrice - targetUser.strikePrice) * exerciseAmount).toFixed(2)}\n\n` +
        `此操作不可撤销，确认继续？`
      );
      
      if (!finalConfirm) {
        return;
      }
      
      // 执行行权
      const exerciseResult = await optionsManagementService.exerciseOptions(
        targetUser.userId,
        exerciseAmount,
        currentPrice
      );
      
      loadStats(); // 重新加载统计数据
      
      if (exerciseResult.success) {
        alert(`✅ 期权行权完成！\n\n👤 用户：${targetUser.userId}\n💰 行权数量：${exerciseResult.exercisedAmount.toLocaleString()} 个\n📈 当前市价：¥${currentPrice.toFixed(2)}\n🎯 执行价格：¥${targetUser.strikePrice.toFixed(2)}\n💵 实际收益：¥${exerciseResult.profit.toFixed(2)}\n\n🎉 已成功将收益添加到用户O币余额中！`);
      } else {
        alert(`❌ 期权行权失败：${exerciseResult.message}`);
      }
    } catch (error) {
      console.error('期权行权失败:', error);
      alert('❌ 期权行权失败，请检查控制台错误信息。');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 计算并分配分红权重
   */
  const handleCalculateDividendWeights = async () => {
    setLoading(true);
    try {
      const periodId = `dividend-period-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      await dividendWeightService.calculateAllDividendWeights(periodId);
      loadStats();
      
      alert(`✅ 分红权重计算完成！为 ${testUsers.length} 个用户计算了分红权重。`);
    } catch (error) {
      console.error('分红权重计算失败:', error);
      alert('❌ 分红权重计算失败，请检查控制台错误信息。');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 计算并分配分红权重
   */
  const handleDistributeDividend = async () => {
    setLoading(true);
    try {
      const periodId = `dividend-period-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const totalPool = 50000; // 5万元分红池
      
      await dividendWeightService.distributeCashDividend(periodId, totalPool);
      loadStats();
      
      // 🔥 触发钱包更新事件，让个人中心实时看到现金变化
      window.dispatchEvent(new CustomEvent('wallet-updated', {
        detail: { 
          type: 'dividend',
          amount: totalPool,
          timestamp: new Date()
        }
      }));
      
      alert(`✅ 现金分红分配完成！共分配了 ${totalPool} 元现金分红。\n\n💰 请在个人中心查看您的现金余额变化！`);
    } catch (error) {
      console.error('现金分红失败:', error);
      alert('❌ 现金分红失败，请检查控制台错误信息。');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 执行现金分红分配
   */
  const handleClearData = () => {
    if (confirm('确定要清空所有绩效数据吗？此操作不可撤销。')) {
      if (activeTab === 'ocoin') {
        oCoinPerformanceService.clearAllocations();
        // 同时清空计算过程
        setCalculationProcess([]);
        setShowCalculation(false);
      } else if (activeTab === 'options') {
        // 清空期权管理数据
        optionsManagementService.clearOptionsData();
      } else {
        dividendWeightService.clearData();
      }
      loadStats();
      alert('✅ 数据已清空。');
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🎯 绩效管理中心</h2>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          O币绩效分配、期权管理与现金分红统一管理
        </div>
      </div>
      
      {/* 标签切换 */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'ocoin'
              ? 'border-b-2 border-orange-600 text-orange-600 dark:text-orange-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('ocoin')}
        >
          🔶 O币绩效分配
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'options'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('options')}
        >
          📊 期权管理
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'dividend'
              ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('dividend')}
        >
          💰 现金分红权重
        </button>
      </div>
      
      {/* O币绩效分配 */}
      {activeTab === 'ocoin' && (
        <div className="space-y-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="text-2xl mr-3">🔶</div>
              <div>
                <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400">O币绩效分配</h3>
                <p className="text-sm text-orange-600 dark:text-orange-500">
                  基于未来绩效预期，分配O币期权奖励
                </p>
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">总分配O币</div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {calculationProcess.length > 0 
                    ? calculationProcess.reduce((sum, p) => sum + p.details.oCoinAmount, 0).toLocaleString()
                    : oCoinStats.totalOCoinAllocated.toLocaleString()
                  }
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">参与用户</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {calculationProcess.length > 0 ? calculationProcess.length : oCoinStats.totalUsers}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">平均绩效分数</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {calculationProcess.length > 0 
                    ? (calculationProcess.reduce((sum, p) => sum + p.details.totalScore, 0) / calculationProcess.length).toFixed(1)
                    : oCoinStats.averageScore
                  }
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleOCoinGrantCalculation}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '计算中...' : '🚀 O币授予计算'}
              </button>
              <button
                onClick={() => setShowCalculation(!showCalculation)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCalculation ? '隐藏计算过程' : '📊 查看计算过程'}
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ 清空数据
              </button>
            </div>
          </div>
          
          {/* 计算过程详情 */}
          {showCalculation && calculationProcess.length > 0 && (
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4 mt-4">
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">📊 O币授予计算过程</h4>
              
              {/* 计算公式说明 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <h5 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2">🧮 计算公式</h5>
                <div className="text-xs text-blue-600 dark:text-blue-500 space-y-1">
                  <p><strong>总分 =</strong> 收入贡献×40% + 推荐人数×20% + 开发贡献×15% + 管理贡献×15% + 营销贡献×10%</p>
                  <p><strong>O币数量 =</strong> 总分 × 100 (每分转换为100个O币)</p>
                </div>
              </div>
              
              {/* 计算结果表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">用户ID</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">收入贡献<br/><span className="text-xs text-slate-500">(40%)</span></th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">推荐人数<br/><span className="text-xs text-slate-500">(20%)</span></th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">开发贡献<br/><span className="text-xs text-slate-500">(15%)</span></th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">管理贡献<br/><span className="text-xs text-slate-500">(15%)</span></th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">营销贡献<br/><span className="text-xs text-slate-500">(10%)</span></th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">总分</th>
                      <th className="px-3 py-2 text-center font-semibold text-orange-600 dark:text-orange-400">授予O币</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {calculationProcess.map((process, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{process.userId}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-slate-700 dark:text-slate-300">{process.details.revenue.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">({(process.details.revenue * 0.4).toFixed(1)}分)</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-slate-700 dark:text-slate-300">{process.details.referrals}</div>
                          <div className="text-xs text-slate-500">({(process.details.referrals * 0.2).toFixed(1)}分)</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-slate-700 dark:text-slate-300">{process.details.development.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">({(process.details.development * 0.15).toFixed(1)}分)</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-slate-700 dark:text-slate-300">{process.details.management.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">({(process.details.management * 0.15).toFixed(1)}分)</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-slate-700 dark:text-slate-300">{process.details.marketing.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">({(process.details.marketing * 0.1).toFixed(1)}分)</div>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">
                          {process.details.totalScore.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-orange-600 dark:text-orange-400">
                          {process.details.oCoinAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">总计</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {calculationProcess.reduce((sum, p) => sum + p.details.revenue, 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {calculationProcess.reduce((sum, p) => sum + p.details.referrals, 0)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {calculationProcess.reduce((sum, p) => sum + p.details.development, 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {calculationProcess.reduce((sum, p) => sum + p.details.management, 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {calculationProcess.reduce((sum, p) => sum + p.details.marketing, 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">
                        {calculationProcess.reduce((sum, p) => sum + p.details.totalScore, 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-orange-600 dark:text-orange-400">
                        {calculationProcess.reduce((sum, p) => sum + p.details.oCoinAmount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* 计算说明 */}
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <h5 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">📝 计算说明</h5>
                <div className="text-xs text-orange-700 dark:text-orange-500 space-y-1">
                  <p>• <strong>收入贡献：</strong>用户为平台带来的收入金额，权重最高(40%)</p>
                  <p>• <strong>推荐人数：</strong>用户成功推荐的新用户数量，体现生态扩张能力(20%)</p>
                  <p>• <strong>开发贡献：</strong>技术开发、产品改进等技术性贡献(15%)</p>
                  <p>• <strong>管理贡献：</strong>团队管理、运营管理等管理性贡献(15%)</p>
                  <p>• <strong>营销贡献：</strong>市场推广、品牌建设等营销性贡献(10%)</p>
                  <p>• <strong>转换规则：</strong>总分乘以100得出最终O币授予数量，确保激励效果</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 期权管理 */}
      {activeTab === 'options' && (
        <div className="space-y-6">
          {/* 当期计算结果显示 */}
          {calculationProcess.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📋</div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400">当期计算结果</h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                      待授予的期权数量，点击“授予期权”按钮进行正式授予
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-yellow-600 dark:text-yellow-500">计算时间</div>
                  <div className="text-xs text-yellow-500">{new Date().toLocaleString()}</div>
                </div>
              </div>
              
              {/* 当期统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                  <div className="text-sm text-slate-500 dark:text-slate-400">待授予期权</div>
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {calculationProcess.reduce((sum, p) => sum + p.details.oCoinAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                  <div className="text-sm text-slate-500 dark:text-slate-400">待授予用户</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {calculationProcess.length}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                  <div className="text-sm text-slate-500 dark:text-slate-400">平均期权数</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {(calculationProcess.reduce((sum, p) => sum + p.details.oCoinAmount, 0) / calculationProcess.length).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* 当期计算详情表格 */}
              <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-3">当期计算详情</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">用户ID</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">绩效分数</th>
                        <th className="px-3 py-2 text-center font-semibold text-yellow-600 dark:text-yellow-400">待授予期权</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">执行价（预估）</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {calculationProcess.map((process, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{process.userId}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="text-slate-700 dark:text-slate-300">{process.details.totalScore.toFixed(2)}</div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="font-bold text-yellow-600 dark:text-yellow-400">{process.details.oCoinAmount.toLocaleString()}</div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="text-slate-700 dark:text-slate-300">¥2.38</div>
                            <div className="text-xs text-slate-500">（市价95%）</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h3 className="text-lg font-bold text-purple-800 dark:text-purple-400">期权管理</h3>
                <p className="text-sm text-purple-600 dark:text-purple-500">
                  基于绩效计算结果，管理O币期权的授予、成熟和行权操作
                </p>
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">总授予期权</div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {optionsStats.totalOptionsGranted.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">参与用户</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {optionsStats.totalUsers}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">已成熟期权</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {optionsStats.totalVested.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">已行权数量</div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {optionsStats.totalExercised.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* 期权池情况 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
              <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-3">期权池统计</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">平均执行价</span>
                    <span className="font-bold text-purple-600">¥{optionsStats.averageStrikePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">成熟率</span>
                    <span className="font-bold text-green-600">
                      {optionsStats.totalOptionsGranted > 0 
                        ? ((optionsStats.totalVested / optionsStats.totalOptionsGranted) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">行权率</span>
                    <span className="font-bold text-orange-600">
                      {optionsStats.totalVested > 0 
                        ? ((optionsStats.totalExercised / optionsStats.totalVested) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">待成熟期权</span>
                    <span className="font-bold text-blue-600">
                      {(optionsStats.totalOptionsGranted - optionsStats.totalVested).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-3">顶级期权持有者</h4>
                <div className="space-y-2">
                  {optionsStats.topOptionHolders.map((holder, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm">{holder.userId}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{holder.totalOptions.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">成熟: {holder.vestedOptions.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleGrantOptions}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '处理中...' : '🎁 授予期权'}
              </button>
              <button
                onClick={handleExerciseOptions}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '处理中...' : '⚙️ 行权操作'}
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ 清空数据
              </button>
            </div>
            
            {/* 期权说明 */}
            <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg">
              <h5 className="text-sm font-bold text-purple-800 dark:text-purple-400 mb-2">📝 期权管理工作流程</h5>
              <div className="text-xs text-purple-700 dark:text-purple-500 space-y-1">
                <p>• <strong>1. 绩效计算：</strong>在"O币绩效分配"标签中执行"授予计算"，系统仅计算不直接授予</p>
                <p>• <strong>2. 结果显示：</strong>在本页面查看当期计算结果的详细数据，包括待授予用户和期权数量</p>
                <p>• <strong>3. 确认授予：</strong>点击"授予期权"按钮，经确认后正式将计算结果转为期权</p>
                <p>• <strong>4. 期权成熟：</strong>期权逐渐成熟，365天内按日均匀释放，只有成熟后才可行权</p>
                <p>• <strong>5. 条件验证：</strong>行权时检查市价、成熟数量等条件，确保合理性和安全性</p>
                <p>• <strong>6. 期权行权：</strong>当O币市价高于执行价且期权已成熟时，可行权获得收益</p>
                <p>• <strong>7. 数据同步：</strong>所有操作都会实时更新期权统计数据，确保数据一致性</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 现金分红权重 */}
      {activeTab === 'dividend' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <h3 className="text-lg font-bold text-green-800 dark:text-green-400">现金分红权重</h3>
                <p className="text-sm text-green-600 dark:text-green-500">
                  基于历史和当下绩效，分配现金分红权重
                </p>
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">总分红金额</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ¥{dividendStats.totalDistributed.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">受益人数</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {dividendStats.totalRecipients}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <div className="text-sm text-slate-500 dark:text-slate-400">平均分红</div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  ¥{dividendStats.averageDividend.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleCalculateDividendWeights}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '计算中...' : '📊 计算分红权重'}
              </button>
              <button
                onClick={handleDistributeDividend}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '分配中...' : '💸 执行现金分红'}
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ 清空数据
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-md font-bold text-blue-800 dark:text-blue-400 mb-2">📝 使用说明</h4>
        <div className="text-sm text-blue-600 dark:text-blue-500 space-y-1">
          <p><strong>O币绩效分配:</strong> 基于用户的收入贡献、推荐玩家、开发/管理/营销贡献计算绩效分数，分配O币期权奖励</p>
          <p><strong>期权管理:</strong> 统一管理O币期权的授予、成熟和行权操作，与绩效分配系统深度集成</p>
          <p><strong>现金分红权重:</strong> 基于用户的历史绩效贡献计算分红权重，按权重分配现金分红</p>
          <p><strong>权重配置:</strong> 可以通过平台管理的参数投票功能调整各项绩效的权重系数</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceManagement;