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
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getDailyCheckDay, saveDailyCheckDay } from "../api/dailyCheck.api";
import {
  DailyCheckDayItemState,
  DailyCheckDayLifecycle,
  DailyCheckStatus,
  DailyReportLifecycleStatus,
} from "../dailyCheck.types";
import { HabitStatusRow } from "../components/HabitStatusRow";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";
import {
  formatDeadlineLabel,
  formatDisplayDate,
  getDeviceTimeZone,
  getTodayDateString,
} from "../dailyCheck.time";

type Props = NativeStackScreenProps<DailyCheckStackParamList, "DailyDay">;

const EMPTY_LIFECYCLE: DailyCheckDayLifecycle = {
  status: "open",
  deadlineAt: new Date().toISOString(),
  closedAt: null,
  completedAt: null,
  wasEditedAfterDeadline: false,
  timeZone: "UTC",
  isOverdue: false,
  canEdit: true,
};

function getLifecycleLabel(status: DailyReportLifecycleStatus) {
  switch (status) {
    case "completed":
      return "Закрыт: заполнен";
    case "partial":
      return "Закрыт: частично";
    case "missed":
      return "Закрыт: пропущен";
    case "open":
    default:
      return "Отчёт ещё открыт";
  }
}

export default function DailyCheckScreen({ route, navigation }: Props) {
  const date = route.params?.date ?? getTodayDateString();
  const timeZone = useMemo(() => getDeviceTimeZone(), []);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [moodComment, setMoodComment] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [musicOfDay, setMusicOfDay] = useState<string>("");
  const [lifecycle, setLifecycle] = useState<DailyCheckDayLifecycle>(EMPTY_LIFECYCLE);
  const [items, setItems] = useState<DailyCheckDayItemState[]>([]);

  useEffect(() => {
    navigation.setOptions({
      title: `Отчёт: ${formatDisplayDate(date)}`,
    });
  }, [date, navigation]);

  const loadDay = useCallback(async () => {
    try {
      const response = await getDailyCheckDay(date, timeZone);

      setMoodScore(response.report?.moodScore ?? null);
      setMoodComment(response.report?.moodComment ?? "");
      setSummary(response.report?.summary ?? "");
      setNote(response.report?.note ?? "");
      setMusicOfDay(response.report?.musicOfDay ?? "");
      setLifecycle(response.lifecycle);

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
  }, [date, timeZone]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadDay();
      setLoading(false);
    };

    run();
  }, [loadDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDay();
    setRefreshing(false);
  }, [loadDay]);

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

  const handleChangeSkipReason = useCallback((itemId: string, value: string) => {
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
  }, []);

  const payload = useMemo(() => {
    return {
      date,
      timeZone,
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
  }, [date, items, moodComment, moodScore, musicOfDay, note, summary, timeZone]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      const response = await saveDailyCheckDay(payload);
      setLifecycle(response.lifecycle);

      Alert.alert(
        "Сохранено",
        response.lifecycle.wasEditedAfterDeadline
          ? "Отчёт сохранён. День был изменён уже после дедлайна."
          : "Отчёт за день сохранён"
      );

      await loadDay();
    } catch (error) {
      console.error("Failed to save daily check day:", error);
      Alert.alert("Ошибка", "Не удалось сохранить отчёт за день");
    } finally {
      setSaving(false);
    }
  }, [loadDay, payload]);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Отчёт за день</Text>
      <Text style={styles.subtitle}>Дата: {formatDisplayDate(date)}</Text>

      <View style={styles.metaCard}>
        <Text style={styles.metaTitle}>{getLifecycleLabel(lifecycle.status)}</Text>
        <Text style={styles.metaText}>
          Дедлайн: {formatDeadlineLabel(lifecycle.deadlineAt)}
        </Text>
        <Text style={styles.metaText}>Таймзона: {lifecycle.timeZone}</Text>

        {lifecycle.wasEditedAfterDeadline ? (
          <Text style={styles.metaWarning}>
            Этот день уже менялся после дедлайна
          </Text>
        ) : null}
      </View>

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
          placeholder="Короткий итог дня"
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
              onChangeSkipReason={(value) => handleChangeSkipReason(item.id, value)}
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
    marginBottom: 14,
  },
  metaCard: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  metaTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  metaText: {
    color: "#bdbdbd",
    fontSize: 13,
    marginBottom: 4,
  },
  metaWarning: {
    color: "#ffd166",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#181818",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    backgroundColor: "#111111",
  },
  multilineInput: {
    minHeight: 120,
  },
  moodButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  moodButtonSelected: {
    backgroundColor: "#2d5bff",
    borderColor: "#2d5bff",
  },
  moodButtonText: {
    color: "#cfcfcf",
    fontSize: 15,
    fontWeight: "700",
  },
  moodButtonTextSelected: {
    color: "#ffffff",
  },
  emptyText: {
    color: "#bdbdbd",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#2d5bff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});