import { createContext, useState, ReactNode, useEffect } from 'react';
import { TestAccount } from '@/data/testAccounts';
const crossPlatformAuthService = { clearToken: () => {} } as any;

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: TestAccount | null;
  setIsAuthenticated: (value: boolean) => void;
  setCurrentUser: (user: TestAccount | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  setIsAuthenticated: () => {},
  setCurrentUser: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<TestAccount | null>(null);

  // 启动时清除之前的登录状态 - 要求用户主动登录
  useEffect(() => {
    console.log('🧹 应用启动，清除之前的登录状态');
    localStorage.removeItem('currentUser');
    // 注意：不清除 newday_token 和 cross_platform_token
    // 它们在用户成功登录后由 Login.tsx 生成
  }, []);

  // 监听 localStorage 变化，同步更新 AuthContext 状态
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (e) {
          console.error('Failed to parse currentUser:', e);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    };

    // 初始检查（此时应该已经被上面的 useEffect 清除了）
    handleStorageChange();

    // 监听 storage 事件（其他标签页的变化）
    window.addEventListener('storage', handleStorageChange);
    
    // 创建自定义事件监听器（同一标签页的变化）
    const customListener = () => handleStorageChange();
    window.addEventListener('localStorageChange', customListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', customListener);
    };
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    crossPlatformAuthService.clearToken(); // 清除 New Day token
  };

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated, 
        currentUser,
        setIsAuthenticated, 
        setCurrentUser,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}