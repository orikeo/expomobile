import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://petv5.onrender.com";

type RequestOptions = {
  method?: string;
  body?: any;
};

async function refreshAccessToken() {
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

  let response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Если accessToken протух
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();

      response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Request failed");
  }

  return response.json();
}