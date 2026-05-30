/**
 * PersonalCenter - 个人中心（MVP v1.0）
 * 
 * 4 个 Tab：凭证资产 / 道具库存 / 购买记录 / 投票记录
 * 数据通过 SkillGateway 从 CloudBase/localStorage 获取
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/hooks/useWallet';

type Tab = 'vouchers' | 'inventory' | 'purchases' | 'votes';

// ==================== 子面板组件（内联） ====================

function WalletOverview() {
  const { wallet } = useWallet();
  const { currentUser } = useAuth();
  const { lang } = useLanguage();

  return (
    <div className="mx-5 mt-4 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg">
          {lang === 'zh' ? '👤 钱包概览' : '👤 Wallet Overview'}
        </h2>
        <span className="text-xs text-slate-400">{currentUser?.nickname || 'Player'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-700/40 rounded-xl">
          <div className="text-xs text-slate-400">💰 {lang === 'zh' ? '游戏币' : 'Game Coins'}</div>
          <div className="text-xl font-bold text-yellow-300 mt-1">
            {(wallet?.gameCoins || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-slate-700/40 rounded-xl">
          <div className="text-xs text-slate-400">⭐ A{lang === 'zh' ? '币' : 'Coins'}</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {(wallet?.aCoins || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-slate-700/40 rounded-xl">
          <div className="text-xs text-slate-400">🎫 {lang === 'zh' ? '即时凭证' : 'Instant Vouchers'}</div>
          <div className="text-xl font-bold text-purple-400 mt-1">
            {wallet?.instantVouchers || 0}
          </div>
        </div>
        <div className="p-3 bg-slate-700/40 rounded-xl">
          <div className="text-xs text-slate-400">⚖️ {lang === 'zh' ? '算法凭证' : 'Algo Vouchers'}</div>
          <div className="text-xl font-bold text-orange-400 mt-1">
            {wallet?.algorithmVouchers || 0}
          </div>
        </div>
      </div>
    </div>
  );
}

function VoucherAssetPanel() {
  const { isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const raw = localStorage.getItem('vouchers');
      if (raw) {
        const all = JSON.parse(raw);
        setVouchers(all.filter((v: any) => v.status === 'active').slice(0, 10));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [isAuthenticated]);

  if (loading) return <div className="text-slate-400 text-center py-10">加载中...</div>;
  if (vouchers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-5xl mb-3">🎫</div>
        <p>暂无凭证资产</p>
        <p className="text-xs mt-1">前往凭证工坊铸造你的第一张凭证</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-5">
      {vouchers.map((v: any) => (
        <div key={v.id} className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/40 flex items-center justify-between">
          <div>
            <div className="text-white font-medium text-sm">{v.metadata?.itemId || '凭证'}</div>
            <div className="text-xs text-slate-400 mt-0.5">{v.templateId?.slice(0, 8)}... | {new Date(v.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="text-right">
            <div className="text-purple-400 font-bold">{v.denomination} 面值</div>
            <div className="text-[10px] text-slate-500">{v.sourceType}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryPanel() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const raw = localStorage.getItem('inventory');
      if (raw) setItems(JSON.parse(raw).slice(0, 10));
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-5xl mb-3">🎒</div>
        <p>道具库存为空</p>
        <p className="text-xs mt-1">探索游戏世界获取道具</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-5">
      {items.map((item: any, i: number) => (
        <div key={i} className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <div className="text-white font-medium text-sm">{item.name || `道具 #${i + 1}`}</div>
          <div className="text-xs text-slate-400 mt-0.5">{item.gameId} · x{item.quantity || 1}</div>
        </div>
      ))}
    </div>
  );
}

function PurchaseHistoryPanel() {
  const { isAuthenticated, currentUser } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const raw = localStorage.getItem('purchases');
      if (raw) {
        const all = JSON.parse(raw);
        setPurchases(all.filter((p: any) => p.userId === (currentUser?.uid || currentUser?.id)).slice(0, 10));
      }
    } catch { /* ignore */ }
  }, [isAuthenticated, currentUser]);

  if (purchases.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-5xl mb-3">📋</div>
        <p>暂无购买记录</p>
        <p className="text-xs mt-1">在凭证工坊购买凭证后会显示在这里</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = { pending: 'text-yellow-400', redeemed: 'text-green-400', expired: 'text-red-400' };

  return (
    <div className="space-y-2.5 px-5">
      {purchases.map((p: any) => (
        <div key={p.id} className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/40 flex items-center justify-between">
          <div>
            <div className="text-white font-medium text-sm">{p.redeemCode || '购买记录'}</div>
            <div className="text-xs text-slate-400 mt-0.5">{new Date(p.paidAt).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-bold">{p.price} {p.currency}</div>
            <div className={`text-[10px] ${statusColors[p.status] || 'text-slate-500'}`}>{p.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== 主页面 ====================

export default function PersonalCenter() {
  const { isAuthenticated } = useAuth();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('vouchers');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'vouchers', label: lang === 'zh' ? '🎫 凭证资产' : '🎫 Vouchers' },
    { key: 'inventory', label: lang === 'zh' ? '🎒 道具库存' : '🎒 Inventory' },
    { key: 'purchases', label: lang === 'zh' ? '📋 购买记录' : '📋 Purchases' },
    { key: 'votes', label: lang === 'zh' ? '🗳️ 投票记录' : '🗳️ Votes' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-400">请先登录以查看个人中心</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pb-20">
      <WalletOverview />

      {/* Tab Bar */}
      <div className="flex mx-5 mt-4 bg-slate-800/40 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-purple-600/40 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'vouchers' && <VoucherAssetPanel />}
        {activeTab === 'inventory' && <InventoryPanel />}
        {activeTab === 'purchases' && <PurchaseHistoryPanel />}
        {activeTab === 'votes' && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-3">🗳️</div>
            <p>投票记录</p>
            <p className="text-xs mt-1">前往议事厅参与社区投票</p>
          </div>
        )}
      </div>
    </div>
  );
}
