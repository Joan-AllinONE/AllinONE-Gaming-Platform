import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 用户数据类型定义
export interface UserStats {
  totalGames: number;
  totalScore: number;
  totalComputingPower: number;
  totalGameCoins: number;
  averageScore: number;
  bestScore: number;
  playTime: number; // 总游戏时长（分钟）
  level: number;
  experience: number;
  achievements: string[];
  dailyStreak: number; // 连续登录天数
  lastLoginDate: string;
}

export interface UserAssets {
  computingPower: number;
  gameCoins: number;
  realMoney: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    type: string;
  }>;
}

export interface UserData {
  userId: string;
  username: string;
  stats: UserStats;
  assets: UserAssets;
  recentActivities: Array<{
    id: string;
    type: 'game' | 'purchase' | 'trade' | 'reward';
    description: string;
    timestamp: Date;
    value?: number;
  }>;
}

interface UserDataContextType {
  userData: UserData;
  updateUserStats: (gameResult: {
    score: number;
    computingPowerEarned: number;
    gameCoinsEarned: number;
    playTime: number;
    gameType: string;
  }) => void;
  updateUserAssets: (assets: Partial<UserAssets>) => void;
  addActivity: (activity: Omit<UserData['recentActivities'][0], 'id' | 'timestamp'>) => void;
  refreshUserData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// 默认用户数据
const defaultUserData: UserData = {
  userId: 'current-user',
  username: '游戏玩家',
  stats: {
    totalGames: 0,
    totalScore: 0,
    totalComputingPower: 0,
    totalGameCoins: 0,
    averageScore: 0,
    bestScore: 0,
    playTime: 0,
    level: 1,
    experience: 0,
    achievements: [],
    dailyStreak: 1,
    lastLoginDate: new Date().toISOString().split('T')[0]
  },
  assets: {
    computingPower: 1000,
    gameCoins: 500,
    realMoney: 0,
    items: []
  },
  recentActivities: []
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>(() => {
    // 从 localStorage 加载用户数据
    const saved = localStorage.getItem('allinone-user-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 确保数据结构完整
        return {
          ...defaultUserData,
          ...parsed,
          stats: { ...defaultUserData.stats, ...parsed.stats },
          assets: { ...defaultUserData.assets, ...parsed.assets }
        };
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
      }
    }
    return defaultUserData;
  });

  // 保存用户数据到 localStorage
  const saveUserData = (data: UserData) => {
    localStorage.setItem('allinone-user-data', JSON.stringify(data));
  };

  // 更新用户游戏统计
  const updateUserStats = (gameResult: {
    score: number;
    computingPowerEarned: number;
    gameCoinsEarned: number;
    playTime: number;
    gameType: string;
  }) => {
    setUserData(prev => {
      const newStats = {
        ...prev.stats,
        totalGames: prev.stats.totalGames + 1,
        totalScore: prev.stats.totalScore + gameResult.score,
        totalComputingPower: prev.stats.totalComputingPower + gameResult.computingPowerEarned,
        totalGameCoins: prev.stats.totalGameCoins + gameResult.gameCoinsEarned,
        playTime: prev.stats.playTime + gameResult.playTime,
        bestScore: Math.max(prev.stats.bestScore, gameResult.score),
        experience: prev.stats.experience + Math.floor(gameResult.score / 100)
      };
      
      // 计算平均分
      newStats.averageScore = Math.round(newStats.totalScore / newStats.totalGames);
      
      // 计算等级（每1000经验升一级）
      newStats.level = Math.floor(newStats.experience / 1000) + 1;

      const newActivity = {
        id: Date.now().toString(),
        type: 'game' as const,
        description: `完成${gameResult.gameType}游戏，获得${gameResult.score}分`,
        timestamp: new Date(),
        value: gameResult.score
      };

      const newData = {
        ...prev,
        stats: newStats,
        // 移除资产更新，资产由钱包服务统一管理
        recentActivities: [newActivity, ...prev.recentActivities.slice(0, 19)] // 保留最近20条记录
      };

      saveUserData(newData);
      return newData;
    });
  };

  // 更新用户资产
  const updateUserAssets = (assets: Partial<UserAssets>) => {
    setUserData(prev => {
      const newData = {
        ...prev,
        assets: { ...prev.assets, ...assets }
      };
      saveUserData(newData);
      return newData;
    });
  };

  // 添加活动记录
  const addActivity = (activity: Omit<UserData['recentActivities'][0], 'id' | 'timestamp'>) => {
    setUserData(prev => {
      const newActivity = {
        ...activity,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      const newData = {
        ...prev,
        recentActivities: [newActivity, ...prev.recentActivities.slice(0, 19)]
      };

      saveUserData(newData);
      return newData;
    });
  };

  // 刷新用户数据（从服务器获取最新数据）
  const refreshUserData = async () => {
    try {
      // 这里可以调用API获取最新的用户数据
      // const response = await fetch('/api/user/data');
      // const serverData = await response.json();
      // setUserData(serverData);
      
      // 目前使用本地数据，实际项目中应该从服务器获取
      console.log('用户数据已刷新');
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // 检查每日登录
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (userData.stats.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const newStreak = userData.stats.lastLoginDate === yesterdayStr 
        ? userData.stats.dailyStreak + 1 
        : 1;

      setUserData(prev => {
        const newData = {
          ...prev,
          stats: {
            ...prev.stats,
            dailyStreak: newStreak,
            lastLoginDate: today
          }
        };
        saveUserData(newData);
        return newData;
      });

      // 添加每日登录奖励
      addActivity({
        type: 'reward',
        description: `每日登录奖励，连续登录${newStreak}天`,
        value: newStreak * 10
      });
    }
  }, []);

  return (
    <UserDataContext.Provider value={{
      userData,
      updateUserStats,
      updateUserAssets,
      addActivity,
      refreshUserData
    }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}