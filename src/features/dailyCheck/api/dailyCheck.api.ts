import { apiRequest } from "../../../api/client";
import {
  CreateDailyCheckItemPayload,
  DailyCheckDayResponse,
  DailyCheckItem,
  SaveDailyCheckDayPayload,
  UpdateDailyCheckItemPayload,
} from "../dailyCheck.types";

/**
 * =========================================================
 * GET DAY
 * =========================================================
 */
export async function getDailyCheckDay(
  date: string
): Promise<DailyCheckDayResponse> {
  return apiRequest<DailyCheckDayResponse>(
    `/daily-check/day?date=${encodeURIComponent(date)}`
  );
}

/**
 * =========================================================
 * SAVE DAY
 * =========================================================
 */
export async function saveDailyCheckDay(
  payload: SaveDailyCheckDayPayload
): Promise<DailyCheckDayResponse> {
  return apiRequest<DailyCheckDayResponse>("/daily-check/day", {
    method: "PUT",
    body: payload,
  });
}

/**
 * =========================================================
 * GET RANGE
 * =========================================================
 *
 * Пока оставим generic, позже затипизируем под overview.
 */
export async function getDailyCheckRange<T = unknown>(
  from: string,
  to: string
): Promise<T> {
  return apiRequest<T>(
    `/daily-check/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}`
  );
}

/**
 * =========================================================
 * GET ITEMS
 * =========================================================
 *
 * Получить все привычки пользователя.
 */
export async function getDailyCheckItems(): Promise<DailyCheckItem[]> {
  return apiRequest<DailyCheckItem[]>("/daily-check/items");
}

/**
 * =========================================================
 * CREATE ITEM
 * =========================================================
 */
export async function createDailyCheckItem(
  payload: CreateDailyCheckItemPayload
): Promise<DailyCheckItem> {
  return apiRequest<DailyCheckItem>("/daily-check/items", {
    method: "POST",
    body: payload,
  });
}

/**
 * =========================================================
 * UPDATE ITEM
 * =========================================================
 */
export async function updateDailyCheckItem(
  itemId: string,
  payload: UpdateDailyCheckItemPayload
): Promise<DailyCheckItem> {
  return apiRequest<DailyCheckItem>(`/daily-check/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * =========================================================
 * DELETE ITEM
 * =========================================================
 */
export async function deleteDailyCheckItem(itemId: string): Promise<void> {
  await apiRequest<void>(`/daily-check/items/${itemId}`, {
    method: "DELETE",
  });
}