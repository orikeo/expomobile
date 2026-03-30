import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  createDailyCheckItem,
  deleteDailyCheckItem,
  getDailyCheckItems,
  updateDailyCheckItem,
} from "../api/dailyCheck.api";
import { DailyCheckAppliesMode, DailyCheckItem } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import {
  formatDisplayDate,
  getCurrentDailyCheckDateString,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<
  DailyCheckStackParamList,
  "DailyHabitForm"
>;

const WEEK_DAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
];

function normalizeSortOrderInput(value: string): string {
  return value.replace(/[^\d-]/g, "");
}

export default function DailyCheckHabitFormScreen({
  navigation,
  route,
}: Props) {
  const mode = route.params?.mode ?? "create";
  const isEditMode = mode === "edit";
  const editingItemId = route.params?.itemId ?? null;

  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [title, setTitle] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("");
  const [appliesMode, setAppliesMode] =
    useState<DailyCheckAppliesMode>("every_day");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [sortOrder, setSortOrder] = useState<string>("0");

  const [loadedItem, setLoadedItem] = useState<DailyCheckItem | null>(null);

  const effectiveFrom = useMemo(() => getCurrentDailyCheckDateString(), []);

  const loadEditingItem = useCallback(async () => {
    if (!isEditMode) {
      return;
    }

    if (!editingItemId) {
      Alert.alert("Ошибка", "Не передан itemId для редактирования");
      navigation.goBack();
      return;
    }

    const items = await getDailyCheckItems();
    const item = items.find((current) => current.id === editingItemId);

    if (!item) {
      Alert.alert("Ошибка", "Привычка не найдена");
      navigation.goBack();
      return;
    }

    setLoadedItem(item);
    setTitle(item.title);
    setEmoji(item.emoji ?? "");
    setAppliesMode(item.appliesMode);
    setWeekDays(
      item.weekDays.length ? [...item.weekDays].sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6, 7]
    );
    setSortOrder(String(item.sortOrder));
  }, [editingItemId, isEditMode, navigation]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        if (isActive) {
          setLoading(true);
        }

        await loadEditingItem();
      } catch (error) {
        console.error("Failed to load habit for edit:", error);

        if (isActive) {
          Alert.alert("Ошибка", "Не удалось загрузить привычку");
          navigation.goBack();
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [isEditMode, loadEditingItem, navigation]);

  const effectiveWeekDays = useMemo(() => {
    if (appliesMode === "every_day") {
      return [1, 2, 3, 4, 5, 6, 7];
    }

    return [...weekDays].sort((a, b) => a - b);
  }, [appliesMode, weekDays]);

  const toggleWeekDay = useCallback((day: number) => {
    setWeekDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((current) => current !== day).sort((a, b) => a - b);
      }

      return [...prev, day].sort((a, b) => a - b);
    });
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!title.trim()) {
      return "Название привычки обязательно";
    }

    if (appliesMode === "selected_days" && effectiveWeekDays.length === 0) {
      return "Выбери хотя бы один день недели";
    }

    if (!/^-?\d+$/.test(sortOrder.trim())) {
      return "sortOrder должен быть целым числом";
    }

    return null;
  }, [appliesMode, effectiveWeekDays.length, sortOrder, title]);

  const handleSave = useCallback(async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert("Ошибка", validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        emoji: emoji.trim() || null,
        appliesMode,
        weekDays: effectiveWeekDays,
        sortOrder: Number(sortOrder.trim()),
        effectiveFrom,
      };

      if (isEditMode) {
        if (!editingItemId) {
          Alert.alert("Ошибка", "Не удалось определить привычку для редактирования");
          return;
        }

        await updateDailyCheckItem(editingItemId, payload);
      } else {
        await createDailyCheckItem(payload);
      }

      Alert.alert(
        "Успешно",
        isEditMode ? "Привычка обновлена" : "Привычка создана",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save habit:", error);
      Alert.alert("Ошибка", "Не удалось сохранить привычку");
    } finally {
      setSaving(false);
    }
  }, [
    appliesMode,
    editingItemId,
    effectiveFrom,
    effectiveWeekDays,
    emoji,
    isEditMode,
    navigation,
    sortOrder,
    title,
    validateForm,
  ]);

  const handleDelete = useCallback(() => {
    if (!isEditMode || !editingItemId) {
      return;
    }

    Alert.alert(
      "Удалить привычку?",
      "Привычка будет удалена. Уже существующие прошлые отчёты это не перепишет, но сама привычка пропадёт из списка.",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteDailyCheckItem(editingItemId);

              Alert.alert("Успешно", "Привычка удалена", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error("Failed to delete habit:", error);
              Alert.alert("Ошибка", "Не удалось удалить привычку");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [editingItemId, isEditMode, navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка привычки...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isEditMode ? "Редактирование привычки" : "Новая привычка"}
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          {isEditMode ? "Изменения вступят в силу" : "Привычка начнёт действовать"}
        </Text>
        <Text style={styles.infoText}>{formatDisplayDate(effectiveFrom)}</Text>
        <Text style={styles.helperText}>
          Прошлые дни не изменяются. Новое расписание применяется только с этой даты.
        </Text>

        {isEditMode && loadedItem?.startDate ? (
          <Text style={styles.secondaryInfoText}>
            Текущая версия привычки действует с:{" "}
            {formatDisplayDate(loadedItem.startDate)}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Название</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Например: Велосипед"
          placeholderTextColor="#777"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Emoji</Text>
        <TextInput
          style={styles.input}
          value={emoji}
          onChangeText={setEmoji}
          placeholder="Например: 🚴"
          placeholderTextColor="#777"
          maxLength={8}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Режим применения</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              appliesMode === "every_day" && styles.modeButtonSelected,
            ]}
            onPress={() => setAppliesMode("every_day")}
            disabled={saving || deleting}
          >
            <Text
              style={[
                styles.modeButtonText,
                appliesMode === "every_day" && styles.modeButtonTextSelected,
              ]}
            >
              Каждый день
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              appliesMode === "selected_days" && styles.modeButtonSelected,
            ]}
            onPress={() => setAppliesMode("selected_days")}
            disabled={saving || deleting}
          >
            <Text
              style={[
                styles.modeButtonText,
                appliesMode === "selected_days" && styles.modeButtonTextSelected,
              ]}
            >
              Выбранные дни
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {appliesMode === "selected_days" && (
        <View style={styles.section}>
          <Text style={styles.label}>Дни недели</Text>

          <View style={styles.weekDaysRow}>
            {WEEK_DAYS.map((day) => {
              const isSelected = weekDays.includes(day.value);

              return (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.weekDayButton,
                    isSelected && styles.weekDayButtonSelected,
                  ]}
                  onPress={() => toggleWeekDay(day.value)}
                  disabled={saving || deleting}
                >
                  <Text
                    style={[
                      styles.weekDayButtonText,
                      isSelected && styles.weekDayButtonTextSelected,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Порядок сортировки</Text>
        <TextInput
          style={styles.input}
          value={sortOrder}
          onChangeText={(value) => setSortOrder(normalizeSortOrderInput(value))}
          placeholder="0"
          placeholderTextColor="#777"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          (saving || deleting) && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={saving || deleting}
      >
        <Text style={styles.saveButtonText}>
          {saving
            ? "Сохранение..."
            : isEditMode
            ? "Сохранить изменения"
            : "Создать привычку"}
        </Text>
      </TouchableOpacity>

      {isEditMode ? (
        <TouchableOpacity
          style={[
            styles.deleteButton,
            (saving || deleting) && styles.disabledButton,
          ]}
          onPress={handleDelete}
          disabled={saving || deleting}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? "Удаление..." : "Удалить привычку"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  secondaryInfoText: {
    color: "#bbbbbb",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  section: {
    marginBottom: 18,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  helperText: {
    color: "#aaaaaa",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#ffffff",
    backgroundColor: "#171717",
  },
  modeRow: {
    gap: 10,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#171717",
  },
  modeButtonSelected: {
    borderColor: "#999",
    backgroundColor: "#2a2a2a",
  },
  modeButtonText: {
    color: "#cccccc",
    fontSize: 15,
    fontWeight: "600",
  },
  modeButtonTextSelected: {
    color: "#ffffff",
  },
  weekDaysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weekDayButton: {
    minWidth: 44,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#171717",
    alignItems: "center",
  },
  weekDayButtonSelected: {
    borderColor: "#999",
    backgroundColor: "#2a2a2a",
  },
  weekDayButtonText: {
    color: "#cccccc",
    fontWeight: "600",
  },
  weekDayButtonTextSelected: {
    color: "#ffffff",
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: "#3a1d1d",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ffd1d1",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});