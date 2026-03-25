import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/auth.service";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);

  const isAuthenticated = Boolean(user);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setIsBootstrapping(true);
      await fetchCurrentUser();
      setIsBootstrapping(false);
    };

    bootstrap();
  }, [fetchCurrentUser]);

  const login = useCallback(async (payload) => {
    setIsAuthActionLoading(true);
    try {
      const data = await authService.login(payload);
      setUser(data?.user || null);
      return data;
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const loginWithOtp = useCallback(async (payload) => {
    setIsAuthActionLoading(true);
    try {
      const data = await authService.loginWithOtp(payload);
      setUser(data?.user || null);
      return data;
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsAuthActionLoading(true);
    try {
      const data = await authService.register(payload);
      return data;
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsAuthActionLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated,
      isBootstrapping,
      isAuthActionLoading,
      fetchCurrentUser,
      login,
      loginWithOtp,
      register,
      logout,
    }),
    [
      user,
      isAuthenticated,
      isBootstrapping,
      isAuthActionLoading,
      fetchCurrentUser,
      login,
      loginWithOtp,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
