import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/features/auth/context/AuthContext";
import { initializeDailyCheckReminder } from "./src/features/dailyCheck/notifications/dailyCheckNotifications";

export default function App() {
  useEffect(() => {
    /**
     * При старте приложения:
     * 1. настроим поведение уведомлений
     * 2. запросим разрешение
     * 3. поставим ежедневное напоминание на 23:00
     *
     * Пока это простая версия:
     * напоминание приходит каждый день.
     *
     * Позже можно сделать "умную" логику:
     * уведомлять только если отчёт за сегодня не заполнен.
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