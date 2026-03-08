/**
 * Экран деталей машины
 *
 * Пользователь попадает сюда после выбора машины
 * Здесь можно перейти в:
 *  - Fuel logs
 *  - Repairs
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useRoute, useNavigation } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../navigation/CarsStack";

/**
 * тип параметров route
 */
type RouteType = RouteProp<CarsStackParamList, "CarDetails">;

/**
 * тип навигации
 */
type NavigationType = NativeStackNavigationProp<CarsStackParamList>;

export default function CarDetailsScreen() {

  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  /**
   * параметры переданные из CarsScreen
   */
  const { carId, name } = route.params;

  return (

    <View style={styles.container}>

      {/* название машины */}
      <Text style={styles.title}>
        {name}
      </Text>

      {/* кнопка перехода в fuel logs */}
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("FuelLogs", {
            carId,
            name,
          })
        }
      >
        <Text style={styles.itemText}>
          Fuel logs
        </Text>
      </TouchableOpacity>

      {/* кнопка перехода в repairs */}
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate("Repairs", {
            carId,
            name,
          })
        }
      >
        <Text style={styles.itemText}>
          Repairs
        </Text>
      </TouchableOpacity>

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 30,
  },

  item: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 12,
  },

  itemText: {
    fontSize: 16,
    fontWeight: "500",
  },

});