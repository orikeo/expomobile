import { apiRequest } from "../../../api/client";

export type RepairType = {
  id: string;
  name: string;
};

export type Repair = {
  id: string;
  carId: string;
  repairTypeId: string;
  repairTypeName: string | null;
  repairDate: string;
  odometer: number | null;
  price: string;
  note: string | null;
  createdAt: string;
};

export type CreateRepairDto = {
  carId: string;
  repairTypeId: string;
  repairDate: string;
  odometer?: number | null;
  price: string;
  note?: string | null;
};

export type UpdateRepairDto = {
  repairTypeId?: string;
  repairDate?: string;
  odometer?: number | null;
  price?: string;
  note?: string | null;
};

export async function getRepairTypes(): Promise<RepairType[]> {
  return apiRequest("/repair/types");
}

export async function createRepairType(name: string): Promise<RepairType> {
  return apiRequest("/repair/types", {
    method: "POST",
    body: { name },
  });
}

export async function getRepairsByCarId(carId: string): Promise<Repair[]> {
  return apiRequest(`/repair/car/${carId}`);
}

export async function getRepairById(id: string): Promise<Repair> {
  return apiRequest(`/repair/${id}`);
}

export async function createRepair(data: CreateRepairDto): Promise<Repair> {
  return apiRequest("/repair", {
    method: "POST",
    body: data,
  });
}

export async function updateRepair(
  id: string,
  data: UpdateRepairDto
): Promise<Repair> {
  return apiRequest(`/repair/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteRepair(id: string): Promise<{ message: string }> {
  return apiRequest(`/repair/${id}`, {
    method: "DELETE",
  });
}