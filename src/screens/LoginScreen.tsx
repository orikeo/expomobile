import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

/**
 * Тип navigation для этого экрана.
 * Мы говорим TypeScript:
 * этот экран называется "Login"
 * и он принадлежит RootStackParamList
 */
type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  /**
   * Локальное состояние для формы
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Состояние загрузки (чтобы блокировать кнопку)
   */
  const [loading, setLoading] = useState(false);

  /**
   * Берём функцию login из AuthContext
   * Она сохраняет токен и переключает навигацию
   */
  const { login } = useAuth();

  /**
   * Обработчик нажатия кнопки
   */
  const handleLogin = async () => {
    try {
      setLoading(true);

      /**
       * Отправляем POST /auth/login
       * backend возвращает:
       * {
       *   accessToken: "...",
       *   refreshToken: "..."
       * }
       */
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email,
          password,
        },
      });

      /**
       * Передаём accessToken в AuthContext
       * Он сохранится в AsyncStorage
       */
      await login(data.accessToken);

      /**
       * Навигация переключится автоматически,
       * потому что изменится isAuthenticated
       */

    } catch (error: any) {
      Alert.alert("Login error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button
        title={loading ? "Loading..." : "Login"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}

/**
 * Стили — это не CSS, а JS-объект,
 * который React Native передаёт нативному движку
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  input: {
    width: 250,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
});