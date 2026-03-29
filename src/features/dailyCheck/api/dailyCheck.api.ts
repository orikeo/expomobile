import { apiRequest } from "../../../api/client";
import {
  CreateDailyCheckItemPayload,
  DailyCheckDayResponse,
  DailyCheckItem,
  DailyCheckRangeDay,
  SaveDailyCheckDayPayload,
  UpdateDailyCheckItemPayload,
} from "../dailyCheck.types";

export async function getDailyCheckDay(
  date: string,
  timeZone: string
): Promise<DailyCheckDayResponse> {
  return apiRequest<DailyCheckDayResponse>(
    `/daily-check/day?date=${encodeURIComponent(date)}&timeZone=${encodeURIComponent(
      timeZone
    )}`
  );
}

export async function saveDailyCheckDay(
  payload: SaveDailyCheckDayPayload
): Promise<DailyCheckDayResponse> {
  return apiRequest<DailyCheckDayResponse>("/daily-check/day", {
    method: "PUT",
    body: payload,
  });
}

export async function getDailyCheckRange(
  from: string,
  to: string,
  timeZone: string
): Promise<DailyCheckRangeDay[]> {
  return apiRequest<DailyCheckRangeDay[]>(
    `/daily-check/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}&timeZone=${encodeURIComponent(timeZone)}`
  );
}

export async function getDailyCheckItems(): Promise<DailyCheckItem[]> {
  return apiRequest<DailyCheckItem[]>("/daily-check/items");
}

export async function createDailyCheckItem(
  payload: CreateDailyCheckItemPayload
): Promise<DailyCheckItem> {
  return apiRequest<DailyCheckItem>("/daily-check/items", {
    method: "POST",
    body: payload,
  });
}

export async function updateDailyCheckItem(
  itemId: string,
  payload: UpdateDailyCheckItemPayload
): Promise<DailyCheckItem> {
  return apiRequest<DailyCheckItem>(`/daily-check/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteDailyCheckItem(itemId: string): Promise<void> {
  await apiRequest<void>(`/daily-check/items/${itemId}`, {
    method: "DELETE",
  });
}