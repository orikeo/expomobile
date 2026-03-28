import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/features/auth/context/AuthContext";
import { initializeDailyCheckReminder } from "./src/features/dailyCheck/notifications/dailyCheckNotifications";

export default function App() {
  useEffect(() => {
    /**
     * При старте приложения:
     * - читаем настройки напоминания из AsyncStorage
     * - если reminder включён, планируем его
     * - если выключен, ничего не ставим
     */
    initializeDailyCheckReminder().catch((error) => {
      console.error("Failed to initialize daily check reminder:", error);
    });
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}