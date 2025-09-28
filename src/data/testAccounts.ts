// 测试账号数据
export interface TestAccount {
  username: string;
  password: string;
  email: string;
  profile: {
    nickname: string;
    avatar: string;
    level: number;
    joinDate: string;
    totalGames: number;
    totalEarnings: number;
  };
  gameData: {
    totalPower: number;
    dailyEarnings: number;
    gameCoins: number;
    level: number;
    experience: number;
    experienceToNext: number;
    multiplier: number;
  };
  gameHistory: Array<{
    date: string;
    game: string;
    score: number;
    earnings: number;
    powerGained: number;
  }>;
}

export const testAccounts: TestAccount[] = [
  {
    username: "player001",
    password: "Test123456",
    email: "player001@allinone.com",
    profile: {
      nickname: "游戏达人",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=player001",
      level: 5,
      joinDate: "2024-12-01",
      totalGames: 156,
      totalEarnings: 2847.32
    },
    gameData: {
      totalPower: 3450,
      dailyEarnings: 78.45,
      gameCoins: 12580,
      level: 5,
      experience: 2340,
      experienceToNext: 3500,
      multiplier: 2.2
    },
    gameHistory: [
      {
        date: "2025-01-20",
        game: "消消乐",
        score: 15600,
        earnings: 45.2,
        powerGained: 156
      },
      {
        date: "2025-01-19",
        game: "消消乐",
        score: 12800,
        earnings: 38.7,
        powerGained: 128
      },
      {
        date: "2025-01-18",
        game: "消消乐",
        score: 18900,
        earnings: 52.1,
        powerGained: 189
      }
    ]
  },
  {
    username: "newbie2025",
    password: "Welcome123",
    email: "newbie@allinone.com",
    profile: {
      nickname: "新手小白",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=newbie2025",
      level: 1,
      joinDate: "2025-01-15",
      totalGames: 8,
      totalEarnings: 45.67
    },
    gameData: {
      totalPower: 1234,
      dailyEarnings: 12.34,
      gameCoins: 890,
      level: 1,
      experience: 450,
      experienceToNext: 1000,
      multiplier: 1.0
    },
    gameHistory: [
      {
        date: "2025-01-20",
        game: "消消乐",
        score: 3200,
        earnings: 8.5,
        powerGained: 32
      },
      {
        date: "2025-01-19",
        game: "消消乐",
        score: 2800,
        earnings: 7.2,
        powerGained: 28
      }
    ]
  },
  {
    username: "master_gamer",
    password: "Master2025!",
    email: "master@allinone.com",
    profile: {
      nickname: "算力大师",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=master_gamer",
      level: 8,
      joinDate: "2024-10-15",
      totalGames: 567,
      totalEarnings: 15678.90
    },
    gameData: {
      totalPower: 8750,
      dailyEarnings: 234.56,
      gameCoins: 45670,
      level: 8,
      experience: 4560,
      experienceToNext: 6000,
      multiplier: 4.8
    },
    gameHistory: [
      {
        date: "2025-01-20",
        game: "消消乐",
        score: 45600,
        earnings: 156.8,
        powerGained: 456
      },
      {
        date: "2025-01-19",
        game: "消消乐",
        score: 38900,
        earnings: 134.2,
        powerGained: 389
      },
      {
        date: "2025-01-18",
        game: "消消乐",
        score: 52300,
        earnings: 178.9,
        powerGained: 523
      }
    ]
  },
  {
    username: "casual_player",
    password: "Casual123",
    email: "casual@allinone.com",
    profile: {
      nickname: "休闲玩家",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=casual_player",
      level: 3,
      joinDate: "2024-11-20",
      totalGames: 89,
      totalEarnings: 567.89
    },
    gameData: {
      totalPower: 2100,
      dailyEarnings: 34.56,
      gameCoins: 3450,
      level: 3,
      experience: 1200,
      experienceToNext: 2250,
      multiplier: 1.5
    },
    gameHistory: [
      {
        date: "2025-01-20",
        game: "消消乐",
        score: 8900,
        earnings: 23.4,
        powerGained: 89
      },
      {
        date: "2025-01-18",
        game: "消消乐",
        score: 7600,
        earnings: 19.8,
        powerGained: 76
      }
    ]
  },
  {
    username: "vip_user",
    password: "VIP2025@",
    email: "vip@allinone.com",
    profile: {
      nickname: "VIP会员",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vip_user",
      level: 10,
      joinDate: "2024-08-01",
      totalGames: 1234,
      totalEarnings: 45678.12
    },
    gameData: {
      totalPower: 15600,
      dailyEarnings: 456.78,
      gameCoins: 89000,
      level: 10,
      experience: 8900,
      experienceToNext: 10000,
      multiplier: 5.7
    },
    gameHistory: [
      {
        date: "2025-01-20",
        game: "消消乐",
        score: 78900,
        earnings: 289.5,
        powerGained: 789
      },
      {
        date: "2025-01-19",
        game: "消消乐",
        score: 65400,
        earnings: 234.8,
        powerGained: 654
      },
      {
        date: "2025-01-18",
        game: "消消乐",
        score: 89600,
        earnings: 345.2,
        powerGained: 896
      }
    ]
  }
];

// 获取测试账号
export const getTestAccount = (username: string): TestAccount | undefined => {
  return testAccounts.find(account => account.username === username);
};

// 验证测试账号
export const validateTestAccount = (username: string, password: string): TestAccount | null => {
  const account = testAccounts.find(
    acc => acc.username === username && acc.password === password
  );
  return account || null;
};

// 获取所有测试账号的用户名和密码（用于展示）
export const getTestAccountCredentials = () => {
  return testAccounts.map(account => ({
    username: account.username,
    password: account.password,
    nickname: account.profile.nickname,
    level: account.profile.level
  }));
};