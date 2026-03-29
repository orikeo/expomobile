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
import { getFuelLogsByCarId, deleteFuelLog, FuelLog } from "../api/fuel.api";
import { colors } from "../../../theme/color";

type RouteType = RouteProp<CarsStackParamList, "FuelLogs">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "FuelLogs">;

/**
 * =========================================================
 * FUEL LOGS SCREEN
 * =========================================================
 *
 * Экран показывает список заправок выбранной машины.
 * Здесь можно:
 *  - загрузить историю
 *  - перейти к созданию новой записи
 *  - перейти к редактированию
 *  - удалить запись
 */
export default function FuelLogsScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { carId, name } = route.params;

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadFuelLogs() {
    try {
      setLoading(true);

      const data = await getFuelLogsByCarId(carId);
      setFuelLogs(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить заправки";

      Alert.alert("Ошибка", message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Заголовок экрана и кнопка добавления новой записи.
   */
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

  /**
   * Перезагрузка при каждом возврате на экран.
   * Это удобно после create / edit.
   */
  useFocusEffect(
    useCallback(() => {
      loadFuelLogs();
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

      /**
       * После успешного удаления сразу обновляем локальный список,
       * чтобы не делать лишний запрос.
       */
      setFuelLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось удалить запись";

      Alert.alert("Ошибка", message);
    } finally {
      setDeletingId(null);
    }
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
          История заправок этой машины появится здесь
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
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
  },

  cardDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 14,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
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
    opacity: 0.65,
  },
});