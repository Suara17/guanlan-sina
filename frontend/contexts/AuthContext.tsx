import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { testTokenApiV1LoginTestTokenPost, readUserMeApiV1UsersMeGet, loginAccessTokenApiV1LoginAccessTokenPost } from '../src/client/sdk.gen';
import { UserPublic, Token } from '../src/client/types.gen';

// 认证状态类型
interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 认证上下文类型
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件的props类型
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 认证状态
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // 初始时设置为true，表示正在检查认证状态
    error: null,
  });

  // 清除错误
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  // 更新认证状态
  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  };

  // 检查token是否有效
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      await testTokenApiV1LoginTestTokenPost();
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // 获取用户信息
  const fetchUserInfo = async (): Promise<UserPublic | null> => {
    try {
      const response = await readUserMeApiV1UsersMeGet();
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  };

  // 检查认证状态
  const checkAuth = async (): Promise<void> => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    updateAuthState({ isLoading: true, error: null });

    try {
      // 验证token
      const isValid = await validateToken(token);
      if (!isValid) {
        throw new Error('Invalid token');
      }

      // 获取用户信息
      const user = await fetchUserInfo();
      if (!user) {
        throw new Error('Failed to fetch user info');
      }

      updateAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      // 清除无效token
      localStorage.removeItem('access_token');
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    updateAuthState({ isLoading: true, error: null });

    try {
      // 调用登录API
      const response = await loginAccessTokenApiV1LoginAccessTokenPost({
        body: {
          username,
          password,
        },
      });

      const tokenData = response.data;
      if (!tokenData?.access_token) {
        throw new Error('Invalid login response');
      }

      // 存储token
      localStorage.setItem('access_token', tokenData.access_token);

      // 验证token并获取用户信息
      const isValid = await validateToken(tokenData.access_token);
      if (!isValid) {
        throw new Error('Token validation failed after login');
      }

      const user = await fetchUserInfo();
      if (!user) {
        throw new Error('Failed to fetch user info after login');
      }

      updateAuthState({
        user,
        token: tokenData.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      console.error('Login failed:', error);

      let errorMessage = '登录失败，请稍后重试';

      if (error.response?.status === 401) {
        errorMessage = '用户名或密码错误';
      } else if (error.response?.status === 422) {
        errorMessage = '输入信息格式错误';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });

      return false;
    }
  };

  // 登出函数
  const logout = (): void => {
    // 清除localStorage中的token
    localStorage.removeItem('access_token');

    // 重置认证状态
    updateAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 提供上下文值
  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
