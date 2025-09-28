import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-[60] px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm hidden md:flex items-center text-sm">
      <button
        onClick={() => setLang('zh')}
        className={cn(
          'px-1 hover:text-blue-600 dark:hover:text-blue-400',
          lang === 'zh' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
        )}
        aria-label="切换为中文"
      >
        中文
      </button>
      <span className="mx-2 text-slate-400">|</span>
      <button
        onClick={() => setLang('en')}
        className={cn(
          'px-1 hover:text-blue-600 dark:hover:text-blue-400',
          lang === 'en' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
        )}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;