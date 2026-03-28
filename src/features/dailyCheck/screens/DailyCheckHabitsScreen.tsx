import React, { useCallback, useEffect, useState } from "react";
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

import { getDailyCheckItems } from "../api/dailyCheck.api";
import { DailyCheckItem } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyHabits">;

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Преобразуем номера дней в короткую подпись.
 * 1 = пн ... 7 = вс
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

  return weekDays.map((day) => map[day] ?? String(day)).join(", ");
}

export default function DailyCheckHabitsScreen({ navigation }: Props) {
  const [items, setItems] = useState<DailyCheckItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * =========================================================
   * LOAD ITEMS
   * =========================================================
   */
  const loadItems = useCallback(async () => {
    try {
      const response = await getDailyCheckItems();
      setItems(response);
    } catch (error) {
      console.error("Failed to load habits:", error);
      Alert.alert("Ошибка", "Не удалось загрузить привычки");
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadItems();
      setLoading(false);
    };

    const unsubscribe = navigation.addListener("focus", () => {
      loadItems();
    });

    run();

    return unsubscribe;
  }, [loadItems, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  /**
   * =========================================================
   * RENDER ITEM
   * =========================================================
   */
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

          <View
            style={[
              styles.statusBadge,
              item.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {item.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <Text style={styles.habitMeta}>
          Дни: {formatWeekDays(item.weekDays)}
        </Text>

        <Text style={styles.habitMeta}>Порядок: {item.sortOrder}</Text>
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
        data={items}
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
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeActive: {
    backgroundColor: "#244b2f",
  },
  statusBadgeInactive: {
    backgroundColor: "#4a2a2a",
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#aaaaaa",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});