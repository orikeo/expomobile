import { useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../../../navigation/CarsStack";
import { updateFuelLog } from "../api/fuel.api";

type RouteType = RouteProp<CarsStackParamList, "EditFuel">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "EditFuel">;

export default function EditFuelScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { fuelLog, name } = route.params;

  const [fuelDate, setFuelDate] = useState(fuelLog.fuelDate);
  const [liters, setLiters] = useState(String(fuelLog.liters));
  const [pricePerLiter, setPricePerLiter] = useState(String(fuelLog.pricePerLiter));
  const [odometer, setOdometer] = useState(
    fuelLog.odometer !== null ? String(fuelLog.odometer) : ""
  );
  const [station, setStation] = useState(fuelLog.station ?? "");
  const [fullTank, setFullTank] = useState(fuelLog.fullTank);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Edit fuel - ${name}`,
    });
  }, [navigation, name]);

  const totalPricePreview = useMemo(() => {
    const litersNumber = Number(liters.replace(",", "."));
    const priceNumber = Number(pricePerLiter.replace(",", "."));

    if (
      Number.isNaN(litersNumber) ||
      Number.isNaN(priceNumber) ||
      litersNumber <= 0 ||
      priceNumber <= 0
    ) {
      return "";
    }

    return (litersNumber * priceNumber).toFixed(2);
  }, [liters, pricePerLiter]);

  async function handleSave() {
    const litersNumber = Number(liters.replace(",", "."));
    const priceNumber = Number(pricePerLiter.replace(",", "."));
    const odometerNumber = odometer.trim() ? Number(odometer) : null;

    if (!fuelDate.trim()) {
      Alert.alert("Ошибка", "Введите дату заправки");
      return;
    }

    if (Number.isNaN(Date.parse(fuelDate))) {
      Alert.alert("Ошибка", "Некорректная дата. Используй формат YYYY-MM-DD");
      return;
    }

    if (Number.isNaN(litersNumber) || litersNumber <= 0) {
      Alert.alert("Ошибка", "Количество литров должно быть больше 0");
      return;
    }

    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert("Ошибка", "Цена за литр должна быть больше 0");
      return;
    }

    if (
      odometer.trim() &&
      (Number.isNaN(odometerNumber) || odometerNumber === null || odometerNumber < 0)
    ) {
      Alert.alert("Ошибка", "Пробег не может быть отрицательным");
      return;
    }

    try {
      setSaving(true);

      await updateFuelLog(fuelLog.id, {
        fuelDate,
        liters: litersNumber,
        pricePerLiter: priceNumber,
        odometer: odometerNumber,
        fullTank,
        station: station.trim() ? station.trim() : null,
      });

      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось обновить запись";

      Alert.alert("Ошибка", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fuel date</Text>
      <TextInput
        style={styles.input}
        value={fuelDate}
        onChangeText={setFuelDate}
        placeholder="YYYY-MM-DD"
      />

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
      <View style={styles.readonlyBox}>
        <Text style={styles.readonlyText}>{totalPricePreview || "—"}</Text>
      </View>

      <Text style={styles.label}>Odometer (optional)</Text>
      <TextInput
        style={styles.input}
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="number-pad"
        placeholder="154000"
      />

      <Text style={styles.label}>Station (optional)</Text>
      <TextInput
        style={styles.input}
        value={station}
        onChangeText={setStation}
        placeholder="OKKO"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Full tank</Text>
        <Switch value={fullTank} onValueChange={setFullTank} />
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save changes</Text>
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

  readonlyBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f2f2f2",
  },

  readonlyText: {
    fontSize: 16,
    color: "#333",
  },

  switchRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
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