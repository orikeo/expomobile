/**
 * =========================================================
 * CAR DETAILS SCREEN
 * =========================================================
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
import { colors } from "../../../theme/color";

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
      <View style={styles.heroCard}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Управление машиной</Text>
        <Text style={styles.carId}>ID: {carId}</Text>
      </View>

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
          История заправок, расход и стоимость топлива
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
          История ремонтов и обслуживания машины
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  carId: {
    fontSize: 12,
    color: colors.textMuted,
  },

  item: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: colors.surface,
  },

  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    color: colors.textPrimary,
  },

  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});