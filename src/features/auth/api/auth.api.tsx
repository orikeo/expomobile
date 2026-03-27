import { apiRequest } from "../../../api/client";

/**
 * =========================================================
 * AUTH RESPONSE TYPES
 * =========================================================
 */
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
};

/**
 * =========================================================
 * LOGIN
 * =========================================================
 *
 * Backend возвращает accessToken + refreshToken
 */
export async function login(data: LoginDto): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  });
}

/**
 * =========================================================
 * REGISTER
 * =========================================================
 *
 * Сейчас backend после регистрации возвращает не токены,
 * а объект созданного пользователя.
 *
 * Поэтому тип должен соответствовать реальному контракту.
 */
export async function register(
  data: RegisterDto
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: data,
  });
}