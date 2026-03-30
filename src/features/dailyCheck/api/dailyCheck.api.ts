import { apiRequest } from "../../../api/client";
import {
  CreateDailyCheckItemPayload,
  DailyCheckDayItem,
  DailyCheckDayLifecycle,
  DailyCheckDayReport,
  DailyCheckDayResponse,
  DailyCheckItem,
  DailyCheckRangeDay,
  DailyCheckStatus,
  SaveDailyCheckDayPayload,
  UpdateDailyCheckItemPayload,
} from "../dailyCheck.types";
import { getFallbackDeadlineIsoForDailyCheckDate } from "../dailyCheck.time";

function normalizeDailyCheckStatus(value: any): DailyCheckStatus | null {
  if (value === "yes" || value === "no" || value === "skipped") {
    return value;
  }

  return null;
}

function normalizeDailyCheckDayReport(payload: any): DailyCheckDayReport | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    moodScore: typeof payload?.moodScore === "number" ? payload.moodScore : null,
    moodComment: typeof payload?.moodComment === "string" ? payload.moodComment : null,
    summary: typeof payload?.summary === "string" ? payload.summary : null,
    note: typeof payload?.note === "string" ? payload.note : null,
    musicOfDay: typeof payload?.musicOfDay === "string" ? payload.musicOfDay : null,
  };
}

function normalizeDailyCheckDayLifecycle(
  payload: any,
  date: string
): DailyCheckDayLifecycle {
  return {
    status:
      payload?.status === "completed" ||
      payload?.status === "partial" ||
      payload?.status === "missed"
        ? payload.status
        : "open",
    deadlineAt:
      typeof payload?.deadlineAt === "string" && payload.deadlineAt
        ? payload.deadlineAt
        : date
        ? getFallbackDeadlineIsoForDailyCheckDate(date)
        : new Date().toISOString(),
    closedAt: typeof payload?.closedAt === "string" ? payload.closedAt : null,
    completedAt:
      typeof payload?.completedAt === "string" ? payload.completedAt : null,
    wasEditedAfterDeadline: Boolean(payload?.wasEditedAfterDeadline),
    timeZone: typeof payload?.timeZone === "string" ? payload.timeZone : "UTC",
    isOverdue: Boolean(payload?.isOverdue),
    canEdit: payload?.canEdit !== false,
  };
}

function normalizeDailyDayItem(payload: any): DailyCheckDayItem {
  return {
    id: typeof payload?.id === "string" ? payload.id : "",
    title: typeof payload?.title === "string" ? payload.title : "",
    emoji: typeof payload?.emoji === "string" ? payload.emoji : null,
    appliesMode:
      payload?.appliesMode === "selected_days" ? "selected_days" : "every_day",
    weekDays: Array.isArray(payload?.weekDays)
      ? payload.weekDays.filter((value: any) => typeof value === "number")
      : [],
    sortOrder: typeof payload?.sortOrder === "number" ? payload.sortOrder : 0,
    status: normalizeDailyCheckStatus(payload?.status),
    skipReason:
      typeof payload?.skipReason === "string" ? payload.skipReason : null,
  };
}

function normalizeDailyDayResponse(payload: any): DailyCheckDayResponse {
  const date = typeof payload?.date === "string" ? payload.date : "";

  return {
    date,
    report: normalizeDailyCheckDayReport(payload?.report),
    lifecycle: normalizeDailyCheckDayLifecycle(payload?.lifecycle, date),
    items: Array.isArray(payload?.items)
      ? payload.items.map(normalizeDailyDayItem)
      : [],
  };
}

function normalizeDailyCheckItem(payload: any): DailyCheckItem {
  return {
    id: payload?.id ?? "",
    userId: payload?.userId ?? "",
    title: payload?.title ?? "",
    emoji: payload?.emoji ?? null,
    appliesMode:
      payload?.appliesMode === "selected_days" ? "selected_days" : "every_day",
    weekDays: Array.isArray(payload?.weekDays) ? payload.weekDays : [],
    sortOrder: typeof payload?.sortOrder === "number" ? payload.sortOrder : 0,
    startDate: payload?.startDate ?? "",
    endDate: payload?.endDate ?? null,
    createdAt: payload?.createdAt ?? "",
    updatedAt: payload?.updatedAt ?? "",
  };
}

function normalizeRangeDay(payload: any): DailyCheckRangeDay {
  const date = payload?.date ?? "";

  return {
    date,
    moodScore: payload?.moodScore ?? null,
    summary: payload?.summary ?? null,
    note: payload?.note ?? null,
    habitsTotal: typeof payload?.habitsTotal === "number" ? payload.habitsTotal : 0,
    yesCount: typeof payload?.yesCount === "number" ? payload.yesCount : 0,
    noCount: typeof payload?.noCount === "number" ? payload.noCount : 0,
    skippedCount:
      typeof payload?.skippedCount === "number" ? payload.skippedCount : 0,
    completionRate:
      typeof payload?.completionRate === "number" ? payload.completionRate : 0,
    finalScore: typeof payload?.finalScore === "number" ? payload.finalScore : 0,
    status: payload?.status ?? "open",
    deadlineAt: payload?.deadlineAt ?? getFallbackDeadlineIsoForDailyCheckDate(date),
    closedAt: payload?.closedAt ?? null,
    wasEditedAfterDeadline: Boolean(payload?.wasEditedAfterDeadline),
    timeZone: payload?.timeZone ?? "UTC",
    isOverdue: Boolean(payload?.isOverdue),
    canEdit: payload?.canEdit !== false,
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

  return Array.isArray(response) ? response.map(normalizeRangeDay) : [];
}

export async function getDailyCheckItems(): Promise<DailyCheckItem[]> {
  const response = await apiRequest<any[]>("/daily-check/items");
  return Array.isArray(response) ? response.map(normalizeDailyCheckItem) : [];
}

export async function createDailyCheckItem(
  payload: CreateDailyCheckItemPayload
): Promise<DailyCheckItem> {
  const response = await apiRequest<any>("/daily-check/items", {
    method: "POST",
    body: payload,
  });

  return normalizeDailyCheckItem(response);
}

export async function updateDailyCheckItem(
  itemId: string,
  payload: UpdateDailyCheckItemPayload
): Promise<DailyCheckItem> {
  const response = await apiRequest<any>(`/daily-check/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });

  return normalizeDailyCheckItem(response);
}

export async function deleteDailyCheckItem(itemId: string): Promise<void> {
  await apiRequest<void>(`/daily-check/items/${itemId}`, {
    method: "DELETE",
  });
}