import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getDailyCheckDay,
  saveDailyCheckDay,
} from "../api/dailyCheck.api";
import {
  DailyCheckDayItemState,
  DailyCheckStatus,
} from "../dailyCheck.types";
import { HabitStatusRow } from "../components/HabitStatusRow";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Форматируем текущую дату в YYYY-MM-DD.
 *
 * Backend сейчас ждёт именно такую строку.
 */
function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * =========================================================
 * SCREEN
 * =========================================================
 */
export default function DailyCheckScreen() {
  /**
   * Пока экран работает только с сегодняшним днём.
   *
   * Позже, когда добавим overview / heatmap,
   * сюда можно будет передавать дату через route params.
   */
  const [date] = useState<string>(getTodayDateString());

  /**
   * Служебные состояния UI
   */
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  /**
   * Поля дневного отчёта
   */
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [moodComment, setMoodComment] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [musicOfDay, setMusicOfDay] = useState<string>("");

  /**
   * Локальные привычки дня
   */
  const [items, setItems] = useState<DailyCheckDayItemState[]>([]);

  /**
   * =========================================================
   * LOAD DAY
   * =========================================================
   *
   * Загружаем данные дня:
   * - report
   * - привычки
   */
  const loadDay = useCallback(async () => {
    try {
      const response = await getDailyCheckDay(date);

      setMoodScore(response.report?.moodScore ?? null);
      setMoodComment(response.report?.moodComment ?? "");
      setSummary(response.report?.summary ?? "");
      setNote(response.report?.note ?? "");
      setMusicOfDay(response.report?.musicOfDay ?? "");

      setItems(
        response.items.map((item) => ({
          id: item.id,
          title: item.title,
          emoji: item.emoji,
          status: item.status,
          skipReason: item.skipReason,
        }))
      );
    } catch (error) {
      console.error("Failed to load daily check day:", error);
      Alert.alert("Ошибка", "Не удалось загрузить отчёт за день");
    }
  }, [date]);

  /**
   * Первый запуск экрана
   */
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadDay();
      setLoading(false);
    };

    run();
  }, [loadDay]);

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDay();
    setRefreshing(false);
  }, [loadDay]);

  /**
   * =========================================================
   * HABITS STATE UPDATES
   * =========================================================
   */

  /**
   * Меняем статус одной привычки.
   *
   * Если новый статус не skipped,
   * то причину skipped очищаем.
   */
  const handleChangeStatus = useCallback(
    (itemId: string, status: DailyCheckStatus) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status,
                skipReason: status === "skipped" ? item.skipReason : null,
              }
            : item
        )
      );
    },
    []
  );

  /**
   * Меняем текст причины skipped.
   */
  const handleChangeSkipReason = useCallback(
    (itemId: string, value: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                skipReason: value,
              }
            : item
        )
      );
    },
    []
  );

  /**
   * =========================================================
   * SAVE PAYLOAD
   * =========================================================
   *
   * Подготавливаем payload для backend.
   *
   * Неотмеченные привычки (status === null)
   * пока не отправляем.
   */
  const payload = useMemo(() => {
    return {
      date,
      report: {
        moodScore,
        moodComment: moodComment.trim() || null,
        summary: summary.trim() || null,
        note: note.trim() || null,
        musicOfDay: musicOfDay.trim() || null,
      },
      entries: items
        .filter((item) => item.status !== null)
        .map((item) => ({
          itemId: item.id,
          status: item.status as DailyCheckStatus,
          skipReason:
            item.status === "skipped" ? item.skipReason?.trim() || null : null,
        })),
    };
  }, [date, moodComment, moodScore, musicOfDay, note, summary, items]);

  /**
   * =========================================================
   * SAVE
   * =========================================================
   *
   * Сохраняем дневной отчёт.
   */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      await saveDailyCheckDay(payload);

      Alert.alert("Успешно", "Отчёт за день сохранён");
    } catch (error) {
      console.error("Failed to save daily check day:", error);
      Alert.alert("Ошибка", "Не удалось сохранить отчёт за день");
    } finally {
      setSaving(false);
    }
  }, [payload]);

  /**
   * =========================================================
   * RENDER MOOD BUTTONS
   * =========================================================
   *
   * Пока делаем простую и понятную схему:
   * 10 кнопок от 1 до 10.
   */
  const renderMoodButtons = () => {
    const buttons = [];

    for (let i = 1; i <= 10; i += 1) {
      const isSelected = moodScore === i;

      buttons.push(
        <TouchableOpacity
          key={i}
          style={[styles.moodButton, isSelected && styles.moodButtonSelected]}
          onPress={() => setMoodScore(i)}
        >
          <Text
            style={[
              styles.moodButtonText,
              isSelected && styles.moodButtonTextSelected,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.moodButtonsContainer}>{buttons}</View>;
  };

  /**
   * =========================================================
   * LOADING STATE
   * =========================================================
   */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка отчёта...</Text>
      </View>
    );
  }

  /**
   * =========================================================
   * MAIN RENDER
   * =========================================================
   */
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Отчёт за день</Text>
      <Text style={styles.subtitle}>Дата: {date}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настроение</Text>

        {renderMoodButtons()}

        <TextInput
          style={styles.input}
          value={moodComment}
          onChangeText={setMoodComment}
          placeholder="Комментарий к настроению"
          placeholderTextColor="#777"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Итог дня</Text>

        <TextInput
          style={styles.input}
          value={summary}
          onChangeText={setSummary}
          placeholder="Короткий смысл / итог дня"
          placeholderTextColor="#777"
          maxLength={160}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Музыка дня</Text>

        <TextInput
          style={styles.input}
          value={musicOfDay}
          onChangeText={setMusicOfDay}
          placeholder="Что сегодня звучало?"
          placeholderTextColor="#777"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Заметка</Text>

        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Свободная заметка о дне"
          placeholderTextColor="#777"
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Привычки</Text>

        {items.length === 0 ? (
          <Text style={styles.emptyText}>На этот день нет активных привычек</Text>
        ) : (
          items.map((item) => (
            <HabitStatusRow
              key={item.id}
              title={item.title}
              emoji={item.emoji}
              status={item.status}
              skipReason={item.skipReason}
              onChangeStatus={(status) => handleChangeStatus(item.id, status)}
              onChangeSkipReason={(value) =>
                handleChangeSkipReason(item.id, value)
              }
            />
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Сохранение..." : "Сохранить"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * =========================================================
 * STYLES
 * =========================================================
 */
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
    marginBottom: 6,
  },
  subtitle: {
    color: "#aaaaaa",
    fontSize: 14,
    marginBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  moodButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  moodButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717",
  },
  moodButtonSelected: {
    backgroundColor: "#2c2c2c",
    borderColor: "#999",
  },
  moodButtonText: {
    color: "#cccccc",
    fontWeight: "600",
  },
  moodButtonTextSelected: {
    color: "#ffffff",
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
  multilineInput: {
    minHeight: 110,
  },
  emptyText: {
    color: "#aaaaaa",
    fontSize: 14,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});