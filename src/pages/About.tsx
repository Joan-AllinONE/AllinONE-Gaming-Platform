import { Link } from "react-router-dom";
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

export default function About() {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      {/* Hero */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-blue-100 mb-3">{t(dict,'about.hero.tag')}</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{t(dict,'about.hero.title')}</h1>
            <p className="mt-4 text-lg text-blue-100">
              {t(dict,'about.hero.desc')}
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/" className="px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-white/90">
                {t(dict,'about.hero.backHome')}
              </Link>
              <a href="#vision" className="px-5 py-2.5 border border-white/70 rounded-lg font-medium hover:bg-white/10">
                {t(dict,'about.hero.quickView')}
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* 快速导航 */}
        <nav className="mb-10">
          <ul className="flex flex-wrap gap-3 text-sm">
            <li><a href="#vision" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'about.nav.vision')}</a></li>
            <li><a href="#values" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'about.nav.values')}</a></li>
            <li><a href="#story" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'about.nav.story')}</a></li>
            <li><a href="#thanks" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'about.nav.thanks')}</a></li>
            <li><a href="#invite" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'about.nav.invite')}</a></li>
            <li><a href="#roadmap" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'about.nav.roadmap')}</a></li>
          </ul>
        </nav>

        {/* 愿景与定位 */}
        <section id="vision" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'about.sections.visionTitle')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              {t(dict,'about.sections.vision.p1')}
            </p>
            <p>
              {t(dict,'about.sections.vision.p2')}
            </p>
          </div>
        </section>

        {/* 核心理念 */}
        <section id="values" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'about.sections.valuesTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t(dict,'about.sections.ideology.buildOpen')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'about.sections.ideology.openDesc')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t(dict,'about.sections.ideology.shareRevenue')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'about.sections.ideology.shareDesc')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">{t(dict,'about.sections.ideology.coGovern')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'about.sections.ideology.governDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* 我们的故事（时间线） */}
        <section id="story" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{t(dict,'about.sections.storyTitle')}</h2>
          <div className="space-y-6">
            <div className="relative pl-8">
              <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-600"></div>
              <h3 className="font-semibold">{t(dict,'about.sections.story.h2020')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'about.sections.story.d2020')}
              </p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-600"></div>
              <h3 className="font-semibold">{t(dict,'about.sections.story.h2025Agent')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'about.sections.story.d2025Agent')}
              </p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-600"></div>
              <h3 className="font-semibold">{t(dict,'about.sections.story.h202508')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'about.sections.story.d202508')}
              </p>
            </div>
          </div>
        </section>

        {/* 感谢与致敬 */}
        <section id="thanks" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'about.sections.thanksTitle')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              {t(dict,'about.sections.thanks.desc')}
            </p>
          </div>
        </section>

        {/* 邀请共建 */}
        <section id="invite" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'about.sections.inviteTitle')}</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <p className="text-slate-600 dark:text-slate-300">
              {t(dict,'about.sections.invite.desc')}
            </p>
            <ul className="list-disc pl-6 mt-3 text-slate-600 dark:text-slate-300">
              <li>{t(dict,'about.sections.invite.list.players')}</li>
              <li>{t(dict,'about.sections.invite.list.developers')}</li>
              <li>{t(dict,'about.sections.invite.list.governors')}</li>
              <li>{t(dict,'about.sections.invite.list.merchants')}</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium">{t(dict,'about.sections.invite.registerNow')}</Link>
              <Link to="/blog-center" className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-medium">{t(dict,'about.sections.invite.toCommunity')}</Link>
            </div>
          </div>
        </section>

        {/* 路线图 */}
        <section id="roadmap" className="mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'about.sections.roadmapTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">{t(dict,'about.sections.roadmap.security')}</h3>
              <p className="text-slate-600 dark:text-slate-300">{t(dict,'about.sections.roadmap.securityDesc')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">{t(dict,'about.sections.roadmap.account')}</h3>
              <p className="text-slate-600 dark:text-slate-300">{t(dict,'about.sections.roadmap.accountDesc')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">{t(dict,'about.sections.roadmap.games')}</h3>
              <p className="text-slate-600 dark:text-slate-300">{t(dict,'about.sections.roadmap.gamesDesc')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer mini */}
      <footer className="py-10 text-center text-slate-500 text-sm">
        <p>{t(dict,'about.footer.copyright')}</p>
      </footer>
    </div>
  );
}