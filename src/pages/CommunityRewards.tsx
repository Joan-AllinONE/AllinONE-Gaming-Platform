import { Link } from "react-router-dom";
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

export default function CommunityRewards() {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      {/* Hero */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-blue-100 mb-3">{t(dict,'communityRewards.hero.tag')}</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{t(dict,'communityRewards.hero.title')}</h1>
            <p className="mt-4 text-lg text-blue-100">
              {t(dict,'communityRewards.hero.desc')}
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/" className="px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-white/90">{t(dict,'communityRewards.hero.backHome')}</Link>
              <a href="#overview" className="px-5 py-2.5 border border-white/70 rounded-lg font-medium hover:bg-white/10">{t(dict,'communityRewards.hero.quickView')}</a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* 快速导航 */}
        <nav className="mb-10">
          <ul className="flex flex-wrap gap-3 text-sm">
            <li><a href="#overview" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'communityRewards.nav.overview')}</a></li>
            <li><a href="#acoin" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'communityRewards.nav.acoin')}</a></li>
            <li><a href="#ocoin" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'communityRewards.nav.ocoin')}</a></li>
            <li><a href="#example" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'communityRewards.nav.example')}</a></li>
            <li><a href="#others" className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700">{t(dict,'communityRewards.nav.others')}</a></li>
          </ul>
        </nav>

        {/* 概览 */}
        <section id="overview" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'communityRewards.overview.title')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              {t(dict,'communityRewards.overview.p')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <i className="fa-solid fa-coins"></i>
              </div>
              <h3 className="font-semibold mb-1">{t(dict,'communityRewards.overview.cards.acoinTitle')}</h3>
              <p className="text-slate-600 dark:text-slate-300">{t(dict,'communityRewards.overview.cards.acoinDesc')}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <h3 className="font-semibold mb-1">{t(dict,'communityRewards.overview.cards.ocoinTitle')}</h3>
              <p className="text-slate-600 dark:text-slate-300">{t(dict,'communityRewards.overview.cards.ocoinDesc')}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
                <i className="fa-solid fa-gamepad"></i>
              </div>
              <h3 className="font-semibold mb-1">{t(dict,'communityRewards.overview.cards.powerTitle')}</h3>
              <p className="text-slate-600 dark:text-slate-300">{t(dict,'communityRewards.overview.cards.powerDesc')}</p>
            </div>
          </div>
        </section>

        {/* A币 */}
        <section id="acoin" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'communityRewards.acoin.title')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ul>
              <li>{t(dict,'communityRewards.acoin.bullets.0')}</li>
              <li>{t(dict,'communityRewards.acoin.bullets.1')}</li>
              <li>{t(dict,'communityRewards.acoin.bullets.2')}</li>
              <li>{t(dict,'communityRewards.acoin.bullets.3')}</li>
            </ul>
          </div>
        </section>

        {/* O币 */}
        <section id="ocoin" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'communityRewards.ocoin.title')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              {t(dict,'communityRewards.ocoin.p')}
            </p>
            <ul>
              <li>{t(dict,'communityRewards.ocoin.bullets.0')}</li>
              <li>{t(dict,'communityRewards.ocoin.bullets.1')}</li>
              <li>{t(dict,'communityRewards.ocoin.bullets.2')}</li>
              <li>{t(dict,'communityRewards.ocoin.bullets.3')}</li>
            </ul>
          </div>
        </section>

        {/* 示例计算 */}
        <section id="example" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'communityRewards.example.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* A币日结示例 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-indigo-200/50 dark:border-indigo-900/30">
              <h3 className="font-semibold mb-3">{t(dict,'communityRewards.example.aDailyTitle')}</h3>
              <div className="text-slate-600 dark:text-slate-300 space-y-2">
                <p className="font-medium">{t(dict,'communityRewards.example.assumptions')}</p>
                <ul className="list-disc pl-5">
                  <li>{t(dict,'communityRewards.example.assumptionsBullets.0')}</li>
                  <li>{t(dict,'communityRewards.example.assumptionsBullets.1')}</li>
                  <li>{t(dict,'communityRewards.example.assumptionsBullets.2')}</li>
                  <li>{t(dict,'communityRewards.example.assumptionsBullets.3')}</li>
                </ul>
                <hr className="my-3 border-slate-200 dark:border-slate-700" />
                <p className="font-medium">{t(dict,'communityRewards.example.calc')}</p>
                <ol className="list-decimal pl-5">
                  <li>{t(dict,'communityRewards.example.calcSteps.0')}</li>
                  <li>{t(dict,'communityRewards.example.calcSteps.1')}</li>
                  <li>{t(dict,'communityRewards.example.calcSteps.2')}</li>
                </ol>
                <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                  {t(dict,'communityRewards.example.result')}
                </div>
              </div>
            </div>

            {/* 绩效包示例（O币/分红） */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-3">{t(dict,'communityRewards.example.performanceTitle')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t(dict,'communityRewards.example.performanceP')}
              </p>
              <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <p>{t(dict,'communityRewards.example.formula')}</p>
                <p className="mt-2">{t(dict,'communityRewards.example.exampleNote')}</p>
                <p>{t(dict,'communityRewards.example.cashLine')}</p>
                <p>{t(dict,'communityRewards.example.bonusLine')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 其他奖励 */}
        <section id="others" className="mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'communityRewards.others.title')}</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              {t(dict,'communityRewards.others.p')}
            </p>
          </div>
        </section>

        {/* 获取奖励步骤图 */}
        <section id="steps" className="mt-10 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t(dict,'communityRewards.steps.title')}</h2>
          <div className="space-y-4">
            {/* Row 1: 1 -> 2 -> 3 */}
            <div className="grid md:grid-cols-5 gap-4 items-stretch">
              {/* Step 1 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[160px]">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2 text-sm">1</div>
                <h3 className="font-semibold">{t(dict,'communityRewards.steps.s1Title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex-1">{t(dict,'communityRewards.steps.s1Desc')}</p>
                <div className="mt-2 text-[12px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 inline-block">{t(dict,'communityRewards.steps.s1Badge')}</div>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <i className="fa-solid fa-arrow-right text-slate-300"></i>
              </div>
              {/* Step 2 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[160px]">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-2 text-sm">2</div>
                <h3 className="font-semibold">{t(dict,'communityRewards.steps.s2Title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex-1">{t(dict,'communityRewards.steps.s2Desc')}</p>
                <div className="mt-2 text-[12px] px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 inline-block">{t(dict,'communityRewards.steps.s2Badge')}</div>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <i className="fa-solid fa-arrow-right text-slate-300"></i>
              </div>
              {/* Step 3 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[160px]">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mb-2 text-sm">3</div>
                <h3 className="font-semibold">{t(dict,'communityRewards.steps.s3Title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex-1">{t(dict,'communityRewards.steps.s3Desc')}</p>
                <div className="mt-2 text-[12px] px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 inline-block">{t(dict,'communityRewards.steps.s3Badge')}</div>
              </div>
            </div>

            {/* Row 2: 4 -> 5 -> 6 */}
            <div className="grid md:grid-cols-5 gap-4 items-stretch">
              {/* Step 4 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[160px]">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold mb-2 text-sm">4</div>
                <h3 className="font-semibold">{t(dict,'communityRewards.steps.s4Title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex-1">{t(dict,'communityRewards.steps.s4Desc')}</p>
                <div className="mt-2 text-[12px] px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 inline-block">{t(dict,'communityRewards.steps.s4Badge')}</div>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <i className="fa-solid fa-arrow-right text-slate-300"></i>
              </div>
              {/* Step 5 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[160px]">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mb-2 text-sm">5</div>
                <h3 className="font-semibold">{t(dict,'communityRewards.steps.s5Title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex-1">{t(dict,'communityRewards.steps.s5Desc')}</p>
                <div className="mt-2 text-[12px] px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 inline-block">{t(dict,'communityRewards.steps.s5Badge')}</div>
              </div>
              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <i className="fa-solid fa-arrow-right text-slate-300"></i>
              </div>
              {/* Step 6 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col min-h-[160px]">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold mb-2 text-sm">6</div>
                <h3 className="font-semibold">{t(dict,'communityRewards.steps.s6Title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex-1">{t(dict,'communityRewards.steps.s6Desc')}</p>
                <div className="mt-2 text-[12px] px-2 py-1 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 inline-block">{t(dict,'communityRewards.steps.s6Badge')}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            {t(dict,'communityRewards.steps.hint')}
          </div>
        </section>
      </main>

      {/* Footer mini */}
      <footer className="py-10 text-center text-slate-500 text-sm">
        <p>{t(dict,'communityRewards.footer.copyright')}</p>
      </footer>
    </div>
  );
}