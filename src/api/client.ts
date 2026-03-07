import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * URL твоего backend API
 */
const API_URL = "https://petv5.onrender.com";

/**
 * тип опций запроса
 */
type RequestOptions = {
  method?: string;
  body?: any;
};

/**
 * logout handler будет устанавливаться из AuthContext
 * чтобы API клиент мог разлогинить пользователя
 */
let logoutHandler: (() => Promise<void>) | null = null;

/**
 * функция регистрации logout из AuthContext
 */
export function setLogoutHandler(fn: () => Promise<void>) {
  logoutHandler = fn;
}

/**
 * refresh lock
 *
 * если refresh уже выполняется —
 * остальные запросы ждут его завершения
 */
let refreshPromise: Promise<string> | null = null;

/**
 * функция обновления access token
 */
export async function refreshAccessToken(): Promise<string> {
  /**
   * если refresh уже идёт — ждём его
   */
  if (refreshPromise) {
    return refreshPromise;
  }

  /**
   * создаём refresh promise
   */
  refreshPromise = (async () => {
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh failed");
    }

    const data = await response.json();

    /**
     * сохраняем новый access token
     */
    await AsyncStorage.setItem("accessToken", data.accessToken);

    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    /**
     * после завершения refresh снимаем lock
     */
    refreshPromise = null;
  }
}

/**
 * главный API клиент
 */
export async function apiRequest(
  endpoint: string,
  { method = "GET", body }: RequestOptions = {}
) {
  /**
   * берём access token
   */
  const token = await AsyncStorage.getItem("accessToken");

  /**
   * функция выполнения запроса
   */
  const makeRequest = async (accessToken?: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",

        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  /**
   * первый запрос
   */
  let response = await makeRequest(token ?? undefined);

  /**
   * если accessToken истёк
   */
  if (response.status === 401) {
    try {
      /**
       * обновляем токен
       */
      const newToken = await refreshAccessToken();

      /**
       * повторяем запрос
       */
      response = await makeRequest(newToken);
    } catch (err) {
      console.log("Refresh failed, logging out");

      /**
       * если refresh не сработал —
       * делаем глобический logout
       */
      await logoutHandler?.();

      throw new Error("Session expired");
    }
  }

  const text = await response.text();

  if (!response.ok) {
    console.log("SERVER RESPONSE:", text);
    throw new Error(text || "Request failed");
  }

  /**
   * если сервер вернул пустой ответ
   */
  return text ? JSON.parse(text) : null;
}