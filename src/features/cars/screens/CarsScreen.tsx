/**
 * Экран списка машин
 *
 * Здесь пользователь:
 *  - видит свои машины
 *  - может добавить новую
 *  - может перейти в детали машины
 */

import { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getCars, createCar, Car } from "../api/car.api";
import { CarsStackParamList } from "../../../navigation/CarsStack";

/**
 * тип навигации
 */
type NavigationType = NativeStackNavigationProp<
  CarsStackParamList,
  "CarsList"
>;

export default function CarsScreen() {

  const navigation = useNavigation<NavigationType>();

  const [cars, setCars] = useState<Car[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  /**
   * загрузка машин
   */
  const loadCars = async () => {
    try {

      const data = await getCars();

      setCars(data);

    } catch (e) {

      console.log("Cars load error", e);

    } finally {

      setLoading(false);

    }
  };

  /**
   * загрузка при открытии экрана
   */
  useEffect(() => {
    loadCars();
  }, []);

  /**
   * создание машины
   */
  const handleCreateCar = async () => {

    if (!name) return;

    try {

      await createCar(name);

      setName("");

      await loadCars();

    } catch (e) {

      console.log("Create car error", e);

    }

  };

  /**
   * переход в детали машины
   */
  const openCar = (car: Car) => {

    navigation.navigate("CarDetails", {
      carId: car.id,
      name: car.name,
    });

  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        My Cars
      </Text>

      <TextInput
        placeholder="Car name (BMW X5)"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateCar}
      >
        <Text style={styles.buttonText}>
          ADD CAR
        </Text>
      </TouchableOpacity>

      <FlatList
        data={cars}
        refreshing={loading}
        onRefresh={loadCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

          <TouchableOpacity
            style={styles.carItem}
            onPress={() => openCar(item)}
          >

            <Text style={styles.carName}>
              {item.name}
            </Text>

          </TouchableOpacity>

        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#1e90ff",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  carItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  carName: {
    fontSize: 16,
    fontWeight: "500",
  },

});