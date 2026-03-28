import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * =========================================================
 * STORAGE KEY
 * =========================================================
 */
const DAILY_CHECK_REMINDER_SETTINGS_KEY = "dailyCheckReminderSettings";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */
export type DailyCheckReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

/**
 * =========================================================
 * DEFAULT SETTINGS
 * =========================================================
 */
export const DEFAULT_DAILY_CHECK_REMINDER_SETTINGS: DailyCheckReminderSettings =
  {
    enabled: true,
    hour: 23,
    minute: 0,
  };

/**
 * =========================================================
 * GET SETTINGS
 * =========================================================
 *
 * Читаем настройки из AsyncStorage.
 * Если их нет или они битые — возвращаем default.
 */
export async function getDailyCheckReminderSettings(): Promise<DailyCheckReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_CHECK_REMINDER_SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_DAILY_CHECK_REMINDER_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<DailyCheckReminderSettings>;

    const enabled =
      typeof parsed.enabled === "boolean"
        ? parsed.enabled
        : DEFAULT_DAILY_CHECK_REMINDER_SETTINGS.enabled;

    const hour =
      typeof parsed.hour === "number" &&
      Number.isInteger(parsed.hour) &&
      parsed.hour >= 0 &&
      parsed.hour <= 23
        ? parsed.hour
        : DEFAULT_DAILY_CHECK_REMINDER_SETTINGS.hour;

    const minute =
      typeof parsed.minute === "number" &&
      Number.isInteger(parsed.minute) &&
      parsed.minute >= 0 &&
      parsed.minute <= 59
        ? parsed.minute
        : DEFAULT_DAILY_CHECK_REMINDER_SETTINGS.minute;

    return {
      enabled,
      hour,
      minute,
    };
  } catch (error) {
    console.error("Failed to read daily check reminder settings:", error);

    return DEFAULT_DAILY_CHECK_REMINDER_SETTINGS;
  }
}

/**
 * =========================================================
 * SAVE SETTINGS
 * =========================================================
 */
export async function saveDailyCheckReminderSettings(
  settings: DailyCheckReminderSettings
): Promise<void> {
  await AsyncStorage.setItem(
    DAILY_CHECK_REMINDER_SETTINGS_KEY,
    JSON.stringify(settings)
  );
}