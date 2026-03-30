import React, { useCallback, useMemo, useState } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import { getDailyCheckDay, saveDailyCheckDay } from "../api/dailyCheck.api";
import { HabitStatusRow } from "../components/HabitStatusRow";
import {
  DailyCheckDayItemState,
  DailyCheckStatus,
} from "../dailyCheck.types";
import {
  formatDisplayDate,
  getCurrentDailyCheckDateString,
  getDeviceTimeZone,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyDay">;

function normalizeMoodScoreInput(value: string): string {
  const digitsOnly = value.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return "";
  }

  const numeric = Number(digitsOnly);

  if (numeric <= 0) {
    return "";
  }

  if (numeric > 10) {
    return "10";
  }

  return String(numeric);
}

export default function DailyCheckScreen({ navigation, route }: Props) {
  const selectedDate = route.params?.date ?? getCurrentDailyCheckDateString();
  const timeZone = useMemo(() => getDeviceTimeZone(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [canEdit, setCanEdit] = useState(true);
  const [statusLabel, setStatusLabel] = useState("open");

  const [moodScoreInput, setMoodScoreInput] = useState("");
  const [moodComment, setMoodComment] = useState("");
  const [summary, setSummary] = useState("");
  const [note, setNote] = useState("");
  const [musicOfDay, setMusicOfDay] = useState("");

  const [items, setItems] = useState<DailyCheckDayItemState[]>([]);

  const loadDay = useCallback(async () => {
    const response = await getDailyCheckDay(selectedDate, timeZone);

    setCanEdit(response.lifecycle.canEdit);
    setStatusLabel(response.lifecycle.status);

    setMoodScoreInput(
      response.report?.moodScore !== null && response.report?.moodScore !== undefined
        ? String(response.report.moodScore)
        : ""
    );
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
  }, [selectedDate, timeZone]);

  const loadDayWithState = useCallback(
    async (showLoader: boolean) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        await loadDay();
      } catch (error) {
        console.error("Failed to load daily day screen:", error);
        Alert.alert("Ошибка", "Не удалось загрузить отчёт за день");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [loadDay]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        try {
          if (isActive) {
            setLoading(true);
          }

          const response = await getDailyCheckDay(selectedDate, timeZone);

          if (!isActive) {
            return;
          }

          setCanEdit(response.lifecycle.canEdit);
          setStatusLabel(response.lifecycle.status);

          setMoodScoreInput(
            response.report?.moodScore !== null &&
              response.report?.moodScore !== undefined
              ? String(response.report.moodScore)
              : ""
          );
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
          console.error("Failed to load daily day screen:", error);

          if (isActive) {
            Alert.alert("Ошибка", "Не удалось загрузить отчёт за день");
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
    }, [selectedDate, timeZone])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDayWithState(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadDayWithState]);


  const filledCount = useMemo(() => {
    return items.filter((item) => item.status !== null).length;
  }, [items]);

  const handleStatusChange = useCallback(
    (itemId: string, status: DailyCheckStatus) => {
      if (!canEdit) {
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          return {
            ...item,
            status,
            skipReason: status === "skipped" ? item.skipReason : null,
          };
        })
      );
    },
    [canEdit]
  );

  const handleSkipReasonChange = useCallback(
    (itemId: string, value: string) => {
      if (!canEdit) {
        return;
      }

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
    [canEdit]
  );

  const validateBeforeSave = useCallback(() => {
    for (const item of items) {
      if (item.status === "skipped" && !item.skipReason?.trim()) {
        return `Укажи причину пропуска для привычки "${item.title}"`;
      }
    }

    if (moodScoreInput) {
      const mood = Number(moodScoreInput);

      if (Number.isNaN(mood) || mood < 1 || mood > 10) {
        return "Оценка настроения должна быть числом от 1 до 10";
      }
    }

    return null;
  }, [items, moodScoreInput]);

  const handleSave = useCallback(async () => {
    if (!canEdit) {
      Alert.alert("Отчёт закрыт", "Этот отчёт уже нельзя редактировать");
      return;
    }

    const validationError = validateBeforeSave();

    if (validationError) {
      Alert.alert("Ошибка", validationError);
      return;
    }

    try {
      setSaving(true);

      await saveDailyCheckDay({
        date: selectedDate,
        timeZone,
        report: {
          moodScore: moodScoreInput ? Number(moodScoreInput) : null,
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
      });

      Alert.alert("Успешно", "Отчёт сохранён");
      await loadDay();
    } catch (error) {
      console.error("Failed to save daily day screen:", error);
      Alert.alert("Ошибка", "Не удалось сохранить отчёт");
    } finally {
      setSaving(false);
    }
  }, [
    canEdit,
    items,
    loadDay,
    moodComment,
    moodScoreInput,
    musicOfDay,
    note,
    selectedDate,
    summary,
    timeZone,
    validateBeforeSave,
  ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка отчёта...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>Отчёт за день</Text>
        <Text style={styles.subtitle}>{formatDisplayDate(selectedDate)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Статус:</Text>
          <Text style={styles.metaValue}>{statusLabel}</Text>
        </View>


        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Заполнено:</Text>
          <Text style={styles.metaValue}>
            {filledCount}/{items.length}
          </Text>
        </View>


        {!canEdit ? (
          <Text style={styles.closedWarning}>
            Отчёт закрыт — данные можно посмотреть, но редактирование недоступно.
          </Text>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Самочувствие и заметки</Text>

        <Text style={styles.fieldLabel}>Настроение (1–10)</Text>
        <TextInput
          value={moodScoreInput}
          onChangeText={(value) => {
            if (!canEdit) {
              return;
            }

            setMoodScoreInput(normalizeMoodScoreInput(value));
          }}
          placeholder="Например: 7"
          keyboardType="number-pad"
          editable={canEdit}
          style={[styles.input, !canEdit && styles.inputDisabled]}
          placeholderTextColor="#777777"
        />

        <Text style={styles.fieldLabel}>Комментарий к настроению</Text>
        <TextInput
          value={moodComment}
          onChangeText={setMoodComment}
          placeholder="Как ты себя чувствовал сегодня?"
          editable={canEdit}
          style={[styles.input, styles.multilineInput, !canEdit && styles.inputDisabled]}
          placeholderTextColor="#777777"
          multiline
        />

        <Text style={styles.fieldLabel}>Краткий итог дня</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Что главное было сегодня?"
          editable={canEdit}
          style={[styles.input, styles.multilineInput, !canEdit && styles.inputDisabled]}
          placeholderTextColor="#777777"
          multiline
        />

        <Text style={styles.fieldLabel}>Заметка</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Любые дополнительные мысли"
          editable={canEdit}
          style={[styles.input, styles.multilineInput, !canEdit && styles.inputDisabled]}
          placeholderTextColor="#777777"
          multiline
        />

        <Text style={styles.fieldLabel}>Музыка дня</Text>
        <TextInput
          value={musicOfDay}
          onChangeText={setMusicOfDay}
          placeholder="Трек / артист / альбом"
          editable={canEdit}
          style={[styles.input, !canEdit && styles.inputDisabled]}
          placeholderTextColor="#777777"
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Привычки</Text>

        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              На эту дату нет активных привычек.
            </Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("DailyHabits")}
            >
              <Text style={styles.secondaryButtonText}>Открыть привычки</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <HabitStatusRow
              key={item.id}
              title={item.title}
              emoji={item.emoji}
              status={item.status}
              skipReason={item.skipReason}
              onChangeStatus={(status) => handleStatusChange(item.id, status)}
              onChangeSkipReason={(value) => handleSkipReasonChange(item.id, value)}
              disabled={!canEdit}
            />
          ))
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!canEdit || saving) && styles.primaryButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!canEdit || saving}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? "Сохранение..." : "Сохранить отчёт"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButtonBottom}
        onPress={() => navigation.navigate("DailyHabits")}
      >
        <Text style={styles.secondaryButtonText}>Перейти к привычкам</Text>
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
    paddingBottom: 28,
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
  headerCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  metaLabel: {
    color: "#aaaaaa",
    fontSize: 14,
  },
  metaValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  closedWarning: {
    marginTop: 12,
    color: "#ffb3b3",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  fieldLabel: {
    color: "#cfcfcf",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#ffffff",
    backgroundColor: "#111111",
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  inputDisabled: {
    opacity: 0.7,
  },
  emptyBox: {
    paddingVertical: 6,
  },
  emptyText: {
    color: "#bbbbbb",
    fontSize: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#2d5bff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#242424",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  secondaryButtonBottom: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});