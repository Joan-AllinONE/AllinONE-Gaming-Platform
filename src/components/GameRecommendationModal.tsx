import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gamepad2, Rocket, Sword } from 'lucide-react';
import { crossPlatformAuthService } from '@/services/crossPlatformAuthService';

interface GameRecommendation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  tag: string;
  tagColor: string;
  link: string;
  isExternal: boolean;
}

const recommendedGames: GameRecommendation[] = [
  {
    id: 'match3',
    name: '消消乐',
    description: '经典三消玩法，消除方块获得算力奖励，轻松上手，乐趣无穷！',
    icon: <Gamepad2 className="w-8 h-8" />,
    gradient: 'from-pink-500 via-purple-500 to-indigo-500',
    tag: '热门推荐',
    tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    link: '/game/match3',
    isExternal: false
  },
  {
    id: 'newday',
    name: 'New Day',
    description: '全新冒险RPG，探索神秘世界，收集稀有道具，开启你的传奇之旅！',
    icon: <Rocket className="w-8 h-8" />,
    gradient: 'from-cyan-500 via-blue-500 to-purple-500',
    tag: '新游上架',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    link: 'https://yxp6y2qgnh.coze.site/',
    isExternal: true
  },
  {
    id: 'stick-war',
    name: '火柴人保卫战',
    description: '策略塔防游戏，部署火柴人战士守护领地，挑战你的战术智慧！',
    icon: <Sword className="w-8 h-8" />,
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    tag: '策略精品',
    tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    link: 'https://42wv2rvtwg.coze.site/',
    isExternal: true
  }
];

const MODAL_STORAGE_KEY = 'allinone_game_recommendation_closed';

export default function GameRecommendationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal
    const hasSeenModal = localStorage.getItem(MODAL_STORAGE_KEY);
    if (!hasSeenModal) {
      // Delay showing the modal for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasAnimated(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(MODAL_STORAGE_KEY, 'true');
  };

  const handleGameClick = () => {
    handleClose();
  };

  // Generate auto-login URL for external games
  const getAutoLoginUrl = useCallback((baseUrl: string): string => {
    const user = crossPlatformAuthService.getCurrentUser();
    const token = crossPlatformAuthService.getNewDayToken();

    if (!user || !token) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    url.searchParams.set('autoLogin', 'true');
    url.searchParams.set('token', token);
    url.searchParams.set('userId', user.userId);
    url.searchParams.set('username', user.username);

    return url.toString();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: 'spring',
                damping: 25,
                stiffness: 300,
                delay: 0.1
              }}
              className="relative w-full max-w-4xl pointer-events-auto"
            >
              {/* Main Modal Card */}
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
                  <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl rounded-full" />
                  {/* Animated particles */}
                  <motion.div
                    animate={{ 
                      y: [0, -20, 0],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full"
                  />
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full"
                  />
                  <motion.div
                    animate={{ 
                      y: [0, -25, 0],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-32 left-40 w-2 h-2 bg-pink-400 rounded-full"
                  />
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all duration-200 border border-slate-700/50 hover:border-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="relative p-6 md:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">新品上架</span>
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl md:text-3xl font-bold text-white mb-2"
                    >
                      热门游戏推荐
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-400 text-sm md:text-base"
                    >
                      发现精选好游戏，开启你的收益之旅
                    </motion.p>
                  </div>

                  {/* Games Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {recommendedGames.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="group relative"
                      >
                        <div className={`relative bg-gradient-to-br ${game.gradient} p-[1px] rounded-xl overflow-hidden`}>
                          <div className="relative bg-slate-900/95 rounded-xl p-5 h-full flex flex-col">
                            {/* Tag */}
                            <div className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-medium rounded-full border ${game.tagColor}`}>
                              {game.tag}
                            </div>

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              {game.icon}
                            </div>

                            {/* Game Info */}
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                              {game.name}
                            </h3>
                            <p className="text-slate-400 text-sm mb-4 flex-grow line-clamp-3">
                              {game.description}
                            </p>

                            {/* Play Button */}
                            {game.isExternal ? (
                              <a
                                href={getAutoLoginUrl(game.link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleGameClick}
                                className={`w-full py-2.5 px-4 rounded-lg bg-gradient-to-r ${game.gradient} text-white font-medium text-sm text-center hover:shadow-lg transition-all duration-300 transform group-hover:scale-[1.02] active:scale-[0.98] block`}
                              >
                                立即游玩
                              </a>
                            ) : (
                              <Link
                                to={game.link}
                                onClick={handleGameClick}
                                className={`w-full py-2.5 px-4 rounded-lg bg-gradient-to-r ${game.gradient} text-white font-medium text-sm text-center hover:shadow-lg transition-all duration-300 transform group-hover:scale-[1.02] active:scale-[0.98] block`}
                              >
                                立即游玩
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center"
                  >
                    <Link
                      to="/game-center"
                      onClick={handleClose}
                      className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <span>查看全部游戏</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </motion.div>
                </div>

                {/* Bottom Gradient Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
