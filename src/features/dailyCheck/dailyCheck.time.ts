/**
 * =========================================================
 * DAILY CHECK TIME HELPERS
 * =========================================================
 */

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

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getLast14DaysRange() {
  const endDate = new Date();
  const startDate = addDays(endDate, -13);

  return {
    from: formatDateToLocalYmd(startDate),
    to: formatDateToLocalYmd(endDate),
  };
}

export function getLast14DaysDateList(): string[] {
  const result: string[] = [];
  const today = new Date();

  for (let offset = 13; offset >= 0; offset -= 1) {
    result.push(formatDateToLocalYmd(addDays(today, -offset)));
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