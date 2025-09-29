export type Lang = 'zh' | 'en';

type Dict = Record<string, any>;

export const getDict = (lang: Lang): Dict => {
  const common = {
    brand: 'AllinONE',
    nav: {
      home: lang === 'zh' ? '首页' : 'Home',
      gameCenter: lang === 'zh' ? '游戏中心' : 'Game Center',
      blogCenter: lang === 'zh' ? '博客中心' : 'Blog Center',
      personalCenter: lang === 'zh' ? '个人中心' : 'Personal Center',
      backHome: lang === 'zh' ? '返回首页' : 'Back to Home',
      quickView: lang === 'zh' ? '快速浏览' : 'Quick View',
    },
    buttons: {
      learnMore: lang === 'zh' ? '了解更多' : 'Learn More',
      createBlog: lang === 'zh' ? '写博客' : 'Write Blog',
      registerNow: lang === 'zh' ? '立即注册' : 'Sign Up',
      login: lang === 'zh' ? '登录' : 'Log In',
      loadingLogin: lang === 'zh' ? '登录中...' : 'Logging in...',
      creatingAccount: lang === 'zh' ? '创建账户中...' : 'Creating account...',
      buyNow: lang === 'zh' ? '立即购买' : 'Buy Now',
      clearFilters: lang === 'zh' ? '清除筛选' : 'Clear Filters',
      prevPage: lang === 'zh' ? '上一页' : 'Previous',
      nextPage: lang === 'zh' ? '下一页' : 'Next',
      cancel: lang === 'zh' ? '取消' : 'Cancel',
    },
  };

  const login = { /* existing content omitted for brevity */ 
    title: lang === 'zh' ? '欢迎回来' : 'Welcome Back',
    subtitle: lang === 'zh' ? '登录您的账户，继续游戏收益之旅' : 'Log in to continue your gaming revenue journey',
    labels: { username: lang === 'zh' ? '用户名' : 'Username', password: lang === 'zh' ? '密码' : 'Password', rememberMe: lang === 'zh' ? '记住我' : 'Remember me', forgotPassword: lang === 'zh' ? '忘记密码？' : 'Forgot password?' },
    placeholders: { username: lang === 'zh' ? '请输入用户名' : 'Enter username', password: lang === 'zh' ? '请输入密码' : 'Enter password' },
    noAccountPrompt: lang === 'zh' ? '还没有账户？' : "Don't have an account?",
    registerLink: lang === 'zh' ? '立即注册' : 'Sign Up',
    test: {
      title: lang === 'zh' ? '测试账号' : 'Test Accounts',
      show: lang === 'zh' ? '显示测试账号' : 'Show test accounts',
      hide: lang === 'zh' ? '隐藏测试账号' : 'Hide test accounts',
      clickTip: lang === 'zh' ? '点击任意账号自动填入登录信息' : 'Click any account to auto-fill credentials',
      password: lang === 'zh' ? '密码' : 'Password',
      infoTitle: lang === 'zh' ? '测试提示' : 'Test Tips',
      infoDesc: lang === 'zh' ? '使用测试账号可以体验不同等级的游戏数据和算力收益' : 'Use test accounts to experience different levels and rewards',
      viewList: lang === 'zh' ? '查看完整测试账号列表' : 'View full test accounts list',
    },
  };

  const register = { /* existing content omitted for brevity */ 
    title: lang === 'zh' ? '创建账户' : 'Create Account',
    subtitle: lang === 'zh' ? '加入我们的游戏收益平台，开始您的旅程' : 'Join our gaming revenue platform and start your journey',
    labels: { username: lang === 'zh' ? '用户名' : 'Username', email: lang === 'zh' ? '邮箱地址' : 'Email Address', password: lang === 'zh' ? '密码' : 'Password', confirmPassword: lang === 'zh' ? '确认密码' : 'Confirm Password', agreePrefix: lang === 'zh' ? '我同意AllinONE的' : 'I agree to AllinONE ', terms: lang === 'zh' ? '服务条款' : 'Terms of Service', and: lang === 'zh' ? '和' : 'and', privacy: lang === 'zh' ? '隐私政策' : 'Privacy Policy' },
    placeholders: { username: lang === 'zh' ? '请创建用户名' : 'Create a username', email: 'your.email@example.com', password: lang === 'zh' ? '请创建密码' : 'Create a password', confirmPassword: lang === 'zh' ? '请再次输入密码' : 'Re-enter password' },
    buttons: { submit: lang === 'zh' ? '创建账户' : 'Create Account', loading: common.buttons.creatingAccount },
    haveAccountPrompt: lang === 'zh' ? '已有账户？' : 'Already have an account?',
    loginLink: common.buttons.login,
  };

  const about = { /* existing content omitted for brevity */ 
    hero: { tag: lang === 'zh' ? '关于 AllinONE' : 'About AllinONE', title: lang === 'zh' ? '关于我们' : 'About Us', desc: lang === 'zh' ? 'AllinONE 是集游戏开发、道具交易与社区激励于一体的开放式游戏平台，致力于打造“共建、共享、共治，互通、互惠、互利”的 Play2Earn 游戏经济生态。' : 'AllinONE is an open gaming platform integrating game development, item trading, and community incentives, building a Play2Earn economy of co-creation, sharing, governance, interconnectivity, and mutual benefit.', backHome: common.nav.backHome, quickView: common.nav.quickView },
    nav: { vision: lang === 'zh' ? '愿景与定位' : 'Vision & Positioning', values: lang === 'zh' ? '核心理念' : 'Core Values', story: lang === 'zh' ? '我们的故事' : 'Our Story', thanks: lang === 'zh' ? '感谢与致敬' : 'Thanks & Tribute', invite: lang === 'zh' ? '加入我们' : 'Join Us', roadmap: lang === 'zh' ? '下一步计划' : 'Next Steps' },
    sections: {
      visionTitle: lang === 'zh' ? '愿景与定位' : 'Vision & Positioning',
      valuesTitle: lang === 'zh' ? '核心理念' : 'Core Values',
      storyTitle: lang === 'zh' ? '我们的故事' : 'Our Story',
      thanksTitle: lang === 'zh' ? '感谢与致敬' : 'Thanks & Tribute',
      inviteTitle: lang === 'zh' ? '加入我们' : 'Join Us',
      roadmapTitle: lang === 'zh' ? '下一步计划' : 'Next Steps',
      vision: {
        p1: lang === 'zh' ? 'AllinONE 不只是一个游戏平台。我们希望在完全合规的前提下，构建人人可参与的游戏经济生态：玩家可以边玩边赚，开发者可以开源共建并共享收益，社区可以以透明方式参与治理与激励，商家可以以合规的方式开展道具交易与增值服务。' : 'AllinONE is more than a gaming platform. We aim to build a fully compliant gaming economy open to everyone: players can play-to-earn, developers can co-build in open source and share revenue, the community can participate in transparent governance and incentives, and merchants can operate item trading and value-added services in a compliant way.',
        p2: lang === 'zh' ? '我们相信，开放、公开、共赢的生态，能让娱乐更有价值，让创造更被看见。' : 'We believe that an open, transparent, and win-win ecosystem makes entertainment more valuable and creation more visible.',
      },
      ideology: {
        buildOpen: lang === 'zh' ? '开源共建' : 'Open Co-construction',
        shareRevenue: lang === 'zh' ? '收益共享' : 'Shared Revenue',
        coGovern: lang === 'zh' ? '社区共治' : 'Community Co-governance',
        openDesc: lang === 'zh' ? '倡导以开源为纽带，降低参与门槛，推动社区驱动的产品迭代。' : 'Advocate open source as a bridge to lower barriers and drive community-led iteration.',
        shareDesc: lang === 'zh' ? '在合规框架下，让玩家、开发者、治理者与商家共享生态增长红利。' : 'Within a compliant framework, enable players, developers, governors, and merchants to share growth dividends.',
        governDesc: lang === 'zh' ? '以公开透明为原则，推动社区投票、参数治理与规则共识。' : 'Promote community voting, parameter governance, and rule consensus based on openness and transparency.',
      },
      story: {
        h2020: lang === 'zh' ? '2020 · 想法萌芽' : '2020 · Idea Emergence',
        d2020: lang === 'zh' ? '比特币与区块链的兴起带来新的可能性，AllinONE 的雏形在脑海中出现。彼时不懂技术、没有团队与资金，理想被迫搁置。' : 'The rise of Bitcoin and blockchain brought new possibilities. The prototype of AllinONE emerged, but without tech skills, team, or funding, the dream was shelved.',
        h2025Agent: lang === 'zh' ? '2025 · AI Agent 爆发' : '2025 · AI Agent Boom',
        d2025Agent: lang === 'zh' ? '抱着试一试的心态做出第一批小游戏。虽然拙朴，却是质的突破：看到作品能够运行，带来了继续前进的信心。' : 'We built the first batch of mini-games with a trial mindset. Though simple, it was a qualitative leap—seeing them run gave confidence to move forward.',
        h202508: lang === 'zh' ? '2025/08 · 工具加速落地' : '2025/08 · Tools Accelerate Delivery',
        d202508: lang === 'zh' ? 'codebuddy 与 qoder 出现后，想法迅速转化为可用原型。阶段性产物在不到一个月内成型，平台框架与核心功能初具规模。' : 'With tools like codebuddy and qoder, ideas quickly turned into usable prototypes. Within a month, the platform framework and core features took shape.',
      },
      thanks: { desc: lang === 'zh' ? '感谢 codebuddy、qoder、coze、deepseek 等 AI 工作者与公司提供的强大能力，也感谢 rollercoin 带来的启发。没有这些工具与灵感，就没有今天的 AllinONE。' : 'Thanks to AI practitioners and companies such as codebuddy, qoder, coze, and deepseek for powerful capabilities, and to rollercoin for inspiration. Without these tools and ideas, AllinONE wouldn’t exist.' },
      invite: {
        desc: lang === 'zh' ? '我们真诚邀请对 AllinONE 感兴趣、志同道合的伙伴加入：看看、玩玩、留言、提建议、提交贡献，甚至批评也欢迎。' : 'We sincerely invite like-minded partners interested in AllinONE to join: explore, play, comment, suggest, contribute—even critique is welcome.',
        list: {
          players: lang === 'zh' ? '玩家：体验游戏与收益模式，提出改进意见' : 'Players: experience games and earning models, suggest improvements',
          developers: lang === 'zh' ? '开发者：参与开源仓库与应用开发，共享收益' : 'Developers: contribute to open-source repos and apps, share revenue',
          governors: lang === 'zh' ? '治理者：参与投票与参数治理，完善生态规则' : 'Governors: take part in voting and parameter governance, refine rules',
          merchants: lang === 'zh' ? '商家：合规开展道具与增值服务，探索新模式' : 'Merchants: operate items and value-added services compliantly, explore new models',
        },
        registerNow: common.buttons.registerNow,
        toCommunity: lang === 'zh' ? '去社区交流' : 'Go to Community',
      },
      roadmap: {
        security: lang === 'zh' ? '平台安全' : 'Platform Security',
        account: lang === 'zh' ? '账户与身份' : 'Accounts & Identity',
        games: lang === 'zh' ? '游戏与生态' : 'Games & Ecosystem',
        securityDesc: lang === 'zh' ? '持续加强风控与合规模块，保障资产与数据安全。' : 'Enhance risk control and compliance to ensure asset and data security.',
        accountDesc: lang === 'zh' ? '完善账户设置、认证流程与隐私保护。' : 'Improve account settings, verification, and privacy protection.',
        gamesDesc: lang === 'zh' ? '丰富小游戏矩阵，优化收益模式与社区激励机制。' : 'Enrich mini-games, optimize earning models and community incentives.',
      },
    },
    footer: { copyright: '© 2025 AllinONE' },
  };

  const blog = { /* existing content omitted for brevity */ 
    header: { home: common.nav.home, gameCenter: common.nav.gameCenter, blogCenter: common.nav.blogCenter, personalCenter: common.nav.personalCenter, createBlog: common.buttons.createBlog },
    sidebar: {
      title: lang === 'zh' ? '博客中心' : 'Blog Center',
      desc: lang === 'zh' ? '欢迎来到AllinONE博客中心，这里有玩家分享的游戏经验、攻略和平台使用心得。' : 'Welcome to the AllinONE Blog Center with shared experiences, tips, and platform insights.',
      searchPlaceholder: lang === 'zh' ? '搜索博客...' : 'Search blogs...',
      categories: lang === 'zh' ? '分类' : 'Categories',
      allCategories: lang === 'zh' ? '全部分类' : 'All Categories',
      popularTags: lang === 'zh' ? '热门标签' : 'Popular Tags',
      stats: lang === 'zh' ? '统计' : 'Stats',
      totalPosts: lang === 'zh' ? '文章总数' : 'Total Posts',
      totalViews: lang === 'zh' ? '总浏览量' : 'Total Views',
      totalLikes: lang === 'zh' ? '总点赞数' : 'Total Likes',
      totalComments: lang === 'zh' ? '总评论数' : 'Total Comments',
    },
    filterBar: { category: lang === 'zh' ? '分类' : 'Category', tag: lang === 'zh' ? '标签' : 'Tag', search: lang === 'zh' ? '搜索' : 'Search', clear: common.buttons.clearFilters },
    empty: {
      title: lang === 'zh' ? '暂无博客' : 'No Blogs Yet',
      notFound: lang === 'zh' ? '没有找到符合条件的博客文章' : 'No blog posts matched your filters',
      encourage: lang === 'zh' ? '博客中心还没有内容，成为第一个发布博客的用户吧！' : 'Be the first to publish a blog!',
      writeBlog: common.buttons.createBlog,
    },
    pagination: { prev: common.buttons.prevPage, next: common.buttons.nextPage },
  };

  const store = { /* existing content omitted for brevity */ 
    header: { title: lang === 'zh' ? '官方商店' : 'Official Store', subtitle: lang === 'zh' ? '平台官方商品，安全可靠有保障' : 'Official platform goods, safe and reliable', personalCenter: common.nav.personalCenter, backHome: common.nav.backHome },
    featured: { title: lang === 'zh' ? '精选推荐' : 'Featured', badge: lang === 'zh' ? '推荐' : 'Featured', buyNow: common.buttons.buyNow },
    categories: { all: lang === 'zh' ? '全部商品' : 'All Items' },
    search: { placeholder: lang === 'zh' ? '搜索商品...' : 'Search items...' },
    rewards: { title: lang === 'zh' ? '获得奖励:' : 'Rewards:' },
    purchase: {
      buyWith: (methodName: string) => (lang === 'zh' ? `${methodName}购买` : `Buy with ${methodName}`),
      stock: lang === 'zh' ? '库存' : 'Stock',
      dailyLimit: lang === 'zh' ? '每日限购' : 'Daily Limit',
      userLimit: lang === 'zh' ? '用户限购' : 'User Limit',
      deadline: lang === 'zh' ? '截止' : 'Ends',
      empty: lang === 'zh' ? '没有找到符合条件的商品' : 'No matching items found',
    },
  };

  const communityRewards = {
    hero: {
      tag: 'AllinONE · Community Rewards',
      title: lang === 'zh' ? '多维化社区奖励系统' : 'Multi-dimensional Community Rewards System',
      desc:
        lang === 'zh'
          ? '社区奖励是 AllinONE 实现 Play2Earn 的重要方式，目标是让每一位参与者获得经济回报并共同构建多样化的经济生态。'
          : 'Community rewards are a key way AllinONE realizes Play2Earn, aiming for every participant to gain economic returns and co-build a diversified economic ecosystem.',
      backHome: common.nav.backHome,
      quickView: common.nav.quickView,
    },
    nav: {
      overview: lang === 'zh' ? '整体概览' : 'Overview',
      acoin: lang === 'zh' ? 'A币' : 'A Coin',
      ocoin: lang === 'zh' ? 'O币' : 'O Coin',
      example: lang === 'zh' ? '示例计算' : 'Examples',
      others: lang === 'zh' ? '其他奖励' : 'Other Rewards',
    },
    overview: {
      title: lang === 'zh' ? '社区奖励系统概览' : 'Overview of Community Rewards',
      p:
        lang === 'zh'
          ? '社区奖励包含：每日结算发放的 A币；对平台贡献者提供的平台管理奖励（现金分红与具期权属性的 O币）；面向普通玩家的算力、游戏币等奖励。 目前由平台统一制定规则并执行发放，未来将通过社区治理与技术升级，进一步扩大奖励的范围、体量与多样性。'
          : 'Community rewards include: daily-settled A Coin; platform management rewards for contributors (cash dividends and option-like O Coin); and rewards such as computing power and in-game currency for regular players. Rules are currently set and executed uniformly by the platform; in the future, community governance and tech upgrades will expand the scope, scale, and diversity of rewards.',
      cards: {
        acoinTitle: lang === 'zh' ? 'A币 · 平台通用币' : 'A Coin · Platform Utility Coin',
        acoinDesc:
          lang === 'zh' ? '按日结算、用于替代现金奖励发放，锚定平台收入转化。' : 'Settled daily, used in place of cash rewards, anchored to platform revenue conversion.',
        ocoinTitle: lang === 'zh' ? 'O币 · 期权与价值' : 'O Coin · Options & Value',
        ocoinDesc:
          lang === 'zh' ? '面向开发者/管理者/投资者，具价值波动与分红权属性。' : 'For developers/managers/investors, with value fluctuation and dividend rights.',
        powerTitle: lang === 'zh' ? '算力与游戏币' : 'Computing Power & Game Coins',
        powerDesc:
          lang === 'zh' ? '零门槛参与，通过游戏表现与活跃度获取日常奖励。' : 'Zero barrier participation; earn daily rewards via gameplay and activity.',
      },
    },
    acoin: {
      title: lang === 'zh' ? 'A币（平台通用币）' : 'A Coin (Platform Utility)',
      bullets: [
        lang === 'zh' ? '总量固定：10 亿；1 A币 = 1 RMB；最小单位 0.01。' : 'Fixed supply: 1 billion; 1 A Coin = 1 RMB; minimum unit 0.01.',
        lang === 'zh' ? '主要用途：用于替代现金进行结算与发放。' : 'Primary use: replace cash for settlement and distribution.',
        lang === 'zh' ? '价值来源：平台收入按比例（当前为 40%）转化为 A币并按玩家贡献度每日分发。' : 'Value source: a portion of platform revenue (currently 40%) is converted to A Coin and distributed daily based on player contribution.',
        lang === 'zh' ? '额度逻辑：额度本身不具备价值，收入转化为 A币发放后才产生价值。' : 'Quota logic: quota itself has no value; value arises when revenue is converted to A Coin and issued.',
      ],
    },
    ocoin: {
      title: lang === 'zh' ? 'O币（期权型代币）' : 'O Coin (Option-like Token)',
      p:
        lang === 'zh'
          ? '平台收入的其余部分（当前为 60%）扣除成本后形成工资与分红资金池，由平台管理者与玩家社区代表共同治理。除获得 A币收益外，贡献者还可获得分红权与 O币（合称“绩效包”）。'
          : 'The remaining platform income (currently 60%), after costs, forms payroll and dividend pools governed jointly by platform managers and community representatives. In addition to A Coin, contributors receive dividend rights and O Coin (collectively the “performance package”).',
      bullets: [
        lang === 'zh' ? '定位：代表平台价值/市值的期权型代币，具备价值波动与分红权。' : 'Positioning: option-like token representing platform value/market cap, with value fluctuation and dividend rights.',
        lang === 'zh' ? '对象：奖励平台的开发者、管理者与投资者，推动“共建共享共治”。' : 'Recipients: developers, managers, and investors; driving co-construction, sharing, and co-governance.',
        lang === 'zh' ? '总量：固定 10 亿；未分发时为限制性状态且价值为 0，分发后可按合规在场内外交易。' : 'Supply: fixed at 1 billion; restricted and zero value before distribution; tradable in/out of market per compliance after distribution.',
        lang === 'zh' ? '分红权：面向历史/当期绩效；O币更侧重未来绩效，二者共同构成绩效回报。' : 'Dividend rights: for past/current performance; O Coin focuses on future performance—together forming performance returns.',
      ],
    },
    example: {
      title: lang === 'zh' ? '示例计算' : 'Example Calculation',
      aDailyTitle: lang === 'zh' ? 'A币日结示例' : 'A Coin Daily Settlement Example',
      assumptions: lang === 'zh' ? '假设条件：' : 'Assumptions:',
      calc: lang === 'zh' ? '计算过程：' : 'Calculation:',
      result: lang === 'zh' ? '最终结果：用户A当日获得 30 A币 奖励（价值约 30 元）' : 'Result: User A receives 30 A Coin for the day (worth ~30 RMB)',
      performanceTitle: lang === 'zh' ? '绩效包示例（O币/分红）' : 'Performance Package Example (O Coin/Dividends)',
      performanceP:
        lang === 'zh'
          ? '例如：某玩家创建一款小游戏，新增 1000 名玩家、带来 10000 元收入。 平台委员会奖励其 1% 平台净收入 + 1000 个 O币，玩家社区代表额外按“每增加 1 元收入分配 5%”激励。'
          : 'Example: A player creates a mini-game, adds 1,000 players and 10,000 RMB revenue. The committee awards 1% of net platform income + 1,000 O Coin; community representatives additionally allocate 5% for each 1 RMB increase.',
      formula: lang === 'zh' ? '绩效包 = 1% ×（平台收入 - 运营成本） + 5% ×（游戏收入T - 游戏收入T-1） + 1000 个 O币' : 'Performance package = 1% × (Platform income − Operating costs) + 5% × (Game revenue T − Game revenue T−1) + 1,000 O Coin',
      exampleNote: lang === 'zh' ? '若当期平台净收入 = 100,000 元，则：' : 'If current net platform income = 100,000 RMB:',
      cashLine: lang === 'zh' ? '现金 = 100,000 × 1% + 10,000 × 5% = 1,000 + 500 = 1,500 元' : 'Cash = 100,000 × 1% + 10,000 × 5% = 1,000 + 500 = 1,500 RMB',
      bonusLine: lang === 'zh' ? '并获得 1000 个 O币；年终分红 = 1000 / O币总量 × 总分红金额' : 'Plus 1,000 O Coin; year-end dividend = 1000 / total O Coin × total dividend amount',
      assumptionsBullets: [
        lang === 'zh' ? '平台当日净收入：1000 元' : 'Platform net income of the day: 1000 RMB',
        lang === 'zh' ? 'A币发放比例：40% → 400 A币' : 'A Coin distribution ratio: 40% → 400 A Coin',
        lang === 'zh' ? '用户A当日贡献：100 游戏币、10 签到分、50 元交易' : 'User A daily contribution: 100 game coins, 10 check-in points, 50 RMB trading',
        lang === 'zh' ? '全网当日贡献：2000 游戏币、200 签到分、1000 元交易' : 'Network daily contribution: 2000 game coins, 200 check-in points, 1000 RMB trading',
      ],
      calcSteps: [
        lang === 'zh'
          ? '贡献权重 = (100/2000)×0.5 + (10/200)×0.3 + (50/1000)×0.2 = 0.05 + 0.015 + 0.01 = 0.075'
          : 'Contribution weight = (100/2000)×0.5 + (10/200)×0.3 + (50/1000)×0.2 = 0.05 + 0.015 + 0.01 = 0.075',
        lang === 'zh'
          ? '假设全网贡献归一化权重 = 1.0'
          : 'Assume normalized network contribution weight = 1.0',
        lang === 'zh'
          ? '用户A获得 A币 = 0.075 × 400 = 30 A币'
          : 'User A gets A Coin = 0.075 × 400 = 30 A Coin',
      ],
    },
    others: {
      title: lang === 'zh' ? '其他奖励' : 'Other Rewards',
      p:
        lang === 'zh'
          ? '新手与普通参与者可零投入通过玩游戏获得游戏币或算力奖励，可用于每日 A币 结算与购买游戏道具。只要参与，就有奖励。'
          : 'Newcomers and regular participants can earn game coins or computing power by playing without investment, usable for daily A Coin settlement and purchasing game items. Participate to earn.',
    },
    steps: {
      title: lang === 'zh' ? '如何获得奖励 · 步骤图' : 'How to Earn Rewards · Steps',
      s1Title: lang === 'zh' ? '注册与认证' : 'Register & Verify',
      s1Desc: lang === 'zh' ? '完成账号注册与实名认证' : 'Complete account registration and real-name verification',
      s1Badge: lang === 'zh' ? '解锁新手奖励' : 'Unlock newbie rewards',
      s2Title: lang === 'zh' ? '试玩与新手任务' : 'Play & Onboarding Tasks',
      s2Desc: lang === 'zh' ? '完成引导、体验小游戏' : 'Finish onboarding and try mini-games',
      s2Badge: lang === 'zh' ? '获得 算力/游戏币' : 'Gain computing power/game coins',
      s3Title: lang === 'zh' ? '日常活跃' : 'Daily Activity',
      s3Desc: lang === 'zh' ? '签到、对局、交易等行为累计贡献' : 'Check-ins, matches, trades contribute cumulatively',
      s3Badge: lang === 'zh' ? '提高 A币日结占比' : 'Increase A Coin daily share',
      s4Title: lang === 'zh' ? '贡献开发/治理' : 'Contribute Dev/Governance',
      s4Desc: lang === 'zh' ? '提交代码、内容或参与治理投票' : 'Submit code/content or join governance voting',
      s4Badge: lang === 'zh' ? '获得 O币/分红权' : 'Gain O Coin/Dividend rights',
      s5Title: lang === 'zh' ? '每日结算' : 'Daily Settlement',
      s5Desc: lang === 'zh' ? '按贡献权重自动结算' : 'Auto-settlement by contribution weight',
      s5Badge: lang === 'zh' ? '领取 A币（如示例：30 A币）' : 'Receive A Coin (e.g., 30 A Coin)',
      s6Title: lang === 'zh' ? '使用奖励' : 'Use Rewards',
      s6Desc: lang === 'zh' ? '用 A币结算、购买道具；O币参与分红或流通' : 'Use A Coin for settlement, buy items; O Coin for dividends or circulation',
      s6Badge: lang === 'zh' ? '娱乐更有价值' : 'Entertainment with more value',
      hint:
        lang === 'zh'
          ? '提示：A币日结与占比受平台收入与全网贡献影响；O币/分红权面向平台贡献者，遵循合规规则与治理流程。'
          : 'Hint: A Coin daily settlement and share depend on platform income and network contribution; O Coin/dividend rights target platform contributors and follow compliant rules and governance.',
    },
    footer: { copyright: '© 2025 AllinONE' },
  };

  const openEconomy = {
    hero: {
      tag: 'AllinONE · Open Economy & Governance',
      title: lang === 'zh' ? '经济公开系统和开放式管理系统' : 'Open Economy System & Open Governance',
      desc:
        lang === 'zh'
          ? '通过公开的财务系统与社区治理机制，确保平台经济透明、分配可追溯，并以数据驱动关键参数设定与持续优化。'
          : 'With transparent financial systems and community governance, the platform ensures economic transparency, traceable allocation, and data‑driven parameter setting and continuous optimization.',
      backHome: common.nav.backHome,
      quickView: common.nav.quickView,
    },
    nav: {
      overview: lang === 'zh' ? '概览' : 'Overview',
      compute: lang === 'zh' ? '算力中心' : 'Computing Center',
      fund: lang === 'zh' ? '资金池' : 'Fund Pool',
      governance: lang === 'zh' ? '平台管理系统' : 'Platform Governance',
      params: lang === 'zh' ? '关键参数' : 'Key Parameters',
      example: lang === 'zh' ? '示例' : 'Example',
    },
    overview: {
      title: lang === 'zh' ? '概览' : 'Overview',
      p:
        lang === 'zh'
          ? '经济公开由两部分组成：算力中心与资金池。算力中心是平台的“大脑”，汇聚游戏活动、经济状态、数据分析与场内外市场数据；资金池记录平台所有收入与支出，保障经济公开透明。在此基础上，平台管理系统以数据为依据，通过投票对关键参数进行设定与调整，实现开放式治理。'
          : 'Open economy consists of two parts: the Computing Center and the Fund Pool. The Computing Center is the “brain” of the platform, aggregating gameplay, economic status, analytics, and market data. The Fund Pool records all income and expenditures to ensure transparency. Based on this, the Platform Governance system sets and adjusts key parameters via voting using data as evidence.',
    },
    compute: {
      title: lang === 'zh' ? '公开的财务系统：算力中心' : 'Transparent Financial System: Computing Center',
      p:
        lang === 'zh'
          ? '算力中心是算力经济生态中心，展示多维度统计分析数据，更重要的是揭示数据如何驱动整个平台的经济循环。它汇集游戏活动、经济状态、数据分析及场内外市场数据，是经济公开、共建共享的重要手段。'
          : 'The Computing Center is the hub of the computing economy, showing multi‑dimensional analytics and, more importantly, revealing how data drives the platform’s economic cycle. It aggregates gameplay, economic status, analytics, and market data—an important means of openness and co‑building.',
    },
    fund: {
      title: lang === 'zh' ? '公开的财务系统：资金池' : 'Transparent Financial System: Fund Pool',
      p:
        lang === 'zh'
          ? '平台资金池是完全透明的财务管理系统，记录平台所有收入与支出，确保经济公开透明并增强用户信任，同时保护用户隐私。资金池作为经济数据的“核心底账”，与算力中心形成“记录与展示”的互补关系。'
          : 'The platform Fund Pool is a fully transparent financial system that records all income and expenditures, ensuring transparency and trust while protecting privacy. As the “core ledger” of economic data, it complements the Computing Center in “recording vs. displaying”.',
    },
    governance: {
      title: lang === 'zh' ? '开放的社区管理：平台管理系统' : 'Open Community Management: Platform Governance',
      p1:
        lang === 'zh'
          ? '当下 A币与 O币系统部分关键参数仍为人为拟定。我们以数据为基础建立数学模型辅助决策。平台管理系统拥有关键参数设定权限，采用少数权限成员投票修改的方式推进治理与优化。'
          : 'Currently, some key parameters of A Coin and O Coin are still manually set. We build mathematical models on data to assist decisions. The governance system has authority to set parameters and advances optimization via voting by authorized members.',
      p2:
        lang === 'zh'
          ? '当前系统支持投票与参数修改，并展示关键数据：A币余额、O币余额与价格、全网算力、收入支出、游戏数据、玩家人数等。投票席位 11 人：5 名平台管理者 + 5 名玩家社区代表 + 1 名创始人。一般情况下投票权平等，创始人保留一票否决权。决议需半数以上通过并由创始人执行参数修改。'
          : 'The system supports voting and parameter changes, and displays key data: A Coin balance, O Coin balance and price, network computing power, income/expenditure, game data, player counts, etc. There are 11 seats: 5 platform managers + 5 community representatives + 1 founder. Votes are equal in general; the founder holds veto power. Decisions require a majority and are executed by the founder.',
    },
    params: {
      title: lang === 'zh' ? '关键参数（示例）' : 'Key Parameters (Examples)',
      leftTitle: lang === 'zh' ? '分配与权重' : 'Allocation & Weights',
      leftBullets: [
        lang === 'zh' ? 'A币各部分分配权重' : 'Allocation weights for A Coin',
        lang === 'zh' ? 'O币各部分分配权重' : 'Allocation weights for O Coin',
        lang === 'zh' ? '收入分配比例、分红权重、兑换比例' : 'Income distribution ratio, dividend weights, exchange ratio',
      ],
      rightTitle: lang === 'zh' ? '展示数据' : 'Displayed Data',
      rightBullets: [
        lang === 'zh' ? 'A币余额、O币余额与价格' : 'A Coin balance, O Coin balance & price',
        lang === 'zh' ? '全网算力、收入支出' : 'Network computing power, income & expenditure',
        lang === 'zh' ? '游戏数据、玩家人数等' : 'Game data, player counts, etc.',
      ],
    },
    example: {
      title: lang === 'zh' ? '投票示例：O币分配与分红权重' : 'Voting Example: O Coin Allocation & Dividend Weights',
      p:
        lang === 'zh'
          ? '通过平台管理系统，成员就 O币的分配权重与分红权重进行投票。O币面向“未来绩效”，分红权面向“历史/当期绩效”，二者共同构成绩效回报。议案需半数以上通过，由创始人执行参数变更。管理者可在系统内直接完成操作并全程留痕。'
          : 'Via the governance system, members vote on O Coin allocation and dividend weights. O Coin targets “future performance”, while dividends target “past/current performance”, together forming performance returns. Proposals require majority approval and are executed by the founder, with full audit trail.',
    },
    footer: { copyright: '© 2025 AllinONE' },
  };

  const tradingSystem = {
    hero: {
      tag: 'AllinONE · Trading System',
      title: lang === 'zh' ? '多样的游戏商品交易系统' : 'Diverse Game Item Trading System',
      desc:
        lang === 'zh'
          ? '除了玩游戏以外，玩家还可以在平台上交易游戏道具。交易系统由官方商店、游戏电商和交易市场三部分构成，类似“京东超市 + 淘宝网店 + 闲鱼”的组合，覆盖官方直营、品牌自营与玩家自由交易的全场景。'
          : 'Beyond playing games, players can trade in‑game items on the platform. The trading system consists of Official Store, Game E‑commerce, and Marketplace—similar to a mix of JD Supermarket + Taobao Stores + Xianyu—covering official operation, brand‑run shops, and free player trading.',
      backHome: common.nav.backHome,
      quickView: common.nav.quickView,
    },
    overview: {
      title: lang === 'zh' ? '系统概览' : 'System Overview',
      p:
        lang === 'zh'
          ? '我们将商品交易拆分为三大场域：平台直营的官方商店、由游戏方运营的游戏电商、以及以玩家为主体的自由交易市场，为玩家提供安全、便捷且自由的交易体验。'
          : 'We split item trading into three arenas: the platform‑run Official Store, game‑operated E‑commerce, and a player‑centric free Marketplace, providing a safe, convenient, and flexible trading experience.',
    },
    cards: {
      officialStore: {
        title: lang === 'zh' ? '官方商店' : 'Official Store',
        desc:
          lang === 'zh'
            ? '由平台直接运营，严选道具与合规发售，适合需要官方保障与统一售后的玩家。'
            : 'Operated directly by the platform with curated items and compliant release—ideal for players who need official assurance and unified after‑sales.',
        link: lang === 'zh' ? '进入官方商店' : 'Go to Official Store',
      },
      gameStore: {
        title: lang === 'zh' ? '游戏电商' : 'Game E‑commerce',
        desc:
          lang === 'zh'
            ? '由具体游戏方自营或授权运营，提供与游戏深度绑定的商品与服务，玩法联动更丰富。'
            : 'Run by specific game studios (self‑operated or authorized), offering deeply integrated goods and services with richer gameplay linkage.',
        link: lang === 'zh' ? '进入游戏电商' : 'Go to Game E‑commerce',
      },
      marketplace: {
        title: lang === 'zh' ? '交易市场' : 'Marketplace',
        desc:
          lang === 'zh'
            ? '以玩家为主的自由买卖市场，支持道具发布与竞价撮合，兼顾开放流通与合规风控。'
            : 'A player‑driven free trading market supporting item listing and bid matching, balancing open circulation with compliant risk control.',
        link: lang === 'zh' ? '进入交易市场' : 'Go to Marketplace',
      },
    },
    note: {
      p:
        lang === 'zh'
          ? '这一组合模式就像把“淘宝网店、京东超市和闲鱼市场”融合到同一平台：既有官方保真，也有品牌自营，还支持玩家自由流通，目标是为你提供全方位、自由的交易环境。'
          : 'This combined model is like integrating “Taobao Stores, JD Supermarket, and Xianyu” into one platform: with official authenticity, brand self‑run shops, and free player circulation—to offer a comprehensive and flexible trading environment.',
    },
    footer: { copyright: '© 2025 AllinONE' },
  };

  const gameStore = {
    center: {
      header: {
        title: lang === 'zh' ? '游戏电商中心' : 'Game Store Center',
        subtitle: lang === 'zh' ? '发现优质游戏道具，连接游戏厂商与玩家' : 'Discover quality game items and connect studios with players',
        walletLabel: lang === 'zh' ? '我的钱包' : 'My Wallet',
      },
      loading: lang === 'zh' ? '加载游戏电商中心数据中...' : 'Loading game store center data...',
      featuredTitle: lang === 'zh' ? '🔥 热门商品' : '🔥 Featured Items',
      filters: {
        category: {
          all: lang === 'zh' ? '全部分类' : 'All Categories',
          weapon: lang === 'zh' ? '武器' : 'Weapon',
          armor: lang === 'zh' ? '装备' : 'Armor',
          consumable: lang === 'zh' ? '消耗品' : 'Consumable',
          skin: lang === 'zh' ? '皮肤' : 'Skin',
        },
        games: {
          all: lang === 'zh' ? '全部游戏' : 'All Games'
        },
        sort: {
          price: lang === 'zh' ? '价格排序' : 'Sort by Price',
          asc: lang === 'zh' ? '价格从低到高' : 'Low to High',
          desc: lang === 'zh' ? '价格从高到低' : 'High to Low',
          comprehensive: lang === 'zh' ? '综合排序' : 'Comprehensive',
          sales: lang === 'zh' ? '销量排序' : 'Sort by Sales',
          rating: lang === 'zh' ? '评分排序' : 'Sort by Rating',
          attention: lang === 'zh' ? '关注度排序' : 'Sort by Attention',
        },
      },
      buttons: {
        buyNow: common.buttons.buyNow,
      },
      storesTitle: lang === 'zh' ? '🏪 游戏商店' : '🏪 Game Stores',
      labels: {
        products: lang === 'zh' ? '商品' : 'Products',
        sales: lang === 'zh' ? '销量' : 'Sales',
        rating: lang === 'zh' ? '评分' : 'Rating',
      },
    },
    detail: {
      loading: lang === 'zh' ? '加载商店数据中...' : 'Loading store data...',
      storeNotFound: {
        title: lang === 'zh' ? '商店不存在' : 'Store Not Found',
        desc: lang === 'zh' ? '抱歉，您访问的商店不存在或已下线。' : 'Sorry, the store you visited does not exist or has been taken offline.',
        back: lang === 'zh' ? '返回游戏电商中心' : 'Back to Game Store Center',
      },
      header: {
        officialStoreSuffix: lang === 'zh' ? '官方商店' : 'Official Store',
      },
      walletLabel: lang === 'zh' ? '我的钱包' : 'My Wallet',
      labels: {
        reviews: lang === 'zh' ? '评价' : 'reviews',
        followers: lang === 'zh' ? '关注者' : 'followers',
        productCount: lang === 'zh' ? '商品数量' : 'Product Count',
        totalSales: lang === 'zh' ? '总销量' : 'Total Sales',
        foundedYear: lang === 'zh' ? '成立年份' : 'Founded',
      },
      products: {
        title: lang === 'zh' ? '商品列表' : 'Products',
        all: lang === 'zh' ? '全部' : 'All',
        totalPrefix: lang === 'zh' ? '共' : 'Total',
        totalSuffix: lang === 'zh' ? '件商品' : 'items',
        stock: lang === 'zh' ? '库存' : 'Stock',
      },
      empty: {
        title: lang === 'zh' ? '暂无商品' : 'No Products',
        desc: lang === 'zh' ? '该分类下暂时没有商品' : 'No products in this category yet',
      },
      buttons: {
        buyNow: common.buttons.buyNow,
      },
    },
  };
  const gameCenter = {
    header: {
      title: lang === 'zh' ? '游戏中心' : 'Game Center',
      networkPower: lang === 'zh' ? '全网算力:' : 'Network Power:',
      networkGameCoins: lang === 'zh' ? '全网游戏币:' : 'Network Game Coins:'
    },
    stats: {
      todaySessions: lang === 'zh' ? '今日游戏次数' : 'Sessions Today',
      todayComputing: lang === 'zh' ? '今日获得算力' : 'Computing Power Today',
      avgRating: lang === 'zh' ? '平均游戏评分' : 'Average Rating',
      streakDays: lang === 'zh' ? '连续游戏天数' : 'Consecutive Days'
    },
    filter: {
      label: lang === 'zh' ? '难度筛选:' : 'Filter by Difficulty:',
      all: lang === 'zh' ? '全部' : 'All',
      easy: lang === 'zh' ? '简单' : 'Easy',
      medium: lang === 'zh' ? '中等' : 'Medium',
      hard: lang === 'zh' ? '困难' : 'Hard'
    },
    difficulty: {
      easy: lang === 'zh' ? '简单' : 'Easy',
      medium: lang === 'zh' ? '中等' : 'Medium',
      hard: lang === 'zh' ? '困难' : 'Hard'
    },
    status: {
      available: lang === 'zh' ? '可游玩' : 'Available',
      comingSoon: lang === 'zh' ? '即将上线' : 'Coming Soon',
      maintenance: lang === 'zh' ? '维护中' : 'Maintenance'
    },
    games: {
      match3: {
        name: lang === 'zh' ? '消消乐' : 'Match 3',
        desc: lang === 'zh' ? '经典三消游戏，消除相同颜色的方块获得算力奖励' : 'Classic match‑3; clear same‑color blocks to earn computing power'
      },
      puzzle: {
        name: lang === 'zh' ? '数字拼图' : 'Number Puzzle',
        desc: lang === 'zh' ? '挑战你的逻辑思维，完成拼图获得丰厚奖励' : 'Challenge logic; complete puzzles for rewards'
      },
      memory: {
        name: lang === 'zh' ? '记忆翻牌' : 'Memory Flip',
        desc: lang === 'zh' ? '考验记忆力的翻牌游戏，记忆越好奖励越多' : 'Test memory; better recall yields more rewards'
      },
      snake: {
        name: lang === 'zh' ? '贪吃蛇' : 'Snake',
        desc: lang === 'zh' ? '经典贪吃蛇游戏，长度越长算力越高' : 'Classic snake; longer length yields higher computing power'
      }
    },
    buttons: {
      start: lang === 'zh' ? '开始游戏' : 'Start Game',
      comingSoon: lang === 'zh' ? '敬请期待' : 'Coming Soon',
      maintenance: lang === 'zh' ? '维护中' : 'Maintenance',
      info: lang === 'zh' ? '详情' : 'Info'
    }
  };
  const personalCenter = {
    title: lang === 'zh' ? '个人中心' : 'Personal Center',
    refresh: lang === 'zh' ? '刷新数据' : 'Refresh',
    nav: {
      home: common.nav.home,
      fundPool: lang === 'zh' ? '资金池' : 'Fund Pool',
      blogCenter: common.nav.blogCenter,
      marketplace: lang === 'zh' ? '交易市场' : 'Marketplace',
      officialStore: lang === 'zh' ? '官方商店' : 'Official Store',
      gameStore: lang === 'zh' ? '游戏商城' : 'Game Store',
      computingCenter: lang === 'zh' ? '算力中心' : 'Computing Center',
      gameCenter: lang === 'zh' ? '游戏中心' : 'Game Center',
      settings: lang === 'zh' ? '设置' : 'Settings',
      settingsTheme: lang === 'zh' ? '主题设置' : 'Theme',
      settingsNotice: lang === 'zh' ? '通知设置' : 'Notifications',
      settingsBind: lang === 'zh' ? '账户绑定' : 'Account Binding',
      settingsSecurity: lang === 'zh' ? '安全设置' : 'Security',
    },
    left: {
      profile: lang === 'zh' ? '玩家档案' : 'Player Profile',
      level: lang === 'zh' ? '等级' : 'Level',
      exp: lang === 'zh' ? '经验值' : 'EXP',
      stats: {
        totalGames: lang === 'zh' ? '游戏场次' : 'Games Played',
        bestScore: lang === 'zh' ? '最高分数' : 'Best Score',
        avgScore: lang === 'zh' ? '平均分数' : 'Average Score',
        achievements: lang === 'zh' ? '成就数量' : 'Achievements',
        playTime: lang === 'zh' ? '游戏时长' : 'Play Time',
        minutes: lang === 'zh' ? '分钟' : 'min',
      },
      walletOverview: lang === 'zh' ? '钱包概览' : 'Wallet Overview',
      wallet: {
        cash: lang === 'zh' ? '现金余额' : 'Cash',
        gameCoins: lang === 'zh' ? '游戏币' : 'Game Coins',
        computingPower: lang === 'zh' ? '算力' : 'Computing',
        aCoins: lang === 'zh' ? 'A币' : 'A Coin',
        details: lang === 'zh' ? '详情 →' : 'Details →',
        loading: lang === 'zh' ? '加载中...' : 'Loading...',
      },
      recent: {
        title: lang === 'zh' ? '最近活动' : 'Recent Activity',
        empty: lang === 'zh' ? '暂无活动记录' : 'No activity yet',
      },
    },
    centerTabs: {
      inventory: lang === 'zh' ? '道具仓库' : 'Inventory',
      transactions: lang === 'zh' ? '交易记录' : 'Transactions',
      wallet: lang === 'zh' ? '钱包管理' : 'Wallet',
      team: lang === 'zh' ? '团队中心' : 'Team Center',
      analysis: lang === 'zh' ? '收支分析' : 'Income & Expense',
      blog: lang === 'zh' ? '博客管理' : 'Blog Manager',
    },
    transactionTabs: {
      purchases: lang === 'zh' ? '购买记录' : 'Purchases',
      sales: lang === 'zh' ? '销售记录' : 'Sales',
      listings: lang === 'zh' ? '在售商品' : 'Listings',
    },
    inventory: {
      myItems: lang === 'zh' ? '我的道具' : 'My Items',
      emptyTitle: lang === 'zh' ? '暂无道具' : 'No items yet',
      emptySub: lang === 'zh' ? '去商店购买一些道具吧！' : 'Go to store to buy some items!',
      qty: lang === 'zh' ? '数量' : 'Qty',
    },
    transactions: {
      title: lang === 'zh' ? '交易记录' : 'Transactions',
      purchaseWord: lang === 'zh' ? '购买' : 'Purchase',
      sellWord: lang === 'zh' ? '出售' : 'Sale',
      income: lang === 'zh' ? '收入' : 'Income',
      expense: lang === 'zh' ? '支出' : 'Expense',
      nonePurchase: lang === 'zh' ? '暂无购买记录' : 'No purchases',
      noneSales: lang === 'zh' ? '暂无销售记录' : 'No sales',
      noneListings: lang === 'zh' ? '暂无在售商品' : 'No listings',
      toMarket: lang === 'zh' ? '去交易市场发布一些商品吧！' : 'Go list items in marketplace!',
      price: lang === 'zh' ? '售价' : 'Price',
      views: lang === 'zh' ? '浏览' : 'Views',
      delist: lang === 'zh' ? '下架商品' : 'Delist',
      editPrice: lang === 'zh' ? '修改价格' : 'Edit Price',
    },
    walletSection: {
      cards: {
        cash: lang === 'zh' ? '现金余额' : 'Cash Balance',
        gameCoins: lang === 'zh' ? '游戏币' : 'Game Coins',
        computingPower: lang === 'zh' ? '算力' : 'Computing Power',
        aCoins: lang === 'zh' ? 'A币' : 'A Coin',
        oCoins: lang === 'zh' ? 'O币' : 'O Coin',
        locked: lang === 'zh' ? '锁定' : 'Locked',
      },
      actions: {
        recharge: { title: lang === 'zh' ? '充值' : 'Recharge', subtitle: lang === 'zh' ? '增加现金余额' : 'Increase cash balance' },
        exchange: { title: lang === 'zh' ? '兑换' : 'Exchange', subtitle: lang === 'zh' ? '货币互相兑换' : 'Convert between currencies' },
        tradeOCoin: { title: lang === 'zh' ? '交易O币' : 'Trade O Coin', subtitle: lang === 'zh' ? '买入 • 出售 • 即时交易' : 'Buy • Sell • Instant trade' },
      }
    },
    walletDetails: {
      title: lang === 'zh' ? '收支明细' : 'Income & Expense Details',
      viewHint: lang === 'zh' ? '点击查看明细' : 'Click to view details',
      headers: {
        cash: lang === 'zh' ? '现金交易记录' : 'Cash Transactions',
        gameCoin: lang === 'zh' ? '游戏币交易记录' : 'Game Coin Transactions',
        computingPower: lang === 'zh' ? '算力交易记录' : 'Computing Power Transactions',
        aCoins: lang === 'zh' ? 'A币交易记录' : 'A Coin Transactions',
        oCoins: lang === 'zh' ? 'O币交易记录' : 'O Coin Transactions',
      },
      tags: {
        income: lang === 'zh' ? '收入' : 'Income',
        expense: lang === 'zh' ? '支出' : 'Expense',
      },
      empty: {
        cash: lang === 'zh' ? '暂无现金交易记录' : 'No cash transactions',
        gameCoin: lang === 'zh' ? '暂无游戏币交易记录' : 'No game coin transactions',
        computingPower: lang === 'zh' ? '暂无算力交易记录' : 'No computing power transactions',
        aCoins: lang === 'zh' ? '暂无A币交易记录' : 'No A Coin transactions',
        oCoins: lang === 'zh' ? '暂无O币交易记录' : 'No O Coin transactions',
      },
      footer: {
        showRecentPrefix: lang === 'zh' ? '显示最近 ' : 'Showing last ',
        showRecentSuffix: lang === 'zh' ? ' 条记录' : ' records',
        more: lang === 'zh' ? '查看更多 →' : 'View more →',
        collapse: lang === 'zh' ? '收起 ↑' : 'Collapse ↑',
      }
    },
    analysisSection: {
      title: lang === 'zh' ? '收支分析' : 'Income & Expense',
      currentAssets: lang === 'zh' ? '当前资产' : 'Current Assets',
      totalIncomeRMB: lang === 'zh' ? '总收入（折算人民币）' : 'Total Income (in RMB)',
      totalExpenseRMB: lang === 'zh' ? '总支出（折算人民币）' : 'Total Expense (in RMB)',
      commissionDetail: lang === 'zh' ? '佣金明细' : 'Commission Details',
      myCommissionExpense: lang === 'zh' ? '我的佣金支出' : 'My Commission Expense',
      refresh: lang === 'zh' ? '刷新' : 'Refresh',
      monitor: {
        title: lang === 'zh' ? '收支分析' : 'Income & Expense',
        loadingWallet: lang === 'zh' ? '加载钱包数据中...' : 'Loading wallet data...',
        currencies: {
          cash: lang === 'zh' ? '现金' : 'Cash',
          gameCoins: lang === 'zh' ? '游戏币' : 'Game Coins',
          computingPower: lang === 'zh' ? '算力' : 'Computing Power',
          aCoins: lang === 'zh' ? 'A币' : 'A Coin',
          oCoins: lang === 'zh' ? 'O币' : 'O Coin',
        },
        calculating: lang === 'zh' ? '计算中...' : 'Calculating...',
      },
      commission: {
        title: lang === 'zh' ? '佣金明细' : 'Commission Details',
        refresh: lang === 'zh' ? '刷新' : 'Refresh',
        myExpenseTitle: lang === 'zh' ? '我的佣金支出' : 'My Commission Expense',
        labels: {
          cash: lang === 'zh' ? '现金佣金' : 'Cash Commission',
          gameCoins: lang === 'zh' ? '游戏币佣金' : 'Game Coin Commission',
          computingPower: lang === 'zh' ? '算力佣金' : 'Computing Power Commission',
        },
        recordsTitle: lang === 'zh' ? '我的佣金记录' : 'My Commission Records',
        loading: lang === 'zh' ? '加载佣金数据中...' : 'Loading commission data...',
        id: lang === 'zh' ? 'ID' : 'ID',
        order: lang === 'zh' ? '订单' : 'Order',
        time: lang === 'zh' ? '时间' : 'Time',
        expenseTag: lang === 'zh' ? '佣金支出' : 'Commission Expense',
        empty: {
          title: lang === 'zh' ? '暂无佣金记录' : 'No commission records',
          hint: lang === 'zh' ? '进行交易后会显示佣金明细' : 'Commission details will appear after trades',
        },
        infoTitle: lang === 'zh' ? '佣金说明' : 'Commission Notes',
        notes: {
          gameStore: lang === 'zh' ? '• 游戏电商: 购买时支付 30% 佣金' : '• Game E‑commerce: 30% commission on purchases',
          marketplace: lang === 'zh' ? '• 玩家市场: 交易时支付 5% 佣金' : '• Marketplace: 5% commission on trades',
          officialStore: lang === 'zh' ? '• 官方商店: 购买时支付 15% 佣金' : '• Official Store: 15% commission on purchases',
          personalHint: lang === 'zh' ? '• 此处显示您个人支付的佣金明细' : '• Shows the commission you personally paid',
        },
      },
      acoinAnalysis: {
        title: lang === 'zh' ? 'A币贡献度分析' : 'A Coin Contribution Analysis',
        basis: lang === 'zh' ? 'A币计算依据' : 'Basis of A Coin Calculation',
        thisMonth: lang === 'zh' ? '本月贡献度' : 'Contribution This Month',
        gameCoinsEarned: lang === 'zh' ? '游戏币获得' : 'Game Coins Earned',
        computingPower: lang === 'zh' ? '算力贡献' : 'Computing Power',
        transactionActivity: lang === 'zh' ? '交易活跃度' : 'Trading Activity',
        coinsUnit: lang === 'zh' ? '币' : 'coins',
        powerUnit: lang === 'zh' ? '算力' : 'computing',
        tradesUnit: lang === 'zh' ? '笔交易' : 'trades',
        dailyRecords: lang === 'zh' ? '每日结算记录' : 'Daily Settlement Records',
        expand: lang === 'zh' ? '展开' : 'Expand',
        collapse: lang === 'zh' ? '收起' : 'Collapse',
        todayStatus: lang === 'zh' ? '今日结算状态' : 'Today’s Settlement Status',
        settled: lang === 'zh' ? '已结算' : 'Settled',
        pending: lang === 'zh' ? '待结算' : 'Pending',
        autoTime: lang === 'zh' ? '每日自动结算，结算时间: 00:00 (系统时间)' : 'Auto settlement daily at 00:00 (system time)',
        contributors: lang === 'zh' ? '受益人数' : 'Recipients',
        share: lang === 'zh' ? '占比' : 'Share',
        none: lang === 'zh' ? '暂无结算记录' : 'No settlement records',
      }
    },
    modals: {
      recharge: {
        title: lang === 'zh' ? '充值' : 'Recharge',
        amountLabel: lang === 'zh' ? '充值金额' : 'Amount',
        amountPlaceholder: lang === 'zh' ? '请输入充值金额' : 'Enter amount',
        paymentLabel: lang === 'zh' ? '支付方式' : 'Payment Method',
        options: {
          alipay: lang === 'zh' ? '支付宝' : 'Alipay',
          wechat: lang === 'zh' ? '微信支付' : 'WeChat Pay',
          card: lang === 'zh' ? '银行卡' : 'Bank Card',
        },
        confirm: lang === 'zh' ? '确认充值' : 'Confirm Recharge',
        cancel: lang === 'zh' ? '取消' : 'Cancel',
      },
      exchange: {
        title: lang === 'zh' ? '货币兑换' : 'Currency Exchange',
        amountLabel: lang === 'zh' ? '兑换金额' : 'Amount',
        amountPlaceholder: lang === 'zh' ? '请输入兑换金额' : 'Enter amount',
        fromLabel: lang === 'zh' ? '从' : 'From',
        toLabel: lang === 'zh' ? '到' : 'To',
        ratesTitle: lang === 'zh' ? '汇率信息' : 'Rates',
        ratesNote: lang === 'zh' ? '💡 汇率由平台管理投票决定' : '💡 Rates are decided by platform governance voting',
        confirm: lang === 'zh' ? '确认兑换' : 'Confirm Exchange',
        cancel: lang === 'zh' ? '取消' : 'Cancel',
        options: {
          cash: lang === 'zh' ? '现金' : 'Cash',
          gameCoin: lang === 'zh' ? '游戏币' : 'Game Coin',
          computingPower: lang === 'zh' ? '算力' : 'Computing Power',
          aCoins: lang === 'zh' ? 'A币' : 'A Coin',
        },
      },
      ocoin: {
        titles: {
          buy: lang === 'zh' ? '购买O币' : 'Buy O Coin',
          sell: lang === 'zh' ? '出售O币' : 'Sell O Coin',
        },
        market: {
          currentPrice: lang === 'zh' ? '当前价格' : 'Current Price',
          change24h: lang === 'zh' ? '24小时涨跌' : '24h Change',
        },
        balances: {
          cash: lang === 'zh' ? '现金余额' : 'Cash Balance',
          ocoin: lang === 'zh' ? 'O币余额' : 'O Coin Balance',
        },
        quantity: {
          buyLabel: lang === 'zh' ? '购买数量' : 'Buy Quantity',
          sellLabel: lang === 'zh' ? '出售数量' : 'Sell Quantity',
          buyPlaceholder: lang === 'zh' ? '请输入购买数量' : 'Enter buy quantity',
          sellPlaceholder: lang === 'zh' ? '请输入出售数量' : 'Enter sell quantity',
        },
        preview: {
          title: lang === 'zh' ? '交易预览' : 'Trade Preview',
          qty: lang === 'zh' ? '数量' : 'Quantity',
          unitPrice: lang === 'zh' ? '单价' : 'Unit Price',
          total: lang === 'zh' ? '总计' : 'Total',
        },
        tips: {
          title: lang === 'zh' ? '交易提示' : 'Trading Tips',
          line1: lang === 'zh' ? '• O币价格会根据市场供需波动' : '• O Coin price fluctuates with market supply/demand',
          line2: lang === 'zh' ? '• O币持有者可享有平台分红权' : '• O Coin holders may enjoy dividend rights',
          line3: lang === 'zh' ? '• 交易完成后立即生效' : '• Trades take effect immediately after completion',
        },
        actions: {
          confirmBuy: lang === 'zh' ? '确认购买' : 'Confirm Buy',
          confirmSell: lang === 'zh' ? '确认出售' : 'Confirm Sell',
          cancel: lang === 'zh' ? '取消' : 'Cancel',
          toggleToSell: lang === 'zh' ? '切换到出售O币' : 'Switch to Sell O Coin',
          toggleToBuy: lang === 'zh' ? '切换到购买O币' : 'Switch to Buy O Coin',
        }
      }
    },
    right: {
      globalData: lang === 'zh' ? '全网数据' : 'Network Data',
      toComputing: lang === 'zh' ? '算力中心 →' : 'Computing Center →',
      overview: lang === 'zh' ? '生态概览' : 'Ecosystem Overview',
      metrics: {
        totalUsers: lang === 'zh' ? '总用户数' : 'Total Users',
        onlineUsers: lang === 'zh' ? '在线用户' : 'Online Users',
        totalComputePower: lang === 'zh' ? '总算力池' : 'Total Computing Power',
        dailyTransactions: lang === 'zh' ? '日交易量' : 'Daily Transactions',
        aCoinBalance: lang === 'zh' ? 'A币余额' : 'A Coin Balance',
        aCoinCirculating: lang === 'zh' ? 'A币流通量' : 'A Coin Circulating',
        aCoinHolders: lang === 'zh' ? 'A币持有人' : 'A Coin Holders',
        oCoinCirculating: lang === 'zh' ? 'O币流通量' : 'O Coin Circulating',
        oCoinPrice: lang === 'zh' ? 'O币价格' : 'O Coin Price',
        oCoinMarketCap: lang === 'zh' ? 'O币市值' : 'O Coin Market Cap',
        unitM: lang === 'zh' ? 'M' : 'M',
        unitWan: lang === 'zh' ? '万' : '10k',
      },
    },
  };

  const marketplace = {
    header: {
      title: lang === 'zh' ? '交易市场' : 'Marketplace',
      subtitle: lang === 'zh' ? '玩家间道具与奖励交易平台' : 'Peer-to-peer trading platform for in-game items and rewards',
      publish: lang === 'zh' ? '发布商品' : 'List Item',
      personalCenter: lang === 'zh' ? '个人中心' : 'Personal Center',
      computingCenter: lang === 'zh' ? '算力中心' : 'Computing Center',
      backHome: common.nav.backHome,
      walletLabel: lang === 'zh' ? '我的钱包' : 'My Wallet',
    },
    loading: lang === 'zh' ? '加载交易市场数据中...' : 'Loading marketplace data...',
    stats: {
      onSale: lang === 'zh' ? '在售商品' : 'Items on Sale',
      today: lang === 'zh' ? '今日交易' : 'Today’s Transactions',
      total: lang === 'zh' ? '交易总额' : 'Total Volume',
      avgPrice: lang === 'zh' ? '平均价格' : 'Average Price',
    },
    search: {
      placeholder: lang === 'zh' ? '搜索商品...' : 'Search items...',
      categories: {
        all: lang === 'zh' ? '所有分类' : 'All Categories',
        weapon: lang === 'zh' ? '武器' : 'Weapon',
        armor: lang === 'zh' ? '装备' : 'Armor',
        consumable: lang === 'zh' ? '消耗品' : 'Consumable',
        material: lang === 'zh' ? '材料' : 'Material',
        rare: lang === 'zh' ? '稀有物品' : 'Rare Items',
      },
      sort: {
        date: lang === 'zh' ? '最新发布' : 'Newest',
        price: lang === 'zh' ? '价格排序' : 'Price',
        popularity: lang === 'zh' ? '热门程度' : 'Popularity',
      },
    },
    list: {
      currencyNames: {
        computing: lang === 'zh' ? '算力' : 'ComputingPower',
        computingPower: lang === 'zh' ? '算力' : 'ComputingPower',
        cash: lang === 'zh' ? '现金' : 'Cash',
        gameCoins: lang === 'zh' ? '游戏币' : 'Game Coins',
        aCoins: lang === 'zh' ? 'A币' : 'A Coin',
      },
      views: lang === 'zh' ? '浏览' : 'views',
      seller: lang === 'zh' ? '卖家' : 'Seller',
      buyNow: lang === 'zh' ? '立即购买' : 'Buy Now',
      insufficient: lang === 'zh' ? '余额不足' : 'Insufficient Balance',
      canBuyWith: (cur: string) => (lang === 'zh' ? `可用${cur}购买` : `Can buy with ${cur}`),
      insufficientWith: (cur: string) => (lang === 'zh' ? `${cur}余额不足` : `Insufficient ${cur} balance`),
      empty: lang === 'zh' ? '没有找到符合条件的商品' : 'No items match your filters',
    },
    modal: {
      title: lang === 'zh' ? '发布商品' : 'List Item',
      noItemsTitle: lang === 'zh' ? '您还没有可发布的道具' : 'You have no items to list',
      noItemsDesc: lang === 'zh' ? '通过游戏获得道具后即可在此发布' : 'Earn items in games to list them here',
      selectItem: lang === 'zh' ? '选择道具' : 'Select Item',
      currencyType: lang === 'zh' ? '货币类型' : 'Currency',
      priceLabel: lang === 'zh' ? '售价' : 'Price',
      cancel: common.buttons.cancel,
      submit: lang === 'zh' ? '发布商品' : 'List Item',
      optionPlaceholder: lang === 'zh' ? '请选择要发布的道具' : 'Select an item to list',
    },
  };

  const storeObj = store; // keep naming stable
  return { common, login, register, about, blog, store: storeObj, communityRewards, openEconomy, tradingSystem, marketplace, gameStore, gameCenter, personalCenter };
};

export const t = (dict: Dict, key: string): string => {
  const parts = key.split('.');
  let current: any = dict;
  for (const p of parts) {
    if (current && typeof current === 'object') {
      current = current[p];
    } else {
      current = undefined;
    }
  }
  if (typeof current === 'function') return current();
  return current ?? key;
};