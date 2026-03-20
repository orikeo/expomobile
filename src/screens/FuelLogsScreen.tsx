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

import { CarsStackParamList } from "../navigation/CarsStack";
import { getFuelLogsByCarId, FuelLog } from "../api/fuel.api";

type RouteType = RouteProp<CarsStackParamList, "FuelLogs">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "FuelLogs">;

export default function FuelLogsScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { carId, name } = route.params;

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFuelLogs() {
    try {
      setLoading(true);

      const data = await getFuelLogsByCarId(carId);
      setFuelLogs(data);
    } catch (error) {
      console.log("Load fuel logs error:", error);

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

  function renderItem({ item }: { item: FuelLog }) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.liters} л</Text>

        <Text style={styles.cardText}>
          Цена за литр: {item.pricePerLiter}
        </Text>

        <Text style={styles.cardText}>
          Общая сумма: {item.totalPrice}
        </Text>

        <Text style={styles.cardText}>
          Пробег: {item.odometer ?? "—"}
        </Text>

        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
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

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
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
  },
});