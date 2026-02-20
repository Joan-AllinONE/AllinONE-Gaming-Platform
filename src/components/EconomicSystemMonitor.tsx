import React, { useEffect, useState } from 'react';
import { WalletBalance } from '@/types/wallet';
import { walletService } from '@/services/walletService';
import oCoinService from '@/services/oCoinService';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

interface EconomicSystemMonitorProps {
  wallet: WalletBalance | null;
  oCoinBalance?: number; // 可选：用于统一显示的 O币余额
}

const EconomicSystemMonitor: React.FC<EconomicSystemMonitorProps> = ({ wallet, oCoinBalance }) => {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const currentAssets = wallet;

  const [totals, setTotals] = useState<{ incomeRMB: number; expenseRMB: number }>({
    incomeRMB: 0,
    expenseRMB: 0
  });
  const [loadingTotals, setLoadingTotals] = useState(false);

  // 计算交易总收入/总支出（折算人民币）
  useEffect(() => {
    const calcTotals = async () => {
      try {
        setLoadingTotals(true);
        // 安全获取 O 币市场数据，避免 .catch 链式在非 Promise 情况下报错
        const marketPromise = (async () => {
          try {
            const data = await oCoinService.getOCoinMarketData();
            return data;
          } catch {
            return { currentPrice: 1 } as any;
          }
        })();

        const [transactions, rates, oMarket, stats] = await Promise.all([
          walletService.getTransactions(1000), // 尽量多取
          walletService.getExchangeRatesAsync(),
          marketPromise,
          walletService.getStats().catch(() => null)
        ]);

        const aCoinRate = 1; // A币与人民币1:1
        const oPrice = oMarket?.currentPrice ?? 1;

        const toRMB = (currency: any, amount: number) => {
          const c = String(currency).toLowerCase();
          if (c === 'cash' || c === 'cny') return amount;
          if (c === 'gamecoins' || c === 'gamecoin') return amount * rates.gameCoinsToRMB;
          if (c === 'computingpower' || c === 'computing') return amount * rates.computingPowerToRMB;
          if (c === 'acoins' || c === 'acoin') return amount * aCoinRate;
          if (c === 'ocoins' || c === 'ocoin') return amount * oPrice;
          return 0;
        };

        let income = 0;
        let expense = 0;

        for (const tx of transactions) {
          const rmb = toRMB(tx.currency as any, tx.amount);
          if (tx.type === 'income') income += rmb;
          else expense += rmb;
        }

        // 优先使用累计统计（更贴近“总”）
        if (stats) {
          const sumIncomeRMB =
            stats.totalIncome.cash +
            stats.totalIncome.gameCoins * rates.gameCoinsToRMB +
            stats.totalIncome.computingPower * rates.computingPowerToRMB +
            stats.totalIncome.aCoins * aCoinRate +
            stats.totalIncome.oCoins * oPrice;

          const sumExpenseRMB =
            stats.totalExpense.cash +
            stats.totalExpense.gameCoins * rates.gameCoinsToRMB +
            stats.totalExpense.computingPower * rates.computingPowerToRMB +
            stats.totalExpense.aCoins * aCoinRate +
            stats.totalExpense.oCoins * oPrice;

          income = Math.max(income, sumIncomeRMB);
          expense = Math.max(expense, sumExpenseRMB);
        }

        setTotals({ incomeRMB: income, expenseRMB: expense });
      } catch (err) {
        console.error('统计总收入/总支出失败:', err);
      } finally {
        setLoadingTotals(false);
      }
    };

    calcTotals();

    // 监听钱包更新事件，确保实时刷新
    const handleUpdate = () => calcTotals();
    window.addEventListener('wallet-updated', handleUpdate as any);
    return () => window.removeEventListener('wallet-updated', handleUpdate as any);
  }, [wallet?.lastUpdated]);

  if (!currentAssets) {
    return (
      <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-purple-400 mb-4">📈 {t(dict,'personalCenter.analysisSection.monitor.title')}</h3>
        <div className="text-center py-10 text-slate-400">{t(dict,'personalCenter.analysisSection.monitor.loadingWallet')}</div>
      </div>
    );
  }

  return (
    <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-6">
      <h3 className="text-lg font-bold text-purple-400 mb-4">📈 {t(dict,'personalCenter.analysisSection.monitor.title')}</h3>
      
      <div>
        <h4 className="font-bold text-cyan-400 mb-3">{t(dict,'personalCenter.analysisSection.currentAssets')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.monitor.currencies.cash')}</div>
            <div className="text-lg font-bold text-green-400 mt-1 truncate">
              ¥{currentAssets.cash.toFixed(2)}
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-3 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.monitor.currencies.gameCoins')}</div>
            <div className="text-lg font-bold text-yellow-400 mt-1 truncate">
              {(currentAssets.gameCoins + (currentAssets.newDayGameCoins || 0)).toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-3 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.monitor.currencies.computingPower')}</div>
            <div className="text-lg font-bold text-purple-400 mt-1 truncate">
              {currentAssets.computingPower.toFixed(1)}
            </div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-lg p-3 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.monitor.currencies.aCoins')}</div>
            <div className="text-lg font-bold text-indigo-400 mt-1 truncate">
              {(currentAssets.aCoins || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-400/20 rounded-lg p-3 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.monitor.currencies.oCoins')}</div>
            <div className="text-lg font-bold text-orange-400 mt-1 truncate">
              {((typeof oCoinBalance === 'number' ? oCoinBalance : (currentAssets.oCoins || 0))).toFixed(2)}
            </div>
          </div>
        </div>

        {/* 新增：总收入 / 总支出（折算人民币） */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.totalIncomeRMB')}</div>
            <div className="text-xl font-bold text-green-400 mt-1">
              {loadingTotals ? t(dict,'personalCenter.analysisSection.monitor.calculating') : `¥${totals.incomeRMB.toFixed(2)}`}
            </div>
          </div>
          <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-4 text-center">
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.totalExpenseRMB')}</div>
            <div className="text-xl font-bold text-red-400 mt-1">
              {loadingTotals ? t(dict,'personalCenter.analysisSection.monitor.calculating') : `¥${totals.expenseRMB.toFixed(2)}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicSystemMonitor;