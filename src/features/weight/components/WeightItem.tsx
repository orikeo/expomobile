import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Weight } from "../api/weight.api";

type Props = {
  item: Weight;
  onDelete: (id: string) => void;
};

export default function WeightItem({ item, onDelete }: Props) {

  const confirmDelete = () => {
    Alert.alert(
      "Delete weight",
      "Do you really want to delete this record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  return (
    <View style={styles.item}>

      <View>
        <Text style={styles.weightText}>
          {item.weight} kg
        </Text>

        <Text style={styles.dateText}>
          {new Date(item.entryDate).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={confirmDelete}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  weightText: {
    fontSize: 16,
    fontWeight: "500",
  },

  dateText: {
    color: "#666",
    fontSize: 14,
  },

  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 13,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#e5e5e5",
  },

  deleteText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "600",
  },

});