/**
 * 综合钱包组件
 * 显示 New Day 和 AllinONE 的分别记录余额，支持 1:1 兑换
 */

import { useEffect, useState } from 'react';
import { currencyExchangeService } from '@/services/currencyExchangeService';
import { walletService } from '@/services/walletService';
import { ChevronDown, ChevronUp, Loader2, Wallet, ArrowRightLeft, Coins, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface WalletData {
  newDay: {
    gameCoins: number;
    cash: number;
    computingPower: number;
  };
  allinone: {
    gameCoins: number;
    newDayGameCoins: number;
    cash: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  consolidated: {
    gameCoins: number;
    newDayGameCoins: number;
    cash: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  gameCoinsSummary: {
    total: number;
    types: Array<{
      key: 'gameCoins' | 'newDayGameCoins';
      name: string;
      platform: string;
      icon: string;
      balance: number;
    }>;
    exchangeRates: {
      gameCoinsToNewDay: number;
      newDayToGameCoins: number;
    };
  };
}

export default function ConsolidatedWallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGameCoinsDropdown, setShowGameCoinsDropdown] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchangeDirection, setExchangeDirection] = useState<'toNewDay' | 'toAllinone'>('toNewDay');
  const [exchanging, setExchanging] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      // 并行获取余额和游戏币汇总
      const [consolidatedData, gameCoinsData] = await Promise.all([
        currencyExchangeService.getConsolidatedBalance(),
        walletService.getGameCoinsSummary()
      ]);
      
      setWalletData({
        ...consolidatedData,
        gameCoinsSummary: gameCoinsData
      });
      setError(null);
    } catch (err) {
      setError('获取余额失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    const amount = parseFloat(exchangeAmount);
    if (!amount || amount <= 0) {
      toast.error('请输入有效的兑换数量');
      return;
    }

    try {
      setExchanging(true);
      const fromType = exchangeDirection === 'toNewDay' ? 'gameCoins' : 'newDayGameCoins';
      const toType = exchangeDirection === 'toNewDay' ? 'newDayGameCoins' : 'gameCoins';
      
      const result = await walletService.exchangeGameCoins(fromType, toType, amount);
      
      if (result.success) {
        toast.success(result.message);
        setShowExchangeModal(false);
        setExchangeAmount('');
        fetchBalance();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('兑换失败');
      console.error(err);
    } finally {
      setExchanging(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // 每 30 秒自动刷新
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !walletData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !walletData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error || '加载失败'}</p>
        <button
          onClick={fetchBalance}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重试
        </button>
      </div>
    );
  }

  const { allinone, gameCoinsSummary } = walletData;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">游戏钱包</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AllinONE & New Day 分别记录
            </p>
          </div>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 游戏币总览 - 带下拉列表 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">游戏币总览</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{gameCoinsSummary.total.toLocaleString()}</span>
              <span className="text-lg opacity-80">币</span>
            </div>
          </div>
          <button
            onClick={() => setShowGameCoinsDropdown(!showGameCoinsDropdown)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            {showGameCoinsDropdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* 游戏币下拉明细 */}
        {showGameCoinsDropdown && (
          <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
            {gameCoinsSummary.types.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${type.icon === 'fa-gamepad' ? 'fa-gamepad' : 'fa-sun'} opacity-80`}></i>
                  <span className="text-sm opacity-90">{type.name}</span>
                </div>
                <span className="font-semibold">{type.balance.toLocaleString()} 币</span>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">兑换比例</span>
                <span>1 : {gameCoinsSummary.exchangeRates.gameCoinsToNewDay}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 兑换按钮 */}
      <button
        onClick={() => setShowExchangeModal(true)}
        className="w-full mb-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
      >
        <ArrowRightLeft className="w-4 h-4" />
        <span>游戏币兑换 (1:1)</span>
      </button>

      {/* 详细余额 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AllinONE 余额 */}
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">AllinONE</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">游戏币</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {allinone.gameCoins.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">A 币</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {allinone.aCoins.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">O 币</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {allinone.oCoins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* New Day 余额 */}
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">New Day</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">游戏币</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {allinone.newDayGameCoins.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">同步状态</span>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                已同步
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 消费说明 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">消费规则</h4>
        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>各平台优先使用自身游戏币</li>
          <li>余额不足时，可兑换后消费（1:1）</li>
          <li>New Day 新用户赠送 1000 游戏币已同步</li>
        </ol>
      </div>

      {/* 兑换弹窗 */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">游戏币兑换</h3>
            
            {/* 兑换方向选择 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExchangeDirection('toNewDay')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  exchangeDirection === 'toNewDay'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                AllinONE → New Day
              </button>
              <button
                onClick={() => setExchangeDirection('toAllinone')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  exchangeDirection === 'toAllinone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                New Day → AllinONE
              </button>
            </div>

            {/* 兑换比例 */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">兑换比例</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">1 : 1</p>
            </div>

            {/* 输入数量 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                兑换数量
              </label>
              <input
                type="number"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                placeholder="请输入数量"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-slate-500">
                可用: {exchangeDirection === 'toNewDay' 
                  ? allinone.gameCoins.toLocaleString() 
                  : allinone.newDayGameCoins.toLocaleString()} 币
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExchangeModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExchange}
                disabled={exchanging || !exchangeAmount}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {exchanging ? '兑换中...' : '确认兑换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
