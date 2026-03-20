import { apiRequest } from "../../../api/client";

export type FuelLog = {
  id: string;
  carId: string;
  fuelDate: string;
  odometer: number | null;
  liters: string;
  pricePerLiter: string;
  totalPrice: string;
  fullTank: boolean;
  station: string | null;
  createdAt: string;
};

export type CreateFuelLogDto = {
  carId: string;
  fuelDate: string;
  odometer?: number | null;
  liters: number;
  pricePerLiter: number;
  fullTank?: boolean;
  station?: string | null;
};

export type UpdateFuelLogDto = {
  fuelDate?: string;
  odometer?: number | null;
  liters?: number;
  pricePerLiter?: number;
  fullTank?: boolean;
  station?: string | null;
};

export async function getFuelLogsByCarId(carId: string): Promise<FuelLog[]> {
  return apiRequest(`/fuel/car/${carId}`);
}

export async function createFuelLog(data: CreateFuelLogDto): Promise<FuelLog> {
  return apiRequest("/fuel", {
    method: "POST",
    body: data,
  });
}

export async function updateFuelLog(
  id: string,
  data: UpdateFuelLogDto
): Promise<FuelLog> {
  return apiRequest(`/fuel/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteFuelLog(id: string): Promise<{ message: string }> {
  return apiRequest(`/fuel/${id}`, {
    method: "DELETE",
  });
}