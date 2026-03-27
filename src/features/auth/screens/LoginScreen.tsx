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
 *
 * Дальше уже AuthContext и tokenStorage сами всё синхронизируют.
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
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
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
          <ActivityIndicator />
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
    </View>
  );
}

/**
 * =========================================================
 * STYLES
 * =========================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#007AFF",
    fontSize: 15,
  },
});