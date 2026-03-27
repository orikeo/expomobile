import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { refreshAccessToken, setLogoutHandler } from "../../../api/client";
import {
  clearTokens,
  getRefreshToken,
  setTokens,
  subscribeToTokenChanges,
} from "../../../api/tokenStorage";

/**
 * =========================================================
 * AUTH CONTEXT TYPES
 * =========================================================
 */
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;

  accessToken: string | null;
  refreshToken: string | null;

  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

/**
 * =========================================================
 * AUTH PROVIDER
 * =========================================================
 *
 * Идея этого варианта:
 * - tokenStorage остаётся источником истины для токенов
 * - AuthContext подписывается на изменения токенов
 * - login/logout/refresh меняют storage
 * - storage уведомляет context
 *
 * То есть мы меньше дублируем ручные setState.
 */
export function AuthProvider({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);

  /**
   * =========================================================
   * LOGOUT
   * =========================================================
   *
   * Очищаем токены через storage.
   * После clearTokens() подписка сама обновит local state.
   */
  const logout = async () => {
    await clearTokens();
  };

  /**
   * =========================================================
   * REGISTER GLOBAL LOGOUT HANDLER
   * =========================================================
   *
   * api client не знает про React context,
   * поэтому передаём ему logout-функцию отсюда.
   */
  useEffect(() => {
    setLogoutHandler(async () => {
      await logout();
    });
  }, []);

  /**
   * =========================================================
   * SUBSCRIBE TO TOKEN CHANGES
   * =========================================================
   *
   * Теперь любое изменение токенов:
   * - login
   * - refresh
   * - logout
   *
   * автоматически отражается в состоянии context.
   */
  useEffect(() => {
    const unsubscribe = subscribeToTokenChanges((tokens) => {
      setAccessTokenState(tokens.accessToken);
      setRefreshTokenState(tokens.refreshToken);
      setIsAuthenticated(Boolean(tokens.refreshToken));
    });

    return unsubscribe;
  }, []);

  /**
   * =========================================================
   * BOOTSTRAP AUTH
   * =========================================================
   *
   * При старте приложения:
   * 1. если refresh token отсутствует -> пользователь не авторизован
   * 2. если refresh token есть -> пробуем получить новый access token
   *
   * Важно:
   * refreshAccessToken() сам обновляет storage,
   * а storage через подписку обновит context state.
   */
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedRefreshToken = await getRefreshToken();

        if (!storedRefreshToken) {
          setIsLoading(false);
          return;
        }

        try {
          await refreshAccessToken();
        } catch (error) {
          console.log("Auto refresh failed", error);
          await clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  /**
   * =========================================================
   * LOGIN
   * =========================================================
   *
   * Сохраняем токены в storage.
   * Подписка сама обновит accessToken / refreshToken / isAuthenticated.
   */
  const login = async (access: string, refresh: string) => {
    await setTokens(access, refresh);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        refreshToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * =========================================================
 * HOOK
 * =========================================================
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}