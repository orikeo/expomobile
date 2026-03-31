import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { CarsStackParamList } from "../../../navigation/CarsStack";
import { colors } from "../../../theme/color";
import {
  createRepair,
  createRepairType,
  deleteRepair,
  getRepairTypes,
  getRepairsByCarId,
  Repair,
  RepairType,
  updateRepair,
} from "../api/repairs.api";

type RouteType = RouteProp<CarsStackParamList, "Repairs">;
type NavigationType = NativeStackNavigationProp<CarsStackParamList, "Repairs">;

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatRepairDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString();
}

export default function RepairsScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationType>();

  const { carId, name } = route.params;

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [repairTypes, setRepairTypes] = useState<RepairType[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingType, setCreatingType] = useState(false);

  const [repairTypeId, setRepairTypeId] = useState("");
  const [repairDate, setRepairDate] = useState(getTodayDateString());
  const [odometer, setOdometer] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  const [newTypeName, setNewTypeName] = useState("");

  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Repairs - ${name}`,
    });
  }, [navigation, name]);

  const selectedRepairTypeName = useMemo(() => {
    const selected = repairTypes.find((type) => type.id === repairTypeId);
    return selected?.name ?? "Не выбран";
  }, [repairTypeId, repairTypes]);

  const isEditing = editingRepairId !== null;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [repairsData, repairTypesData] = await Promise.all([
        getRepairsByCarId(carId),
        getRepairTypes(),
      ]);

      setRepairs(repairsData);
      setRepairTypes(repairTypesData);

      if (!editingRepairId && !repairTypeId && repairTypesData.length > 0) {
        setRepairTypeId(repairTypesData[0].id);
      }
    } catch (error) {
      console.log("Repairs load error", error);
      Alert.alert("Ошибка", "Не удалось загрузить ремонты");
    } finally {
      setLoading(false);
    }
  }, [carId, editingRepairId, repairTypeId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function resetForm(nextTypes?: RepairType[]) {
    const types = nextTypes ?? repairTypes;

    setRepairTypeId(types[0]?.id ?? "");
    setRepairDate(getTodayDateString());
    setOdometer("");
    setPrice("");
    setNote("");
    setEditingRepairId(null);
  }

  function validateForm() {
    if (!repairTypeId) {
      Alert.alert("Ошибка", "Выбери тип ремонта");
      return false;
    }

    if (!repairDate.trim()) {
      Alert.alert("Ошибка", "Введите дату ремонта");
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(repairDate.trim())) {
      Alert.alert("Ошибка", "Дата ремонта должна быть в формате YYYY-MM-DD");
      return false;
    }

    if (Number.isNaN(Date.parse(repairDate.trim()))) {
      Alert.alert("Ошибка", "Некорректная дата ремонта");
      return false;
    }

    const normalizedPrice = Number(price.replace(",", "."));

    if (Number.isNaN(normalizedPrice) || normalizedPrice <= 0) {
      Alert.alert("Ошибка", "Цена ремонта должна быть больше 0");
      return false;
    }

    if (odometer.trim()) {
      const odometerNumber = Number(odometer);

      if (!Number.isInteger(odometerNumber) || odometerNumber < 0) {
        Alert.alert("Ошибка", "Пробег должен быть целым числом и не меньше 0");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        carId,
        repairTypeId,
        repairDate: repairDate.trim(),
        price: price.replace(",", ".").trim(),
        odometer: odometer.trim() ? Number(odometer) : null,
        note: note.trim() ? note.trim() : null,
      };

      if (isEditing && editingRepairId) {
        await updateRepair(editingRepairId, {
          repairTypeId: payload.repairTypeId,
          repairDate: payload.repairDate,
          price: payload.price,
          odometer: payload.odometer,
          note: payload.note,
        });
      } else {
        await createRepair(payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось сохранить ремонт";

      Alert.alert("Ошибка", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateType() {
    const trimmedName = newTypeName.trim();

    if (!trimmedName) {
      Alert.alert("Ошибка", "Введите название нового типа ремонта");
      return;
    }

    try {
      setCreatingType(true);

      const createdType = await createRepairType(trimmedName);

      const nextTypes = [...repairTypes, createdType].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setRepairTypes(nextTypes);
      setRepairTypeId(createdType.id);
      setNewTypeName("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось создать тип ремонта";

      Alert.alert("Ошибка", message);
    } finally {
      setCreatingType(false);
    }
  }

  function handleStartEdit(repair: Repair) {
    setEditingRepairId(repair.id);
    setRepairTypeId(repair.repairTypeId);
    setRepairDate(repair.repairDate);
    setOdometer(repair.odometer !== null ? String(repair.odometer) : "");
    setPrice(repair.price);
    setNote(repair.note ?? "");
  }

  function handleCancelEdit() {
    resetForm();
  }

  function handleDelete(repair: Repair) {
    Alert.alert(
      "Удалить ремонт?",
      `${repair.repairTypeName ?? "Ремонт"} будет удалён`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRepair(repair.id);

              if (editingRepairId === repair.id) {
                resetForm();
              }

              await loadData();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Не удалось удалить ремонт";

              Alert.alert("Ошибка", message);
            }
          },
        },
      ]
    );
  }

  function renderRepairTypeSelector() {
    if (repairTypes.length === 0) {
      return (
        <View style={styles.emptyTypeBox}>
          <Text style={styles.emptyTypeTitle}>Пока нет типов ремонта</Text>
          <Text style={styles.emptyTypeText}>
            Сначала создай хотя бы один тип ниже. Например: Масло, Тормоза,
            Подвеска
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.typeList}>
        {repairTypes.map((type) => {
          const selected = type.id === repairTypeId;

          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeChip, selected && styles.typeChipSelected]}
              onPress={() => setRepairTypeId(type.id)}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selected && styles.typeChipTextSelected,
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerBlock}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {isEditing ? "Edit repair" : "Add repair"}
        </Text>
        <Text style={styles.sectionSubtitle}>Машина: {name}</Text>

        <Text style={styles.label}>Тип ремонта</Text>
        <Text style={styles.selectedTypeText}>
          Выбрано: {selectedRepairTypeName}
        </Text>
        {renderRepairTypeSelector()}

        <Text style={styles.label}>Дата ремонта</Text>
        <TextInput
          style={styles.input}
          value={repairDate}
          onChangeText={setRepairDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholder}
          editable={!submitting}
        />

        <Text style={styles.label}>Цена</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder="2500.00"
          placeholderTextColor={colors.placeholder}
          editable={!submitting}
        />

        <Text style={styles.label}>Пробег (optional)</Text>
        <TextInput
          style={styles.input}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="number-pad"
          placeholder="154000"
          placeholderTextColor={colors.placeholder}
          editable={!submitting}
        />

        <Text style={styles.label}>Заметка (optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Что делали, какие запчасти ставили..."
          placeholderTextColor={colors.placeholder}
          editable={!submitting}
          multiline
        />

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || repairTypes.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isEditing ? "Save changes" : "Add repair"}
            </Text>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCancelEdit}
            disabled={submitting}
          >
            <Text style={styles.secondaryButtonText}>Cancel edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>New repair type</Text>
        <Text style={styles.sectionSubtitle}>
          Добавь свои категории под себя
        </Text>

        <TextInput
          style={styles.input}
          value={newTypeName}
          onChangeText={setNewTypeName}
          placeholder="Например: Масло"
          placeholderTextColor={colors.placeholder}
          editable={!creatingType}
        />

        <TouchableOpacity
          style={[styles.primaryButton, creatingType && styles.buttonDisabled]}
          onPress={handleCreateType}
          disabled={creatingType}
        >
          {creatingType ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Add repair type</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Repair history</Text>
        <Text style={styles.sectionSubtitle}>Всего записей: {repairs.length}</Text>
      </View>

      {repairs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Пока нет ремонтов</Text>
          <Text style={styles.emptyText}>
            Добавь первую запись, чтобы начать историю обслуживания машины
          </Text>
        </View>
      ) : (
        repairs.map((item) => (
          <View key={item.id} style={styles.repairCard}>
            <View style={styles.repairCardTop}>
              <View style={styles.repairCardMain}>
                <Text style={styles.repairTitle}>
                  {item.repairTypeName ?? "Без названия"}
                </Text>
                <Text style={styles.repairDate}>
                  Дата ремонта: {formatRepairDate(item.repairDate)}
                </Text>
                <Text style={styles.repairCreatedAt}>
                  Создано: {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>

              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{item.price}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Пробег:</Text>
              <Text style={styles.metaValue}>
                {item.odometer !== null ? `${item.odometer} км` : "—"}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Заметка:</Text>
              <Text style={styles.metaValue}>{item.note || "—"}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleStartEdit(item)}
              >
                <Text style={styles.actionButtonText}>Редактировать</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.actionButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
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
    paddingBottom: 32,
  },

  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
    color: colors.textPrimary,
  },

  selectedTypeText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  typeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  typeChipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },

  typeChipTextSelected: {
    color: colors.onPrimary,
  },

  emptyTypeBox: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },

  emptyTypeTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptyTypeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
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

  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  primaryButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  secondaryButton: {
    marginTop: 10,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  listHeader: {
    marginTop: 4,
    marginBottom: 8,
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

  repairCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  repairCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },

  repairCardMain: {
    flex: 1,
  },

  repairTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  repairDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  repairCreatedAt: {
    fontSize: 12,
    color: colors.textMuted,
  },

  priceBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  priceBadgeText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },

  metaRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },

  metaLabel: {
    width: 80,
    color: colors.textSecondary,
    fontSize: 13,
  },

  metaValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  editButton: {
    backgroundColor: colors.primary,
  },

  deleteButton: {
    backgroundColor: colors.danger,
  },

  actionButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
});