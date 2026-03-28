/**
 * =========================================================
 * DAILY CHECK STATUS
 * =========================================================
 */
export type DailyCheckStatus = "yes" | "no" | "skipped";

/**
 * =========================================================
 * DAILY CHECK APPLIES MODE
 * =========================================================
 *
 * every_day     -> привычка показывается каждый день
 * selected_days -> привычка показывается только в выбранные дни недели
 */
export type DailyCheckAppliesMode = "every_day" | "selected_days";

/**
 * =========================================================
 * DAY REPORT
 * =========================================================
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
 * DAILY CHECK ITEM
 * =========================================================
 *
 * Полный тип привычки, который приходит с backend.
 */
export interface DailyCheckItem {
  id: string;
  userId: string;
  title: string;
  emoji: string | null;
  appliesMode: DailyCheckAppliesMode;
  weekDays: number[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * =========================================================
 * DAY ITEM FROM BACKEND
 * =========================================================
 *
 * Один пункт привычки, уже применённый к конкретному дню.
 */
export interface DailyCheckDayItem {
  id: string;
  title: string;
  emoji: string | null;

  appliesMode: DailyCheckAppliesMode;
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
 * CREATE / UPDATE HABIT PAYLOADS
 * =========================================================
 */
export interface CreateDailyCheckItemPayload {
  title: string;
  emoji?: string | null;
  appliesMode?: DailyCheckAppliesMode;
  weekDays?: number[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateDailyCheckItemPayload {
  title?: string;
  emoji?: string | null;
  appliesMode?: DailyCheckAppliesMode;
  weekDays?: number[];
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * =========================================================
 * LOCAL UI ITEM STATE
 * =========================================================
 */
export interface DailyCheckDayItemState {
  id: string;
  title: string;
  emoji: string | null;
  status: DailyCheckStatus | null;
  skipReason: string | null;
}