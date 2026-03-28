import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getDailyCheckRange } from "../api/dailyCheck.api";
import { DailyCheckRangeDay } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import {
  applyDailyCheckReminderSettings,
} from "../notifications/dailyCheckNotifications";
import {
  getDailyCheckReminderSettings,
  saveDailyCheckReminderSettings,
} from "../notifications/dailyCheckReminderSettings";

type Props = NativeStackScreenProps<
  DailyCheckStackParamList,
  "DailyOverview"
>;

function formatDateToYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getLast14DaysRange() {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);

  start.setDate(today.getDate() - 13);

  return {
    from: formatDateToYmd(start),
    to: formatDateToYmd(end),
  };
}

function getShortWeekday(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const labels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  return labels[day];
}

function getDayNumber(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).getDate().toString();
}

function getCardBackgroundColor(day: DailyCheckRangeDay): string {
  const { finalScore, habitsTotal } = day;

  if (habitsTotal === 0) {
    return "#1b1b1b";
  }

  if (finalScore <= 0.2) {
    return "#4a2020";
  }

  if (finalScore <= 0.4) {
    return "#5a321d";
  }

  if (finalScore <= 0.6) {
    return "#66521a";
  }

  if (finalScore <= 0.8) {
    return "#355a2f";
  }

  return "#1f6a35";
}

function getCardBorderColor(day: DailyCheckRangeDay): string {
  if (day.habitsTotal === 0) {
    return "#333333";
  }

  if (day.skippedCount > 0) {
    return "#c8b26a";
  }

  return "#444444";
}

function formatRangeLabel(from: string, to: string): string {
  return `${from} → ${to}`;
}

