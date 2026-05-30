import { Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/authContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

import GameBase from "@/pages/GameBase";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GameCenter from "@/pages/GameCenter";
import GamePlay from "@/pages/GamePlay";
import PublishingCenter from "@/pages/PublishingCenter";
import VoucherSystemPage from "@/pages/VoucherSystemPage";
import PersonalCenter from "@/pages/PersonalCenter";

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
