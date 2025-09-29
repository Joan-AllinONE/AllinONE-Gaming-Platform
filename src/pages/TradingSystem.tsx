import { Link } from "react-router-dom";
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

export default function TradingSystem() {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      {/* Hero */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-4xl">
            <p className="text-amber-100 mb-3">{t(dict,'tradingSystem.hero.tag')}</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{t(dict,'tradingSystem.hero.title')}</h1>
            <p className="mt-4 text-lg text-amber-100">
              {t(dict,'tradingSystem.hero.desc')}
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/" className="px-5 py-2.5 bg-white text-amber-700 rounded-lg font-medium hover:bg-white/90">{t(dict,'tradingSystem.hero.backHome')}</Link>
              <a href="#overview" className="px-5 py-2.5 border border-white/70 rounded-lg font-medium hover:bg-white/10">{t(dict,'tradingSystem.hero.quickView')}</a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* 概览 */}
        <section id="overview" className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'tradingSystem.overview.title')}</h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t(dict,'tradingSystem.overview.p')}
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          {/* 官方商店 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3">
              <i className="fa-solid fa-bag-shopping"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t(dict,'tradingSystem.cards.officialStore.title')}</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t(dict,'tradingSystem.cards.officialStore.desc')}
            </p>
            <Link to="/official-store" className="inline-flex items-center text-amber-700 dark:text-amber-300 font-medium hover:underline">
              {t(dict,'tradingSystem.cards.officialStore.link')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
            </Link>
          </div>

          {/* 游戏电商 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <i className="fa-solid fa-store"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t(dict,'tradingSystem.cards.gameStore.title')}</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t(dict,'tradingSystem.cards.gameStore.desc')}
            </p>
            <Link to="/game-store" className="inline-flex items-center text-blue-700 dark:text-blue-300 font-medium hover:underline">
              {t(dict,'tradingSystem.cards.gameStore.link')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
            </Link>
          </div>

          {/* 交易市场 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
              <i className="fa-solid fa-arrows-rotate"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t(dict,'tradingSystem.cards.marketplace.title')}</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t(dict,'tradingSystem.cards.marketplace.desc')}
            </p>
            <Link to="/marketplace" className="inline-flex items-center text-emerald-700 dark:text-emerald-300 font-medium hover:underline">
              {t(dict,'tradingSystem.cards.marketplace.link')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
            </Link>
          </div>
        </section>

        {/* 说明 */}
        <section className="mt-10">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-6">
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'tradingSystem.note.p')}
            </p>
          </div>
        </section>
      </main>

      <footer className="py-10 text-center text-slate-500 text-sm">
        <p>{t(dict,'tradingSystem.footer.copyright')}</p>
      </footer>
    </div>
  );
}