function formatTime(hour: number, minute: number): string {
  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function addHour(hour: number, delta: number): number {
  const next = hour + delta;

  if (next < 0) {
    return 23;
  }

  if (next > 23) {
    return 0;
  }

  return next;
}

function addMinute(minute: number, delta: number): number {
  const next = minute + delta;

  if (next < 0) {
    return 55;
  }

  if (next > 59) {
    return 0;
  }

  return next;
}

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [days, setDays] = useState<DailyCheckRangeDay[]>([]);

  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderHour, setReminderHour] = useState<number>(23);
  const [reminderMinute, setReminderMinute] = useState<number>(0);
  const [reminderSaving, setReminderSaving] = useState<boolean>(false);

  const range = useMemo(() => getLast14DaysRange(), []);
  const today = useMemo(() => formatDateToYmd(new Date()), []);

  const loadRange = useCallback(async () => {
    try {
      const response = await getDailyCheckRange(range.from, range.to);
      setDays(response);
    } catch (error) {
      console.error("Failed to load daily check range:", error);
      Alert.alert("Ошибка", "Не удалось загрузить обзор за 2 недели");
    }
  }, [range.from, range.to]);

  const loadReminderSettings = useCallback(async () => {
    try {
      const settings = await getDailyCheckReminderSettings();

      setReminderEnabled(settings.enabled);
      setReminderHour(settings.hour);
      setReminderMinute(settings.minute);
    } catch (error) {
      console.error("Failed to load reminder settings:", error);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await Promise.all([loadRange(), loadReminderSettings()]);
      setLoading(false);
    };

    run();
  }, [loadRange, loadReminderSettings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRange(), loadReminderSettings()]);
    setRefreshing(false);
  }, [loadRange, loadReminderSettings]);

  const firstWeek = days.slice(0, 7);
  const secondWeek = days.slice(7, 14);

  const handlePressDay = useCallback(
    (day: DailyCheckRangeDay) => {
      navigation.navigate("DailyDay", {
        date: day.date,
      });
    },
    [navigation]
  );

  const handleSaveReminderSettings = useCallback(
    async (nextSettings: {
      enabled: boolean;
      hour: number;
      minute: number;
    }) => {
      try {
        setReminderSaving(true);

        await saveDailyCheckReminderSettings(nextSettings);
        await applyDailyCheckReminderSettings(nextSettings);

        setReminderEnabled(nextSettings.enabled);
        setReminderHour(nextSettings.hour);
        setReminderMinute(nextSettings.minute);
      } catch (error) {
        console.error("Failed to save reminder settings:", error);
        Alert.alert("Ошибка", "Не удалось сохранить настройки напоминания");
      } finally {
        setReminderSaving(false);
      }
    },
    []
  );

  const renderWeekRow = (weekDays: DailyCheckRangeDay[]) => {
    return (
      <View style={styles.weekRow}>
        {weekDays.map((day) => {
          const hasText = Boolean(day.summary || day.note);
          const isEmptyDay = day.habitsTotal === 0;
          const isToday = day.date === today;

          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCard,
                {
                  backgroundColor: getCardBackgroundColor(day),
                  borderColor: isToday ? "#ffffff" : getCardBorderColor(day),
                  borderWidth: isToday ? 2 : 1,
                },
              ]}
              onPress={() => handlePressDay(day)}
            >
              <Text style={styles.dayWeekLabel}>{getShortWeekday(day.date)}</Text>
              <Text style={styles.dayNumber}>{getDayNumber(day.date)}</Text>

              <View style={styles.dayCenter}>
                {day.moodScore !== null ? (
                  <Text style={styles.moodText}>{day.moodScore}</Text>
                ) : (
                  <Text style={styles.moodPlaceholder}>—</Text>
                )}
              </View>

              <View style={styles.dayBottomRow}>
                {hasText ? (
                  <View style={styles.noteDot} />
                ) : (
                  <View style={styles.noteDotHidden} />
                )}

                <Text style={styles.habitMiniText}>
                  {isEmptyDay ? "0" : `${day.yesCount}/${day.habitsTotal}`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка обзора...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Последние 2 недели</Text>
      <Text style={styles.subtitle}>
        Цвет дня зависит от выполнения привычек. Цифра внутри — настроение.
      </Text>
      <Text style={styles.rangeLabel}>{formatRangeLabel(range.from, range.to)}</Text>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Как читать карточки</Text>
        <Text style={styles.legendText}>• Чем зеленее день, тем лучше итог</Text>
        <Text style={styles.legendText}>• Светлая рамка — сегодняшний день</Text>
        <Text style={styles.legendText}>• Золотистая рамка — в дне были skipped</Text>
        <Text style={styles.legendText}>• Точка означает, что есть итог дня или заметка</Text>
        <Text style={styles.legendText}>• Дробь внизу — выполнено / всего привычек</Text>
      </View>

      <View style={styles.reminderCard}>
        <View style={styles.reminderHeaderRow}>
          <View style={styles.reminderTextBlock}>
            <Text style={styles.reminderTitle}>Напоминание</Text>
            <Text style={styles.reminderText}>
              Ежедневное локальное напоминание о заполнении отчёта.
            </Text>
          </View>

          <Switch
            value={reminderEnabled}
            onValueChange={(value) =>
              handleSaveReminderSettings({
                enabled: value,
                hour: reminderHour,
                minute: reminderMinute,
              })
            }
            disabled={reminderSaving}
          />
        </View>

        <View
          style={[
            styles.timeControlsWrapper,
            !reminderEnabled && styles.timeControlsWrapperDisabled,
          ]}
        >
          <Text style={styles.timeLabel}>Время</Text>

          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeBlockLabel}>Часы</Text>

              <View style={styles.timeButtonsRow}>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  disabled={reminderSaving}
                  onPress={() =>
                    handleSaveReminderSettings({
                      enabled: reminderEnabled,
                      hour: addHour(reminderHour, -1),
                      minute: reminderMinute,
                    })
                  }
                >
                  <Text style={styles.timeAdjustButtonText}>-</Text>
                </TouchableOpacity>

                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValueText}>
                    {reminderHour.toString().padStart(2, "0")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  disabled={reminderSaving}
                  onPress={() =>
                    handleSaveReminderSettings({
                      enabled: reminderEnabled,
                      hour: addHour(reminderHour, 1),
                      minute: reminderMinute,
                    })
                  }
                >
                  <Text style={styles.timeAdjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeBlock}>
              <Text style={styles.timeBlockLabel}>Минуты</Text>

              <View style={styles.timeButtonsRow}>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  disabled={reminderSaving}
                  onPress={() =>
                    handleSaveReminderSettings({
                      enabled: reminderEnabled,
                      hour: reminderHour,
                      minute: addMinute(reminderMinute, -5),
                    })
                  }
                >
                  <Text style={styles.timeAdjustButtonText}>-</Text>
                </TouchableOpacity>

                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValueText}>
                    {reminderMinute.toString().padStart(2, "0")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  disabled={reminderSaving}
                  onPress={() =>
                    handleSaveReminderSettings({
                      enabled: reminderEnabled,
                      hour: reminderHour,
                      minute: addMinute(reminderMinute, 5),
                    })
                  }
                >
                  <Text style={styles.timeAdjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.currentTimeText}>
            Текущее время напоминания: {formatTime(reminderHour, reminderMinute)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.todayButton}
        onPress={() => navigation.navigate("DailyDay", { date: today })}
      >
        <Text style={styles.todayButtonText}>Открыть сегодняшний отчёт</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.habitsButton}
        onPress={() => navigation.navigate("DailyHabits")}
      >
        <Text style={styles.habitsButtonText}>Открыть привычки</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Неделя 1</Text>
        {renderWeekRow(firstWeek)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Неделя 2</Text>
        {renderWeekRow(secondWeek)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#aaaaaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  rangeLabel: {
    color: "#7f7f7f",
    fontSize: 12,
    marginBottom: 16,
  },
  legendCard: {
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  legendTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  legendText: {
    color: "#bbbbbb",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  reminderCard: {
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2c2c2c",
  },
  reminderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  reminderTextBlock: {
    flex: 1,
  },
  reminderTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  reminderText: {
    color: "#bbbbbb",
    fontSize: 13,
    lineHeight: 19,
  },
  timeControlsWrapper: {
    marginTop: 14,
  },
  timeControlsWrapperDisabled: {
    opacity: 0.45,
  },
  timeLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeBlock: {
    flex: 1,
  },
  timeBlockLabel: {
    color: "#aaaaaa",
    fontSize: 12,
    marginBottom: 8,
  },
  timeButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeAdjustButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  timeAdjustButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: -1,
  },
  timeValueBox: {
    flex: 1,
    marginHorizontal: 8,
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  timeValueText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  currentTimeText: {
    color: "#bbbbbb",
    fontSize: 13,
    marginTop: 12,
  },
  todayButton: {
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  todayButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  habitsButton: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  habitsButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: "space-between",
  },
  dayWeekLabel: {
    color: "#eeeeee",
    fontSize: 11,
    textAlign: "center",
    opacity: 0.9,
  },
  dayNumber: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  dayCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  moodText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  moodPlaceholder: {
    color: "#dddddd",
    fontSize: 18,
    opacity: 0.6,
  },
  dayBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    opacity: 0.9,
  },
  noteDotHidden: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  habitMiniText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
});