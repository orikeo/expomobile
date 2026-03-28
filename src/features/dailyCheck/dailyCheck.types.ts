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
 * RANGE DAY SUMMARY
 * =========================================================
 *
 * Это одна карточка дня для 2-недельного overview.
 */
export interface DailyCheckRangeDay {
  date: string;
  moodScore: number | null;
  summary: string | null;
  note: string | null;
  habitsTotal: number;
  yesCount: number;
  noCount: number;
  skippedCount: number;
  completionRate: number;
  finalScore: number;
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