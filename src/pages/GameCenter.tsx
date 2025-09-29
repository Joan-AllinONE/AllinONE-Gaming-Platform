import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

interface GameCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rewards: {
    computingPower: number;
    gameCoins: number;
  };
  players: number;
  status: 'available' | 'coming-soon' | 'maintenance';
}

const games: GameCard[] = [
  {
    id: 'match3',
    name: '消消乐',
    description: '经典三消游戏，消除相同颜色的方块获得算力奖励',
    icon: 'fa-solid fa-gem',
    difficulty: 'easy',
    rewards: { computingPower: 50, gameCoins: 50 },
    players: 1234,
    status: 'available'
  },
  {
    id: 'puzzle',
    name: '数字拼图',
    description: '挑战你的逻辑思维，完成拼图获得丰厚奖励',
    icon: 'fa-solid fa-puzzle-piece',
    difficulty: 'medium',
    rewards: { computingPower: 80, gameCoins: 80 },
    players: 567,
    status: 'coming-soon'
  },
  {
    id: 'memory',
    name: '记忆翻牌',
    description: '考验记忆力的翻牌游戏，记忆越好奖励越多',
    icon: 'fa-solid fa-brain',
    difficulty: 'medium',
    rewards: { computingPower: 70, gameCoins: 70 },
    players: 890,
    status: 'coming-soon'
  },
  {
    id: 'snake',
    name: '贪吃蛇',
    description: '经典贪吃蛇游戏，长度越长算力越高',
    icon: 'fa-solid fa-worm',
    difficulty: 'hard',
    rewards: { computingPower: 100, gameCoins: 100 },
    players: 456,
    status: 'maintenance'
  }
];

const difficultyColors = {
  easy: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
};

const statusColors = {
  available: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  'coming-soon': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
};

const statusText = {
  available: '可游玩',
  'coming-soon': '即将上线',
  maintenance: '维护中'
};

export default function GameCenter() {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredGames = selectedDifficulty === 'all' 
    ? games 
    : games.filter(game => game.difficulty === selectedDifficulty);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AllinONE</span>
              </Link>
              <div className="hidden md:block w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
              <h1 className="hidden md:block text-lg font-semibold text-slate-700 dark:text-slate-200">{t(dict, 'gameCenter.header.title')}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <i className="fa-solid fa-coins text-yellow-500"></i>
                <span>{t(dict, 'gameCenter.header.networkPower')} <span className="font-semibold text-blue-600 dark:text-blue-400">1,234</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <i className="fa-solid fa-gem text-purple-500"></i>
                <span>{t(dict, 'gameCenter.header.networkGameCoins')} <span className="font-semibold text-purple-600 dark:text-purple-400">5,678</span></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <i className="fa-solid fa-gamepad text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">12</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'gameCenter.stats.todaySessions')}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <i className="fa-solid fa-trophy text-green-600 dark:text-green-400 text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">856</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'gameCenter.stats.todayComputingPower')}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <i className="fa-solid fa-star text-purple-600 dark:text-purple-400 text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">4.8</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'gameCenter.stats.avgRating')}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <i className="fa-solid fa-fire text-orange-600 dark:text-orange-400 text-xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">7</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'gameCenter.stats.streakDays')}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t(dict, 'gameCenter.filter.label')}</span>
          <div className="flex gap-2">
            {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDifficulty === difficulty
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {difficulty === 'all' ? t(dict, 'gameCenter.filter.all') : 
                 difficulty === 'easy' ? t(dict, 'gameCenter.filter.easy') :
                 difficulty === 'medium' ? t(dict, 'gameCenter.filter.medium') : t(dict, 'gameCenter.filter.hard')}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                    <i className={game.icon}></i>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[game.difficulty]}`}>
                      {game.difficulty === 'easy' ? t(dict, 'gameCenter.difficulty.easy') : 
                       game.difficulty === 'medium' ? t(dict, 'gameCenter.difficulty.medium') : t(dict, 'gameCenter.difficulty.hard')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[game.status]}`}>
                      {t(dict, `gameCenter.status.${game.status === 'coming-soon' ? 'comingSoon' : game.status}`)}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t(dict, `gameCenter.games.${game.id}.name`)}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">{t(dict, `gameCenter.games.${game.id}.desc`)}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <i className="fa-solid fa-coins text-yellow-500"></i>
                      <span>{game.rewards.computingPower}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fa-solid fa-gem text-purple-500"></i>
                      <span>{game.rewards.gameCoins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fa-solid fa-users"></i>
                      <span>{game.players}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {game.status === 'available' ? (
                    <Link
                      to={`/game/${game.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {t(dict, 'gameCenter.buttons.start')}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 text-center py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                    >
                      {game.status === 'coming-soon' ? t(dict, 'gameCenter.buttons.comingSoon') : t(dict, 'gameCenter.buttons.maintenance')}
                    </button>
                  )}
                  <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <i className="fa-solid fa-info-circle"></i>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}