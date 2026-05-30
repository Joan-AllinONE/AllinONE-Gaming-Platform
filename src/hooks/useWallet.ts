/**
 * useWallet - MVP v1.0 精简钱包 Hook
 * 从 WalletSkill + localStorage 读取余额数据
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/authContext';

export interface WalletData {
  gameCoins: number;
  aCoins: number;
  instantVouchers: number;
  algorithmVouchers: number;
  lastUpdated: number;
}

export function useWallet() {
  const { currentUser, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWalletData = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      // Try wallet Skill first (CloudBase)
      try {
        const { skillGateway } = await import('@/skills/index');
        const result = await skillGateway.execute('wallet', 'getBalance', {}, {
          userId: currentUser?.uid || currentUser?.id || 'anonymous',
          sessionId: 'web',
        } as any);
        if (result.success && result.data) {
          setWallet({
            gameCoins: result.data.gameCoins || 0,
            aCoins: result.data.aCoins || 0,
            instantVouchers: result.data.instantVouchers || 0,
            algorithmVouchers: result.data.algorithmVouchers || 0,
            lastUpdated: result.data.lastUpdated || Date.now(),
          });
          setLoading(false);
          return;
        }
      } catch { /* Skill not ready yet, fallback */ }

      // Fallback: localStorage
      const saved = localStorage.getItem('wallet_v2');
      if (saved) {
        const data = JSON.parse(saved);
        const uid = currentUser?.uid || currentUser?.id || 'anonymous';
        const userWallet = data[uid];
        if (userWallet) {
          setWallet(userWallet);
          setLoading(false);
          return;
        }
      }
      // Default
      setWallet({ gameCoins: 0, aCoins: 0, instantVouchers: 0, algorithmVouchers: 0, lastUpdated: Date.now() });
    } catch (err) {
      console.warn('useWallet: refresh failed', err);
      setWallet({ gameCoins: 0, aCoins: 0, instantVouchers: 0, algorithmVouchers: 0, lastUpdated: Date.now() });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => { refreshWalletData(); }, [refreshWalletData]);

  // Listen for auth changes to refresh
  useEffect(() => {
    const handler = () => refreshWalletData();
    window.addEventListener('allinoneAuthChange', handler);
    return () => window.removeEventListener('allinoneAuthChange', handler);
  }, [refreshWalletData]);

  return { wallet, loading, refreshWalletData };
}
