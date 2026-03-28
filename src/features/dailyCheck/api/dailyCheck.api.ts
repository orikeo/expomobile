import { apiRequest } from "../../../api/client";
import {
  DailyCheckDayResponse,
  SaveDailyCheckDayPayload,
} from "../dailyCheck.types";

/**
 * =========================================================
 * GET DAY
 * =========================================================
 *
 * Получаем данные отчёта за конкретный день.
 * Backend ждёт дату в формате YYYY-MM-DD.
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
 *
 * Сохраняем запись дня:
 * - report
 * - entries по привычкам
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
 * Нужен для будущего overview / heatmap за 2 недели.
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
 * Полезно для экрана настроек привычек.
 * Пока можно не использовать, но лучше сразу иметь.
 */
export async function getDailyCheckItems<T = unknown>(): Promise<T> {
  return apiRequest<T>("/daily-check/items");
}