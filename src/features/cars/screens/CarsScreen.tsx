/**
 * =========================================================
 * CARS SCREEN
 * =========================================================
 *
 * Здесь пользователь:
 *  - видит список своих машин
 *  - может добавить новую машину
 *  - может перейти в детали машины
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getCars, createCar, Car } from "../api/car.api";
import { CarsStackParamList } from "../../../navigation/CarsStack";
import { colors } from "../../../theme/color";

/**
 * Тип навигации для этого экрана.
 */
type NavigationType = NativeStackNavigationProp<
  CarsStackParamList,
  "CarsList"
>;

export default function CarsScreen() {
  const navigation = useNavigation<NavigationType>();

  const [cars, setCars] = useState<Car[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  /**
   * ---------------------------------------------------------
   * ЗАГРУЗКА СПИСКА МАШИН
   * ---------------------------------------------------------
   */
  async function loadCars() {
    try {
      setLoading(true);

      const data = await getCars();
      setCars(data);
    } catch (error) {
      console.log("Cars load error", error);
      Alert.alert("Ошибка", "Не удалось загрузить список машин");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Первая загрузка экрана.
   */
  useEffect(() => {
    loadCars();
  }, []);

  /**
   * ---------------------------------------------------------
   * СОЗДАНИЕ МАШИНЫ
   * ---------------------------------------------------------
   */
  async function handleCreateCar() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Ошибка", "Введите название машины");
      return;
    }

    try {
      setCreating(true);

      await createCar(trimmedName);

      setName("");
      await loadCars();
    } catch (error) {
      console.log("Create car error", error);
      Alert.alert("Ошибка", "Не удалось создать машину");
    } finally {
      setCreating(false);
    }
  }

  /**
   * Переход в детали выбранной машины.
   */
  function openCar(car: Car) {
    navigation.navigate("CarDetails", {
      carId: car.id,
      name: car.name,
    });
  }

  /**
   * Отрисовка одной карточки машины.
   */
  function renderCarItem({ item }: { item: Car }) {
    return (
      <TouchableOpacity style={styles.carCard} onPress={() => openCar(item)}>
        <Text style={styles.carName}>{item.name}</Text>
        <Text style={styles.carHint}>Открыть детали, заправки и ремонты</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Cars</Text>
      <Text style={styles.subtitle}>
        Здесь хранятся все машины для топлива и ремонтов
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>New car</Text>

        <TextInput
          placeholder="Car name (BMW X5)"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={!creating}
        />

        <TouchableOpacity
          style={[styles.button, creating && styles.buttonDisabled]}
          onPress={handleCreateCar}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Add car</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : cars.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Пока нет машин</Text>
          <Text style={styles.emptyText}>
            Добавь первую машину, чтобы вести заправки и ремонты
          </Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          refreshing={loading}
          onRefresh={loadCars}
          keyExtractor={(item) => item.id}
          renderItem={renderCarItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
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
    marginBottom: 12,
  },

  button: {
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
    fontSize: 15,
    fontWeight: "700",
  },

  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  listContent: {
    paddingBottom: 16,
  },

  carCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  carName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },

  carHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});