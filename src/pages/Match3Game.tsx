import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { databaseService } from '@/services/database';
import { useUserData } from '@/contexts/UserDataContext';
import { walletService } from '@/services/walletService';
import GameRules from '@/components/GameRules';
import GameEffects from '@/components/GameEffects';

// 游戏配置
const BOARD_SIZE = 8;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const MATCH_MIN = 3;

interface Gem {
  id: string;
  color: string;
  row: number;
  col: number;
}

interface GameStats {
  score: number;
  moves: number;
  level: number;
  target: number;
  timeLeft: number;
  powerUps: {
    bomb: number;
    lightning: number;
    rainbow: number;
  };
}

const colorClasses = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500'
};

export default function Match3Game() {
  const { updateUserStats } = useUserData();
  const [board, setBoard] = useState<Gem[][]>([]);
  const [selectedGem, setSelectedGem] = useState<{row: number, col: number} | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    moves: 30,
    level: 1,
    target: 1000,
    timeLeft: 60, // 改为60秒
    powerUps: {
      bomb: 2,
      lightning: 1,
      rainbow: 1
    }
  });
  const [isGameActive, setIsGameActive] = useState(true);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1);
  const [effects, setEffects] = useState<Array<{
    id: string;
    type: 'bomb' | 'lightning' | 'rainbow' | 'match' | 'combo';
    position: { row: number; col: number };
    timestamp: number;
  }>>([]);

  // 创建随机宝石
  const createGem = useCallback((row: number, col: number): Gem => {
    return {
      id: `${row}-${col}-${Date.now()}-${Math.random()}`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      row,
      col
    };
  }, []);

  // 初始化游戏板
  const initializeBoard = useCallback(() => {
    const newBoard: Gem[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      newBoard[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        newBoard[row][col] = createGem(row, col);
      }
    }
    setBoard(newBoard);
  }, [createGem]);

  // 检查水平匹配
  const findHorizontalMatches = useCallback((board: Gem[][]) => {
    const matches: {row: number, col: number}[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      let count = 1;
      let currentColor = board[row][0].color;
      
      for (let col = 1; col < BOARD_SIZE; col++) {
        if (board[row][col].color === currentColor) {
          count++;
        } else {
          if (count >= MATCH_MIN) {
            for (let i = col - count; i < col; i++) {
              matches.push({row, col: i});
            }
          }
          count = 1;
          currentColor = board[row][col].color;
        }
      }
      
      if (count >= MATCH_MIN) {
        for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
          matches.push({row, col: i});
        }
      }
    }
    
    return matches;
  }, []);

  // 检查垂直匹配
  const findVerticalMatches = useCallback((board: Gem[][]) => {
    const matches: {row: number, col: number}[] = [];
    
    for (let col = 0; col < BOARD_SIZE; col++) {
      let count = 1;
      let currentColor = board[0][col].color;
      
      for (let row = 1; row < BOARD_SIZE; row++) {
        if (board[row][col].color === currentColor) {
          count++;
        } else {
          if (count >= MATCH_MIN) {
            for (let i = row - count; i < row; i++) {
              matches.push({row: i, col});
            }
          }
          count = 1;
          currentColor = board[row][col].color;
        }
      }
      
      if (count >= MATCH_MIN) {
        for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
          matches.push({row: i, col});
        }
      }
    }
    
    return matches;
  }, []);

  // 检查所有匹配
  const findAllMatches = useCallback((board: Gem[][]) => {
    const horizontalMatches = findHorizontalMatches(board);
    const verticalMatches = findVerticalMatches(board);
    return [...horizontalMatches, ...verticalMatches];
  }, [findHorizontalMatches, findVerticalMatches]);

  // 移除匹配的宝石并让宝石下落
  const removeMatchesAndDrop = useCallback((board: Gem[][], matches: {row: number, col: number}[]) => {
    const newBoard = board.map(row => [...row]);
    
    // 标记要移除的宝石
    const toRemove = new Set(matches.map(m => `${m.row}-${m.col}`));
    
    // 每列处理下落
    for (let col = 0; col < BOARD_SIZE; col++) {
      const column = [];
      
      // 收集未被移除的宝石
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (!toRemove.has(`${row}-${col}`)) {
          column.push(newBoard[row][col]);
        }
      }
      
      // 填充新宝石到顶部
      while (column.length < BOARD_SIZE) {
        column.push(createGem(0, col));
      }
      
      // 重新放置宝石
      for (let i = 0; i < BOARD_SIZE; i++) {
        const gem = column[BOARD_SIZE - 1 - i];
        newBoard[i][col] = {
          ...gem,
          row: i,
          col: col
        };
      }
    }
    
    return newBoard;
  }, [createGem]);

  // 处理匹配
  const processMatches = useCallback(async (board: Gem[][]) => {
    let currentBoard = board;
    let totalMatches = 0;
    
    while (true) {
      const matches = findAllMatches(currentBoard);
      if (matches.length === 0) break;
      
      totalMatches += matches.length;
      currentBoard = removeMatchesAndDrop(currentBoard, matches);
      
      // 短暂延迟以显示动画效果
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (totalMatches > 0) {
      const basePoints = totalMatches * 10 * gameStats.level;
      const points = Math.round(basePoints * difficultyMultiplier);
      
      // 添加消除动画效果
      const centerRow = Math.floor(BOARD_SIZE / 2);
      const centerCol = Math.floor(BOARD_SIZE / 2);
      const newMatchEffect = {
        id: `effect-${Date.now()}-${Math.random()}`,
        type: 'match' as const,
        position: { row: centerRow, col: centerCol },
        timestamp: Date.now()
      };
      setEffects(prev => [...prev, newMatchEffect]);
      
      // 如果是连击，添加连击动画
      if (totalMatches >= 6) {
        setTimeout(() => {
          const newComboEffect = {
            id: `effect-${Date.now()}-${Math.random()}`,
            type: 'combo' as const,
            position: { row: centerRow, col: centerCol },
            timestamp: Date.now()
          };
          setEffects(prev => [...prev, newComboEffect]);
        }, 200);
      }
      
      setGameStats(prev => ({ ...prev, score: prev.score + points }));
      toast.success(`消除了 ${totalMatches} 个宝石，获得 ${points} 分！`);
    }
    
    return currentBoard;
  }, [findAllMatches, removeMatchesAndDrop, gameStats.level]);

  // 交换宝石
  const swapGems = useCallback(async (row1: number, col1: number, row2: number, col2: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // 创建交换后的棋盘
    const newBoard = board.map(row => [...row]);
    const temp = newBoard[row1][col1];
    newBoard[row1][col1] = newBoard[row2][col2];
    newBoard[row2][col2] = temp;
    
    // 更新位置信息
    newBoard[row1][col1].row = row1;
    newBoard[row1][col1].col = col1;
    newBoard[row2][col2].row = row2;
    newBoard[row2][col2].col = col2;
    
    // 检查交换后是否有匹配
    const matches = findAllMatches(newBoard);
    
    if (matches.length > 0) {
      // 有匹配，执行交换
      setBoard(newBoard);
      setGameStats(prev => ({ ...prev, moves: prev.moves - 1 }));
      
      // 处理匹配
      setTimeout(async () => {
        const finalBoard = await processMatches(newBoard);
        setBoard(finalBoard);
        setIsProcessing(false);
      }, 100);
    } else {
      // 无匹配，恢复原状
      toast.error('无法消除，请尝试其他组合');
      setIsProcessing(false);
    }
  }, [board, isProcessing, findAllMatches, processMatches]);

  // 处理宝石点击
  const handleGemClick = useCallback((row: number, col: number) => {
    if (!isGameActive || activePowerUp || isProcessing) return;
    
    if (selectedGem) {
      const { row: selectedRow, col: selectedCol } = selectedGem;
      
      // 检查是否点击同一个宝石
      if (selectedRow === row && selectedCol === col) {
        setSelectedGem(null);
        return;
      }
      
      // 检查是否相邻
      const isAdjacent = 
        (Math.abs(selectedRow - row) === 1 && selectedCol === col) ||
        (Math.abs(selectedCol - col) === 1 && selectedRow === row);
      
      if (isAdjacent) {
        swapGems(selectedRow, selectedCol, row, col);
        setSelectedGem(null);
      } else {
        setSelectedGem({ row, col });
      }
    } else {
      setSelectedGem({ row, col });
    }
  }, [selectedGem, isGameActive, activePowerUp, isProcessing, swapGems]);

  // 使用道具
  const usePowerUp = useCallback((type: string, row: number, col: number) => {
    if (!gameStats.powerUps[type as keyof typeof gameStats.powerUps] || isProcessing) return;
    
    setIsProcessing(true);
    
    // 添加道具动画效果
    const newEffect = {
      id: `effect-${Date.now()}-${Math.random()}`,
      type: type as 'bomb' | 'lightning' | 'rainbow',
      position: { row, col },
      timestamp: Date.now()
    };
    setEffects(prev => [...prev, newEffect]);
    
    const newBoard = board.map(row => [...row]);
    const matches: {row: number, col: number}[] = [];
    
    switch (type) {
      case 'bomb':
        // 炸弹：消除3x3区域
        for (let r = Math.max(0, row - 1); r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
            matches.push({row: r, col: c});
          }
        }
        break;
      case 'lightning':
        // 闪电：消除整行和整列
        for (let c = 0; c < BOARD_SIZE; c++) {
          matches.push({row, col: c});
        }
        for (let r = 0; r < BOARD_SIZE; r++) {
          matches.push({row: r, col});
        }
        break;
      case 'rainbow':
        // 彩虹：消除所有相同颜色
        const targetColor = newBoard[row][col].color;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (newBoard[r][c].color === targetColor) {
              matches.push({row: r, col: c});
            }
          }
        }
        break;
    }
    
    // 延迟执行消除，让动画先播放
    setTimeout(() => {
      const finalBoard = removeMatchesAndDrop(newBoard, matches);
      setBoard(finalBoard);
      
      setGameStats(prev => ({
        ...prev,
        score: prev.score + Math.round(matches.length * 15 * difficultyMultiplier),
        powerUps: {
          ...prev.powerUps,
          [type]: prev.powerUps[type as keyof typeof prev.powerUps] - 1
        }
      }));
      
      setActivePowerUp(null);
      toast.success(`使用了${type === 'bomb' ? '炸弹' : type === 'lightning' ? '闪电' : '彩虹'}道具！`);
      
      setTimeout(() => setIsProcessing(false), 300);
    }, 400); // 等待动画播放
  }, [gameStats.powerUps, isProcessing, board, removeMatchesAndDrop, difficultyMultiplier]);

  // 游戏计时器
  useEffect(() => {
    if (!isGameActive) return;
    
    const timer = setInterval(() => {
      setGameStats(prev => {
        if (prev.timeLeft <= 1) {
          setIsGameActive(false);
          toast.error('时间到！游戏结束');
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameActive]);

  // 处理游戏结束，保存记录
  const handleGameEnd = useCallback(async () => {
    // 提高奖励比例让玩家更容易看到效果
    const computingPowerEarned = Math.max(1, Math.floor(gameStats.score / 50)); // 每50分获得1算力，最少1算力
    const gameCoinsEarned = Math.max(10, Math.floor(gameStats.score / 5)); // 每5分获得1游戏币，最少10游戏币
    const gameDuration = 60 - gameStats.timeLeft; // 游戏时长
    
    console.log('游戏结束奖励计算:', { 
      score: gameStats.score, 
      computingPowerEarned, 
      gameCoinsEarned,
      duration: gameDuration 
    });
    
    try {
      // 保存到数据库
      await databaseService.addGameRecord({
        gameType: 'match3',
        gameName: '消消乐',
        score: gameStats.score,
        computingPowerEarned,
        duration: gameDuration,
        level: gameStats.level,
        moves: 30 - gameStats.moves // 已使用的步数
      });
      
      // 更新用户数据上下文（包含统计数据和资产更新）
      updateUserStats({
        score: gameStats.score,
        computingPowerEarned,
        gameCoinsEarned,
        playTime: gameDuration,
        gameType: '消消乐'
      });
      
      // 调用钱包服务添加奖励（这会同时更新钱包余额和添加交易记录）
      await walletService.addGameReward(computingPowerEarned, gameCoinsEarned, 'match3-game');
      
      // 触发钱包更新事件，确保个人中心实时更新
      window.dispatchEvent(new CustomEvent('wallet-updated'));
      
      console.log('游戏记录已保存并更新用户数据:', {
        score: gameStats.score,
        computingPowerEarned,
        gameCoinsEarned,
        duration: gameDuration
      });
      
      toast.success(`游戏结束！获得 ${computingPowerEarned} 算力和 ${gameCoinsEarned} 游戏币`);
    } catch (error) {
      console.error('保存游戏记录失败:', error);
      toast.error('保存游戏记录失败');
    }
  }, [gameStats, updateUserStats]);

  // 检查游戏结束条件
  useEffect(() => {
    if (!isGameActive) return;
    
    if (gameStats.moves <= 0 || gameStats.timeLeft <= 0) {
      setIsGameActive(false);
      handleGameEnd();
    }
    
    if (gameStats.score >= gameStats.target) {
      setIsGameActive(false);
      toast.success('恭喜过关！');
      handleGameEnd();
    }
  }, [gameStats, isGameActive, handleGameEnd]);

  // 初始化游戏
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/game-center" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <i className="fa-solid fa-arrow-left"></i>
                <span>返回游戏中心</span>
              </Link>
              <div className="hidden md:block w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
              <h1 className="hidden md:block text-lg font-semibold text-slate-700 dark:text-slate-200">消消乐</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                关卡 <span className="font-bold text-purple-600">{gameStats.level}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                目标 <span className="font-bold text-green-600">{gameStats.target}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* 游戏统计面板 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 分数和时间 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">分数</span>
                  <span className="text-xl font-bold text-blue-600">{gameStats.score.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">剩余步数</span>
                  <span className="text-xl font-bold text-orange-600">{gameStats.moves}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">剩余时间</span>
                  <span className="text-xl font-bold text-red-600">{formatTime(gameStats.timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* 道具面板 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-semibold mb-3">道具</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActivePowerUp(activePowerUp === 'bomb' ? null : 'bomb')}
                  disabled={gameStats.powerUps.bomb === 0}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    activePowerUp === 'bomb' 
                      ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' 
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  } ${gameStats.powerUps.bomb === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-bomb text-red-500"></i>
                    <span className="text-sm">炸弹</span>
                  </div>
                  <span className="text-sm font-bold">{gameStats.powerUps.bomb}</span>
                </button>
                
                <button
                  onClick={() => setActivePowerUp(activePowerUp === 'lightning' ? null : 'lightning')}
                  disabled={gameStats.powerUps.lightning === 0}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    activePowerUp === 'lightning' 
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' 
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  } ${gameStats.powerUps.lightning === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-bolt text-yellow-500"></i>
                    <span className="text-sm">闪电</span>
                  </div>
                  <span className="text-sm font-bold">{gameStats.powerUps.lightning}</span>
                </button>
                
                <button
                  onClick={() => setActivePowerUp(activePowerUp === 'rainbow' ? null : 'rainbow')}
                  disabled={gameStats.powerUps.rainbow === 0}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    activePowerUp === 'rainbow' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500' 
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  } ${gameStats.powerUps.rainbow === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-rainbow text-purple-500"></i>
                    <span className="text-sm">彩虹</span>
                  </div>
                  <span className="text-sm font-bold">{gameStats.powerUps.rainbow}</span>
                </button>
              </div>
              
              {activePowerUp && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                  点击游戏板使用{activePowerUp === 'bomb' ? '炸弹' : activePowerUp === 'lightning' ? '闪电' : '彩虹'}道具
                </div>
              )}
            </div>
          </div>

          {/* 游戏板 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md relative">
              <div className="grid grid-cols-8 gap-1 max-w-md mx-auto relative">
                {/* 动画效果层 */}
                <GameEffects 
                  effects={effects} 
                  onEffectComplete={(id: string) => setEffects(prev => prev.filter(effect => effect.id !== id))}
                  cellSize={48}
                />
                {board.map((row, rowIndex) =>
                  row.map((gem, colIndex) => (
                    <motion.button
                      key={gem.id}
                      onClick={() => {
                        if (activePowerUp) {
                          usePowerUp(activePowerUp, rowIndex, colIndex);
                        } else {
                          handleGemClick(rowIndex, colIndex);
                        }
                      }}
                      className={`
                        aspect-square rounded-lg shadow-md transition-all duration-200 transform hover:scale-105
                        ${colorClasses[gem.color as keyof typeof colorClasses]}
                        ${selectedGem?.row === rowIndex && selectedGem?.col === colIndex 
                          ? 'ring-4 ring-white ring-opacity-80 scale-110' 
                          : ''
                        }
                        ${activePowerUp ? 'cursor-crosshair' : 'cursor-pointer'}
                        ${isProcessing ? 'pointer-events-none' : ''}
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isProcessing}
                    >
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-white/20 to-transparent"></div>
                    </motion.button>
                  ))
                )}
              </div>
              
              {!isGameActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl"
                >
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center max-w-sm">
                    <h3 className="text-2xl font-bold mb-4">
                      {gameStats.score >= gameStats.target ? '恭喜过关！' : '游戏结束'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                      最终分数: {gameStats.score.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm"
                      >
                        再玩一次
                      </button>
                      <Link
                        to="/computing-power"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-medium transition-colors text-center text-sm"
                      >
                        查看算力
                      </Link>
                      <Link
                        to="/game-center"
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-3 rounded-lg font-medium transition-colors text-center text-sm"
                      >
                        游戏中心
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* 游戏规则 - 移到游戏板下方 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
              <GameRules gameType="match3" playerLevel={playerLevel} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}