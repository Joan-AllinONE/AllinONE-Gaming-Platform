/**
 * GameBase - 游戏化首页（MVP v1.0）
 * 展示玩家的个人基地，包含建筑卡片、HUD状态栏、事件横幅和底部导航
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/authContext';
import { useWallet } from '@/hooks/useWallet';

// ==================== 内联组件（简化版，后续可拆分为独立文件） ====================

function HUD() {
  const { currentUser } = useAuth();
  const { wallet } = useWallet();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700/50">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💰</span>
          <span className="font-bold text-yellow-300">{wallet?.gameCoins?.toLocaleString() || '0'}</span>
          <span className="text-xs text-slate-400">金币</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🎫</span>
          <span className="font-bold text-purple-400">{wallet?.instantVouchers || 0}</span>
          <span className="text-xs text-slate-400">凭证</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⚖️</span>
          <span className="font-bold text-cyan-400">{(wallet?.aCoins || 0).toFixed(1)}</span>
          <span className="text-xs text-slate-400">权重</span>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-sm text-slate-300">{currentUser?.nickname || '冒险者'}</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
          {(currentUser?.nickname || 'A')[0].toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function BuildingCard({ icon, label, description, badge, route }: {
  icon: string; label: string; description: string; badge?: number; route: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -6 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(route)}
      className="relative flex flex-col items-center justify-center p-5 bg-slate-800/60 hover:bg-slate-700/60 rounded-2xl border border-slate-700/40 hover:border-purple-500/30 transition-all duration-200 min-h-[130px]"
    >
      <div className="text-4xl mb-2.5">{icon}</div>
      <div className="font-bold text-white text-sm">{label}</div>
      <div className="text-xs text-slate-400 mt-1">{description}</div>
      {badge && badge > 0 ? (
        <span className="absolute top-2.5 right-2.5 min-w-[22px] h-[22px] bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold px-1.5">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </motion.button>
  );
}

function EventBanner() {
  const navigate = useNavigate();
  const events = [
    { id: '1', message: '🆕 欢迎来到 AllinONE 游戏平台！探索你的基地吧', action: null, timestamp: Date.now() },
    { id: '2', message: '💡 前往「凭证工坊」铸造你的第一张游戏凭证', action: { label: '去看看', route: '/voucher-system' }, timestamp: Date.now() },
    { id: '3', message: '🎮 进入「游戏世界」发现新游戏并获得奖励', action: { label: '探索', route: '/game-center' }, timestamp: Date.now() },
  ] as const;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % events.length), 4000);
    return () => clearInterval(t);
  }, []);
  const ev = events[idx];
  return (
    <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-5 mt-3 p-3.5 bg-gradient-to-r from-purple-900/30 to-cyan-900/20 rounded-xl border border-purple-500/20 flex items-center justify-between">
      <span className="text-sm text-slate-200">{ev.message}</span>
      {ev.action && <button onClick={() => navigate(ev.action!.route)} className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap ml-3">{ev.action.label} →</button>}
    </motion.div>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const navs = [
    { icon: '🏰', label: '基地', route: '/' },
    { icon: '🎒', label: '背包', route: '/personal-center' },
    { icon: '🗳️', label: '议事厅', route: '/voucher-system' },
    { icon: '⚙️', label: '设置', route: '/personal-center' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-3 bg-slate-800/90 backdrop-blur border-t border-slate-700/50 z-50">
      {navs.map(n => (
        <button key={n.route} onClick={() => navigate(n.route)}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-purple-400 transition-colors">
          <span className="text-xl">{n.icon}</span>
          <span className="text-[10px]">{n.label}</span>
        </button>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

import { useState, useEffect } from 'react';

export default function GameBase() {
  const buildings = [
    { icon: '🔨', label: '凭证工坊', description: '铸造与管理凭证', route: '/voucher-system' },
    { icon: '🏛️', label: '议事厅', description: '社区投票与治理', route: '/voucher-system' },
    { icon: '🛒', label: '道具商店', description: '浏览与购买道具', route: '/voucher-system' },
    { icon: '🎒', label: '背包', description: '查看我的凭证', route: '/personal-center' },
    { icon: '📊', label: '数据中心', description: '统计与交易记录', route: '/personal-center' },
    { icon: '🎮', label: '游戏世界', description: '探索游戏', route: '/game-center' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pb-20">
      <HUD />
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          🏰 我的基地
        </h1>
        <p className="text-sm text-slate-400 mt-1">欢迎回来，冒险者</p>
      </div>
      <div className="grid grid-cols-3 gap-3 px-5">
        {buildings.map(b => (
          <BuildingCard key={b.label} {...b} />
        ))}
      </div>
      <EventBanner />
      <BottomNav />
    </div>
  );
}
