import { apiRequest } from "./client";

export type Weight = {
  id: string;
  weight: number;
  entryDate: string;
  createdAt: string;
  note?: string | null;
};

export async function getWeights(): Promise<Weight[]> {
  const response = await apiRequest("/weights");

  return response.items.map((w: any) => ({
    ...w,
    weight: Number(w.weight),
  }));
}

export async function addWeight(weight: number) {
  const today = new Date().toISOString().split("T")[0];

  return apiRequest("/weights", {
    method: "POST",
    body: {
      weight,
      entryDate: today,
    },
  });
}

export const deleteWeight = async (
  id: string
) => {

  await apiRequest(`/weights/${id}`, {
    method: "DELETE"
  });

};

export async function getWeightHistory() {
  return apiRequest("/weights/history");
}

export async function getWeightChart() {
  return apiRequest("/weights/chart");
}