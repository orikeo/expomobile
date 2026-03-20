import { apiRequest } from "../../../api/client";

export type Car = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export async function getCars(): Promise<Car[]> {
  return apiRequest("/cars");
}

export async function getCarById(id: string): Promise<Car> {
  return apiRequest(`/cars/${id}`);
}

export async function createCar(name: string): Promise<Car> {
  return apiRequest("/cars", {
    method: "POST",
    body: { name },
  });
}

export async function updateCar(id: string, name: string): Promise<Car> {
  return apiRequest(`/cars/${id}`, {
    method: "PATCH",
    body: { name },
  });
}

export async function deleteCar(id: string): Promise<{ message: string }> {
  return apiRequest(`/cars/${id}`, {
    method: "DELETE",
  });
}