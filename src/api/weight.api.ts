import { apiRequest } from "./client";

export type Weight = {
  id: number;
  weight: number;
  createdAt: string;
};

export async function getWeights(): Promise<Weight[]> {
  return apiRequest("/weights");
}

export async function addWeight(weight: number) {
  return apiRequest("/weights", {
    method: "POST",
    body: { weight },
  });
}

export async function getWeightHistory() {
  return apiRequest("/weights/history");
}

export async function getWeightChart() {
  return apiRequest("/weights/chart");
}