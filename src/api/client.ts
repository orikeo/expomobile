import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "./tokenStorage";

const API_URL = "https://petv5.onrender.com";

type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
};

let logoutHandler: (() => Promise<void>) | null = null;

/**
 * =========================================================
 * LOGOUT HANDLER
 * =========================================================
 *
 * Глобальный обработчик нужен, чтобы api client
 * мог инициировать logout, но сам не зависел от React context.
 */
export function setLogoutHandler(fn: () => Promise<void>) {
  logoutHandler = fn;
}

/**
 * =========================================================
 * REFRESH LOCK
 * =========================================================
 *
 * Защита от ситуации, когда несколько запросов одновременно
 * получили 401 и каждый пытается делать refresh сам.
 *
 * Пока один refresh идёт, остальные ждут тот же promise.
 */
let refreshPromise: Promise<string> | null = null;

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */
async function parseResponseError(response: Response): Promise<never> {
  const text = await response.text();

  console.log("SERVER RESPONSE:", text);

  if (!text) {
    throw new Error("Request failed");
  }

  try {
    const errorData = JSON.parse(text);
    throw new Error(errorData?.message || "Request failed");
  } catch {
    throw new Error(text || "Request failed");
  }
}

/**
 * =========================================================
 * REFRESH ACCESS TOKEN
 * =========================================================
 *
 * Важно:
 * - refresh идёт отдельным fetch
 * - не через apiRequest, чтобы не устроить рекурсию
 */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();

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
      await parseResponseError(response);
    }

    const data = await response.json();

    if (!data?.accessToken || typeof data.accessToken !== "string") {
      throw new Error("Invalid refresh response");
    }

    /**
     * Сейчас backend возвращает только accessToken.
     * Поэтому обновляем только его.
     *
     * Когда добавишь rotation refresh token,
     * здесь можно будет сохранять оба.
     */
    await setAccessToken(data.accessToken);

    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * =========================================================
 * API REQUEST
 * =========================================================
 *
 * Алгоритм:
 * 1. берём access token
 * 2. делаем запрос
 * 3. если 401 -> пытаемся refresh
 * 4. повторяем запрос
 * 5. если refresh не удался -> logout
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  { method = "GET", body }: RequestOptions = {}
): Promise<T> {
  const token = await getAccessToken();

  const makeRequest = async (accessToken?: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        ...(body !== undefined && {
          "Content-Type": "application/json",
        }),
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await makeRequest(token ?? undefined);

  /**
   * access token истёк / невалиден
   * пытаемся обновить и повторить запрос
   */
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      response = await makeRequest(newToken);
    } catch (error) {
      console.log("Refresh failed, logging out", error);
      await logoutHandler?.();
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    await parseResponseError(response);
  }

  /**
   * Некоторые endpoints могут возвращать пустой ответ,
   * например 204 No Content
   */
  const text = await response.text();

  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}