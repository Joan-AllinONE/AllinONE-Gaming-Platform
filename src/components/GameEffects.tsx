import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Effect {
  id: string;
  type: 'bomb' | 'lightning' | 'rainbow' | 'match' | 'combo';
  position: { row: number; col: number };
  timestamp: number;
}

interface GameEffectsProps {
  effects: Effect[];
  onEffectComplete: (id: string) => void;
  cellSize?: number;
}

export default function GameEffects({ effects, onEffectComplete, cellSize = 48 }: GameEffectsProps) {
  const [activeEffects, setActiveEffects] = useState<Effect[]>([]);

  useEffect(() => {
    setActiveEffects(effects);
  }, [effects]);

  const getEffectComponent = (effect: Effect) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: effect.position.col * (cellSize + 4) + 'px',
      top: effect.position.row * (cellSize + 4) + 'px',
      width: cellSize + 'px',
      height: cellSize + 'px',
      pointerEvents: 'none' as const,
      zIndex: 100
    };

    switch (effect.type) {
      case 'bomb':
        return (
          <motion.div
            key={effect.id}
            style={baseStyle}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: [0, 2, 0],
              opacity: [1, 1, 0]
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
            onAnimationComplete={() => onEffectComplete(effect.id)}
            className="flex items-center justify-center"
          >
            <div className="text-4xl">💥</div>
          </motion.div>
        );

      case 'lightning':
        return (
          <motion.div
            key={effect.id}
            style={baseStyle}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ 
              duration: 0.8
            }}
            onAnimationComplete={() => onEffectComplete(effect.id)}
            className="flex items-center justify-center"
          >
            <div className="text-4xl">⚡</div>
          </motion.div>
        );

      case 'rainbow':
        return (
          <motion.div
            key={effect.id}
            style={baseStyle}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 1 }}
            onAnimationComplete={() => onEffectComplete(effect.id)}
            className="flex items-center justify-center"
          >
            <div className="text-4xl">🌈</div>
          </motion.div>
        );

      case 'match':
        return (
          <motion.div
            key={effect.id}
            style={baseStyle}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [1, 1.3, 0],
              y: [0, -30]
            }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => onEffectComplete(effect.id)}
            className="flex items-center justify-center"
          >
            <div className="text-2xl">✨</div>
          </motion.div>
        );

      case 'combo':
        return (
          <motion.div
            key={effect.id}
            style={baseStyle}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              y: [0, -50]
            }}
            transition={{ duration: 0.8 }}
            onAnimationComplete={() => onEffectComplete(effect.id)}
            className="flex items-center justify-center"
          >
            <div className="bg-purple-600 text-white px-2 py-1 rounded font-bold text-sm">
              COMBO!
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {activeEffects.map(effect => getEffectComponent(effect))}
      </AnimatePresence>
    </div>
  );
}