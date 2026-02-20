import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import testDataService from '@/services/testDataService';

/**
 * 平台管理系统测试页面
 * 用于初始化测试数据并提供进入平台管理系统的入口
 */
const PlatformManagementTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitTestData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await testDataService.initPlatformManagementTestData();
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化测试数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">平台管理系统测试</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            初始化测试数据并进入平台管理系统
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {initialized && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            测试数据初始化成功！您现在可以进入平台管理系统。
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleInitTestData}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                初始化中...
              </>
            ) : (
              '初始化测试数据'
            )}
          </button>

          <Link
            to="/platform-management"
            className="block w-full py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors text-center"
          >
            进入平台管理系统
          </Link>

          <Link
            to="/"
            className="block w-full py-3 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg font-medium transition-colors text-center"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlatformManagementTest;