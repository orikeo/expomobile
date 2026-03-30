import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DailyCheckStatus } from "../dailyCheck.types";

interface HabitStatusRowProps {
  title: string;
  emoji: string | null;
  status: DailyCheckStatus | null;
  skipReason: string | null;
  onChangeStatus: (status: DailyCheckStatus) => void;
  onChangeSkipReason: (value: string) => void;
  disabled?: boolean;
}

export function HabitStatusRow({
  title,
  emoji,
  status,
  skipReason,
  onChangeStatus,
  onChangeSkipReason,
  disabled = false,
}: HabitStatusRowProps) {
  const renderStatusButton = (
    value: DailyCheckStatus,
    label: string,
    isSelected: boolean
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.statusButton,
          isSelected && styles.statusButtonSelected,
          disabled && styles.statusButtonDisabled,
        ]}
        onPress={() => {
          if (disabled) {
            return;
          }

          onChangeStatus(value);
        }}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text
          style={[
            styles.statusButtonText,
            isSelected && styles.statusButtonTextSelected,
            disabled && styles.statusButtonTextDisabled,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {emoji ? `${emoji} ` : ""}
          {title}
        </Text>
      </View>

      <View style={styles.statusRow}>
        {renderStatusButton("yes", "YES", status === "yes")}
        {renderStatusButton("no", "NO", status === "no")}
        {renderStatusButton("skipped", "SKIP", status === "skipped")}
      </View>

      {status === "skipped" && (
        <View style={styles.skipReasonWrapper}>
          <Text style={styles.skipReasonLabel}>Причина пропуска</Text>
          <TextInput
            value={skipReason ?? ""}
            onChangeText={(value) => {
              if (disabled) {
                return;
              }

              onChangeSkipReason(value);
            }}
            placeholder="Например: был на работе весь день"
            placeholderTextColor="#777777"
            style={[
              styles.skipReasonInput,
              disabled && styles.skipReasonInputDisabled,
            ]}
            editable={!disabled}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#1b1b1b",
  },
  containerDisabled: {
    opacity: 0.78,
  },
  headerRow: {
    marginBottom: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  statusButtonSelected: {
    borderColor: "#888",
    backgroundColor: "#2a2a2a",
  },
  statusButtonDisabled: {
    backgroundColor: "#151515",
  },
  statusButtonText: {
    color: "#cccccc",
    fontSize: 14,
    fontWeight: "600",
  },
  statusButtonTextSelected: {
    color: "#ffffff",
  },
  statusButtonTextDisabled: {
    color: "#9a9a9a",
  },
  skipReasonWrapper: {
    marginTop: 12,
  },
  skipReasonLabel: {
    color: "#bbbbbb",
    marginBottom: 6,
    fontSize: 13,
  },
  skipReasonInput: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    backgroundColor: "#111",
  },
  skipReasonInputDisabled: {
    backgroundColor: "#161616",
    color: "#b8b8b8",
  },
});