import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * =========================================================
 * TOKEN STORAGE KEYS
 * =========================================================
 */
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * =========================================================
 * TOKEN SNAPSHOT TYPE
 * =========================================================
 *
 * Удобный тип для передачи текущего состояния токенов
 * всем подписчикам.
 */
export type TokenSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
};

/**
 * =========================================================
 * SUBSCRIBERS
 * =========================================================
 *
 * Здесь храним слушателей, которым будем сообщать,
 * когда токены изменились.
 *
 * Это нужно, чтобы AuthContext автоматически узнавал,
 * когда client.ts обновил access token после refresh.
 */
type TokenListener = (tokens: TokenSnapshot) => void;

const listeners = new Set<TokenListener>();

/**
 * =========================================================
 * INTERNAL NOTIFY
 * =========================================================
 *
 * Сообщаем всем подписчикам новое состояние токенов.
 */
function notifyListeners(tokens: TokenSnapshot) {
  for (const listener of listeners) {
    listener(tokens);
  }
}

/**
 * =========================================================
 * READ CURRENT TOKENS
 * =========================================================
 *
 * Вспомогательная функция:
 * читает оба токена сразу и возвращает их как объект.
 */
export async function getTokenSnapshot(): Promise<TokenSnapshot> {
  const [accessToken, refreshToken] = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);

  return {
    accessToken: accessToken[1],
    refreshToken: refreshToken[1],
  };
}

/**
 * =========================================================
 * GETTERS
 * =========================================================
 */
export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * =========================================================
 * SETTERS
 * =========================================================
 *
 * После каждого изменения токенов уведомляем подписчиков.
 * Это важно для синхронизации storage и React state.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);

  notifyListeners({
    accessToken,
    refreshToken,
  });
}

export async function setAccessToken(accessToken: string): Promise<void> {
  const refreshToken = await getRefreshToken();

  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  notifyListeners({
    accessToken,
    refreshToken,
  });
}

export async function setRefreshToken(refreshToken: string): Promise<void> {
  const accessToken = await getAccessToken();

  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  notifyListeners({
    accessToken,
    refreshToken,
  });
}

/**
 * =========================================================
 * CLEAR
 * =========================================================
 */
export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

  notifyListeners({
    accessToken: null,
    refreshToken: null,
  });
}

/**
 * =========================================================
 * SUBSCRIBE
 * =========================================================
 *
 * Позволяет подписаться на любые изменения токенов.
 *
 * Возвращаем функцию unsubscribe, чтобы useEffect
 * мог корректно отписаться при размонтировании.
 */
export function subscribeToTokenChanges(listener: TokenListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}