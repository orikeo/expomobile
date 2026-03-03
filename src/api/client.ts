const API_URL = "https://petv5.onrender.com"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
// ⚠️ обязательно без слэша в конце

type RequestOptions = {
  method?: string;
  body?: any;
};

export async function apiRequest(
  endpoint: string,
  { method = "GET", body }: RequestOptions = {}
) {
  // автоматически достаём токен
  const token = await AsyncStorage.getItem("accessToken");

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Request failed");
  }

  return response.json();
}