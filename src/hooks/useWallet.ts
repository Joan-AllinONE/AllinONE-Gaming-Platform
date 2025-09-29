import { useState, useEffect, useCallback } from 'react';
import { walletService } from '@/services/walletService';
import { gameActivityService } from '@/services/gameActivityService';
import { WalletBalance, WalletStats, WalletTransaction } from '@/types/wallet';

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [walletBalance, walletStats, walletTransactions] = await Promise.all([
        walletService.getBalance(),
        walletService.getStats(),
        walletService.getTransactions(50)
      ]);

      setBalance(walletBalance);
      setStats(walletStats);
      setTransactions(walletTransactions);
    } catch (err) {
      console.error('刷新钱包数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加游戏奖励
  const addGameReward = useCallback(async (computingPower: number, gameCoins: number, gameId?: string) => {
    try {
      await walletService.addGameReward(computingPower, gameCoins, gameId);
      await refreshWalletData();
    } catch (err) {
      console.error('添加游戏奖励失败:', err);
      throw err;
    }
  }, [refreshWalletData]);

  // 进行购买
  const makePurchase = useCallback(async (
    amount: number, 
    currency: 'cash' | 'gameCoins', 
    description: string, 
    relatedId?: string
  ) => {
    try {
      await walletService.makePurchase(amount, currency, description, relatedId);
      await refreshWalletData();
      return true;
    } catch (err) {
      console.error('购买失败:', err);
      throw err;
    }
  }, [refreshWalletData]);

  // 充值现金
  const recharge = useCallback(async (amount: number, method: string = '支付宝') => {
    try {
      await walletService.recharge(amount, method);
      await refreshWalletData();
    } catch (err) {
      console.error('充值失败:', err);
      throw err;
    }
  }, [refreshWalletData]);

  // 货币兑换
  const exchangeCurrency = useCallback(async (
    fromCurrency: 'cash' | 'gameCoins' | 'computingPower',
    toCurrency: 'cash' | 'gameCoins' | 'computingPower',
    amount: number
  ) => {
    try {
      await walletService.exchangeCurrency(fromCurrency, toCurrency, amount);
      await refreshWalletData();
    } catch (err) {
      console.error('兑换失败:', err);
      throw err;
    }
  }, [refreshWalletData]);

  // 初始化数据
  useEffect(() => {
    refreshWalletData();
  }, [refreshWalletData]);

  // 监听钱包更新事件
  useEffect(() => {
    const handleWalletUpdate = () => {
      console.log('收到钱包更新事件，刷新数据...');
      refreshWalletData();
    };

    window.addEventListener('wallet-updated', handleWalletUpdate);
    return () => window.removeEventListener('wallet-updated', handleWalletUpdate);
  }, [refreshWalletData]);

  // 定期更新算力数据（每30秒）
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 静默更新余额，主要是为了同步算力数据
        const newBalance = await walletService.getBalance();
        setBalance(newBalance);
      } catch (err) {
        console.warn('定期更新钱包数据失败:', err);
      }
    }, 30000); // 30秒更新一次

    return () => clearInterval(interval);
  }, []);

  return {
    balance,
    stats,
    transactions,
    loading,
    error,
    refreshWalletData,
    addGameReward,
    makePurchase,
    recharge,
    exchangeCurrency,
    getTransactions: () => walletService.getTransactions()
  };
}