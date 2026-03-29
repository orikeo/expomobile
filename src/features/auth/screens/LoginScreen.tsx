import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { login as loginRequest } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { APP_UI_VERSION } from "../../../config/appVersion";
import { colors } from "../../../theme/color";

/**
 * =========================================================
 * AUTH STACK TYPES
 * =========================================================
 */
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

/**
 * =========================================================
 * LOGIN SCREEN
 * =========================================================
 *
 * Логика:
 * 1. пользователь вводит email и password
 * 2. фронт делает базовую валидацию
 * 3. вызываем backend /auth/login
 * 4. получаем accessToken + refreshToken
 * 5. передаём их в AuthContext.login()
 */
export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    /**
     * ---------------------------------------------------------
     * БАЗОВАЯ ВАЛИДАЦИЯ
     * ---------------------------------------------------------
     */
    if (!normalizedEmail) {
      Alert.alert("Ошибка", "Введите email");
      return;
    }

    if (!trimmedPassword) {
      Alert.alert("Ошибка", "Введите пароль");
      return;
    }

    try {
      setLoading(true);

      const data = await loginRequest({
        email: normalizedEmail,
        password: trimmedPassword,
      });

      await login(data.accessToken, data.refreshToken);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось войти";

      Alert.alert("Ошибка", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Вход</Text>
        <Text style={styles.subtitle}>PET tracker</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          disabled={loading}
        >
          <Text style={styles.link}>Нет аккаунта? Зарегистрироваться</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>v{APP_UI_VERSION}</Text>
      </View>
    </View>
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
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },

  link: {
    marginTop: 18,
    textAlign: "center",
    color: colors.primary,
    fontSize: 15,
    fontWeight: "500",
  },

  versionText: {
    marginTop: 18,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});