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
import Constants from "expo-constants";

import { getDailyCheckRange } from "../api/dailyCheck.api";
import { DailyCheckRangeDay, DailyReportLifecycleStatus } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import { applyDailyCheckReminderSettings } from "../notifications/dailyCheckNotifications";
import {
  getDailyCheckReminderSettings,
  saveDailyCheckReminderSettings,
} from "../notifications/dailyCheckReminderSettings";
import {
  formatDeadlineLabel,
  formatDayShort,
  getDeviceTimeZone,
  getLast14DaysDateList,
  getLast14DaysRange,
  getTodayDateString,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyOverview">;

function getStatusColor(status: DailyReportLifecycleStatus) {
  switch (status) {
    case "completed":
      return "#244b2f";
    case "partial":
      return "#6b5a25";
    case "missed":
      return "#101010";
    case "open":
    default:
      return "#1f3b66";
  }
}

function getStatusLabel(status: DailyReportLifecycleStatus) {
  switch (status) {
    case "completed":
      return "done";
    case "partial":
      return "part";
    case "missed":
      return "miss";
    case "open":
    default:
      return "open";
  }
}

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  const timeZone = useMemo(() => getDeviceTimeZone(), []);

  /**
   * В Expo Go expo-notifications работает ограниченно.
   * Чтобы не ловить ошибки на toggle / apply settings,
   * скрываем активное управление напоминаниями в Expo Go.
   */
  const isExpoGo = Boolean(Constants.expoGoConfig);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<DailyCheckRangeDay[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const loadOverview = useCallback(async () => {
    const { from, to } = getLast14DaysRange();
    const data = await getDailyCheckRange(from, to, timeZone);
    setDays(data);
  }, [timeZone]);

  const loadReminderSettings = useCallback(async () => {
    if (isExpoGo) {
      setRemindersEnabled(false);
      return;
    }

    const settings = await getDailyCheckReminderSettings();
    setRemindersEnabled(settings.enabled);
  }, [isExpoGo]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await Promise.all([loadOverview(), loadReminderSettings()]);
      } catch (error) {
        console.error("Failed to load daily overview:", error);
        Alert.alert("Ошибка", "Не удалось загрузить обзор daily check");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadOverview, loadReminderSettings]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadOverview();
    } finally {
      setRefreshing(false);
    }
  }, [loadOverview]);

  const handleToggleReminders = useCallback(
    async (value: boolean) => {
      if (isExpoGo) {
        Alert.alert(
          "Expo Go",
          "Напоминания лучше проверять в development build. В Expo Go notifications поддерживаются ограниченно."
        );
        return;
      }

      try {
        setRemindersEnabled(value);

        const current = await getDailyCheckReminderSettings();
        const nextSettings = {
          ...current,
          enabled: value,
        };

        await saveDailyCheckReminderSettings(nextSettings);
        await applyDailyCheckReminderSettings(nextSettings);
      } catch (error) {
        console.error("Failed to toggle reminders:", error);
        setRemindersEnabled((prev) => !prev);
        Alert.alert("Ошибка", "Не удалось обновить настройки напоминаний");
      }
    },
    [isExpoGo]
  );

  const daysMap = useMemo(() => {
    const map = new Map<string, DailyCheckRangeDay>();

    for (const day of days) {
      map.set(day.date, day);
    }

    return map;
  }, [days]);

  const calendarDays = useMemo(() => {
    return getLast14DaysDateList().map((date) => {
      const existing = daysMap.get(date);

      return (
        existing ?? {
          date,
          moodScore: null,
          summary: null,
          note: null,
          habitsTotal: 0,
          yesCount: 0,
          noCount: 0,
          skippedCount: 0,
          completionRate: 0,
          finalScore: 0,
          status: "open" as DailyReportLifecycleStatus,
          deadlineAt: new Date().toISOString(),
          closedAt: null,
          wasEditedAfterDeadline: false,
          timeZone,
          isOverdue: false,
          canEdit: true,
        }
      );
    });
  }, [daysMap, timeZone]);

  const firstRow = calendarDays.slice(0, 7);
  const secondRow = calendarDays.slice(7, 14);
  const selectedToday = getTodayDateString();

  function renderRow(rowDays: DailyCheckRangeDay[]) {
    return (
      <View style={styles.daysRow}>
        {rowDays.map((day) => {
          const isToday = day.date === selectedToday;

          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCell,
                { backgroundColor: getStatusColor(day.status) },
                isToday && styles.todayCell,
              ]}
              onPress={() => navigation.navigate("DailyDay", { date: day.date })}
            >
              <Text style={styles.dayCellDate}>{formatDayShort(day.date)}</Text>
              <Text style={styles.dayCellStatus}>{getStatusLabel(day.status)}</Text>
              {day.moodScore !== null ? (
                <Text style={styles.dayCellMood}>{day.moodScore}/10</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Daily Check</Text>
      <Text style={styles.subtitle}>Последние 14 дней</Text>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Статусы</Text>

        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: getStatusColor("open") }]} />
          <Text style={styles.legendText}>open</Text>

          <View style={[styles.legendDot, { backgroundColor: getStatusColor("completed") }]} />
          <Text style={styles.legendText}>completed</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: getStatusColor("partial") }]} />
          <Text style={styles.legendText}>partial</Text>

          <View style={[styles.legendDot, { backgroundColor: getStatusColor("missed") }]} />
          <Text style={styles.legendText}>missed</Text>
        </View>
      </View>

      <View style={styles.calendarCard}>
        {renderRow(firstRow)}
        {renderRow(secondRow)}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("DailyDay", { date: selectedToday })}
      >
        <Text style={styles.primaryButtonText}>Открыть отчёт</Text>
      </TouchableOpacity>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomTitle}>Сегодня</Text>
        <Text style={styles.bottomText}>
          Дедлайн: {formatDeadlineLabel(daysMap.get(selectedToday)?.deadlineAt ?? new Date().toISOString())}
        </Text>
      </View>

      <View style={styles.reminderCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>Напоминания</Text>
          <Text style={styles.reminderText}>
            {isExpoGo
              ? "В Expo Go лучше не тестировать notifications"
              : "Локальные уведомления daily check"}
          </Text>
        </View>

        <Switch
          value={remindersEnabled}
          onValueChange={handleToggleReminders}
          disabled={isExpoGo}
        />
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("DailyHabits")}
      >
        <Text style={styles.secondaryButtonText}>Привычки</Text>
      </TouchableOpacity>
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
    paddingBottom: 28,
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
    marginBottom: 16,
  },
  legendCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  legendTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  legendText: {
    color: "#d0d0d0",
    marginRight: 12,
  },
  calendarCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayCell: {
    width: "13.2%",
    aspectRatio: 1,
    borderRadius: 12,
    padding: 6,
    justifyContent: "space-between",
  },
  todayCell: {
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  dayCellDate: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  dayCellStatus: {
    color: "#ffffff",
    fontSize: 9,
  },
  dayCellMood: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#2d5bff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  bottomTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  bottomText: {
    color: "#c9c9c9",
    fontSize: 13,
  },
  reminderCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  reminderTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  reminderText: {
    color: "#aaaaaa",
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});