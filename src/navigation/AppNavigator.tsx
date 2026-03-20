import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../features/auth/context/AuthContext";

import LoginScreen from "../features/auth/screens/LoginScreen";
import MainTabs from "./MainTabs";

/**
 * тип всех экранов root stack
 */
export type RootStackParamList = {
  Login: undefined;
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

    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >

      {accessToken ? (

        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
        />

      ) : (

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

      )}

    </Stack.Navigator>

  );

}