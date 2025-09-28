import { 
  PlatformParameter, 
  Vote, 
  PlatformMember, 
  PlatformData,
  VoteRecord,
  VoteResult,
  GameData
} from '@/types/platformManagement';

/**
 * 测试数据服务
 * 提供平台管理系统的测试数据
 */
class TestDataService {
  /**
   * 获取测试平台参数
   */
  getParameters(): PlatformParameter[] {
    return [
      {
        id: 'a-coin-mining-weight',
        name: 'A币挖矿权重',
        description: '用户挖矿获得A币的权重系数',
        category: 'acoin_allocation',
        currentValue: 0.7,
        minValue: 0.1,
        maxValue: 1.0,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'a-coin-staking-weight',
        name: 'A币质押权重',
        description: '用户质押获得A币的权重系数',
        category: 'acoin_allocation',
        currentValue: 0.2,
        minValue: 0.05,
        maxValue: 0.5,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'income-platform-ratio',
        name: '平台收入比例',
        description: '总收入中平台运营部分的比例',
        category: 'income_distribution',
        currentValue: 0.3,
        minValue: 0.1,
        maxValue: 0.5,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'a-coin-to-game-coin-rate',
        name: 'A币兑换游戏币比例',
        description: '1个A币可兑换的游戏币数量',
        category: 'exchange_rates',
        currentValue: 100,
        minValue: 50,
        maxValue: 200,
        step: 5,
        unit: '游戏币',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'cash-to-game-coin-rate',
        name: '现金兑换游戏币比例',
        description: '1元现金可兑换的游戏币数量',
        category: 'exchange_rates',
        currentValue: 100,
        minValue: 50,
        maxValue: 200,
        step: 10,
        unit: '游戏币',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'cash-to-computing-power-rate',
        name: '现金兑换算力比例',
        description: '1元现金可兑换的算力数量',
        category: 'exchange_rates',
        currentValue: 10,
        minValue: 5,
        maxValue: 20,
        step: 1,
        unit: '算力',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      
      // 🔶 O币绩效分配权重参数（面向未来绩效，获得期权）
      {
        id: 'ocoin-performance-revenue-weight',
        name: 'O币绩效-收入增加权重',
        description: 'O币分配中收入增加量的权重系数',
        category: 'ocoin_performance',
        currentValue: 0.3,
        minValue: 0.1,
        maxValue: 0.6,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'ocoin-performance-player-weight',
        name: 'O币绩效-玩家增加权重',
        description: 'O币分配中玩家增加量的权重系数',
        category: 'ocoin_performance',
        currentValue: 0.2,
        minValue: 0.05,
        maxValue: 0.4,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'ocoin-performance-development-weight',
        name: 'O币绩效-开发贡献权重',
        description: 'O币分配中开发贡献的权重系数',
        category: 'ocoin_performance',
        currentValue: 0.2,
        minValue: 0.05,
        maxValue: 0.4,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'ocoin-performance-management-weight',
        name: 'O币绩效-管理贡献权重',
        description: 'O币分配中管理贡献的权重系数',
        category: 'ocoin_performance',
        currentValue: 0.15,
        minValue: 0.05,
        maxValue: 0.3,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'ocoin-performance-marketing-weight',
        name: 'O币绩效-营销贡献权重',
        description: 'O币分配中营销贡献的权重系数',
        category: 'ocoin_performance',
        currentValue: 0.15,
        minValue: 0.05,
        maxValue: 0.3,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      
      // 💰 分红权重分配参数（面向历史和当下绩效，获得现金）
      {
        id: 'dividend-performance-revenue-weight',
        name: '分红权重-历史收入贡献权重',
        description: '分红分配中历史收入贡献的权重系数',
        category: 'dividend_performance',
        currentValue: 0.35,
        minValue: 0.1,
        maxValue: 0.6,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'dividend-performance-player-weight',
        name: '分红权重-历史玩家增长权重',
        description: '分红分配中历史玩家增长贡献的权重系数',
        category: 'dividend_performance',
        currentValue: 0.15,
        minValue: 0.05,
        maxValue: 0.3,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'dividend-performance-development-weight',
        name: '分红权重-历史开发贡献权重',
        description: '分红分配中历史开发贡献的权重系数',
        category: 'dividend_performance',
        currentValue: 0.2,
        minValue: 0.05,
        maxValue: 0.4,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'dividend-performance-management-weight',
        name: '分红权重-历史管理贡献权重',
        description: '分红分配中历史管理贡献的权重系数',
        category: 'dividend_performance',
        currentValue: 0.15,
        minValue: 0.05,
        maxValue: 0.3,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      },
      {
        id: 'dividend-performance-marketing-weight',
        name: '分红权重-历史营销贡献权重',
        description: '分红分配中历史营销贡献的权重系数',
        category: 'dividend_performance',
        currentValue: 0.15,
        minValue: 0.05,
        maxValue: 0.3,
        step: 0.05,
        unit: '',
        lastModified: new Date('2023-06-01'),
        modifiedBy: 'system',
        history: []
      }
    ];
  }
  
  /**
   * 获取测试成员
   */
  getMembers(): PlatformMember[] {
    return [
      {
        id: 'founder-1',
        name: 'Joan创始人',
        role: 'founder',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        hasVetoRight: true,
        joinedAt: new Date('2023-01-01'),
        isActive: true
      },
      {
        id: 'manager-1',
        name: '李管理',
        role: 'platform_manager',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        hasVetoRight: false,
        joinedAt: new Date('2023-02-15'),
        isActive: true
      },
      {
        id: 'manager-2',
        name: '王管理',
        role: 'platform_manager',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        hasVetoRight: false,
        joinedAt: new Date('2023-02-20'),
        isActive: true
      },
      {
        id: 'rep-1',
        name: '周代表',
        role: 'community_representative',
        avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
        hasVetoRight: false,
        joinedAt: new Date('2023-04-01'),
        isActive: true
      },
      {
        id: 'rep-2',
        name: '吴代表',
        role: 'community_representative',
        avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
        hasVetoRight: false,
        joinedAt: new Date('2023-04-10'),
        isActive: true
      }
    ];
  }
  
  /**
   * 获取测试投票
   */
  getVotes(): Vote[] {
    // 创建投票记录
    const voteRecords1: VoteRecord[] = [
      {
        id: 'vr-1',
        voteId: 'vote-1',
        memberId: 'rep-1',
        decision: 'approve',
        comment: '作为提议人，我支持这个提案',
        votedAt: new Date('2023-07-01')
      },
      {
        id: 'vr-2',
        voteId: 'vote-1',
        memberId: 'rep-2',
        decision: 'approve',
        comment: '同意提高挖矿权重',
        votedAt: new Date('2023-07-02')
      },
      {
        id: 'vr-3',
        voteId: 'vote-1',
        memberId: 'manager-1',
        decision: 'reject',
        comment: '当前权重已经合理，不需要调整',
        votedAt: new Date('2023-07-02')
      }
    ];
    
    const voteRecords2: VoteRecord[] = [
      {
        id: 'vr-4',
        voteId: 'vote-2',
        memberId: 'rep-1',
        decision: 'approve',
        comment: '同意降低平台收入比例',
        votedAt: new Date('2023-06-16')
      },
      {
        id: 'vr-5',
        voteId: 'vote-2',
        memberId: 'manager-1',
        decision: 'reject',
        comment: '平台运营需要足够资金支持',
        votedAt: new Date('2023-06-16')
      },
      {
        id: 'vr-6',
        voteId: 'vote-2',
        memberId: 'founder-1',
        decision: 'approve',
        comment: '支持尝试降低平台收入比例',
        votedAt: new Date('2023-06-25')
      }
    ];
    
    const result2: VoteResult = {
      approveCount: 2,
      rejectCount: 1,
      abstainCount: 0,
      founderVeto: false,
      finalStatus: 'passed',
      implementedAt: new Date('2023-06-26'),
      implementedBy: 'founder-1'
    };
    
    return [
      {
        id: 'vote-1',
        title: '提高A币挖矿权重',
        description: '提议将A币挖矿权重从0.7提高到0.8',
        parameterId: 'a-coin-mining-weight',
        currentValue: 0.7,
        proposedValue: 0.8,
        proposedBy: '周代表',
        reason: '当前挖矿权重较低，导致用户挖矿积极性不高，提高权重可以激励更多用户参与挖矿活动。',
        status: 'active',
        createdAt: new Date('2023-07-01'),
        voteRecords: voteRecords1
      },
      {
        id: 'vote-2',
        title: '降低平台收入比例',
        description: '提议将平台收入比例从0.3降低到0.25',
        parameterId: 'income-platform-ratio',
        currentValue: 0.3,
        proposedValue: 0.25,
        proposedBy: '周代表',
        reason: '降低平台收入比例，可以增加分红和生态建设的资金，更好地回馈用户和发展生态。',
        status: 'passed',
        createdAt: new Date('2023-06-15'),
        endedAt: new Date('2023-06-25'),
        voteRecords: voteRecords2,
        result: result2
      }
    ];
  }
  
  /**
   * 获取测试平台数据
   */
  getPlatformData(): PlatformData {
    const gameData: GameData[] = [
      {
        id: 'game-1',
        name: '太空探险',
        activeUsers: 25000,
        dailyRevenue: 12000,
        computingPowerGenerated: 85000
      },
      {
        id: 'game-2',
        name: '魔法世界',
        activeUsers: 18000,
        dailyRevenue: 9000,
        computingPowerGenerated: 65000
      },
      {
        id: 'game-3',
        name: '赛车竞技',
        activeUsers: 15000,
        dailyRevenue: 7500,
        computingPowerGenerated: 55000
      }
    ];
    
    return {
      acoinBalance: 10000000,
      ocoinBalance: 5000000,
      ocoinPrice: 0.5,
      totalComputingPower: 1500000,
      dailyIncome: 50000,
      dailyExpense: 30000,
      activeUsers: 35000,
      newUsers: 1200,
      gameData: gameData,
      updatedAt: new Date()
    };
  }
  
  /**
   * 初始化平台管理测试数据
   * 这个方法在测试页面中被调用，用于模拟数据初始化
   */
  async initPlatformManagementTestData(): Promise<void> {
    // 模拟异步初始化过程
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('平台管理测试数据初始化完成');
        resolve();
      }, 1000);
    });
  }
}

export default new TestDataService();