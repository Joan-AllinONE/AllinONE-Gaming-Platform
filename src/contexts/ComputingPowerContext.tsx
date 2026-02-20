import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ComputingPowerData {
  totalPower: number;
  dailyEarnings: number;
  gameCoins: number;
  level: number;
  experience: number;
  experienceToNext: number;
  multiplier: number;
  lastUpdateTime: number;
}

interface ComputingPowerContextType {
  data: ComputingPowerData;
  addPower: (amount: number) => void;
  addGameCoins: (amount: number) => void;
  addExperience: (amount: number) => void;
  calculateEarnings: () => number;
  getNextLevelRequirement: () => number;
}

const ComputingPowerContext = createContext<ComputingPowerContextType | undefined>(undefined);

const INITIAL_DATA: ComputingPowerData = {
  totalPower: 1234,
  dailyEarnings: 32.58,
  gameCoins: 5678,
  level: 1,
  experience: 0,
  experienceToNext: 1000,
  multiplier: 1.0,
  lastUpdateTime: Date.now()
};

const LEVEL_MULTIPLIERS = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 4.0, 4.8, 5.7];
const BASE_EXPERIENCE_REQUIREMENT = 1000;

export function ComputingPowerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ComputingPowerData>(() => {
    const saved = localStorage.getItem('computingPowerData');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem('computingPowerData', JSON.stringify(data));
  }, [data]);

  // 自动计算收益
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - data.lastUpdateTime;
      const hoursElapsed = timeDiff / (1000 * 60 * 60);
      
      if (hoursElapsed >= 0.1) { // 每6分钟更新一次
        const earnings = calculateEarnings() * hoursElapsed;
        setData(prev => ({
          ...prev,
          dailyEarnings: prev.dailyEarnings + earnings,
          lastUpdateTime: now
        }));
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [data.lastUpdateTime, data.totalPower, data.multiplier]);

  const addPower = (amount: number) => {
    setData(prev => ({
      ...prev,
      totalPower: prev.totalPower + amount
    }));
  };

  const addGameCoins = (amount: number) => {
    setData(prev => ({
      ...prev,
      gameCoins: prev.gameCoins + amount
    }));
  };

  const addExperience = (amount: number) => {
    setData(prev => {
      let newExp = prev.experience + amount;
      let newLevel = prev.level;
      let newExpToNext = prev.experienceToNext;
      let newMultiplier = prev.multiplier;

      // 检查是否升级
      while (newExp >= newExpToNext && newLevel < LEVEL_MULTIPLIERS.length) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = getNextLevelRequirement(newLevel);
        newMultiplier = LEVEL_MULTIPLIERS[newLevel - 1] || LEVEL_MULTIPLIERS[LEVEL_MULTIPLIERS.length - 1];
      }

      return {
        ...prev,
        experience: newExp,
        level: newLevel,
        experienceToNext: newExpToNext,
        multiplier: newMultiplier
      };
    });
  };

  const calculateEarnings = () => {
    // 基础收益 = 算力 * 等级倍数 * 0.001
    return data.totalPower * data.multiplier * 0.001;
  };

  const getNextLevelRequirement = (level?: number) => {
    const currentLevel = level || data.level;
    return BASE_EXPERIENCE_REQUIREMENT * Math.pow(1.5, currentLevel - 1);
  };

  const value: ComputingPowerContextType = {
    data,
    addPower,
    addGameCoins,
    addExperience,
    calculateEarnings,
    getNextLevelRequirement
  };

  return (
    <ComputingPowerContext.Provider value={value}>
      {children}
    </ComputingPowerContext.Provider>
  );
}

export function useComputingPower() {
  const context = useContext(ComputingPowerContext);
  if (context === undefined) {
    throw new Error('useComputingPower must be used within a ComputingPowerProvider');
  }
  return context;
}