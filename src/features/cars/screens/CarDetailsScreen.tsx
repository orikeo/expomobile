/**
 * Экран деталей машины
 *
 * Пользователь попадает сюда после выбора машины.
 * Отсюда можно перейти в:
 *  - Fuel logs
 *  - Repairs
 */

import { useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../../../navigation/CarsStack";

type RouteType = RouteProp<CarsStackParamList, "CarDetails">;
type NavigationType = NativeStackNavigationProp<
  CarsStackParamList,
  "CarDetails"
>;

export default function CarDetailsScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { carId, name } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
    });
  }, [navigation, name]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>

      <Text style={styles.subtitle}>Управление машиной</Text>

      <Text style={styles.carId}>ID: {carId}</Text>

      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("FuelLogs", {
            carId,
            name,
          })
        }
      >
        <Text style={styles.itemTitle}>Fuel logs</Text>
        <Text style={styles.itemDescription}>
          Посмотреть историю заправок
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("Repairs", {
            carId,
            name,
          })
        }
      >
        <Text style={styles.itemTitle}>Repairs</Text>
        <Text style={styles.itemDescription}>
          Посмотреть историю ремонтов
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },

  carId: {
    fontSize: 12,
    color: "#999",
    marginBottom: 24,
  },

  item: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: "#fafafa",
  },

  itemTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },

  itemDescription: {
    fontSize: 14,
    color: "#666",
  },
});