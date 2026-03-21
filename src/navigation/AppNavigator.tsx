import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../features/auth/context/AuthContext";

import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterScreen from "../features/auth/screens/RegisterScreen";
import MainTabs from "./MainTabs";

/**
 * тип всех экранов root stack
 */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

/**
 * создаём stack с типами
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { accessToken, isLoading } = useAuth();

  /**
   * пока проверяем авторизацию
   */
  if (isLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {accessToken ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}