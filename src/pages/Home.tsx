import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { lang, setLang } = useLanguage();

  const dict = {
    zh: {
      brand: 'AllinONE',
      nav: {
        gameCenter: '游戏中心',
        computingDashboard: '算力中心',
        blogCenter: '博客中心',
        officialStore: '官方商店',
        gameStore: '游戏电商',
        marketplace: '交易市场',
        fundPool: '资金池',
        personalCenter: '个人中心',
      },
      auth: { login: '登录', register: '立即注册' },
      hero: {
        badge: '全新上线 - 合规游戏收益平台',
        title1: '玩游戏，',
        title2: '轻松获取收益',
        desc: 'AllinONE将游戏乐趣与收益机会完美结合，通过合规的虚拟经济系统，让每位玩家都能在娱乐中获得实实在在的回报。',
        ctaStart: '立即开始',
        demo: '观看演示',
        activePlayers: '活跃玩家',
        todayIncome: '今日收益',
      },
      features: {
        title: 'AllinONE核心玩法',
        desc: '经典的游戏化收益模式，合规化改造，公开透明的经济，开放的管理系统，为您带来有趣的体验',
        rewardsTitle: '多维化社区奖励系统',
        rewardsDesc: '通过A币、O币、算力与游戏币等多维奖励，面向玩家、开发者与治理者，打造“共建共享共治”的Play2Earn生态。',
        economyTitle: '经济公开系统和开放式管理系统',
        economyDesc: '公开的财务系统（算力中心与资金池）+ 开放的社区管理（平台管理系统），以数据为基础进行治理与分配，保障透明与共治。',
        gamesTitle: '多元化小游戏矩阵',
        gamesDesc: '多款有趣的小游戏任您选择，每款游戏都有独特的玩法和算力奖励机制。',
        tradingTitle: '多样的游戏商品交易系统',
        tradingDesc: '除了玩游戏，玩家还可在平台交易道具：官方商店（平台运营）、游戏电商（游戏方运营）、交易市场（玩家自由买卖），为你提供全方位的自由交易环境。',
        centerTitle: '一站式个人中心',
        centerDesc: '个人中心是玩家数据的汇集地，也是参与平台的重要入口。我们将交易、游戏、社交、数据分析与管理融为一体，为你一站式解决游戏、交易、交流与管理需求。',
        blogTitle: '玩家博客中心',
        blogDesc: '分享游戏经验和心得，与其他玩家交流互动，共同成长进步。',
        learnMore: '了解更多',
        viewBlog: '查看博客',
      },
      how: {
        title: '如何开始使用AllinONE',
        desc: '简单四步，开启您的游戏收益之旅',
        step1Title: '注册并完成认证',
        step1Desc: '创建账户并完成实名认证，确保合规参与',
        step2Title: '选择喜欢的游戏',
        step2Desc: '从多样化的小游戏矩阵中选择您感兴趣的游戏',
        step3Title: '提升算力获取收益',
        step3Desc: '通过游戏表现提升算力，自动获得平台奖励',
        step4Title: '兑换合规奖励',
        step4Desc: '将虚拟积分按合规流程兑换为实际奖励',
      },
      cta: {
        title: '准备好开始您的游戏收益之旅了吗？',
        desc: '加入AllinONE，体验合规、有趣、有回报的游戏平台',
        register: '立即注册，免费开始',
        more: '了解更多',
      },
      about: {
        title: '关于我们',
        desc: 'AllinONE 是集游戏开发、道具交易与社区激励于一体的开放式游戏平台，致力于打造“共建、共享、共治，互通、互惠、互利”的 Play2Earn 游戏经济生态。',
        ideaTitle: '我们的理念',
        ideaDesc: 'AllinONE 不止是游戏。平台以开源共建、收益共享、社区共治为核心——无论是玩家、开发者、治理者还是商家，都能在这里获得可持续的价值回报。',
        startTitle: '起点与突破',
        startDesc: '从 2020 年的萌芽到 2025 年 AI Agent 的飞跃，在 codebuddy、qoder、coze、deepseek 等 AI 工具的助力下，我们完成了从想法到原型的关键跃迁。',
        thanksTitle: '感谢与邀请',
        thanksDesc: '感谢 AI 社区与 rollercoin 的启发。诚邀感兴趣的伙伴加入：看看、玩玩、留言、提建议、提交贡献，甚至批评也欢迎，一起把“开放、公开、共赢”的理念落到实处。',
        visionTitle: '展望',
        visionDesc: '接下来我们将持续完善安全、账号与游戏功能，推进合规与生态建设，让每个人都能在平台上赚钱、消费、社交与娱乐。',
      },
      footer: {
        slogan: '合规的游戏收益平台，让娱乐更有价值',
        contact: '联系我们：',
        platformMgmt: '平台管理',
        columns: {
          platformTitle: '平台',
          supportTitle: '支持',
          legalTitle: '法律',
        },
        links: {
          about: '关于我们',
          gameCenter: '游戏中心',
          earning: '收益模式',
          faq: '常见问题',
          help: '帮助中心',
          contact: '联系我们',
          feedback: '用户反馈',
          terms: '服务条款',
          privacy: '隐私政策',
          antiAddiction: '防沉迷政策',
          compliance: '合规声明',
        },
        copyrightLine: '© 2025 AllinONE. 保留所有权利。本平台已通过国家相关部门合规审核。'
      }
    },
    en: {
      brand: 'AllinONE',
      nav: {
        gameCenter: 'Game Center',
        computingDashboard: 'Computing Dashboard',
        blogCenter: 'Blog Center',
        officialStore: 'Official Store',
        gameStore: 'Game E-commerce',
        marketplace: 'Marketplace',
        fundPool: 'Fund Pool',
        personalCenter: 'Personal Center',
      },
      auth: { login: 'Log In', register: 'Sign Up' },
      hero: {
        badge: 'Newly Launched - Compliant Gaming Revenue Platform',
        title1: 'Play Games,',
        title2: 'Earn with Ease',
        desc: 'AllinONE combines gaming fun with earning opportunities through a compliant virtual economy, enabling every player to gain real returns while having fun.',
        ctaStart: 'Get Started',
        demo: 'Watch Demo',
        activePlayers: 'Active Players',
        todayIncome: 'Today\'s Income',
      },
      features: {
        title: 'AllinONE Core Gameplay',
        desc: 'Classic gamified earning, compliance-oriented, transparent economy, and open management deliver an engaging experience.',
        rewardsTitle: 'Multi-dimensional Community Rewards',
        rewardsDesc: 'Rewards with A-Coin, O-Coin, computing power, and game coins for players, developers, and governors, building a co-create, co-share, and co-govern Play2Earn ecosystem.',
        economyTitle: 'Transparent Economy & Open Management',
        economyDesc: 'Open financial system (Computing Center & Fund Pool) + open community management (Platform Management) ensure transparency and co-governance based on data.',
        gamesTitle: 'Diverse Mini-Game Matrix',
        gamesDesc: 'Multiple fun mini-games to choose from, each with unique gameplay and computing power rewards.',
        tradingTitle: 'Diverse Game Item Trading',
        tradingDesc: 'Beyond gaming, trade items via Official Store (platform), Game E-commerce (game studios), and Marketplace (player-to-player) to enjoy a full-spectrum trading environment.',
        centerTitle: 'One-stop Personal Center',
        centerDesc: 'The personal center is the hub of player data and the main entry to participate. We integrate transactions, gaming, social, analytics, and management into one.',
        blogTitle: 'Player Blog Center',
        blogDesc: 'Share gaming experiences, interact with others, and grow together.',
        learnMore: 'Learn More',
        viewBlog: 'View Blog',
      },
      how: {
        title: 'How to Start with AllinONE',
        desc: 'Four simple steps to begin your earning journey',
        step1Title: 'Register & Verify',
        step1Desc: 'Create an account and complete real-name verification for compliance',
        step2Title: 'Choose Your Games',
        step2Desc: 'Pick from a diverse matrix of mini-games',
        step3Title: 'Increase Computing Power',
        step3Desc: 'Boost computing power through performance to earn rewards',
        step4Title: 'Redeem Compliant Rewards',
        step4Desc: 'Redeem virtual points into rewards following compliance procedures',
      },
      cta: {
        title: 'Ready to start your gaming revenue journey?',
        desc: 'Join AllinONE to experience a compliant, fun, and rewarding platform',
        register: 'Sign Up for Free',
        more: 'Learn More',
      },
      about: {
        title: 'About Us',
        desc: 'AllinONE is an open gaming platform integrating game development, item trading, and community incentives, building a Play2Earn economy of co-creation, sharing, governance, interconnectivity, mutual benefit, and win-win.',
        ideaTitle: 'Our Philosophy',
        ideaDesc: 'AllinONE is more than games. With open co-construction, shared revenue, and community governance, everyone—players, developers, governors, and merchants—can gain sustainable value.',
        startTitle: 'Origin & Breakthrough',
        startDesc: 'From the 2020 inception to the 2025 AI Agent leap, aided by codebuddy, qoder, coze, and deepseek, we transitioned from ideas to a working prototype.',
        thanksTitle: 'Thanks & Invitation',
        thanksDesc: 'Thanks to the AI community and rollercoin for inspiration. We invite you to join: explore, play, comment, suggest, contribute—even critique—to implement openness, transparency, and win-win.',
        visionTitle: 'Vision',
        visionDesc: 'We will keep improving security, accounts, and game features, advancing compliance and ecosystem so everyone can earn, spend, socialize, and entertain on the platform.',
      },
      footer: {
        slogan: 'A compliant gaming revenue platform making entertainment more valuable',
        contact: 'Contact us: ',
        platformMgmt: 'Platform Management',
        columns: {
          platformTitle: 'Platform',
          supportTitle: 'Support',
          legalTitle: 'Legal',
        },
        links: {
          about: 'About Us',
          gameCenter: 'Game Center',
          earning: 'Earning Models',
          faq: 'FAQ',
          help: 'Help Center',
          contact: 'Contact Us',
          feedback: 'User Feedback',
          terms: 'Terms of Service',
          privacy: 'Privacy Policy',
          antiAddiction: 'Anti-Addiction Policy',
          compliance: 'Compliance Statement',
        },
        copyrightLine: '© 2025 AllinONE. All rights reserved. This platform has passed compliance review by relevant authorities.'
      }
    }
  } as const;

  const t = (key: string): string => {
    const [scope, subKey, subSub] = key.split('.');
    const section = (dict as any)[lang][scope];
    if (section && subKey && subSub !== undefined) return section[subKey]?.[subSub] ?? key;
    if (section && subKey) return section[subKey] ?? key;
    return (dict as any)[lang][key] ?? key;
  };
  
  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      {/* Navigation Bar */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-3" 
          : "bg-transparent py-5"
      )}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AllinONE</span>
          </div>
          
            <nav className="hidden md:flex items-center gap-8">
            <Link to="/game-center" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.gameCenter')}</Link>
            <Link to="/computing-dashboard" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.computingDashboard')}</Link>
            <Link to="/blog-center" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.blogCenter')}</Link>
            <Link to="/official-store" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.officialStore')}</Link>
            <Link to="/game-store" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.gameStore')}</Link>
            <Link to="/marketplace" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.marketplace')}</Link>
            <Link to="/fund-pool" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.fundPool')}</Link>
            <Link to="/computing-power" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.personalCenter')}</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
            >
              {t('auth.register')}
            </Link>
            <div className="ml-2 pl-3 border-l border-slate-200 dark:border-slate-700 text-sm">
              <button
                onClick={() => setLang('zh')}
                className={cn("hover:text-blue-600 dark:hover:text-blue-400", lang === 'zh' ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200")}
              >
                中文
              </button>
              <span className="mx-2 text-slate-400">|</span>
              <button
                onClick={() => setLang('en')}
                className={cn("hover:text-blue-600 dark:hover:text-blue-400", lang === 'en' ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200")}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-2">
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                {t('hero.title1')}<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{t('hero.title2')}</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-lg">
                {t('hero.desc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/register"
                  className="px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5 text-center"
                >
                  {t('hero.ctaStart')}
                </Link>
                <button className="px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <i className="fa-solid fa-play-circle"></i>
                  {t('hero.demo')}
                </button>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={`https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a`} 
                      alt="用户头像" 
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800"
                    />
                  ))}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">10,000+</span> 玩家已加入
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20dashboard%2C%20interface%20showing%20gaming%20stats%2C%20virtual%20currency%2C%20modern%20UI%2C%20blue%20theme&sign=a160cbc38262558651adba1662dee0ce" 
                  alt="AllinONE游戏平台界面" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg z-20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <i className="fa-solid fa-arrow-up text-xl"></i>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{t('hero.todayIncome')}</div>
                    <div className="text-lg font-bold">¥32.58</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg z-20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <i className="fa-solid fa-users text-xl"></i>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{t('hero.activePlayers')}</div>
                    <div className="text-lg font-bold">2,384</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">{t('features.title')}</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {t('features.desc')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 双代币经济 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
                  <i className="fa-solid fa-gift text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{t('features.rewardsTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {t('features.rewardsDesc')}
                </p>
                <Link to="/community-rewards" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                  {t('features.learnMore')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </Link>
              </div>
              
              {/* 经济公开系统和开放式管理系统 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
                  <i className="fa-solid fa-scale-balanced text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{t('features.economyTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {t('features.economyDesc')}
                </p>
                <Link to="/open-economy" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                  {t('features.learnMore')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </Link>
              </div>
              
              {/* 小游戏矩阵 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5">
                  <i className="fa-solid fa-gamepad text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{t('features.gamesTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {t('features.gamesDesc')}
                </p>
                <Link to="/game-center" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                  {t('features.learnMore')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </Link>
              </div>

              {/* 多样化游戏商品交易系统 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
                  <i className="fa-solid fa-store text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{t('features.tradingTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {t('features.tradingDesc')}
                </p>
                <Link to="/trading-system" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                  {t('features.learnMore')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </Link>
              </div>

              {/* 一站式个人中心 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-5">
                  <i className="fa-solid fa-user text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{t('features.centerTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {t('features.centerDesc')}
                </p>
                <Link to="/computing-power" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                  {t('features.learnMore')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </Link>
              </div>

              {/* 博客中心 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-5">
                  <i className="fa-solid fa-blog text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{t('features.blogTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {t('features.blogDesc')}
                </p>
                <Link to="/blog-center" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                  {t('features.viewBlog')} <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">{t('how.title')}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {t('how.desc')}
            </p>
          </div>
          
          <div className="relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 dark:bg-blue-800 -translate-y-1/2 z-0"></div>
            
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {/* 步骤1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg">1</div>
                <h3 className="text-xl font-bold mb-2">{t('how.step1Title')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('how.step1Desc')}
                </p>
              </div>
              
              {/* 步骤2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg">2</div>
                <h3 className="text-xl font-bold mb-2">{t('how.step2Title')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('how.step2Desc')}
                </p>
              </div>
              
              {/* 步骤3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg">3</div>
                <h3 className="text-xl font-bold mb-2">{t('how.step3Title')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('how.step3Desc')}
                </p>
              </div>
              
              {/* 步骤4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg">4</div>
                <h3 className="text-xl font-bold mb-2">{t('how.step4Title')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('how.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('cta.title')}</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              {t('cta.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 text-lg font-semibold bg-white text-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {t('cta.register')}
              </Link>
              <a href="#features" className="px-8 py-4 text-lg font-semibold bg-transparent border-2 border-white rounded-xl hover:bg-white/10 transition-all">
                {t('cta.more')}
              </a>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-white dark:bg-slate-900/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">{t('about.title')}</h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                {t('about.desc')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{t('about.ideaTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('about.ideaDesc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{t('about.startTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('about.startDesc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{t('about.thanksTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('about.thanksDesc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{t('about.visionTitle')}</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {t('about.visionDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-xl font-bold text-white">AllinONE</span>
              </div>
              <p className="text-slate-400 mb-4">
                {t('footer.slogan')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-weibo"></i>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-wechat"></i>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-qq"></i>
                </a>
              </div>
              <p className="mt-4 text-slate-400">
                {t('footer.contact')}
                <a href="mailto:allinone_2014@hotmail.com" className="underline hover:text-white">
                  allinone_2014@hotmail.com
                </a>
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">{t('footer.columns.platformTitle')}</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.about')}</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.gameCenter')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.earning')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.faq')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">{t('footer.columns.supportTitle')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.help')}</a></li>
                <li><a href="mailto:allinone_2014@hotmail.com" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.contact')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.feedback')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">{t('footer.columns.legalTitle')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.terms')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.privacy')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.antiAddiction')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.links.compliance')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>{t('footer.copyrightLine')}</p>
            <div className="mt-4">
              <Link 
                to="/platform-management" 
                className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm"
              >
                <i className="fa-solid fa-cog mr-2"></i>
                {t('footer.platformMgmt')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
);
}