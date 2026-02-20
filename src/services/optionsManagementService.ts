import oCoinService from './oCoinService';
import { walletService } from './walletService';
import { OCoinOption } from '@/types/oCoin';

/**
 * 期权池状态
 */
interface OptionsPool {
  totalGranted: number;
  totalVested: number;
  totalExercised: number;
  totalUnlocked: number; // 新增：已解禁但未行权的O币
  participatingUsers: number;
  averageStrikePrice: number;
  lastUpdateTime: Date;
}

/**
 * 用户期权信息
 */
interface UserOptionsInfo {
  userId: string;
  totalOptions: number;
  vestedOptions: number;
  exercisedOptions: number;
  unlockedOptions: number; // 新增：已解禁但未行权的期权
  strikePrice: number;
  grantDate: Date;
  options: OCoinOption[];
}

/**
 * 期权管理服务
 * 负责管理O币期权的授予、成熟、解禁和行权
 */
class OptionsManagementService {
  private readonly STORAGE_KEY = 'options_management_data';
  private readonly FUND_POOL_KEY = 'options_fund_pool_data';
  
  /**
   * 获取资金池中O币的数据
   */
  getFundPoolOCoinData(): {
    totalLockedOCoins: number;
    totalUnlockedOCoins: number;
    lastUpdated: Date;
  } {
    try {
      const data = localStorage.getItem(this.FUND_POOL_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('获取资金池O币数据失败:', error);
    }
    
    // 返回默认数据
    return {
      totalLockedOCoins: 0,
      totalUnlockedOCoins: 0,
      lastUpdated: new Date()
    };
  }
  
  /**
   * 更新资金池O币数据
   */
  private updateFundPoolOCoinData(lockedChange: number, unlockedChange: number): void {
    const currentData = this.getFundPoolOCoinData();
    const updatedData = {
      totalLockedOCoins: Math.max(0, currentData.totalLockedOCoins + lockedChange),
      totalUnlockedOCoins: Math.max(0, currentData.totalUnlockedOCoins + unlockedChange),
      lastUpdated: new Date()
    };
    
    localStorage.setItem(this.FUND_POOL_KEY, JSON.stringify(updatedData));
    console.log('💰 资金池O币数据更新:', updatedData);
  }
  
  /**
   * 基于绩效计算结果授予期权（O币存入资金池）
   */
  async grantOptionsFromPerformance(
    calculationResults: Array<{
      userId: string;
      oCoinAmount: number;
      totalScore: number;
    }>,
    currentPrice: number = 2.50
  ): Promise<{ totalGranted: number; grantedUsers: number; details: Array<{ userId: string; amount: number; strikePrice: number }> }> {
    const grantDetails: Array<{ userId: string; amount: number; strikePrice: number }> = [];
    let totalOCoinsToPool = 0;
    
    for (const result of calculationResults) {
      try {
        // 将O币计算结果转换为期权数量（1:1比例）
        const optionAmount = result.oCoinAmount;
        
        // 设置执行价格（当前市价 + 小幅溢价作为激励）
        const strikePrice = Number((currentPrice * 0.95).toFixed(2)); // 5%折扣作为激励
        
        // 授予期权（O币将存入资金池，不直接给用户）
        const option = oCoinService.grantOption(result.userId, optionAmount, 365); // 1年归属期
        
        grantDetails.push({
          userId: result.userId,
          amount: optionAmount,
          strikePrice: strikePrice
        });
        
        totalOCoinsToPool += optionAmount;
        
        console.log(`✅ 用户 ${result.userId} 获得 ${optionAmount} 个期权，执行价: ¥${strikePrice}，对应O币存入资金池`);
      } catch (error) {
        console.error(`❌ 为用户 ${result.userId} 授予期权失败:`, error);
      }
    }
    
    // 将对应的O币数量存入资金池（作为未解禁状态）
    if (totalOCoinsToPool > 0) {
      this.updateFundPoolOCoinData(totalOCoinsToPool, 0);
      console.log(`💰 将 ${totalOCoinsToPool.toLocaleString()} 个O币存入资金池（未解禁状态）`);
    }
    
    return {
      totalGranted: grantDetails.reduce((sum, detail) => sum + detail.amount, 0),
      grantedUsers: grantDetails.length,
      details: grantDetails
    };
  }
  
  /**
   * 获取期权池统计数据
   */
  getOptionsPoolStats(): OptionsPool {
    try {
      // 获取所有用户的期权信息
      const allUserOptions = this.getAllUserOptions();
      
      let totalGranted = 0;
      let totalVested = 0;
      let totalExercised = 0;
      let totalStrikeValue = 0;
      let optionCount = 0;
      const userIds = new Set<string>();
      
      allUserOptions.forEach(userInfo => {
        userIds.add(userInfo.userId);
        totalGranted += userInfo.totalOptions;
        totalVested += userInfo.vestedOptions;
        totalExercised += userInfo.exercisedOptions;
        
        userInfo.options.forEach(option => {
          // 假设执行价格存储在选项中（这里需要扩展OCoinOption类型）
          totalStrikeValue += 2.50; // 暂时使用固定价格，后续可改进
          optionCount++;
        });
      });
      
      return {
        totalGranted,
        totalVested,
        totalExercised,
        totalUnlocked: 0, // 添加缺少的totalUnlocked属性
        participatingUsers: userIds.size,
        averageStrikePrice: optionCount > 0 ? totalStrikeValue / optionCount : 0,
        lastUpdateTime: new Date()
      };
    } catch (error) {
      console.error('获取期权池统计失败:', error);
      return {
        totalGranted: 0,
        totalVested: 0,
        totalExercised: 0,
        totalUnlocked: 0, // 添加缺少的totalUnlocked属性
        participatingUsers: 0,
        averageStrikePrice: 0,
        lastUpdateTime: new Date()
      };
    }
  }
  
  /**
   * 获取所有用户的期权信息
   */
  private getAllUserOptions(): UserOptionsInfo[] {
    // 这里需要遍历所有用户，获取他们的期权信息
    // 由于没有用户列表，我们使用测试用户
    const testUsers = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
    
    return testUsers.map(userId => {
      const userOptions = oCoinService.getUserOptions(userId);
      
      const totalOptions = userOptions.reduce((sum, option) => sum + option.amount, 0);
      const vestedOptions = userOptions.reduce((sum, option) => sum + option.vestedAmount, 0);
      const exercisedOptions = 0; // 暂时没有行权记录，需要后续扩展
      
      return {
        userId,
        totalOptions,
        vestedOptions,
        exercisedOptions,
        unlockedOptions: vestedOptions, // 添加缺少的unlockedOptions属性
        strikePrice: 2.50, // 固定价格，后续可改进
        grantDate: userOptions.length > 0 ? userOptions[0].grantDate : new Date(),
        options: userOptions
      };
    }).filter(info => info.totalOptions > 0); // 只返回有期权的用户
  }
  
  /**
   * 获取顶级期权持有者
   */
  getTopOptionHolders(limit: number = 10): Array<{
    userId: string;
    totalOptions: number;
    vestedOptions: number;
    strikePrice: number;
  }> {
    const allUserOptions = this.getAllUserOptions();
    
    return allUserOptions
      .sort((a, b) => b.totalOptions - a.totalOptions)
      .slice(0, limit)
      .map(userInfo => ({
        userId: userInfo.userId,
        totalOptions: userInfo.totalOptions,
        vestedOptions: userInfo.vestedOptions,
        strikePrice: userInfo.strikePrice
      }));
  }
  
  /**
   * 批量处理期权成熟（将成熟的O币从资金池发放到个人账户）
   */
  async processVesting(): Promise<{ totalVested: number; affectedUsers: number; totalUnlocked: number }> {
    const allUserOptions = this.getAllUserOptions();
    let totalVested = 0;
    let totalUnlocked = 0;
    let affectedUsers = 0;
    
    for (const userInfo of allUserOptions) {
      let userUnlockedAmount = 0;
      
      for (const option of userInfo.options) {
        if (!option.isFullyVested) {
          // 计算应该成熟的数量
          const now = new Date();
          const daysPassed = Math.floor((now.getTime() - option.grantDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysPassed > 0) {
            const dailyVest = option.amount / option.vestingPeriod;
            const shouldBeVested = Math.min(dailyVest * daysPassed, option.amount);
            const newVest = shouldBeVested - option.vestedAmount;
            
            if (newVest > 0) {
              try {
                // 更新期权成熟状态
                oCoinService.vestOption(option.id, newVest);
                totalVested += newVest;
                userUnlockedAmount += newVest;
                
                console.log(`✨ 用户 ${userInfo.userId} 期权 ${option.id} 成熟 ${newVest.toFixed(2)} 个`);
              } catch (error) {
                console.error(`期权成熟处理失败: ${option.id}`, error);
              }
            }
          }
        }
      }
      
      // 如果该用户有O币解禁，将其发放到个人账户
      if (userUnlockedAmount > 0) {
        try {
          // 从资金池移除锁定的O币
          this.updateFundPoolOCoinData(-userUnlockedAmount, 0);
          
          // 发放到用户个人账户
          await walletService.recordOCoinVesting(userUnlockedAmount, `期权解禁 - ${userUnlockedAmount.toFixed(2)} O币`);
          
          totalUnlocked += userUnlockedAmount;
          affectedUsers++;
          
          console.log(`💰 用户 ${userInfo.userId} 获得 ${userUnlockedAmount.toFixed(2)} 个解禁O币，已发放到个人账户`);
        } catch (error) {
          console.error(`发放O币到个人账户失败: ${userInfo.userId}`, error);
        }
      }
    }
    
    return { totalVested, affectedUsers, totalUnlocked };
  }
  
  /**
   * 执行期权行权
   */
  async exerciseOptions(
    userId: string,
    amount: number,
    currentMarketPrice: number
  ): Promise<{ 
    success: boolean; 
    exercisedAmount: number; 
    profit: number; 
    message: string;
  }> {
    try {
      const userOptions = oCoinService.getUserOptions(userId);
      
      // 计算可行权数量
      const totalVested = userOptions.reduce((sum, option) => sum + option.vestedAmount, 0);
      
      if (amount > totalVested) {
        return {
          success: false,
          exercisedAmount: 0,
          profit: 0,
          message: `行权数量(${amount})超过已成熟期权数量(${totalVested})`
        };
      }
      
      // 计算平均执行价格
      const averageStrikePrice = 2.50; // 暂时固定，后续改进
      
      if (currentMarketPrice <= averageStrikePrice) {
        return {
          success: false,
          exercisedAmount: 0,
          profit: 0,
          message: `当前市价(¥${currentMarketPrice})低于执行价(¥${averageStrikePrice})，行权无收益`
        };
      }
      
      // 计算收益
      const profit = (currentMarketPrice - averageStrikePrice) * amount;
      
      // 执行行权（添加O币余额）
      const userBalance = oCoinService.getUserBalance(userId);
      userBalance.availableBalance += amount;
      
      return {
        success: true,
        exercisedAmount: amount,
        profit: profit,
        message: `成功行权 ${amount} 个期权，获得收益 ¥${profit.toFixed(2)}`
      };
    } catch (error) {
      console.error('期权行权失败:', error);
      return {
        success: false,
        exercisedAmount: 0,
        profit: 0,
        message: `行权失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
  
  /**
   * 清空期权数据（测试用）
   */
  clearOptionsData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('✅ 期权数据已清空');
  }
}

export const optionsManagementService = new OptionsManagementService();
export default optionsManagementService;