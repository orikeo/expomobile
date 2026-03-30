import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DailyCheckOverviewScreen from "../features/dailyCheck/screens/DailyCheckOverviewScreen";
import DailyCheckScreen from "../features/dailyCheck/screens/DailyCheckScreen";
import DailyCheckHabitsScreen from "../features/dailyCheck/screens/DailyCheckHabitsScreen";
import DailyCheckHabitFormScreen from "../features/dailyCheck/screens/DailyCheckHabitFormScreen";

export type DailyCheckStackParamList = {
  DailyOverview: undefined;
  DailyDay: { date?: string } | undefined;
  DailyHabits: undefined;
  DailyHabitForm:
    | {
        mode?: "create" | "edit";
        itemId?: string;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<DailyCheckStackParamList>();

export default function DailyCheckNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DailyOverview"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0f0f0f",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: "#0f0f0f",
        },
      }}
    >
      <Stack.Screen
        name="DailyOverview"
        component={DailyCheckOverviewScreen}
        options={{
          title: "Daily Check",
        }}
      />

      <Stack.Screen
        name="DailyDay"
        component={DailyCheckScreen}
        options={{
          title: "Отчёт за день",
        }}
      />

      <Stack.Screen
        name="DailyHabits"
        component={DailyCheckHabitsScreen}
        options={{
          title: "Привычки",
        }}
      />

      <Stack.Screen
        name="DailyHabitForm"
        component={DailyCheckHabitFormScreen}
        options={({ route }) => ({
          title:
            route.params?.mode === "edit"
              ? "Редактировать привычку"
              : "Новая привычка",
        })}
      />
    </Stack.Navigator>
  );
}