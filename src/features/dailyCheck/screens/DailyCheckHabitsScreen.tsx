import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { getDailyCheckItems } from "../api/dailyCheck.api";
import { DailyCheckItem } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import { formatDisplayDate } from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyHabits">;

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatWeekDays(weekDays: number[]): string {
  const map: Record<number, string> = {
    1: "Пн",
    2: "Вт",
    3: "Ср",
    4: "Чт",
    5: "Пт",
    6: "Сб",
    7: "Вс",
  };

  if (!weekDays.length) {
    return "—";
  }

  if (weekDays.length === 7) {
    return "Каждый день";
  }

  return [...weekDays]
    .sort((a, b) => a - b)
    .map((day) => map[day] ?? String(day))
    .join(", ");
}

function formatAppliesMode(item: DailyCheckItem): string {
  if (item.appliesMode === "every_day") {
    return "Каждый день";
  }

  return `По дням: ${formatWeekDays(item.weekDays)}`;
}

export default function DailyCheckHabitsScreen({ navigation }: Props) {
  const [items, setItems] = useState<DailyCheckItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.title.localeCompare(b.title, "ru");
    });
  }, [items]);

  const loadItems = useCallback(async () => {
    const response = await getDailyCheckItems();
    setItems(response);
  }, []);

  const loadItemsWithState = useCallback(
    async (showLoader: boolean) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        await loadItems();
      } catch (error) {
        console.error("Failed to load habits:", error);
        Alert.alert("Ошибка", "Не удалось загрузить привычки");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [loadItems]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        try {
          if (isActive) {
            setLoading(true);
          }

          const response = await getDailyCheckItems();

          if (!isActive) {
            return;
          }

          setItems(response);
        } catch (error) {
          console.error("Failed to load habits:", error);

          if (isActive) {
            Alert.alert("Ошибка", "Не удалось загрузить привычки");
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
    }, [])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadItemsWithState(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadItemsWithState]);

  const renderItem = ({ item }: { item: DailyCheckItem }) => {
    return (
      <TouchableOpacity
        style={styles.habitCard}
        onPress={() =>
          navigation.navigate("DailyHabitForm", {
            mode: "edit",
            itemId: item.id,
          })
        }
      >
        <View style={styles.habitHeader}>
          <Text style={styles.habitTitle}>
            {item.emoji ? `${item.emoji} ` : ""}
            {item.title}
          </Text>
        </View>

        <Text style={styles.habitMeta}>{formatAppliesMode(item)}</Text>
        <Text style={styles.habitMeta}>Порядок: {item.sortOrder}</Text>

        {!!item.startDate && (
          <Text style={styles.habitMeta}>
            Действует с: {formatDisplayDate(item.startDate)}
          </Text>
        )}

        {!!item.endDate && (
          <Text style={styles.habitMeta}>
            Действует до: {formatDisplayDate(item.endDate)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка привычек...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Мои привычки</Text>
            <Text style={styles.subtitle}>
              Здесь можно смотреть, редактировать и добавлять привычки.
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate("DailyHabitForm", {
                  mode: "create",
                })
              }
            >
              <Text style={styles.addButtonText}>Добавить привычку</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>Пока привычек нет</Text>
            <Text style={styles.emptySubtext}>
              Создай первую привычку и она появится здесь.
            </Text>
          </View>
        }
      />
    </View>
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
    flexGrow: 1,
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
  header: {
    marginBottom: 18,
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
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  habitCard: {
    backgroundColor: "#1b1b1b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  habitTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    paddingRight: 12,
  },
  habitMeta: {
    color: "#bbbbbb",
    fontSize: 13,
    marginBottom: 4,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#aaaaaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});