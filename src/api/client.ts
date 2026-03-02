const API_URL = "https://petv5.onrender.com"; 
// ⚠️ обязательно без слэша в конце

type RequestOptions = {
  method?: string;
  body?: any;
  token?: string;
};

export async function apiRequest(
  endpoint: string,
  { method = "GET", body, token }: RequestOptions = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Если сервер вернул ошибку — пробрасываем её
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Request failed");
  }

  return response.json();
}