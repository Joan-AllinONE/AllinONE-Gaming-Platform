import { Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/authContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GameCenter from "@/pages/GameCenter";
import GamePlay from "@/pages/GamePlay";
import PublishingCenter from "@/pages/PublishingCenter";
import VoucherSystemPage from "@/pages/VoucherSystemPage";

// MVP v1.0 占位页面 - 将在后续批次构建
const GameBase = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">🏰 AllinONE</h1>
      <p className="text-slate-400">游戏化首页建设中...</p>
    </div>
  </div>
);

const PersonalCenter = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">👤 个人中心</h1>
      <p className="text-slate-400">个人中心重构中...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <LanguageSwitcher />
      <Routes>
        <Route path="/" element={<GameBase />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game-center" element={<GameCenter />} />
        <Route path="/game/:gameId" element={<GamePlay />} />
        <Route path="/voucher-system" element={<VoucherSystemPage />} />
        <Route path="/publishing-center" element={<PublishingCenter />} />
        <Route path="/personal-center" element={<PersonalCenter />} />
      </Routes>
    </AuthProvider>
    </LanguageProvider>
  );
}
