import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  Dimensions,
  TouchableOpacity,
} from "react-native";

import { LineChart } from "react-native-chart-kit";

import { getWeights, addWeight, Weight } from "../api/weight.api";

export default function WeightScreen() {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");

  /**
   * Загружаем веса с backend
   */
  const loadWeights = async () => {
    try {
      const data = await getWeights();

      // сортируем по дате
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.entryDate).getTime() -
          new Date(b.entryDate).getTime()
      );

      setWeights(sorted);
    } catch (e) {
      console.log("Weight load error", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * загружаем при открытии экрана
   */
  useEffect(() => {
    loadWeights();
  }, []);

  /**
   * добавление веса
   */
  const handleAddWeight = async () => {
    if (!newWeight) return;

    try {
      await addWeight(Number(newWeight));

      setNewWeight("");

      await loadWeights();

      Alert.alert("Success", "Weight added");

      Keyboard.dismiss();
    } catch (e) {
      console.log("Add weight error", e);
    }
  };

  /**
   * данные для графика
   */
  const chartData = {
    labels: weights.map((w) =>
      new Date(w.entryDate).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      })
    ),

    datasets: [
      {
        data: weights.map((w) => w.weight),
      },
    ],
  };

  /**
   * текущий вес (последний)
   */
  const currentWeight =
    weights.length > 0 ? weights[weights.length - 1].weight : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Tracker</Text>

      {currentWeight && (
        <Text style={styles.currentWeight}>
          Current weight: {currentWeight} kg
        </Text>
      )}

      <TextInput
        placeholder="Enter weight"
        keyboardType="numeric"
        value={newWeight}
        onChangeText={setNewWeight}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddWeight}
      >
        <Text style={styles.addButtonText}>ADD WEIGHT</Text>
      </TouchableOpacity>

      {weights.length > 0 && (
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 20}
          height={220}
          yAxisSuffix="kg"
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 1,
            color: (opacity = 1) =>
              `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) =>
              `rgba(0,0,0,${opacity})`,
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#1e90ff",
            },
          }}
          style={{
            marginVertical: 20,
            borderRadius: 10,
          }}
        />
      )}

      <FlatList
        data={weights}
        refreshing={loading}
        onRefresh={loadWeights}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.weightText}>
              {item.weight} kg
            </Text>

            <Text style={styles.dateText}>
              {new Date(item.entryDate).toLocaleDateString()}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "600",
  },

  currentWeight: {
    fontSize: 18,
    marginBottom: 15,
    color: "#555",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },

  addButton: {
    backgroundColor: "#1e90ff",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 15,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  weightText: {
    fontSize: 16,
    fontWeight: "500",
  },

  dateText: {
    color: "#666",
    fontSize: 14,
  },
});