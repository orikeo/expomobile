import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  newWeight: string;
  setNewWeight: (value: string) => void;
  onAdd: () => void;
};

export default function WeightForm({
  newWeight,
  setNewWeight,
  onAdd,
}: Props) {
  return (
    <>
      <TextInput
        placeholder="Enter weight"
        keyboardType="numeric"
        value={newWeight}
        onChangeText={setNewWeight}
        style={styles.input}
      />

      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <Text style={styles.addButtonText}>ADD WEIGHT</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
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
});