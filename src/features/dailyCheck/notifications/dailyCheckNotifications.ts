import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

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
 *
 * Определяет, как уведомления показываются,
 * когда приложение уже открыто.
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
 *
 * Для Android желательно создать отдельный канал.
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
 *
 * Проверяем/запрашиваем разрешение на уведомления.
 */
async function ensureNotificationPermissions(): Promise<boolean> {
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
 *
 * Чтобы не плодить дубликаты, перед новым планированием
 * удаляем старые daily-check напоминания.
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
 *
 * Простая версия:
 * каждый день в 23:00 напоминаем заполнить отчёт.
 *
 * Позже можно сделать более умно:
 * проверять, заполнен ли день, и только тогда напоминать.
 */
export async function scheduleDailyCheckReminder(
  hour: number = 23,
  minute: number = 0
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

    /**
     * Для expo-notifications такой вариант триггера
     * обычно самый прямой и удобный.
     */
    trigger: {
      hour,
      minute,
      repeats: true,
    } as Notifications.NotificationTriggerInput,
  });
}

/**
 * =========================================================
 * INITIALIZE REMINDER
 * =========================================================
 *
 * Главная функция для App.tsx:
 * - создаёт Android channel
 * - запрашивает разрешение
 * - ставит ежедневное уведомление
 */
export async function initializeDailyCheckReminder(): Promise<void> {
  await ensureAndroidChannel();

  const hasPermission = await ensureNotificationPermissions();

  if (!hasPermission) {
    console.warn("Notification permission was not granted");
    return;
  }

  await scheduleDailyCheckReminder(23, 0);
}