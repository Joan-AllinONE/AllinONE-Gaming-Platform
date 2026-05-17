/**
 * 模拟数据测试脚本
 * 用于验证平台数据收集器的模拟数据功能
 */

import { platformDataCollector } from './settlement/PlatformDataCollector';
import { algorithmVoucherService } from './services/AlgorithmVoucherService';

/**
 * 测试模拟数据收集
 */
export async function testMockDataCollection(): Promise<void> {
  console.log('=== 开始测试模拟数据收集 ===\n');

  // 1. 启用模拟数据模式
  platformDataCollector.updateConfig({
    useMockData: true,
    mockUserCount: 50,
    cacheDuration: 60000,
  });

  // 2. 收集全网数据
  console.log('1. 收集全网游戏币总量...');
  const totalGameCoins = await platformDataCollector.collectTotalGameCoins();
  console.log(`   结果: ${totalGameCoins.toLocaleString()} 游戏币`);

  console.log('\n2. 收集全网算力总量...');
  const totalComputingPower = await platformDataCollector.collectTotalComputingPower();
  console.log(`   结果: ${totalComputingPower.toLocaleString()} 算力`);

  console.log('\n3. 收集平台现金收入（人民币）...');
  const netIncome = await platformDataCollector.collectPlatformNetIncome('2026-04-01', '2026-04-28');
  console.log(`   结果: ${netIncome.toFixed(4)} A币（已按汇率转换）`);

  console.log('\n4. 收集全网交易额...');
  const transactionVolume = await platformDataCollector.collectTotalTransactionVolume('2026-04-01', '2026-04-28');
  console.log(`   结果: ${transactionVolume.toLocaleString()} A币`);

  console.log('\n5. 收集活跃用户数...');
  const activeUserCount = await platformDataCollector.collectActiveUserCount();
  console.log(`   结果: ${activeUserCount} 人`);

  console.log('\n6. 收集所有用户数据...');
  const userData = await platformDataCollector.collectAllUserData('2026-04-01', '2026-04-28');
  console.log(`   总用户数: ${userData.length} 人`);
  
  // 按游戏币排序显示
  console.log('\n   游戏币排行榜（前10名）:');
  userData
    .sort((a, b) => b.gameCoins - a.gameCoins)
    .slice(0, 10)
    .forEach((user, index) => {
      console.log(`     ${index + 1}. ${user.userName}: 游戏币=${user.gameCoins.toLocaleString()}, 算力=${user.computingPower.toLocaleString()}, 交易额=${user.transactionVolume.toLocaleString()}`);
    });
  
  // 统计各类型用户
  const stats = {
    大佬: userData.filter(u => u.userName.startsWith('大佬')).length,
    高手: userData.filter(u => u.userName.startsWith('高手')).length,
    活跃: userData.filter(u => u.userName.startsWith('活跃')).length,
    普通: userData.filter(u => u.userName.startsWith('普通')).length,
    新手: userData.filter(u => u.userName.startsWith('新手')).length,
  };
  console.log('\n   用户类型分布:', stats);

  console.log('\n=== 模拟数据收集测试完成 ===');
}

/**
 * 测试算法凭证结算流程
 */
