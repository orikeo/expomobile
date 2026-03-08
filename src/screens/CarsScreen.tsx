import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { getCars, createCar, Car } from "../api/car.api";

export default function CarsScreen() {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Cars</Text>

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
          <View style={styles.carItem}>
            <Text style={styles.carName}>
              {item.name}
            </Text>
          </View>
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
    marginBottom: 20,
    fontWeight: "600",
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
    color: "white",
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