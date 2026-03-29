import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/HomeScreen";
import WeightsScreen from "../features/weight/screens/WeightScreen";
import CarsStack from "./CarsStack";
import DailyCheckNavigator from "./DailyCheckNavigator";
import { colors } from "../theme/color";

export type MainTabParamList = {
  Home: undefined;
  Daily: undefined;
  Weights: undefined;
  Cars: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "ellipse";

          if (route.name === "Home") {
            iconName = "home-outline";
          } else if (route.name === "Daily") {
            iconName = "calendar-outline";
          } else if (route.name === "Weights") {
            iconName = "pulse-outline";
          } else if (route.name === "Cars") {
            iconName = "car-sport-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Daily" component={DailyCheckNavigator} />
      <Tab.Screen name="Weights" component={WeightsScreen} />
      <Tab.Screen name="Cars" component={CarsStack} />
    </Tab.Navigator>
  );
}