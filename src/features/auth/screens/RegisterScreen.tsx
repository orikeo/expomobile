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
import { register } from "../api/auth.api";

/**
 * =========================================================
 * AUTH STACK TYPES
 * =========================================================
 */
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

/**
 * =========================================================
 * REGISTER SCREEN
 * =========================================================
 *
 * Логика:
 * 1. пользователь вводит email + password + confirmPassword
 * 2. делаем базовую фронтовую валидацию
 * 3. вызываем backend /auth/register
 * 4. если успех -> показываем сообщение и переводим на Login
 *
 * Важно:
 * Сейчас backend на register НЕ возвращает токены.
 * Поэтому здесь мы НЕ вызываем login/saveTokens.
 */
export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

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

    if (trimmedPassword.length < 6) {
      Alert.alert("Ошибка", "Пароль должен быть не короче 6 символов");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert("Ошибка", "Пароли не совпадают");
      return;
    }

    try {
      setLoading(true);

      await register({
        email: normalizedEmail,
        password: trimmedPassword,
      });

      /**
       * Сейчас после регистрации токены не выдаются.
       * Поэтому просто отправляем пользователя на логин.
       */
      Alert.alert(
        "Успешно",
        "Аккаунт создан. Теперь войдите в систему.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось зарегистрироваться";

      Alert.alert("Ошибка", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Повторите пароль"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Зарегистрироваться</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        disabled={loading}
      >
        <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
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