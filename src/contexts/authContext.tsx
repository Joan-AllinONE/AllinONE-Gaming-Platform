import { createContext, useState, ReactNode, useEffect } from 'react';
import { TestAccount } from '@/data/testAccounts';

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

  // 初始化时检查本地存储的用户数据
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
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