import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTestAccountCredentials } from '@/data/testAccounts';

export default function TestAccounts() {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const testCredentials = getTestAccountCredentials();

  const copyToClipboard = async (text: string, accountId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(accountId);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    if (level >= 5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    if (level >= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getLevelBadge = (level: number) => {
    if (level >= 10) return '👑 VIP会员';
    if (level >= 8) return '💎 算力大师';
    if (level >= 5) return '🎮 游戏达人';
    if (level >= 3) return '🌟 休闲玩家';
    return '🌱 新手小白';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 导航栏 */}
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                AllinONE
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            测试账号列表
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            选择任意账号体验不同等级的游戏数据和算力收益
          </p>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <i className="fa-solid fa-info-circle text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                使用说明
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
                <li>• 点击用户名或密码可快速复制到剪贴板</li>
                <li>• 不同等级的账号拥有不同的游戏数据和算力收益</li>
                <li>• 建议从低等级账号开始体验，了解游戏成长过程</li>
                <li>• 所有测试数据仅用于演示，不代表真实收益</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 账号列表 */}
        <div className="grid gap-6 md:grid-cols-2">
          {testCredentials.map((account, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                {/* 账号头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {account.nickname.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {account.nickname}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(account.level)}`}>
                          Lv.{account.level}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {getLevelBadge(account.level)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 登录信息 */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      用户名
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white">
                        {account.username}
                      </code>
                      <button
                        onClick={() => copyToClipboard(account.username, `${index}-username`)}
                        className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                        title="复制用户名"
                      >
                        {copiedAccount === `${index}-username` ? (
                          <i className="fa-solid fa-check text-green-600"></i>
                        ) : (
                          <i className="fa-solid fa-copy"></i>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      密码
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white">
                        {account.password}
                      </code>
                      <button
                        onClick={() => copyToClipboard(account.password, `${index}-password`)}
                        className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                        title="复制密码"
                      >
                        {copiedAccount === `${index}-password` ? (
                          <i className="fa-solid fa-check text-green-600"></i>
                        ) : (
                          <i className="fa-solid fa-copy"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 快速登录按钮 */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <i className="fa-solid fa-sign-in-alt"></i>
                    使用此账号登录
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              需要帮助？
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              如果您在使用测试账号时遇到任何问题，请联系我们的技术支持团队
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                <i className="fa-solid fa-envelope mr-1"></i>
                support@allinone.com
              </a>
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                <i className="fa-brands fa-qq mr-1"></i>
                QQ群: 123456789
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}