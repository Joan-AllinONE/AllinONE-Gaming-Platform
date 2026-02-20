import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import TestPage from "@/pages/TestPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GameCenter from "@/pages/GameCenter";
import Match3Game from "@/pages/Match3Game";
import ComputingDashboard from "@/pages/ComputingDashboard";
import ComputingTest from "@/pages/ComputingTest";
import GamePersonalCenter from "@/pages/GamePersonalCenter";
import Marketplace from "@/pages/Marketplace";
import OfficialStore from "@/pages/OfficialStore";
import GameStoreCenter from "@/pages/GameStoreCenter";
import GameStoreDetail from "@/pages/GameStoreDetail";
import ComputingPowerPageSimple from "@/pages/ComputingPowerPageSimple";
import TestAccounts from "@/pages/TestAccounts";
import FundPool from "@/pages/FundPool";
import FundPoolDemo from "@/pages/FundPoolDemo";
import ACoinSettlementTest from "@/pages/ACoinSettlementTest";
import ACoinCalculationTest from "@/pages/ACoinCalculationTest";
import BlogCenter from "@/pages/BlogCenter";
import BlogDetail from "@/pages/BlogDetail";
import BlogEditor from "@/pages/BlogEditor";
import PlatformManagement from "@/pages/PlatformManagement";
import PlatformManagementTest from "@/pages/PlatformManagementTest";
import About from "@/pages/About";
import CommunityRewards from "@/pages/CommunityRewards";
import OpenEconomy from "@/pages/OpenEconomy";
import TradingSystem from "@/pages/TradingSystem";
import { AuthProvider } from '@/contexts/authContext';
import { ComputingPowerProvider } from '@/contexts/ComputingPowerContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { BlogProvider } from '@/contexts/BlogContext';
import { PlatformManagementProvider } from '@/contexts/PlatformManagementContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NewDayIntegrationInit from '@/components/NewDayIntegrationInit';
import NewDayIntegrationTest from '@/pages/NewDayIntegrationTest';

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <ComputingPowerProvider>
        <UserDataProvider>
          <BlogProvider>
            <PlatformManagementProvider>
            {/* 自动初始化 New Day 集成 */}
            <NewDayIntegrationInit autoLogin={true} autoSyncInterval={30000} />
            <LanguageSwitcher />
            <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game-center" element={<GameCenter />} />
          <Route path="/game/match3" element={<Match3Game />} />
          <Route path="/computing-dashboard" element={<ComputingDashboard />} />
          <Route path="/computing-test" element={<ComputingTest />} />
          <Route path="/computing-power" element={<GamePersonalCenter />} />
          <Route path="/computing-power-simple" element={<ComputingPowerPageSimple />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/official-store" element={<OfficialStore />} />
          <Route path="/game-store" element={<GameStoreCenter />} />
          <Route path="/game-store/store/:storeId" element={<GameStoreDetail />} />
          <Route path="/fund-pool" element={<FundPool />} />
          <Route path="/fund-pool-demo" element={<FundPoolDemo />} />
          <Route path="/test-accounts" element={<TestAccounts />} />
          <Route path="/acoin-settlement-test" element={<ACoinSettlementTest />} />
          <Route path="/acoin-calculation-test" element={<ACoinCalculationTest />} />
          <Route path="/blog-center" element={<BlogCenter />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/blog/create" element={<BlogEditor />} />
          <Route path="/blog/edit/:id" element={<BlogEditor />} />
          <Route path="/platform-management" element={<PlatformManagement />} />
          <Route path="/platform-management-test" element={<PlatformManagementTest />} />
          <Route path="/about" element={<About />} />
          <Route path="/community-rewards" element={<CommunityRewards />} />
          <Route path="/open-economy" element={<OpenEconomy />} />
          <Route path="/trading-system" element={<TradingSystem />} />
          <Route path="/newday-integration-test" element={<NewDayIntegrationTest />} />
            </Routes>
            </PlatformManagementProvider>
          </BlogProvider>
        </UserDataProvider>
      </ComputingPowerProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
