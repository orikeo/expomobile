import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Тип данных, которые доступны из контекста
 */
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

/**
 * Создаём сам контекст
 * По умолчанию undefined — чтобы отлавливать ошибки использования вне Provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  /**
   * Состояние авторизации
   */
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Состояние загрузки (чтобы не мигал экран при старте)
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Храним accessToken в памяти
   * Это быстрее, чем каждый раз читать из AsyncStorage
   */
  const [accessToken, setAccessToken] = useState<string | null>(null);

  /**
   * При запуске приложения проверяем,
   * есть ли сохранённый токен
   */
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (token) {
          setAccessToken(token);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("Error loading token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  /**
   * Логин:
   * - сохраняем токен
   * - обновляем состояние
   */
  const login = async (token: string) => {
    await AsyncStorage.setItem("accessToken", token);
    setAccessToken(token);
    setIsAuthenticated(true);
  };

  /**
   * Логаут:
   * - удаляем токен
   * - сбрасываем состояние
   */
  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Кастомный хук для удобного использования контекста
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}