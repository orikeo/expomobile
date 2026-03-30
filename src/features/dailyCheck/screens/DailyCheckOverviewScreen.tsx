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
import {
  DailyCheckRangeDay,
  DailyReportLifecycleStatus,
} from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import {
  formatDayShort,
  getCurrentDailyCheckDateString,
  getDeviceTimeZone,
  getFallbackDeadlineIsoForDailyCheckDate,
  getLast14DaysDateList,
  getLast14DaysRange,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyOverview">;

type OverviewDisplayStatus = "open" | "partial" | "completed";

function getOverviewDisplayStatus(day: DailyCheckRangeDay): OverviewDisplayStatus {
  const total = day.habitsTotal;
  const yes = day.yesCount;

  if (total <= 0 || yes <= 0) {
    return "open";
  }

  if (yes >= total) {
    return "completed";
  }

  return "partial";
}

function getGradientColor(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));

  if (clamped <= 0) {
    return "#1f4f9a";
  }

  if (clamped < 0.5) {
    return "#6d651f";
  }

  if (clamped < 0.9) {
    return "#447a2f";
  }

  return "#1f7a3d";
}

function getMoodLabel(day: DailyCheckRangeDay): string | null {
  if (day.moodScore === null || day.moodScore === undefined) {
    return null;
  }

  return `${day.moodScore}/10`;
}

function getStatusCellMark(status: OverviewDisplayStatus) {
  switch (status) {
    case "completed":
      return "✓";
    case "partial":
      return "•";
    case "open":
    default:
      return "";
  }
}

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  const timeZone = useMemo(() => getDeviceTimeZone(), []);
  const activeReportDate = useMemo(() => getCurrentDailyCheckDateString(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<DailyCheckRangeDay[]>([]);
  const hasLoadedOnceRef = useRef(false);

  const loadOverview = useCallback(async () => {
    const { from, to } = getLast14DaysRange(activeReportDate);
    const data = await getDailyCheckRange(from, to, timeZone);
    setDays(data);
  }, [activeReportDate, timeZone]);

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

          const { from, to } = getLast14DaysRange(activeReportDate);
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
    }, [activeReportDate, timeZone])
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
    return getLast14DaysDateList(activeReportDate).map((date) => {
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
          deadlineAt: getFallbackDeadlineIsoForDailyCheckDate(date),
          closedAt: null,
          wasEditedAfterDeadline: false,
          timeZone,
          isOverdue: false,
          canEdit: true,
        }
      );
    });
  }, [activeReportDate, daysMap, timeZone]);

  const firstRow = calendarDays.slice(0, 7);
  const secondRow = calendarDays.slice(7, 14);

  function renderRow(rowDays: DailyCheckRangeDay[]) {
    return (
      <View style={styles.daysRow}>
        {rowDays.map((day) => {
          const displayStatus = getOverviewDisplayStatus(day);
          const isActiveReportDay = day.date === activeReportDate;
          const mark = getStatusCellMark(displayStatus);
          const ratio = day.habitsTotal > 0 ? day.yesCount / day.habitsTotal : 0;
          const isPartial = ratio > 0 && ratio < 1;
          const moodLabel = getMoodLabel(day);

          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCell,
                { backgroundColor: getGradientColor(ratio) },
                isPartial && styles.partialCell,
                isActiveReportDay && styles.todayCell,
              ]}
              onPress={() => navigation.navigate("DailyDay", { date: day.date })}
            >
              <View style={styles.dayCellTop}>
                <Text style={styles.dayCellDate}>{formatDayShort(day.date)}</Text>
                {mark ? <Text style={styles.dayCellMark}>{mark}</Text> : null}
              </View>

              <View style={styles.dayCellBottom}>
  {moodLabel && (
    <Text style={styles.dayCellMood}>{moodLabel}</Text>
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
          <View style={[styles.legendDot, { backgroundColor: getGradientColor(0) }]} />
          <Text style={styles.legendText}>open</Text>

          <View style={[styles.legendDot, { backgroundColor: getGradientColor(0.4) }]} />
          <Text style={styles.legendText}>partial</Text>

          <View style={[styles.legendDot, { backgroundColor: getGradientColor(1) }]} />
          <Text style={styles.legendText}>completed</Text>
        </View>
      </View>

      <View style={styles.calendarCard}>
        {renderRow(firstRow)}
        {renderRow(secondRow)}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("DailyDay", { date: activeReportDate })}
      >
        <Text style={styles.primaryButtonText}>Открыть отчёт</Text>
      </TouchableOpacity>

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
    fontSize: 14,
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
  partialCell: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
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
  dayCellBottom: {
    marginTop: 6,
  },
  dayCellMood: {
    color: "#f3f3f3",
    fontSize: 10,
    fontWeight: "700",
  },
  dayCellEmpty: {
    color: "#d0d0d0",
    fontSize: 10,
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