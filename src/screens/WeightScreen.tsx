import { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { getWeights, addWeight, Weight } from "../api/weight.api";

export default function WeightScreen() {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");

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

  useEffect(() => {
    loadWeights();
  }, []);

  const handleAddWeight = async () => {
    if (!newWeight) return;

    try {
      await addWeight(Number(newWeight));
      setNewWeight("");
      loadWeights();
    } catch (e) {
      console.log("Add weight error", e);
    }
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