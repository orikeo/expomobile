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
  ScrollView,
} from "react-native";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../../../navigation/CarsStack";
import { updateFuelLog } from "../api/fuel.api";
import { colors } from "../../../theme/color";

type RouteType = RouteProp<CarsStackParamList, "EditFuel">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "EditFuel">;

export default function EditFuelScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { fuelLog, name } = route.params;

  const [fuelDate, setFuelDate] = useState(fuelLog.fuelDate);
  const [liters, setLiters] = useState(String(fuelLog.liters));
  const [pricePerLiter, setPricePerLiter] = useState(
    String(fuelLog.pricePerLiter)
  );
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

  /**
   * Preview общей стоимости только для UI.
   */
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
      (Number.isNaN(odometerNumber) ||
        odometerNumber === null ||
        odometerNumber < 0)
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Edit fuel log</Text>
        <Text style={styles.sectionSubtitle}>
          Редактирование записи для {name}
        </Text>

        <Text style={styles.label}>Fuel date</Text>
        <TextInput
          style={styles.input}
          value={fuelDate}
          onChangeText={setFuelDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholder}
          editable={!saving}
        />

        <Text style={styles.label}>Liters</Text>
        <TextInput
          style={styles.input}
          value={liters}
          onChangeText={setLiters}
          keyboardType="decimal-pad"
          placeholder="40.5"
          placeholderTextColor={colors.placeholder}
          editable={!saving}
        />

        <Text style={styles.label}>Price per liter</Text>
        <TextInput
          style={styles.input}
          value={pricePerLiter}
          onChangeText={setPricePerLiter}
          keyboardType="decimal-pad"
          placeholder="56.20"
          placeholderTextColor={colors.placeholder}
          editable={!saving}
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
          placeholderTextColor={colors.placeholder}
          editable={!saving}
        />

        <Text style={styles.label}>Station (optional)</Text>
        <TextInput
          style={styles.input}
          value={station}
          onChangeText={setStation}
          placeholder="OKKO"
          placeholderTextColor={colors.placeholder}
          editable={!saving}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Full tank</Text>
            <Text style={styles.switchHint}>
              Включай, если это была заправка до полного бака
            </Text>
          </View>

          <Switch value={fullTank} onValueChange={setFullTank} disabled={saving} />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
    paddingBottom: 28,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
    color: colors.textPrimary,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
  },

  readonlyBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },

  readonlyText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  switchRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  switchLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  switchHint: {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 240,
  },

  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});