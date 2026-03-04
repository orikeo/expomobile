import { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  Dimensions,
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
      setWeights(data);
    } catch (e) {
      console.log("Weight load error", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * вызывается один раз при открытии экрана
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
   * Подготавливаем данные для графика
   * react-native-chart-kit требует такой формат
   */
  const chartData = {
    labels: weights.map((_, i) => (i + 1).toString()),
    datasets: [
      {
        data: weights.map((w) => w.weight),
      },
    ],
  };

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

      <TextInput
        placeholder="Enter weight"
        keyboardType="numeric"
        value={newWeight}
        onChangeText={setNewWeight}
        style={styles.input}
      />

      <Button title="Add Weight" onPress={handleAddWeight} />

      {/* Показываем график только если есть данные */}
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
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          }}
          style={{
            marginVertical: 20,
            borderRadius: 10,
          }}
        />
      )}

      <FlatList
        data={weights}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.weight} kg</Text>
            <Text>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
    fontSize: 22,
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },

  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});