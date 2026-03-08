import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";


/**
 * Импорт экранов
 */

import CarsStack from "./CarsStack";
import HomeScreen from "../screens/HomeScreen";
import WeightScreen from "../screens/WeightScreen";
import CarsScreen from "../screens/CarsScreen";

/**
 * Типы навигации
 * Это список всех экранов внутри Tabs
 */
export type MainTabParamList = {
  Home: undefined;
  Weights: undefined;
  Cars: undefined;
};

/**
 * Создаём Tab Navigator
 */
const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        /**
         * Убираем верхний header
         */
        headerShown: false,

        /**
         * Цвета вкладок
         */
        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "gray",

        /**
         * Иконки вкладок
         */
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Weights") {
            iconName = "fitness";
          } else {
            iconName = "ellipse";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      {/* Home */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />

      <Tab.Screen
  name="Cars"
  component={CarsStack}
/>

      {/* Weight Tracker */}
      <Tab.Screen
        name="Weights"
        component={WeightScreen}
        options={{
          tabBarLabel: "Weights",
        }}
      />
    </Tab.Navigator>
  );
}