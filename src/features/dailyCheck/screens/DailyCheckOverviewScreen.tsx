import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { getDailyCheckRange } from "../api/dailyCheck.api";
import { DailyCheckRangeDay, DailyReportLifecycleStatus } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import {
  formatDeadlineLabel,
  formatDayShort,
  getDeviceTimeZone,
  getLast14DaysDateList,
  getLast14DaysRange,
  getTodayDateString,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyOverview">;

type OverviewDisplayStatus = "open" | "completed" | "partial" | "missed";

function getStatusColor(status: OverviewDisplayStatus) {
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

function getStatusLegendLabel(status: OverviewDisplayStatus) {
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

function getStatusCellMark(status: OverviewDisplayStatus) {
  switch (status) {
    case "completed":
      return "✓";
    case "partial":
      return "P";
    case "missed":
      return "M";
    case "open":
    default:
      return "";
  }
}

/**
 * Для overview нам важнее не только lifecycle-статус дня,
 * но и визуальная заполненность.
 *
 * Почему:
 * - backend до дедлайна хранит день как "open"
 * - поэтому даже 10/10 до дедлайна остаётся синим
 *
 * Здесь делаем display-статус:
 * - закрытые дни используем как есть
 * - открытые дни красим по фактической заполненности
 */
function getOverviewDisplayStatus(day: DailyCheckRangeDay): OverviewDisplayStatus {
  if (day.status !== "open") {
    return day.status;
  }

  const answeredCount = day.yesCount + day.noCount + day.skippedCount;
  const hasReportContent =
    day.moodScore !== null ||
    Boolean(day.summary?.trim()) ||
    Boolean(day.note?.trim());

  if (day.habitsTotal === 0) {
    return hasReportContent ? "completed" : "open";
  }

  if (answeredCount === 0 && !hasReportContent) {
    return "open";
  }

  if (answeredCount >= day.habitsTotal) {
    return "completed";
  }

  return "partial";
}

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  const timeZone = useMemo(() => getDeviceTimeZone(), []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<DailyCheckRangeDay[]>([]);
  const hasLoadedOnceRef = useRef(false);

  const loadOverview = useCallback(async () => {
    const { from, to } = getLast14DaysRange();
    const data = await getDailyCheckRange(from, to, timeZone);
    setDays(data);
  }, [timeZone]);

  const loadOverviewWithState = useCallback(
    async (showLoader: boolean) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        await loadOverview();
      } catch (error) {
        console.error("Failed to load daily overview:", error);
        Alert.alert("Ошибка", "Не удалось загрузить обзор daily check");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [loadOverview]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        try {
          if (!hasLoadedOnceRef.current) {
            setLoading(true);
          }

          const { from, to } = getLast14DaysRange();
          const data = await getDailyCheckRange(from, to, timeZone);

          if (!isActive) {
            return;
          }

          setDays(data);
          hasLoadedOnceRef.current = true;
        } catch (error) {
          console.error("Failed to load daily overview:", error);

          if (!hasLoadedOnceRef.current && isActive) {
            Alert.alert("Ошибка", "Не удалось загрузить обзор daily check");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      run();

      return () => {
        isActive = false;
      };
    }, [timeZone])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadOverviewWithState(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadOverviewWithState]);

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
          const displayStatus = getOverviewDisplayStatus(day);
          const isToday = day.date === selectedToday;
          const mark = getStatusCellMark(displayStatus);

          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCell,
                { backgroundColor: getStatusColor(displayStatus) },
                isToday && styles.todayCell,
              ]}
              onPress={() => navigation.navigate("DailyDay", { date: day.date })}
            >
              <View style={styles.dayCellTop}>
                <Text style={styles.dayCellDate}>{formatDayShort(day.date)}</Text>
                {mark ? <Text style={styles.dayCellMark}>{mark}</Text> : null}
              </View>

              <View>
                {day.moodScore !== null ? (
                  <Text style={styles.dayCellMood}>{day.moodScore}/10</Text>
                ) : (
                  <Text style={styles.dayCellEmpty}>—</Text>
                )}
              </View>
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
          <Text style={styles.legendText}>{getStatusLegendLabel("open")}</Text>

          <View style={[styles.legendDot, { backgroundColor: getStatusColor("completed") }]} />
          <Text style={styles.legendText}>{getStatusLegendLabel("completed")}</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: getStatusColor("partial") }]} />
          <Text style={styles.legendText}>{getStatusLegendLabel("partial")}</Text>

          <View style={[styles.legendDot, { backgroundColor: getStatusColor("missed") }]} />
          <Text style={styles.legendText}>{getStatusLegendLabel("missed")}</Text>
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
          Дедлайн:{" "}
          {formatDeadlineLabel(
            daysMap.get(selectedToday)?.deadlineAt ?? new Date().toISOString()
          )}
        </Text>
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
  dayCellTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dayCellDate: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  dayCellMark: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  dayCellMood: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  dayCellEmpty: {
    color: "#d0d0d0",
    fontSize: 9,
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