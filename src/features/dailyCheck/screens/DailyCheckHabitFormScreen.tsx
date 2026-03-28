import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  createDailyCheckItem,
  getDailyCheckItems,
  updateDailyCheckItem,
} from "../api/dailyCheck.api";
import { DailyCheckAppliesMode } from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";

type Props = NativeStackScreenProps<
  DailyCheckStackParamList,
  "DailyHabitForm"
>;

/**
 * =========================================================
 * WEEKDAY OPTIONS
 * =========================================================
 */
const WEEK_DAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
];

/**
 * =========================================================
 * SCREEN
 * =========================================================
 */
export default function DailyCheckHabitFormScreen({
  navigation,
  route,
}: Props) {
  const isEditMode = route.params.mode === "edit";
  const editingItemId = route.params.mode === "edit" ? route.params.itemId : null;

  /**
   * =========================================================
   * FORM STATE
   * =========================================================
   */
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);

  const [title, setTitle] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("");
  const [appliesMode, setAppliesMode] =
    useState<DailyCheckAppliesMode>("every_day");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<string>("0");

  /**
   * =========================================================
   * LOAD ITEM FOR EDIT
   * =========================================================
   *
   * Пока отдельного GET /items/:id нет,
   * поэтому просто получаем список и ищем item по id.
   */
  const loadEditingItem = useCallback(async () => {
    if (!isEditMode || !editingItemId) {
      return;
    }

    try {
      const items = await getDailyCheckItems();
      const item = items.find((current) => current.id === editingItemId);

      if (!item) {
        Alert.alert("Ошибка", "Привычка не найдена");
        navigation.goBack();
        return;
      }

      setTitle(item.title);
      setEmoji(item.emoji ?? "");
      setAppliesMode(item.appliesMode);
      setWeekDays(item.weekDays);
      setIsActive(item.isActive);
      setSortOrder(String(item.sortOrder));
    } catch (error) {
      console.error("Failed to load habit for edit:", error);
      Alert.alert("Ошибка", "Не удалось загрузить привычку");
      navigation.goBack();
    }
  }, [editingItemId, isEditMode, navigation]);

  useEffect(() => {
    const run = async () => {
      if (!isEditMode) {
        return;
      }

      setLoading(true);
      await loadEditingItem();
      setLoading(false);
    };

    run();
  }, [isEditMode, loadEditingItem]);

  /**
   * =========================================================
   * HELPERS
   * =========================================================
   */

  /**
   * Для every_day автоматически используем все дни недели.
   */
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

  /**
   * =========================================================
   * SAVE
   * =========================================================
   */
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
        isActive,
        sortOrder: Number(sortOrder.trim()),
      };

      if (isEditMode && editingItemId) {
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
    effectiveWeekDays,
    emoji,
    isActive,
    isEditMode,
    navigation,
    sortOrder,
    title,
    validateForm,
  ]);

  /**
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка привычки...</Text>
      </View>
    );
  }

  /**
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isEditMode ? "Редактирование привычки" : "Новая привычка"}
      </Text>

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
          onChangeText={setSortOrder}
          placeholder="0"
          placeholderTextColor="#777"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextBlock}>
            <Text style={styles.label}>Активная привычка</Text>
            <Text style={styles.helperText}>
              Неактивная привычка не участвует в новых отчётах, но история по ней
              сохраняется.
            </Text>
          </View>

          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving
            ? "Сохранение..."
            : isEditMode
            ? "Сохранить изменения"
            : "Создать привычку"}
        </Text>
      </TouchableOpacity>
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  switchTextBlock: {
    flex: 1,
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
  disabledButton: {
    opacity: 0.6,
  },
});