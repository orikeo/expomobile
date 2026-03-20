import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { refreshAccessToken, setLogoutHandler } from "../../../api/client";

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

export function AuthProvider({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  /**
   * регистрируем глобический logout
   */
  useEffect(() => {
    setLogoutHandler(async () => {
      await logout();
    });
  }, []);

  /**
   * bootstrap авторизации при запуске приложения
   */
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedRefresh = await AsyncStorage.getItem("refreshToken");

        if (!storedRefresh) {
          setIsLoading(false);
          return;
        }

        try {
          const newAccessToken = await refreshAccessToken();

          setAccessToken(newAccessToken);
          setRefreshToken(storedRefresh);

          setIsAuthenticated(true);
        } catch (err) {
          console.log("Auto refresh failed");

          await logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  /**
   * login
   */
  const login = async (access: string, refresh: string) => {
    await AsyncStorage.setItem("accessToken", access);
    await AsyncStorage.setItem("refreshToken", refresh);

    setAccessToken(access);
    setRefreshToken(refresh);

    setIsAuthenticated(true);
  };

  /**
   * logout
   */
  const logout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);

    setAccessToken(null);
    setRefreshToken(null);

    setIsAuthenticated(false);
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}