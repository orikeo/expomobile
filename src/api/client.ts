import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://petv5.onrender.com";

type RequestOptions = {
  method?: string;
  body?: any;
};

let logoutHandler: (() => void) | null = null;

export function setLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

export async function refreshAccessToken() {
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

  await AsyncStorage.setItem("accessToken", data.accessToken);

  return data.accessToken;
}

export async function apiRequest(
  endpoint: string,
  { method = "GET", body }: RequestOptions = {}
) {
  let token = await AsyncStorage.getItem("accessToken");

  const makeRequest = async (accessToken?: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await makeRequest(token ?? undefined);

  /**
   * если access token истёк
   */
  if (response.status === 401) {
  try {
    const newToken = await refreshAccessToken();
    response = await makeRequest(newToken);
  } catch (e) {
    console.log("Refresh failed");

    logoutHandler?.();

    throw new Error("Session expired");
  }
}

  const text = await response.text();

  if (!response.ok) {
    console.log("SERVER RESPONSE:", text);
    throw new Error(text || "Request failed");
  }

  return JSON.parse(text);
}