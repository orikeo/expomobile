import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DailyCheckStackParamList } from "../../../navigation/DailyCheckNavigator";

type Props = NativeStackScreenProps<
  DailyCheckStackParamList,
  "DailyOverview"
>;

export default function DailyCheckOverviewScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Check</Text>
      <Text style={styles.subtitle}>
        Здесь будет твой обзор за 2 недели, а пока сделаем удобную точку входа в
        модуль.
      </Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("DailyDay")}
      >
        <Text style={styles.actionButtonText}>Открыть отчёт за сегодня</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("DailyHabits")}
      >
        <Text style={styles.actionButtonText}>Мои привычки</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 16,
    justifyContent: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#aaaaaa",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  actionButton: {
    backgroundColor: "#222222",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});