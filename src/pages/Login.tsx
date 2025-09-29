import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';
import { validateTestAccount, getTestAccountCredentials } from '@/data/testAccounts';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const { setIsAuthenticated, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const testCredentials = getTestAccountCredentials();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 验证测试账号
    setTimeout(() => {
      if (username && password) {
        const account = validateTestAccount(username, password);
        if (account) {
          // 保存用户数据到localStorage
          localStorage.setItem('currentUser', JSON.stringify(account));
          setCurrentUser(account);
          setIsAuthenticated(true);
          toast.success(`欢迎回来，${account.profile.nickname}！`);
          navigate('/');
        } else {
          toast.error('用户名或密码错误');
        }
      } else {
        toast.error('请输入用户名和密码');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleTestAccountLogin = (testUsername: string, testPassword: string) => {
    setUsername(testUsername);
    setPassword(testPassword);
    setShowTestAccounts(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AllinONE</span>
          </div>
          <h1 className="text-2xl font-bold">{t(dict,'login.title')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t(dict,'login.subtitle')}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                {t(dict,'login.labels.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-user text-slate-400"></i>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t(dict,'login.placeholders.username')}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                {t(dict,'login.labels.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-slate-400"></i>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t(dict,'login.placeholders.password')}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  {t(dict,'login.labels.rememberMe')}
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  {t(dict,'login.labels.forgotPassword')}
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-80 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    {t(dict,'common.buttons.loadingLogin')}
                  </>
                ) : t(dict,'common.buttons.login')
                }
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t(dict,'login.noAccountPrompt')}{' '}
              <Link to="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                {t(dict,'login.registerLink')}
              </Link>
            </p>
          </div>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {t(dict,'login.test.title')}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <i className="fa-solid fa-vial text-green-600"></i>
                {showTestAccounts ? t(dict,'login.test.hide') : t(dict,'login.test.show')}
                <i className={`fa-solid fa-chevron-${showTestAccounts ? 'up' : 'down'} text-xs`}></i>
              </button>
              
              {showTestAccounts && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2">
                    {t(dict,'login.test.clickTip')}
                  </div>
                  {testCredentials.map((account, index) => (
                    <div
                      key={index}
                      onClick={() => handleTestAccountLogin(account.username, account.password)}
                      className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {account.nickname}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {account.username}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                            Lv.{account.level}
                          </span>
                          <i className="fa-solid fa-arrow-right text-xs text-slate-400"></i>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {t(dict,'login.test.password')}: {account.password}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
              <div className="mt-6 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 text-sm">
                    <i className="fa-solid fa-info-circle"></i>
                    <span className="font-medium">{t(dict,'login.test.infoTitle')}</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 mb-2">
                    {t(dict,'login.test.infoDesc')}
                  </p>
                  <Link 
                    to="/test-accounts"
                    className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 font-medium underline"
                  >
                    <i className="fa-solid fa-external-link"></i>
                    {t(dict,'login.test.viewList')}
                  </Link>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}