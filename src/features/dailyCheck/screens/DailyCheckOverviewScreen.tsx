import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import { getDailyCheckRange } from "../api/dailyCheck.api";
import { DailyCheckRangeDay } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";

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

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [days, setDays] = useState<DailyCheckRangeDay[]>([]);

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

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadRange();
      setLoading(false);
    };

    run();
  }, [loadRange]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRange();
    setRefreshing(false);
  }, [loadRange]);

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

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Напоминание</Text>
        <Text style={styles.infoCardText}>
          Сейчас приложение ставит простое ежедневное локальное уведомление на 23:00.
        </Text>
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
  infoCard: {
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2c2c2c",
  },
  infoCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoCardText: {
    color: "#bbbbbb",
    fontSize: 13,
    lineHeight: 19,
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