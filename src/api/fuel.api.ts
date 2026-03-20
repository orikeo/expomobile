import { apiRequest } from "./client";

export type FuelLog = {
  id: string;
  carId: string;
  liters: string;
  pricePerLiter: string;
  totalPrice: string;
  odometer: number | null;
  createdAt: string;
};

export type CreateFuelLogDto = {
  carId: string;
  liters: string;
  pricePerLiter: string;
  totalPrice: string;
  odometer?: number | null;
};

/**
 * получить все заправки по машине
 */
export async function getFuelLogsByCarId(carId: string): Promise<FuelLog[]> {
  return apiRequest(`/fuel/car/${carId}`);
}

/**
 * получить одну заправку по id
 */
export async function getFuelLogById(id: string): Promise<FuelLog> {
  return apiRequest(`/fuel/${id}`);
}

/**
 * создать запись о заправке
 */
export async function createFuelLog(
  data: CreateFuelLogDto
): Promise<FuelLog> {
  return apiRequest("/fuel", {
    method: "POST",
    body: data,
  });
}

/**
 * обновить запись о заправке
 */
export async function updateFuelLog(
  id: string,
  data: Partial<CreateFuelLogDto>
): Promise<FuelLog> {
  return apiRequest(`/fuel/${id}`, {
    method: "PATCH",
    body: data,
  });
}

/**
 * удалить запись о заправке
 */
export async function deleteFuelLog(
  id: string
): Promise<{ message: string }> {
  return apiRequest(`/fuel/${id}`, {
    method: "DELETE",
  });
}