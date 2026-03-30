/**
 * =========================================================
 * DAILY CHECK TIME HELPERS
 * =========================================================
 */

export const DAILY_CHECK_DEADLINE_HOUR = 12;

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatDateToLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateToLocalYmd(new Date());
}

/**
 * Активная дата daily check:
 * - с 00:00 до 11:59 открываем отчёт за предыдущий день
 * - с 12:00 и позже открываем отчёт за текущий день
 *
 * Это считается по локальному времени устройства.
 */
export function getCurrentDailyCheckDateString(now = new Date()): string {
  const result = new Date(now);

  if (result.getHours() < DAILY_CHECK_DEADLINE_HOUR) {
    result.setDate(result.getDate() - 1);
  }

  return formatDateToLocalYmd(result);
}

export function parseLocalYmdToDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Диапазон последних 14 дней.
 *
 * По умолчанию строится от "активной даты отчёта", а не просто от today.
 * Это важно, потому что утром до дедлайна активным ещё считается вчерашний день.
 */
export function getLast14DaysRange(anchorDate = getCurrentDailyCheckDateString()) {
  const endDate = parseLocalYmdToDate(anchorDate);
  const startDate = addDays(endDate, -13);

  return {
    from: formatDateToLocalYmd(startDate),
    to: formatDateToLocalYmd(endDate),
  };
}

export function getLast14DaysDateList(
  anchorDate = getCurrentDailyCheckDateString()
): string[] {
  const result: string[] = [];
  const endDate = parseLocalYmdToDate(anchorDate);

  for (let offset = 13; offset >= 0; offset -= 1) {
    result.push(formatDateToLocalYmd(addDays(endDate, -offset)));
  }

  return result;
}

export function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDayShort(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Локальный fallback-дедлайн для отчёта за конкретную дату:
 * отчёт за день D можно заполнить до 12:00 следующего дня.
 *
 * Нужен только как fallback на фронте,
 * если backend по какой-то причине не прислал deadlineAt.
 */
export function getFallbackDeadlineDateForDailyCheckDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const deadline = new Date(year, month - 1, day);

  deadline.setDate(deadline.getDate() + 1);
  deadline.setHours(DAILY_CHECK_DEADLINE_HOUR, 0, 0, 0);

  return deadline;
}

export function getFallbackDeadlineIsoForDailyCheckDate(value: string): string {
  return getFallbackDeadlineDateForDailyCheckDate(value).toISOString();
}

export function formatDeadlineLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}