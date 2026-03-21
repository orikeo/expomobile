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
  FuelLog,
} from "../api/fuel.api";

type RouteType = RouteProp<CarsStackParamList, "FuelLogs">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "FuelLogs">;

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
        <Text style={styles.cardText}>Total price: {item.totalPrice}</Text>
        <Text style={styles.cardText}>Odometer: {item.odometer ?? "—"}</Text>
        <Text style={styles.cardText}>
          Station: {item.station ? item.station : "—"}
        </Text>

        <Text style={styles.cardDate}>
          Created: {new Date(item.createdAt).toLocaleString()}
        </Text>

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
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
    color: "#007AFF",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#007AFF",
  },

  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  listContent: {
    padding: 16,
    backgroundColor: "#fff",
  },

  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeFull: {
    backgroundColor: "#dff5e3",
  },

  badgePartial: {
    backgroundColor: "#f3f3f3",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  cardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },

  cardDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
    marginBottom: 12,
  },

  deleteButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#e74c3c",
  },

  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  buttonDisabled: {
    opacity: 0.7,
  },
});