import { apiRequest } from "./client";

export type Car = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

/**
 * получить список машин
 */
export async function getCars(): Promise<Car[]> {
  return apiRequest("/cars");
}

/**
 * создать машину
 */
export async function createCar(name: string) {
  return apiRequest("/cars", {
    method: "POST",
    body: { name },
  });
}