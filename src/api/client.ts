import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://petv5.onrender.com";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

let logoutHandler: (() => Promise<void>) | null = null;

export function setLogoutHandler(fn: () => Promise<void>) {
  logoutHandler = fn;
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

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

    await AsyncStorage.setItem("accessToken", data.accessToken);

    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest(
  endpoint: string,
  { method = "GET", body }: RequestOptions = {}
) {
  const token = await AsyncStorage.getItem("accessToken");

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

  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      response = await makeRequest(newToken);
    } catch {
      console.log("Refresh failed, logging out");
      await logoutHandler?.();
      throw new Error("Session expired");
    }
  }

  const text = await response.text();

  if (!response.ok) {
    console.log("SERVER RESPONSE:", text);

    try {
      const errorData = text ? JSON.parse(text) : null;
      throw new Error(errorData?.message || "Request failed");
    } catch {
      throw new Error(text || "Request failed");
    }
  }

  return text ? JSON.parse(text) : null;
}