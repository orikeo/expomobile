import { apiRequest } from "../../../api/client";
import {
  CreateDailyCheckItemPayload,
  DailyCheckDayResponse,
  DailyCheckItem,
  DailyCheckRangeDay,
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
 * Нужен для overview за 2 недели.
 */
export async function getDailyCheckRange(
  from: string,
  to: string
): Promise<DailyCheckRangeDay[]> {
  return apiRequest<DailyCheckRangeDay[]>(
    `/daily-check/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}`
  );
}

/**
 * =========================================================
 * GET ITEMS
 * =========================================================
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
 *
 * Пока оставим в API на будущее / для dev-нужд,
 * но в UI не используем.
 */
export async function deleteDailyCheckItem(itemId: string): Promise<void> {
  await apiRequest<void>(`/daily-check/items/${itemId}`, {
    method: "DELETE",
  });
}