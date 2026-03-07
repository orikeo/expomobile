import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";

import {
  getWeights,
  addWeight,
  deleteWeight,
  Weight,
} from "../api/weight.api";

import WeightForm from "../components/weight/WeightForm";
import WeightChart from "../components/weight/WeightChart";
import WeightList from "../components/weight/WeightList";

export default function WeightScreen() {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");

  /**
   * загрузка весов
   */
  const loadWeights = async () => {
    try {
      const data = await getWeights();

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
   * загрузка при открытии
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
   * удаление веса
   */
  const handleDeleteWeight = async (id: string) => {
    try {
      await deleteWeight(id);

      await loadWeights();
    } catch (e) {
      console.log("Delete weight error", e);
    }
  };

  /**
   * текущий вес
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

      <WeightForm
        newWeight={newWeight}
        setNewWeight={setNewWeight}
        onAdd={handleAddWeight}
      />

      {weights.length > 0 && (
        <WeightChart weights={weights} />
      )}

      <WeightList
        weights={weights}
        loading={loading}
        onRefresh={loadWeights}
        onDelete={handleDeleteWeight}
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
});