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
  deleteDailyCheckItem,
  getDailyCheckItems,
  updateDailyCheckItem,
} from "../api/dailyCheck.api";
import {
  DailyCheckAppliesMode,
  DailyCheckItem,
} from "../dailyCheck.types";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";

type Props = NativeStackScreenProps<
  DailyCheckStackParamList,
  "DailyHabitForm"
>;

type WeekDayOption = {
  value: number;
  label: string;
};

const WEEK_DAYS: WeekDayOption[] = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
];

export default function DailyCheckHabitFormScreen({
  navigation,
  route,
}: Props) {
  const isEditMode = route.params.mode === "edit";
  const editingItemId = route.params.mode === "edit" ? route.params.itemId : null;

  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [title, setTitle] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("");
  const [appliesMode, setAppliesMode] =
    useState<DailyCheckAppliesMode>("every_day");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [isActive, setIsActive] = useState<boolean>(true);

  /**
   * =========================================================
   * LOAD EDIT ITEM
   * =========================================================
   *
   * У тебя пока нет отдельного GET /daily-check/items/:id,
   * поэтому для режима редактирования просто грузим список
   * и находим нужную привычку по id.
   */
  const loadEditItem = useCallback(async () => {
    if (!isEditMode || !editingItemId) {
      return;
    }

    try {
      const items = await getDailyCheckItems();
      const foundItem = items.find((item) => item.id === editingItemId);

      if (!foundItem) {
        Alert.alert("Ошибка", "Привычка не найдена");
        navigation.goBack();
        return;
      }

      fillFormFromItem(foundItem);
    } catch (error) {
      console.error("Failed to load habit for edit:", error);
      Alert.alert("Ошибка", "Не удалось загрузить привычку");
      navigation.goBack();
    }
  }, [editingItemId, isEditMode, navigation]);

  /**
   * Заполняем форму данными привычки.
   */
  const fillFormFromItem = (item: DailyCheckItem) => {
    setTitle(item.title);
    setEmoji(item.emoji ?? "");
    setAppliesMode(item.appliesMode);
    setWeekDays(item.weekDays);
    setSortOrder(String(item.sortOrder));
    setIsActive(item.isActive);
  };

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Редактировать привычку" : "Новая привычка",
    });

    const run = async () => {
      if (!isEditMode) {
        return;
      }

      setLoading(true);
      await loadEditItem();
      setLoading(false);
    };

    run();
  }, [isEditMode, loadEditItem, navigation]);

  /**
   * =========================================================
   * HELPERS
   * =========================================================
   */

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((item) => item !== day).sort((a, b) => a - b);
      }

      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const normalizedSortOrder = useMemo(() => {
    const parsed = Number(sortOrder);

    if (!Number.isInteger(parsed)) {
      return 0;
    }

    return parsed;
  }, [sortOrder]);

  /**
   * =========================================================
   * VALIDATION
   * =========================================================
   */

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Название привычки обязательно");
      return false;
    }

    if (appliesMode === "selected_days" && weekDays.length === 0) {
      Alert.alert("Ошибка", "Выбери хотя бы один день недели");
      return false;
    }

    return true;
  };

  /**
   * =========================================================
   * SAVE
   * =========================================================
   */

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      title: title.trim(),
      emoji: emoji.trim() || null,
      appliesMode,
      weekDays:
        appliesMode === "every_day"
          ? [1, 2, 3, 4, 5, 6, 7]
          : [...weekDays].sort((a, b) => a - b),
      sortOrder: normalizedSortOrder,
      isActive,
    };

    try {
      setSaving(true);

      if (isEditMode && editingItemId) {
        await updateDailyCheckItem(editingItemId, payload);
      } else {
        await createDailyCheckItem(payload);
      }

      Alert.alert(
        "Успешно",
        isEditMode ? "Привычка обновлена" : "Привычка создана"
      );

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save habit:", error);
      Alert.alert("Ошибка", "Не удалось сохранить привычку");
    } finally {
      setSaving(false);
    }
  };

  /**
   * =========================================================
   * DELETE
   * =========================================================
   */

  const confirmDelete = () => {
    if (!isEditMode || !editingItemId) {
      return;
    }

    Alert.alert(
      "Удалить привычку?",
      "Это действие нельзя отменить.",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!editingItemId) {
      return;
    }

    try {
      setDeleting(true);

      await deleteDailyCheckItem(editingItemId);

      Alert.alert("Успешно", "Привычка удалена");
      navigation.goBack();
    } catch (error) {
      console.error("Failed to delete habit:", error);
      Alert.alert("Ошибка", "Не удалось удалить привычку");
    } finally {
      setDeleting(false);
    }
  };

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Название</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Например: Велосипед"
          placeholderTextColor="#777"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emoji</Text>
        <TextInput
          style={styles.input}
          value={emoji}
          onChangeText={setEmoji}
          placeholder="Например: 🚴"
          placeholderTextColor="#777"
          maxLength={8}
        />
        <Text style={styles.helperText}>
          Поле не обязательное, но помогает визуально.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Когда показывать</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              appliesMode === "every_day" && styles.modeButtonSelected,
            ]}
            onPress={() => {
              setAppliesMode("every_day");
              setWeekDays([1, 2, 3, 4, 5, 6, 7]);
            }}
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
            onPress={() => {
              setAppliesMode("selected_days");

              /**
               * Если до этого было every_day,
               * можно оставить все дни выбранными.
               */
              if (weekDays.length === 0) {
                setWeekDays([1, 2, 3, 4, 5, 6, 7]);
              }
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                appliesMode === "selected_days" &&
                  styles.modeButtonTextSelected,
              ]}
            >
              Выбранные дни
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {appliesMode === "selected_days" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Дни недели</Text>

          <View style={styles.weekDaysRow}>
            {WEEK_DAYS.map((day) => {
              const selected = weekDays.includes(day.value);

              return (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.weekDayButton,
                    selected && styles.weekDayButtonSelected,
                  ]}
                  onPress={() => toggleWeekDay(day.value)}
                >
                  <Text
                    style={[
                      styles.weekDayButtonText,
                      selected && styles.weekDayButtonTextSelected,
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
        <Text style={styles.sectionTitle}>Порядок</Text>
        <TextInput
          style={styles.input}
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#777"
        />
        <Text style={styles.helperText}>
          Чем меньше число, тем выше привычка в списке.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrapper}>
            <Text style={styles.sectionTitle}>Активна</Text>
            <Text style={styles.helperText}>
              Если выключить, привычка не будет показываться в дневном отчёте.
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

      {isEditMode && (
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.disabledButton]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? "Удаление..." : "Удалить привычку"}
          </Text>
        </TouchableOpacity>
      )}
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
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
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
  helperText: {
    color: "#9a9a9a",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#171717",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modeButtonSelected: {
    borderColor: "#999",
    backgroundColor: "#2b2b2b",
  },
  modeButtonText: {
    color: "#cccccc",
    fontSize: 14,
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
    minWidth: 52,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#171717",
  },
  weekDayButtonSelected: {
    borderColor: "#999",
    backgroundColor: "#2b2b2b",
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
    gap: 16,
  },
  switchTextWrapper: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#4a2020",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});