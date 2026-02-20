import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databaseService } from '@/services/database';

export default function ComputingPowerPageSimple() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('开始加载算力数据...');
        const userData = await databaseService.getUserComputingData();
        console.log('算力数据加载成功:', userData);
        setData(userData);
      } catch (err) {
        console.error('加载数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载算力数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-4">错误信息: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p>没有数据</p>
          <Link to="/game-center" className="text-blue-600 hover:underline">
            返回游戏中心
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">算力数据中心 (简化版)</h1>
            <div className="flex gap-4">
              <Link to="/game-center" className="text-blue-600 hover:underline">
                游戏中心
              </Link>
              <Link to="/computing-power" className="text-blue-600 hover:underline">
                完整版
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">用户信息</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>用户名:</strong> {data.user?.username || 'N/A'}</p>
              <p><strong>等级:</strong> {data.stats?.currentRank || 'N/A'}</p>
            </div>
            <div>
              <p><strong>总算力:</strong> {data.stats?.totalComputingPower || 0}</p>
              <p><strong>游戏局数:</strong> {data.stats?.totalGamesPlayed || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">最近游戏记录</h2>
          {data.recentGames && data.recentGames.length > 0 ? (
            <div className="space-y-2">
              {data.recentGames.map((game: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{game.gameName}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(game.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{game.score}</div>
                    <div className="text-sm text-green-600">+{game.computingPowerEarned} 算力</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">还没有游戏记录</p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link 
            to="/game/match3"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            开始游戏
          </Link>
        </div>
      </main>
    </div>
  );
}