import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import CarsStack from "./CarsStack";
import HomeScreen from "../screens/HomeScreen";
import WeightScreen from "../features/weight/screens/WeightScreen";
import DailyCheckNavigator from "./DailyCheckNavigator";

/**
 * =========================================================
 * MAIN TAB PARAM LIST
 * =========================================================
 */
export type MainTabParamList = {
  Home: undefined;
  Daily: undefined;
  Weights: undefined;
  Cars: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Daily") {
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
        name="Daily"
        component={DailyCheckNavigator}
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