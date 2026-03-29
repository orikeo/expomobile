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
import { DailyCheckRangeDay, DailyReportLifecycleStatus } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import { applyDailyCheckReminderSettings } from "../notifications/dailyCheckNotifications";
import {
  getDailyCheckReminderSettings,
  saveDailyCheckReminderSettings,
} from "../notifications/dailyCheckReminderSettings";
import {
  formatDeadlineLabel,
  formatDisplayDate,
  getDeviceTimeZone,
  getLast14DaysRange,
  getTodayDateString,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyOverview">;

function getStatusColor(status: DailyReportLifecycleStatus) {
  switch (status) {
    case "completed":
      return "#244b2f";
    case "partial":
      return "#5c4a1f";
    case "missed":
      return "#111111";
    case "open":
    default:
      return "#1f3b66";
  }
}

function getStatusLabel(status: DailyReportLifecycleStatus) {
  switch (status) {
    case "completed":
      return "completed";
    case "partial":
      return "partial";
    case "missed":
      return "missed";
    case "open":
    default:
      return "open";
  }
}

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  const timeZone = useMemo(() => getDeviceTimeZone(), []);
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
    const settings = await getDailyCheckReminderSettings();
    setRemindersEnabled(settings.enabled);
  }, []);

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
    []
  );

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
      <Text style={styles.subtitle}>
        Последние 14 дней и текущие статусы отчётов
      </Text>

      <View style={styles.topButtonsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("DailyDay", { date: getTodayDateString() })}
        >
          <Text style={styles.primaryButtonText}>Открыть сегодняшний отчёт</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("DailyHabits")}
        >
          <Text style={styles.secondaryButtonText}>Привычки</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.reminderCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>Напоминания</Text>
          <Text style={styles.reminderText}>
            Локальные уведомления для daily check
          </Text>
        </View>

        <Switch value={remindersEnabled} onValueChange={handleToggleReminders} />
      </View>

      {days.map((day) => (
        <TouchableOpacity
          key={day.date}
          style={styles.dayCard}
          onPress={() => navigation.navigate("DailyDay", { date: day.date })}
        >
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayTitle}>{formatDisplayDate(day.date)}</Text>
              <Text style={styles.daySubtitle}>
                Дедлайн: {formatDeadlineLabel(day.deadlineAt)}
              </Text>
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(day.status) }]}
            >
              <Text style={styles.statusBadgeText}>{getStatusLabel(day.status)}</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <Text style={styles.metricText}>Yes: {day.yesCount}</Text>
            <Text style={styles.metricText}>No: {day.noCount}</Text>
            <Text style={styles.metricText}>Skip: {day.skippedCount}</Text>
          </View>

          <Text style={styles.dayMeta}>Habits total: {day.habitsTotal}</Text>
          <Text style={styles.dayMeta}>Final score: {day.finalScore}</Text>

          {day.moodScore !== null ? (
            <Text style={styles.dayMeta}>Mood: {day.moodScore}/10</Text>
          ) : null}

          {day.summary ? (
            <Text style={styles.daySummary}>Summary: {day.summary}</Text>
          ) : null}

          {day.wasEditedAfterDeadline ? (
            <Text style={styles.lateEditText}>Отредактирован после дедлайна</Text>
          ) : null}
        </TouchableOpacity>
      ))}
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
  topButtonsRow: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#2d5bff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
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
  dayCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 12,
  },
  dayTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  daySubtitle: {
    color: "#aaaaaa",
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  metricText: {
    color: "#ffffff",
    fontSize: 13,
  },
  dayMeta: {
    color: "#c9c9c9",
    fontSize: 13,
    marginBottom: 4,
  },
  daySummary: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 4,
  },
  lateEditText: {
    color: "#ffd166",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
});