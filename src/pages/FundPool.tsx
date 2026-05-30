import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fundPoolService } from '@/services/fundPoolService';
import { FundPoolTransaction, FundPoolBalance, PublicFundPoolData } from '@/types/fundPool';
const FundPoolOCoinMarket = () => null; // MVP v1.0 stub - OCoin removed

export default function FundPool() {
  const [fundPoolData, setFundPoolData] = useState<PublicFundPoolData | null>(null);
  const [transactions, setTransactions] = useState<FundPoolTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'charts' | 'ocoin'>('overview');
  const [searchFilters, setSearchFilters] = useState({
    type: '',
    category: '',
    source: '',
    currency: ''
  });

  useEffect(() => {
    loadFundPoolData();
    
    const dataInterval = setInterval(loadFundPoolData, 30000);
    
    return () => {
      clearInterval(dataInterval);
    };
  }, []);

  const loadFundPoolData = async () => {
    try {
      const [publicData, allTransactions] = await Promise.all([
        fundPoolService.getPublicFundPoolData(),
        fundPoolService.getAllTransactions()
      ]);
      setFundPoolData(publicData);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('加载资金池数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const filtered = await fundPoolService.searchTransactions({
        type: searchFilters.type as any,
        category: searchFilters.category,
        source: searchFilters.source
      });
      
      // 客户端货币筛选
      let result = filtered;
      if (searchFilters.currency) {
        result = filtered.filter(tx => tx.currency === searchFilters.currency);
      }
      
      setTransactions(result);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const resetSearch = () => {
    setSearchFilters({ type: '', category: '', source: '', currency: '' });
    loadFundPoolData();
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyNames = {
      computingPower: '算力',
      // 兼容旧数据
      computing: '算力',
      cash: '现金',
      gameCoins: '游戏币',
    };
    return `${amount.toLocaleString()} ${currencyNames[currency as keyof typeof currencyNames] || currency}`;
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'income' ? '↗️' : '↙️';
  };

  // 简单图表数据处理
  const getBarWidth = (value: number, maxValue: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">加载资金池数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">平台资金池</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">透明公开的平台财务数据</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>🔄 实时更新</span>
                <span>•</span>
                <span>📊 公开透明</span>
                <span>•</span>
                <span>🔒 隐私保护</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-500 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-home mr-1"></i>
                  主页
                </Link>
                <Link
                  to="/computing-power"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-user mr-1"></i>
                  个人中心
                </Link>
                <Link
                  to="/computing-dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-chart-line mr-1"></i>
                  算力中心
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg mb-8">
          {[
            { key: 'overview', label: '总览', icon: '📊' },
            { key: 'transactions', label: '交易记录', icon: '📋' },
            { key: 'charts', label: '数据图表', icon: '📈' },
            { key: 'ocoin', label: 'O币市场', icon: '🔶' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && fundPoolData && (
          <div className="space-y-8">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">算力余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {(fundPoolData.currentBalance.computingPower ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">现金余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ¥{fundPoolData.currentBalance.cash.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">游戏币余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {fundPoolData.currentBalance.gameCoins.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🪙</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">总价值</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ¥{fundPoolData.currentBalance.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">收入统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">总收入</span>
                    <span className="font-medium text-green-600">¥{fundPoolData.stats.totalIncome.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">佣金收入</span>
                    <span className="font-medium">¥{fundPoolData.stats.incomeByCategory.commission.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">支出统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">总支出</span>
                    <span className="font-medium text-red-600">¥{fundPoolData.stats.totalExpense.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">奖励支出</span>
                    <span className="font-medium">¥{fundPoolData.stats.expenseByCategory.reward.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">交易统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">总交易数</span>
                    <span className="font-medium">{fundPoolData.transactionCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">平均金额</span>
                    <span className="font-medium">¥{fundPoolData.averageTransactionAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Search Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">筛选条件</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有类型</option>
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>

                <select
                  value={searchFilters.category}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有类别</option>
                  <option value="commission">佣金</option>
                  <option value="reward">奖励</option>
                  <option value="operation">运营</option>
                  <option value="refund">退款</option>
                  <option value="maintenance">维护</option>
                </select>

                <select
                  value={searchFilters.source}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, source: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有来源</option>
                  <option value="player_market">玩家市场</option>
                  <option value="game_store">游戏电商</option>
                  <option value="official_store">官方商店</option>
                  <option value="system">系统</option>
                </select>

                <select
                  value={searchFilters.currency}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, currency: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有货币</option>
                  <option value="cash">💰 现金</option>
                  <option value="computing">⚡ 算力</option>
                  <option value="gameCoins">🪙 游戏币</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    搜索
                  </button>
                  <button
                    onClick={resetSearch}
                    className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
                  >
                    重置
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">交易记录</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">共 {transactions.length} 条记录</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">交易编号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">描述</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">来源</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {transactions.slice(0, 50).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-slate-100">
                          {tx.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`flex items-center gap-1 ${getTransactionTypeColor(tx.type)}`}>
                            {getTransactionTypeIcon(tx.type)}
                            {tx.type === 'income' ? '收入' : '支出'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={getTransactionTypeColor(tx.type)}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {tx.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {tx.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {tx.timestamp.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && fundPoolData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Trend */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">近7日趋势</h3>
                <div className="space-y-4">
                  {fundPoolData.stats.dailyStats.slice(-7).map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{day.date.split('-').slice(1).join('/')}</span>
                        <span className="font-medium">净收入: ¥{day.netIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-green-500 rounded-sm"
                          style={{ width: `${getBarWidth(day.income, Math.max(...fundPoolData.stats.dailyStats.map(d => d.income)))}%` }}
                          title={`收入: ¥${day.income}`}
                        ></div>
                        <div 
                          className="bg-red-500 rounded-sm"
                          style={{ width: `${getBarWidth(day.expense, Math.max(...fundPoolData.stats.dailyStats.map(d => d.expense)))}%` }}
                          title={`支出: ¥${day.expense}`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span>收入</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                    <span>支出</span>
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">收支分类</h3>
                <div className="space-y-4">
                  {[
                    { label: '佣金收入', value: fundPoolData.stats.incomeByCategory.commission, color: 'bg-green-500', type: 'income' },
                    { label: '运营收入', value: fundPoolData.stats.incomeByCategory.operation, color: 'bg-blue-500', type: 'income' },
                    { label: '奖励支出', value: fundPoolData.stats.expenseByCategory.reward, color: 'bg-yellow-500', type: 'expense' },
                    { label: '退款支出', value: fundPoolData.stats.expenseByCategory.refund, color: 'bg-red-500', type: 'expense' },
                    { label: '维护支出', value: fundPoolData.stats.expenseByCategory.maintenance, color: 'bg-purple-500', type: 'expense' }
                  ].map((item, index) => {
                    const maxValue = Math.max(
                      fundPoolData.stats.incomeByCategory.commission,
                      fundPoolData.stats.incomeByCategory.operation,
                      fundPoolData.stats.expenseByCategory.reward,
                      fundPoolData.stats.expenseByCategory.refund,
                      fundPoolData.stats.expenseByCategory.maintenance
                    );
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                          <span className="font-medium">¥{item.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${getBarWidth(item.value, maxValue)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* A币数据分析 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-8 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl text-white">🅰️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">A币数据分析</h2>
                  <p className="text-slate-600 dark:text-slate-400">发放趋势、持有分布、流通统计</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* A币发放趋势 */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>📈</span>
                    A币发放趋势 (近7日)
                  </h3>
                  <div className="space-y-4">
                    {/* 模拟近7日A币发放数据 */}
                    {[
                      { date: '09/04', distributed: 0, platformIncome: 0 },
                      { date: '09/05', distributed: 0, platformIncome: 0 },
                      { date: '09/06', distributed: 0.8, platformIncome: 2 },
                      { date: '09/07', distributed: 0, platformIncome: 0 },
                      { date: '09/08', distributed: 1.17, platformIncome: 2.925 },
                      { date: '09/09', distributed: 0.5, platformIncome: 1.25 },
                      { date: '09/10', distributed: 1.2, platformIncome: 3 }
                    ].map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{day.date}</span>
                          <span className="font-medium text-purple-600">发放: {day.distributed}A币</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div 
                            className="bg-purple-500 rounded-sm"
                            style={{ width: `${day.distributed > 0 ? (day.distributed / 1.2) * 100 : 0}%` }}
                            title={`发放: ${day.distributed}A币`}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          平台收入: ¥{day.platformIncome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* A币持有分布 */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>👥</span>
                    持有者分布
                  </h3>
                  <div className="space-y-4">
                    {[
                      { range: '1000+ A币', holders: 2, percentage: 15, color: 'bg-purple-600' },
                      { range: '500-999 A币', holders: 5, percentage: 25, color: 'bg-purple-500' },
                      { range: '100-499 A币', holders: 12, percentage: 35, color: 'bg-purple-400' },
                      { range: '10-99 A币', holders: 18, percentage: 20, color: 'bg-purple-300' },
                      { range: '1-9 A币', holders: 8, percentage: 5, color: 'bg-purple-200' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{item.range}</span>
                          <span className="font-medium">{item.holders}人 ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* A币月度统计 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  A币月度统计
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { month: '2024/07', distributed: 0, holders: 0, avgHolding: 0 },
                    { month: '2024/08', distributed: 0, holders: 0, avgHolding: 0 },
                    { month: '2024/09', distributed: 3.67, holders: 45, avgHolding: 0.08 },
                    { month: '2024/10', distributed: 12.5, holders: 68, avgHolding: 0.18 },
                    { month: '2024/11', distributed: 28.3, holders: 89, avgHolding: 0.32 },
                    { month: '2024/12', distributed: 45.2, holders: 112, avgHolding: 0.40 }
                  ].map((month, index) => (
                    <div key={index} className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{month.month.split('/')[1]}月</div>
                      <div className="space-y-1">
                        <div className="text-xs text-purple-600">发放量</div>
                        <div className="text-sm font-medium">{month.distributed}A币</div>
                        <div className="text-xs text-blue-600">持有者</div>
                        <div className="text-sm font-medium">{month.holders}人</div>
                        <div className="text-xs text-green-600">平均持有</div>
                        <div className="text-sm font-bold">{month.avgHolding}A币</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* A币年度总结 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span>🏆</span>
                  2024年度A币总结
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">89.67</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">累计发放 (A币)</div>
                    <div className="text-xs text-purple-500 mt-1">≈ ¥89.67</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">112</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">总持有者数</div>
                    <div className="text-xs text-blue-500 mt-1">较上月+23人</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">0.80</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">平均持有量 (A币)</div>
                    <div className="text-xs text-green-500 mt-1">持续增长</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">0.009%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">流通率</div>
                    <div className="text-xs text-orange-500 mt-1">89.67/1000000000</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">月度统计</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {fundPoolData.stats.monthlyStats.map((month, index) => (
                  <div key={index} className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{month.month}</div>
                    <div className="space-y-1">
                      <div className="text-xs text-green-600">收入</div>
                      <div className="text-sm font-medium">¥{month.income.toLocaleString()}</div>
                      <div className="text-xs text-red-600">支出</div>
                      <div className="text-sm font-medium">¥{month.expense.toLocaleString()}</div>
                      <div className="text-xs text-blue-600">净收入</div>
                      <div className="text-sm font-bold">¥{month.netIncome.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* O币市场标签 */}
        {activeTab === 'ocoin' && (
          <div className="space-y-6">
            <FundPoolOCoinMarket />
            
            {/* 快速操作链接 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                🎯 O币相关操作
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/computing-power"
                  className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <span className="text-2xl">💱</span>
                  <div>
                    <div className="font-medium text-orange-800 dark:text-orange-400">交易O币</div>
                    <div className="text-sm text-orange-600 dark:text-orange-500">前往个人中心买入或出售</div>
                  </div>
                </Link>
                
                <Link
                  to="/computing-dashboard"
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-400">算力中心</div>
                    <div className="text-sm text-blue-600 dark:text-blue-500">查看算力生态数据</div>
                  </div>
                </Link>
                
                <Link
                  to="/platform-management"
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <span className="text-2xl">🔐</span>
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-400">期权管理</div>
                    <div className="text-sm text-green-600 dark:text-green-500">前往平台管理系统</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* 资金池与O币关系说明 */}
            <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
              <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">💡 资金池与O币的关系</h4>
              <div className="text-xs text-orange-700 dark:text-orange-500 space-y-1">
                <p>• 资金池的净收入将用于O币分红，按持币比例分配给所有O币持有者</p>
                <p>• O币的交易手续费将进入资金池，增强平台整体资金实力</p>
                <p>• 资金池的健康状况直接影响O币的分红能力和市场价值</p>
                <p>• 通过资金池透明度提升O币投资者的信心和收益预期</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}