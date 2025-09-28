import React, { useState, useEffect } from 'react';
import { walletService } from '@/services/walletService';
import { WalletTransaction } from '@/types/wallet';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

interface CommissionDisplayProps {
  className?: string;
}

const CommissionDisplay: React.FC<CommissionDisplayProps> = ({ className = '' }) => {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const [commissionTransactions, setCommissionTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState({
    cash: 0,
    gameCoins: 0,
    computingPower: 0
  });

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      
      // 获取所有钱包交易记录
      const allTransactions = await walletService.getTransactions();
      
      // 筛选出佣金相关的交易
      const commissionTxs = allTransactions.filter(tx => 
        tx.description?.includes('平台佣金') || 
        tx.description?.includes('佣金')
      );

      setCommissionTransactions(commissionTxs);

      // 计算总佣金
      const totals = {
        cash: 0,
        gameCoins: 0,
        computingPower: 0
      };

      commissionTxs.forEach(tx => {
        if (tx.type === 'expense') { // 用户支付的佣金
          switch (tx.currency) {
            case 'cash':
              totals.cash += tx.amount;
              break;
            case 'gameCoins':
              totals.gameCoins += tx.amount;
              break;
            case 'computingPower':
              totals.computingPower += tx.amount;
              break;
          }
        }
      });

      setTotalCommission(totals);

    } catch (error) {
      console.error('加载佣金数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    switch (currency) {
      case 'cash': return `¥${amount.toFixed(2)}`;
      case 'gameCoins': return `${amount.toLocaleString()} 币`;
      case 'computingPower': return `${amount.toFixed(1)} 算力`;
      default: return amount.toString();
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'cash': return '💵';
      case 'gameCoins': return '🪙';
      case 'computingPower': return '⚡';
      default: return '💰';
    }
  };

  const extractOrderId = (description: string) => {
    const match = description.match(/订单(\w+)/);
    return match ? match[1] : '';
  };

  const getCommissionRate = (description: string) => {
    const match = description.match(/\((\d+\.?\d*)%\)/);
    return match ? match[1] + '%' : '';
  };

  if (loading) {
    return (
      <div className={`bg-slate-800/80 border border-orange-400/30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-orange-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400 mx-auto mb-2"></div>
            <div>{t(dict,'personalCenter.analysisSection.commission.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/80 border border-orange-400/30 rounded-lg p-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-orange-400 flex items-center">
          💰 {t(dict,'personalCenter.analysisSection.commission.title')}
        </h2>
        <button
          onClick={loadCommissionData}
          className="bg-orange-500/20 border border-orange-400/30 rounded-lg px-3 py-1 text-orange-400 hover:bg-orange-500/30 transition-all text-sm"
        >
          🔄 {t(dict,'personalCenter.analysisSection.commission.refresh')}
        </button>
      </div>

      {/* 佣金统计 */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-orange-400 mb-4">📊 {t(dict,'personalCenter.analysisSection.commission.myExpenseTitle')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">💵</div>
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.commission.labels.cash')}</div>
            <div className="text-lg font-bold text-green-400">
              ¥{totalCommission.cash.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🪙</div>
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.commission.labels.gameCoins')}</div>
            <div className="text-lg font-bold text-yellow-400">
              {totalCommission.gameCoins.toLocaleString()} 币
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.commission.labels.computingPower')}</div>
            <div className="text-lg font-bold text-purple-400">
              {totalCommission.computingPower.toFixed(1)} 算力
            </div>
          </div>
        </div>
      </div>

      {/* 佣金交易记录 */}
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-4">📋 {t(dict,'personalCenter.analysisSection.commission.recordsTitle')}</h3>
        
        {commissionTransactions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commissionTransactions.map((tx) => (
              <div key={tx.id} className="bg-slate-700/30 border border-slate-600/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getCurrencyIcon(tx.currency)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{tx.description}</span>
                        {getCommissionRate(tx.description) && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                            {getCommissionRate(tx.description)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 flex items-center gap-2">
                        <span>{t(dict,'personalCenter.analysisSection.commission.id')}: {tx.id}</span>
                        {extractOrderId(tx.description) && (
                          <span>• {t(dict,'personalCenter.analysisSection.commission.order')}: {extractOrderId(tx.description)}</span>
                        )}
                        <span>• {t(dict,'personalCenter.analysisSection.commission.time')}: {new Date(tx.timestamp).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">
                      -{formatCurrency(tx.amount, tx.currency)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t(dict,'personalCenter.analysisSection.commission.expenseTag')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">💰</div>
            <div>{t(dict,'personalCenter.analysisSection.commission.empty.title')}</div>
            <div className="text-sm mt-1">{t(dict,'personalCenter.analysisSection.commission.empty.hint')}</div>
          </div>
        )}
      </div>

      {/* 说明信息 */}
      <div className="mt-6 pt-4 border-t border-slate-600/30">
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
          <h4 className="font-bold text-blue-400 mb-2">💡 {t(dict,'personalCenter.analysisSection.commission.infoTitle')}</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>{t(dict,'personalCenter.analysisSection.commission.notes.gameStore')}</li>
            <li>{t(dict,'personalCenter.analysisSection.commission.notes.marketplace')}</li>
            <li>{t(dict,'personalCenter.analysisSection.commission.notes.officialStore')}</li>
            <li>{t(dict,'personalCenter.analysisSection.commission.notes.personalHint')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommissionDisplay;