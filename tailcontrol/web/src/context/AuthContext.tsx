import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'tailcontrol.portal.token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      async login(email, password) {
        const response = await api.login(email, password);
        localStorage.setItem(STORAGE_KEY, response.accessToken);
        setToken(response.accessToken);
      },
      async register(email, password, displayName) {
        const response = await api.register(email, password, displayName);
        localStorage.setItem(STORAGE_KEY, response.accessToken);
        setToken(response.accessToken);
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      },
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
