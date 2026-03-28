import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  DailyCheckReminderSettings,
  getDailyCheckReminderSettings,
} from "./dailyCheckReminderSettings";

/**
 * =========================================================
 * CONSTANTS
 * =========================================================
 */
const DAILY_CHECK_NOTIFICATION_TYPE = "daily-check-reminder";
const ANDROID_CHANNEL_ID = "daily-check-reminders";

/**
 * =========================================================
 * NOTIFICATION HANDLER
 * =========================================================
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * =========================================================
 * ANDROID CHANNEL
 * =========================================================
 */
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Daily Check Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
    vibrationPattern: [0, 250, 150, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/**
 * =========================================================
 * PERMISSIONS
 * =========================================================
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const currentPermissions = await Notifications.getPermissionsAsync();

  if (currentPermissions.granted) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();

  return requestedPermissions.granted;
}

/**
 * =========================================================
 * CANCEL OLD DAILY REMINDERS
 * =========================================================
 */
export async function cancelDailyCheckReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const dailyCheckNotifications = scheduled.filter(
    (item) => item.content.data?.type === DAILY_CHECK_NOTIFICATION_TYPE
  );

  await Promise.all(
    dailyCheckNotifications.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.identifier)
    )
  );
}

/**
 * =========================================================
 * SCHEDULE DAILY REMINDER
 * =========================================================
 */
export async function scheduleDailyCheckReminder(
  hour: number,
  minute: number
): Promise<void> {
  await cancelDailyCheckReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Check",
      body: "Не забудь заполнить отчёт за день",
      sound: "default",
      data: {
        type: DAILY_CHECK_NOTIFICATION_TYPE,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * =========================================================
 * APPLY SETTINGS
 * =========================================================
 *
 * Применяет конкретные настройки:
 * - если enabled = false -> отменяет уведомления
 * - если enabled = true  -> проверяет permission и планирует уведомление
 */
export async function applyDailyCheckReminderSettings(
  settings: DailyCheckReminderSettings
): Promise<void> {
  await ensureAndroidChannel();

  if (!settings.enabled) {
    await cancelDailyCheckReminders();
    return;
  }

  const hasPermission = await ensureNotificationPermissions();

  if (!hasPermission) {
    console.warn("Notification permission was not granted");
    return;
  }

  await scheduleDailyCheckReminder(settings.hour, settings.minute);
}

/**
 * =========================================================
 * INITIALIZE FROM STORAGE
 * =========================================================
 *
 * Читаем настройки из storage и применяем их при старте приложения.
 */
export async function initializeDailyCheckReminder(): Promise<void> {
  const settings = await getDailyCheckReminderSettings();
  await applyDailyCheckReminderSettings(settings);
}