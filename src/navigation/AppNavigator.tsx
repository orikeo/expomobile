import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../features/auth/context/AuthContext";

import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterScreen from "../features/auth/screens/RegisterScreen";
import MainTabs from "./MainTabs";

/**
 * =========================================================
 * ROOT STACK PARAM LIST
 * =========================================================
 *
 * Корневой stack приложения:
 * - экраны авторизации
 * - основная вкладочная навигация
 */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

/**
 * =========================================================
 * STACK
 * =========================================================
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { accessToken, isLoading } = useAuth();

  /**
   * Пока AuthContext проверяет токены и сессию,
   * лучше показать простой loader,
   * а не просто вернуть null.
   */
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {accessToken ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}