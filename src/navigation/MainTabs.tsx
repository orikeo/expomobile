import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import CarsStack from "./CarsStack";
import HomeScreen from "../screens/HomeScreen";
import WeightScreen from "../features/weight/screens/WeightScreen";
import DailyCheckScreen from "../features/dailyCheck/screens/DailyCheckScreen";

/**
 * =========================================================
 * MAIN TAB PARAM LIST
 * =========================================================
 *
 * Список всех вкладок нижней навигации.
 */
export type MainTabParamList = {
  Home: undefined;
  DailyCheck: undefined;
  Weights: undefined;
  Cars: undefined;
};

/**
 * =========================================================
 * TAB NAVIGATOR
 * =========================================================
 */
const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        /**
         * Верхний header пока скрываем.
         * Если потом захочешь — можно вернуть
         * и настроить по каждому экрану отдельно.
         */
        headerShown: false,

        /**
         * Цвета активной / неактивной вкладки
         */
        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "gray",

        /**
         * Подбор иконки по имени вкладки
         */
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "DailyCheck") {
            iconName = "calendar";
          } else if (route.name === "Weights") {
            iconName = "fitness";
          } else if (route.name === "Cars") {
            iconName = "car";
          } else {
            iconName = "ellipse";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />

      <Tab.Screen
        name="DailyCheck"
        component={DailyCheckScreen}
        options={{
          tabBarLabel: "Daily",
        }}
      />

      <Tab.Screen
        name="Weights"
        component={WeightScreen}
        options={{
          tabBarLabel: "Weights",
        }}
      />

      <Tab.Screen
        name="Cars"
        component={CarsStack}
        options={{
          tabBarLabel: "Cars",
        }}
      />
    </Tab.Navigator>
  );
}