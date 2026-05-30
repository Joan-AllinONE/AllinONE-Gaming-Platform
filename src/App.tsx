import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GameCenter from "@/pages/GameCenter";
import Match3Game from "@/pages/Match3Game";
import ComputingDashboard from "@/pages/ComputingDashboard";
import ComputingTest from "@/pages/ComputingTest";
import GamePersonalCenter from "@/pages/GamePersonalCenter";
import ComputingPowerPageSimple from "@/pages/ComputingPowerPageSimple";
import PlatformManagement from "@/pages/PlatformManagement";
import About from "@/pages/About";
import CommunityRewards from "@/pages/CommunityRewards";
import OpenEconomy from "@/pages/OpenEconomy";
import TradingSystem from "@/pages/TradingSystem";
import { AuthProvider } from '@/contexts/authContext';
import { ComputingPowerProvider } from '@/contexts/ComputingPowerContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { PlatformManagementProvider } from '@/contexts/PlatformManagementContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NewDayIntegrationInit from '@/components/NewDayIntegrationInit';
import VoteNotifications from '@/components/voucher-system/VoteNotifications';
import PublishingCenter from '@/pages/PublishingCenter';
import GamePlay from '@/pages/GamePlay';
import VoucherSystemPage from '@/pages/VoucherSystemPage';

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <ComputingPowerProvider>
        <UserDataProvider>
            <PlatformManagementProvider>
            {/* 自动初始化 New Day 集成 */}
            <NewDayIntegrationInit autoLogin={true} autoSyncInterval={30000} />
            {/* 全局投票通知提示 */}
            <VoteNotifications />
            <LanguageSwitcher />
            <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game-center" element={<GameCenter />} />
          <Route path="/game/match3" element={<Match3Game />} />
          <Route path="/computing-dashboard" element={<ComputingDashboard />} />
          <Route path="/computing-test" element={<ComputingTest />} />
          <Route path="/computing-power" element={<GamePersonalCenter />} />
          <Route path="/computing-power-simple" element={<ComputingPowerPageSimple />} />
          <Route path="/platform-management" element={<PlatformManagement />} />
          <Route path="/about" element={<About />} />
          <Route path="/community-rewards" element={<CommunityRewards />} />
          <Route path="/open-economy" element={<OpenEconomy />} />
          <Route path="/trading-system" element={<TradingSystem />} />
          <Route path="/publishing-center" element={<PublishingCenter />} />
          <Route path="/game/:gameId" element={<GamePlay />} />
          <Route path="/voucher-system" element={<VoucherSystemPage />} />
            </Routes>
            </PlatformManagementProvider>
        </UserDataProvider>
      </ComputingPowerProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