export async function testSettlementFlow(): Promise<void> {
  console.log('\n=== 开始测试算法凭证结算流程 ===\n');

  // 清理旧的凭证数据，避免干扰
  console.log('0. 清理旧数据...');
  localStorage.removeItem('voucher_system');
  localStorage.removeItem('algorithm_voucher_system');
  // 清理所有凭证相关的localStorage数据
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('voucher_') || key.startsWith('algorithm_') || key.startsWith('USER_RESULTS:'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`   已清理 ${keysToRemove.length} 个旧数据项`);

  // 确保使用模拟数据
  platformDataCollector.updateConfig({
    useMockData: true,
    mockUserCount: 50,
    cacheDuration: 60000,
  });

  // 设置数据收集器
  algorithmVoucherService.setDataCollector(platformDataCollector);

  // 1. 获取或创建测试模板
  let templates = algorithmVoucherService.getTemplates();
  let template = templates.find(t => t.name === 'A币日结凭证（测试）');

  if (!template) {
    console.log('1. 创建测试模板...');
    template = algorithmVoucherService.createTemplate(
      {
        name: 'A币日结凭证（测试）',
        description: '用于测试的A币日结凭证模板，最小面值0.0001 A币',
        minDenomination: 0.0001,
        denominationUnit: 'ACOIN',
        settlementCycle: 'daily',
        settlementTime: '00:00',
        algorithm: {
          weights: {
            gameCoins: 0.5,
            computingPower: 0.3,
            transactionVolume: 0.2,
          },
          formula: 'standard',
          dataCollection: {
            gameCoinsPeriod: 1,
            computingPowerPeriod: 1,
            transactionPeriod: 1,
          },
        },
        poolConfig: {
          calculationMode: 'fixed',
          fixedTotalSupply: 1000,  // 平台奖池：总量1000张（总价值0.1 A币）
          minDistributionAmount: 0.0001,
          carryOverEnabled: true,
          // 游戏独立奖池（参考即时型凭证的分配逻辑：每个游戏独立计算奖池）
          gamePools: [
            {
              gameId: 'match3',
              gameName: '消消乐',
              calculationMode: 'fixed',
              fixedTotalSupply: 500,  // 消消乐奖池：固定500张
              allocation: { mode: 'fixed', fixedAmount: 500 },
              metrics: { playerCount: true, gameSessions: true },
            },
            {
              gameId: 'puzzle',
              gameName: '益智闯关',
              calculationMode: 'auto',
              allocation: { mode: 'ratio', ratio: 0.3 },  // 游戏收入的30%
              metrics: { gameRevenue: true },
            },
          ],
        },
      },
      'system',
      '系统'
    );
    console.log(`   模板创建成功: ${template.id}`);
  } else {
    console.log(`1. 使用现有模板: ${template.id}`);
  }

  // 显示模板信息
  console.log(`\n2. 模板信息:`);
  console.log(`   - 名称: ${template.name}`);
  console.log(`   - 最小面值: ${template.minDenomination} ${template.denominationUnit}`);
  console.log(`   - 总量: ${template.totalSupply?.toLocaleString()} 个`);
  console.log(`   - 总价值: ${template.totalValue} ${template.denominationUnit}`);
  if (template.poolConfig.gamePools && template.poolConfig.gamePools.length > 0) {
    console.log(`   - 游戏奖池:`);
    template.poolConfig.gamePools.forEach(gp => {
      console.log(`      * ${gp.gameName}: ${gp.calculationMode === 'fixed' ? `固定 ${gp.fixedTotalSupply} 张` : `模式=${gp.allocation.mode}, 参数=${gp.allocation.ratio || gp.allocation.fixedAmount || gp.allocation.formula || '默认'}`}`);
    });
  }

  // 3. 触发结算
  console.log(`\n3. 触发结算...`);
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await algorithmVoucherService.triggerSettlement(
      template.id,
      today,
      {
        autoIssue: true,
        minThreshold: 0.0001,
        sendNotification: true,
        detailedLogging: true,
      }
    );

    console.log(`   结算完成!`);
    console.log(`   - 状态: ${result.status}`);
    console.log(`   - 参与用户: ${result.totalParticipants} 人`);
    console.log(`   - 总发放金额: ${result.totalDistributed.toFixed(4)} A币`);
    console.log(`   - 发放凭证数: ${result.totalVouchersIssued} 个`);

    // 显示游戏奖池详情
    if ((result as any).networkSnapshot?.gamePoolDetails) {
      const details = (result as any).networkSnapshot.gamePoolDetails;
      if (details.length > 0) {
        console.log(`   - 游戏奖池分配:`);
        details.forEach((pool: any) => {
          console.log(`      * ${pool.gameName}: ${pool.amount.toFixed(4)} A币 (${pool.calculationDetail})`);
        });
      }
    }
    console.log(`   - 人均获得: ${result.averagePerUser.toFixed(4)} A币`);

    // 显示前10个用户的结算结果
    if (result.userResults.length > 0) {
      console.log(`\n4. 结算排行榜（前10名）:`);
      result.userResults
        .sort((a, b) => b.actualTotalValue - a.actualTotalValue)
        .slice(0, 10)
        .forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.userName}:`);
          console.log(`      - 贡献比例: ${(user.contributionRatio * 100).toFixed(2)}%`);
          console.log(`      - 贡献分数: ${user.contributionScore.toFixed(2)}`);
          console.log(`      - 个人数据: 币=${user.personalData.gameCoins.toLocaleString()}, 算力=${user.personalData.computingPower.toLocaleString()}, 交易=${user.personalData.transactionVolume.toLocaleString()}`);
          console.log(`      - 计算金额: ${user.calculatedAmount.toFixed(4)} A币`);
          console.log(`      - 凭证数量: ${user.actualVoucherCount} 个 × 0.0001 = ${user.actualTotalValue.toFixed(4)} A币`);
        });
      
      // 显示统计
      console.log(`\n5. 分配统计:`);
      console.log(`   - 最高获得: ${Math.max(...result.userResults.map(r => r.actualTotalValue)).toFixed(4)} A币`);
      console.log(`   - 最低获得: ${Math.min(...result.userResults.map(r => r.actualTotalValue)).toFixed(4)} A币`);
      console.log(`   - 差距倍数: ${(Math.max(...result.userResults.map(r => r.actualTotalValue)) / Math.max(0.0001, Math.min(...result.userResults.map(r => r.actualTotalValue)))).toFixed(1)}倍`);
    }
  } catch (error) {
    console.error('   结算失败:', error);
  }

  console.log('\n=== 算法凭证结算流程测试完成 ===');
}

/**
 * 运行所有测试
 */
export async function runAllTests(): Promise<void> {
  await testMockDataCollection();
  await testSettlementFlow();
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 浏览器环境，挂载到 window
  (window as any).testMockData = {
    testMockDataCollection,
    testSettlementFlow,
    runAllTests,
  };
  console.log('模拟数据测试工具已挂载到 window.testMockData');
}
