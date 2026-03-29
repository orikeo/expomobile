import { apiRequest } from "../../../api/client";
import {
  CreateDailyCheckItemPayload,
  DailyCheckDayResponse,
  DailyCheckItem,
  DailyCheckRangeDay,
  SaveDailyCheckDayPayload,
  UpdateDailyCheckItemPayload,
} from "../dailyCheck.types";

function normalizeDailyDayResponse(payload: any): DailyCheckDayResponse {
  return {
    date: payload?.date ?? "",
    report: payload?.report ?? null,
    lifecycle: payload?.lifecycle ?? {
      status: "open",
      deadlineAt: new Date().toISOString(),
      closedAt: null,
      completedAt: null,
      wasEditedAfterDeadline: false,
      timeZone: "UTC",
      isOverdue: false,
      canEdit: true,
    },
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
}

export async function getDailyCheckDay(
  date: string,
  timeZone: string
): Promise<DailyCheckDayResponse> {
  const response = await apiRequest<any>(
    `/daily-check/day?date=${encodeURIComponent(date)}&timeZone=${encodeURIComponent(
      timeZone
    )}`
  );

  return normalizeDailyDayResponse(response);
}

export async function saveDailyCheckDay(
  payload: SaveDailyCheckDayPayload
): Promise<DailyCheckDayResponse> {
  const response = await apiRequest<any>("/daily-check/day", {
    method: "PUT",
    body: payload,
  });

  return normalizeDailyDayResponse(response);
}

export async function getDailyCheckRange(
  from: string,
  to: string,
  timeZone: string
): Promise<DailyCheckRangeDay[]> {
  const response = await apiRequest<any>(
    `/daily-check/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}&timeZone=${encodeURIComponent(timeZone)}`
  );

  return Array.isArray(response) ? response : [];
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