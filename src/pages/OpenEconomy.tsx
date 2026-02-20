import { Link } from "react-router-dom";
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

export default function OpenEconomy() {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      {/* Hero */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-4xl">
            <p className="text-blue-100 mb-3">{t(dict,'openEconomy.hero.tag')}</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{t(dict,'openEconomy.hero.title')}</h1>
            <p className="mt-4 text-lg text-blue-100">
              {t(dict,'openEconomy.hero.desc')}
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/" className="px-5 py-2.5 bg-white text-indigo-700 rounded-lg font-medium hover:bg-white/90">{t(dict,'openEconomy.hero.backHome')}</Link>
              <a href="#overview" className="px-5 py-2.5 border border-white/70 rounded-lg font-medium hover:bg-white/10">{t(dict,'openEconomy.hero.quickView')}</a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* 快速导航 */}
        <nav className="mb-10">
          <ul className="flex flex-wrap gap-3 text-sm">
            <li><a href="#overview" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'openEconomy.nav.overview')}</a></li>
            <li><a href="#compute" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'openEconomy.nav.compute')}</a></li>
            <li><a href="#fund" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'openEconomy.nav.fund')}</a></li>
            <li><a href="#governance" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'openEconomy.nav.governance')}</a></li>
            <li><a href="#params" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'openEconomy.nav.params')}</a></li>
            <li><a href="#example" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'openEconomy.nav.example')}</a></li>
          </ul>
        </nav>

        {/* 概览 */}
        <section id="overview" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'openEconomy.overview.title')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              {t(dict,'openEconomy.overview.p')}
            </p>
          </div>
        </section>

        {/* 算力中心 */}
        <section id="compute" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'openEconomy.compute.title')}</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'openEconomy.compute.p')}
            </p>
          </div>
        </section>

        {/* 资金池 */}
        <section id="fund" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'openEconomy.fund.title')}</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'openEconomy.fund.p')}
            </p>
          </div>
        </section>

        {/* 平台管理系统 */}
        <section id="governance" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'openEconomy.governance.title')}</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'openEconomy.governance.p1')}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'openEconomy.governance.p2')}
            </p>
          </div>
        </section>

        {/* 关键参数 */}
        <section id="params" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'openEconomy.params.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5">
              <h3 className="font-semibold mb-2">{t(dict,'openEconomy.params.leftTitle')}</h3>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                <li>{t(dict,'openEconomy.params.leftBullets.0')}</li>
                <li>{t(dict,'openEconomy.params.leftBullets.1')}</li>
                <li>{t(dict,'openEconomy.params.leftBullets.2')}</li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5">
              <h3 className="font-semibold mb-2">{t(dict,'openEconomy.params.rightTitle')}</h3>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                <li>{t(dict,'openEconomy.params.rightBullets.0')}</li>
                <li>{t(dict,'openEconomy.params.rightBullets.1')}</li>
                <li>{t(dict,'openEconomy.params.rightBullets.2')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 示例 */}
        <section id="example" className="mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'openEconomy.example.title')}</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'openEconomy.example.p')}
            </p>
          </div>
        </section>
      </main>

      {/* Footer mini */}
      <footer className="py-10 text-center text-slate-500 text-sm">
        <p>{t(dict,'openEconomy.footer.copyright')}</p>
      </footer>
    </div>
  );
}