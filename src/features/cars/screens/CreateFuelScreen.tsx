import { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../../../navigation/CarsStack";
import { createFuelLog } from "../api/fuel.api";

type RouteType = RouteProp<CarsStackParamList, "CreateFuel">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "CreateFuel">;

export default function CreateFuelScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { carId, name } = route.params;

  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [odometer, setOdometer] = useState("");
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Add fuel - ${name}`,
    });
  }, [navigation, name]);

  async function handleSave() {
    if (!liters.trim()) {
      Alert.alert("Ошибка", "Введите количество литров");
      return;
    }

    if (!pricePerLiter.trim()) {
      Alert.alert("Ошибка", "Введите цену за литр");
      return;
    }

    if (!totalPrice.trim()) {
      Alert.alert("Ошибка", "Введите общую сумму");
      return;
    }

    try {
      setSaving(true);

      await createFuelLog({
        carId,
        liters: liters.trim(),
        pricePerLiter: pricePerLiter.trim(),
        totalPrice: totalPrice.trim(),
        odometer: odometer.trim() ? Number(odometer) : null,
      });

      navigation.goBack();
    } catch (error) {
      console.log("Create fuel log error:", error);

      const message =
        error instanceof Error ? error.message : "Не удалось создать запись";

      Alert.alert("Ошибка", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Liters</Text>
      <TextInput
        style={styles.input}
        value={liters}
        onChangeText={setLiters}
        keyboardType="decimal-pad"
        placeholder="40.5"
      />

      <Text style={styles.label}>Price per liter</Text>
      <TextInput
        style={styles.input}
        value={pricePerLiter}
        onChangeText={setPricePerLiter}
        keyboardType="decimal-pad"
        placeholder="56.20"
      />

      <Text style={styles.label}>Total price</Text>
      <TextInput
        style={styles.input}
        value={totalPrice}
        onChangeText={setTotalPrice}
        keyboardType="decimal-pad"
        placeholder="2276.10"
      />

      <Text style={styles.label}>Odometer</Text>
      <TextInput
        style={styles.input}
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="number-pad"
        placeholder="154000"
      />

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },

  button: {
    marginTop: 24,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});