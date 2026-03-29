import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { useAuth } from "../features/auth/context/AuthContext";
import { MainTabParamList } from "../navigation/MainTabs";
import { colors } from "../theme/color";

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList, "Home">;
};

/**
 * =========================================================
 * HOME SCREEN
 * =========================================================
 *
 * Пока это не полноценный dashboard.
 * На текущем этапе Home нужен как простой и понятный хаб:
 *  - быстрый переход к основным модулям
 *  - единый стиль
 *  - без лишней перегрузки
 */
export default function HomeScreen({ navigation }: Props) {
  const { logout } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>PET Tracker</Text>
      <Text style={styles.subtitle}>
        Личный трекер: машины, вес, daily check
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Разделы</Text>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Cars")}
        >
          <Text style={styles.menuButtonTitle}>Cars</Text>
          <Text style={styles.menuButtonText}>
            Машины, заправки и ремонты
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Weights")}
        >
          <Text style={styles.menuButtonTitle}>Weights</Text>
          <Text style={styles.menuButtonText}>
            История веса и график изменений
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Daily")}
        >
          <Text style={styles.menuButtonTitle}>Daily check</Text>
          <Text style={styles.menuButtonText}>
            Привычки, отчёт за день и самочувствие
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 14,
  },

  menuButton: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  menuButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  menuButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  logoutButton: {
    marginTop: 20,
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  logoutButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});