import { useCallback, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../../../navigation/CarsStack";
import {
  getFuelLogsByCarId,
  deleteFuelLog,
  getFuelStatsByCarId,
  FuelLog,
  FuelStatsResponse,
} from "../api/fuel.api";
import { colors } from "../../../theme/color";

type RouteType = RouteProp<CarsStackParamList, "FuelLogs">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "FuelLogs">;

function formatNumber(value: number) {
  return value.toFixed(2);
}

export default function FuelLogsScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { carId, name } = route.params;

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [stats, setStats] = useState<FuelStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadFuelData() {
    try {
      setLoading(true);

      const [logsData, statsData] = await Promise.all([
        getFuelLogsByCarId(carId),
        getFuelStatsByCarId(carId),
      ]);

      setFuelLogs(logsData);
      setStats(statsData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить заправки";

      Alert.alert("Ошибка", message);
    } finally {
      setLoading(false);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${name} - Fuel logs`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("CreateFuel", {
              carId,
              name,
            })
          }
        >
          <Text style={styles.headerButton}>Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, name, carId]);

  useFocusEffect(
    useCallback(() => {
      loadFuelData();
    }, [carId])
  );

  function handleDeletePress(item: FuelLog) {
    Alert.alert(
      "Удалить запись?",
      `Заправка от ${item.fuelDate} будет удалена`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => confirmDelete(item.id),
        },
      ]
    );
  }

  async function confirmDelete(id: string) {
    try {
      setDeletingId(id);
      await deleteFuelLog(id);

      await loadFuelData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось удалить запись";

      Alert.alert("Ошибка", message);
    } finally {
      setDeletingId(null);
    }
  }

  function renderStatsHeader() {
    if (!stats) {
      return null;
    }

    const { summary, consumption } = stats;

    return (
      <View style={styles.statsWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <Text style={styles.sectionSubtitle}>
            Общая сводка по машине {name}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Всего записей</Text>
            <Text style={styles.statValue}>{summary.totalLogs}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Полных баков</Text>
            <Text style={styles.statValue}>{summary.totalFullTankLogs}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Всего литров</Text>
            <Text style={styles.statValue}>
              {formatNumber(summary.totalLiters)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Всего потрачено</Text>
            <Text style={styles.statValue}>
              {formatNumber(summary.totalSpent)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Средняя цена / л</Text>
            <Text style={styles.statValue}>
              {formatNumber(summary.averagePricePerLiter)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Средняя заправка</Text>
            <Text style={styles.statValue}>
              {formatNumber(summary.averageFillVolume)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Последняя дата</Text>
            <Text style={styles.statValueSmall}>
              {summary.lastFuelDate ?? "—"}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Последний пробег</Text>
            <Text style={styles.statValueSmall}>
              {summary.lastOdometer !== null ? `${summary.lastOdometer} км` : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consumption</Text>
          <Text style={styles.sectionSubtitle}>
            Считается только по участкам между полными баками с известным пробегом
          </Text>
        </View>

        {consumption ? (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Участков</Text>
              <Text style={styles.statValue}>{consumption.segmentCount}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Пробег</Text>
              <Text style={styles.statValue}>
                {consumption.totalDistanceKm} км
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Топлива в расчёте</Text>
              <Text style={styles.statValue}>
                {formatNumber(consumption.totalLiters)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Потрачено в расчёте</Text>
              <Text style={styles.statValue}>
                {formatNumber(consumption.totalSpent)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Расход / 100 км</Text>
              <Text style={styles.statValue}>
                {formatNumber(consumption.averageConsumptionPer100Km)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Стоимость / км</Text>
              <Text style={styles.statValue}>
                {formatNumber(consumption.averageCostPerKm)}
              </Text>
            </View>

            <View style={styles.statCardWide}>
              <Text style={styles.statLabel}>Стоимость / 100 км</Text>
              <Text style={styles.statValue}>
                {formatNumber(consumption.averageCostPer100Km)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Пока мало данных для расхода</Text>
            <Text style={styles.infoText}>
              Нужны минимум две записи с отметкой Full tank и с заполненным
              odometer, чтобы приложение могло посчитать расход более осмысленно.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fuel history</Text>
          <Text style={styles.sectionSubtitle}>
            Все записи по заправкам этой машины
          </Text>
        </View>
      </View>
    );
  }

  function renderItem({ item }: { item: FuelLog }) {
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{item.fuelDate}</Text>

          <View
            style={[
              styles.badge,
              item.fullTank ? styles.badgeFull : styles.badgePartial,
            ]}
          >
            <Text style={styles.badgeText}>
              {item.fullTank ? "Full tank" : "Partial"}
            </Text>
          </View>
        </View>

        <Text style={styles.cardText}>Liters: {item.liters}</Text>
        <Text style={styles.cardText}>Price per liter: {item.pricePerLiter}</Text>
        <Text style={styles.totalPriceText}>Total price: {item.totalPrice}</Text>
        <Text style={styles.cardText}>Odometer: {item.odometer ?? "—"}</Text>
        <Text style={styles.cardText}>
          Station: {item.station ? item.station : "—"}
        </Text>

        <Text style={styles.cardDate}>
          Created: {new Date(item.createdAt).toLocaleString()}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate("EditFuel", {
                fuelLog: item,
                name,
              })
            }
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
            onPress={() => handleDeletePress(item)}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (fuelLogs.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Заправок пока нет</Text>
        <Text style={styles.emptyText}>
          Добавь несколько записей, и здесь появятся история и статистика
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate("CreateFuel", {
              carId,
              name,
            })
          }
        >
          <Text style={styles.addButtonText}>Add fuel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={fuelLogs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={renderStatsHeader()}
    />
  );
}

const styles = StyleSheet.create({
  headerButton: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.textPrimary,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },

  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  addButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  listContent: {
    padding: 16,
    backgroundColor: colors.background,
  },

  statsWrapper: {
    marginBottom: 8,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  statCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },

  statCardWide: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  statValueSmall: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    color: colors.textPrimary,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeFull: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },

  badgePartial: {
    backgroundColor: colors.neutral,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  totalPriceText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },

  cardDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  editButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  deleteButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.7,
  },
});