import React, { useState } from 'react';
import { gameActivityService } from '@/services/gameActivityService';
import { computingEconomicService } from '@/services/computingEconomicService';

const ComputingTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGameActivity = async () => {
    setIsLoading(true);
    addResult('开始测试游戏活动服务...');
    
    try {
      // 测试获取玩家统计
      const playerStats = await gameActivityService.getPlayerStats('test-user');
      addResult(`玩家统计: 活跃度 ${playerStats?.activityLevel || 0}, 游戏次数 ${playerStats?.totalGamesPlayed || 0}`);
      
      // 测试记录游戏活动
      await gameActivityService.recordGameActivity({
        userId: 'test-user',
        gameId: 'puzzle',
        gameName: '测试游戏',
        startTime: new Date(),
        endTime: new Date(),
        duration: 300,
        score: 100,
        level: 1,
        achievements: [],
        computingPowerEarned: 10,
        gameCoinsEarned: 50,
        activityType: 'game_play'
      });
      addResult('记录游戏活动成功');
      
      // 测试获取算力分解
      const breakdown = await gameActivityService.getPlayerComputingPowerBreakdown('test-user');
      addResult(`算力分解: 基础活动 ${breakdown.baseActivity}, 游戏表现 ${breakdown.gamePerformance}, 社交贡献 ${breakdown.socialContribution}, 总计 ${breakdown.total}`);
      
    } catch (error) {
      addResult(`游戏活动服务错误: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testEconomicService = async () => {
    setIsLoading(true);
    addResult('开始测试经济服务...');
    
    try {
      // 测试获取经济数据
      const economicData = await computingEconomicService.getComputingEconomicData();
      addResult(`经济数据: 总算力 ${economicData.totalNetworkComputingPower}, 经济价值 ${economicData.totalEconomicValue}`);
      
      // 测试获取玩家经济档案
      const profile = await computingEconomicService.getPlayerEconomicProfile('test-user');
      addResult(`玩家档案: 总算力 ${profile.computingPowerBreakdown.total}, 经济等级 ${profile.economicLevel}, 排名 ${profile.performanceRank}`);
      
      // 测试获取市场数据
      const marketData = await computingEconomicService.getComputingMarketData();
      addResult(`市场数据: 当前价格 ${marketData.currentComputingPrice}, 市场趋势 ${marketData.marketTrend}`);
      
    } catch (error) {
      addResult(`经济服务错误: ${error}`);
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">算力中心服务测试</h1>
        
        <div className="flex gap-4 mb-6">
          <button 
            onClick={testGameActivity} 
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            测试游戏活动服务
          </button>
          <button 
            onClick={testEconomicService} 
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            测试经济服务
          </button>
          <button 
            onClick={clearResults} 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            清除结果
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">测试结果:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">点击按钮开始测试...</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComputingTest;