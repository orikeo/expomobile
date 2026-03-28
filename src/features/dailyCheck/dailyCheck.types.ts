/**
 * =========================================================
 * DAILY CHECK STATUS
 * =========================================================
 *
 * Возможные состояния привычки за день:
 * - yes      -> выполнил
 * - no       -> не выполнил
 * - skipped  -> не учитывается, но с причиной
 */
export type DailyCheckStatus = "yes" | "no" | "skipped";

/**
 * =========================================================
 * DAY REPORT
 * =========================================================
 *
 * Общая запись дня:
 * - настроение
 * - комментарий к настроению
 * - краткий итог дня
 * - заметка
 * - музыка дня
 */
export interface DailyCheckDayReport {
  moodScore: number | null;
  moodComment: string | null;
  summary: string | null;
  note: string | null;
  musicOfDay: string | null;
}

/**
 * =========================================================
 * DAY ITEM FROM BACKEND
 * =========================================================
 *
 * Один пункт привычки, который backend возвращает для дня.
 *
 * Здесь я оставил все поля, которые backend сейчас отдаёт.
 * Даже если часть из них пока не нужна на экране,
 * лучше типизировать полностью.
 */
export interface DailyCheckDayItem {
  id: string;
  title: string;
  emoji: string | null;

  appliesMode: "every_day" | "selected_days";
  weekDays: number[];
  sortOrder: number;
  isActive: boolean;

  status: DailyCheckStatus | null;
  skipReason: string | null;
}

/**
 * =========================================================
 * GET DAY RESPONSE
 * =========================================================
 */
export interface DailyCheckDayResponse {
  date: string;
  report: DailyCheckDayReport | null;
  items: DailyCheckDayItem[];
}

/**
 * =========================================================
 * SAVE ENTRY PAYLOAD
 * =========================================================
 *
 * Что отправляем по одной привычке при сохранении дня.
 */
export interface SaveDailyCheckEntryPayload {
  itemId: string;
  status: DailyCheckStatus;
  skipReason?: string | null;
}

/**
 * =========================================================
 * SAVE DAY PAYLOAD
 * =========================================================
 *
 * Полный payload для PUT /daily-check/day
 */
export interface SaveDailyCheckDayPayload {
  date: string;
  report?: {
    moodScore?: number | null;
    moodComment?: string | null;
    summary?: string | null;
    note?: string | null;
    musicOfDay?: string | null;
  };
  entries: SaveDailyCheckEntryPayload[];
}

/**
 * =========================================================
 * LOCAL UI ITEM STATE
 * =========================================================
 *
 * Локальный тип для состояния экрана.
 * По сути это упрощённая версия backend item.
 *
 * Мы не тянем сюда лишние поля, которые сейчас не нужны UI.
 */
export interface DailyCheckDayItemState {
  id: string;
  title: string;
  emoji: string | null;
  status: DailyCheckStatus | null;
  skipReason: string | null;
}