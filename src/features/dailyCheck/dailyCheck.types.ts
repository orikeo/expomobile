export type DailyCheckStatus = "yes" | "no" | "skipped";
export type DailyCheckAppliesMode = "every_day" | "selected_days";

export type DailyReportLifecycleStatus =
  | "open"
  | "completed"
  | "partial"
  | "missed";

export interface DailyCheckDayReport {
  moodScore: number | null;
  moodComment: string | null;
  summary: string | null;
  note: string | null;
  musicOfDay: string | null;
}

export interface DailyCheckDayLifecycle {
  status: DailyReportLifecycleStatus;
  deadlineAt: string;
  closedAt: string | null;
  completedAt: string | null;
  wasEditedAfterDeadline: boolean;
  timeZone: string;
  isOverdue: boolean;
  canEdit: boolean;
}

export interface DailyCheckItem {
  id: string;
  userId: string;
  title: string;
  emoji: string | null;
  appliesMode: DailyCheckAppliesMode;
  weekDays: number[];
  sortOrder: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCheckDayItem {
  id: string;
  title: string;
  emoji: string | null;
  appliesMode: DailyCheckAppliesMode;
  weekDays: number[];
  sortOrder: number;
  status: DailyCheckStatus | null;
  skipReason: string | null;
}

export interface DailyCheckDayResponse {
  date: string;
  report: DailyCheckDayReport | null;
  lifecycle: DailyCheckDayLifecycle;
  items: DailyCheckDayItem[];
}

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

  status: DailyReportLifecycleStatus;
  deadlineAt: string;
  closedAt: string | null;
  wasEditedAfterDeadline: boolean;
  timeZone: string;
  isOverdue: boolean;
  canEdit: boolean;
}

export interface SaveDailyCheckEntryPayload {
  itemId: string;
  status: DailyCheckStatus;
  skipReason?: string | null;
}

export interface SaveDailyCheckDayPayload {
  date: string;
  timeZone?: string;
  report?: {
    moodScore?: number | null;
    moodComment?: string | null;
    summary?: string | null;
    note?: string | null;
    musicOfDay?: string | null;
  };
  entries: SaveDailyCheckEntryPayload[];
}

export interface CreateDailyCheckItemPayload {
  title: string;
  emoji?: string | null;
  appliesMode?: DailyCheckAppliesMode;
  weekDays?: number[];
  sortOrder?: number;
  effectiveFrom?: string;
}

export interface UpdateDailyCheckItemPayload {
  title?: string;
  emoji?: string | null;
  appliesMode?: DailyCheckAppliesMode;
  weekDays?: number[];
  sortOrder?: number;
  effectiveFrom?: string;
}

export interface DailyCheckDayItemState {
  id: string;
  title: string;
  emoji: string | null;
  status: DailyCheckStatus | null;
  skipReason: string | null;
}