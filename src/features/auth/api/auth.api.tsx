import { apiRequest } from "../../../api/client";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
};

export async function login(data: LoginDto): Promise<AuthResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: data,
  });
}

export async function register(data: RegisterDto): Promise<AuthResponse> {
  return apiRequest("/auth/register", {
    method: "POST",
    body: data,
  });
}