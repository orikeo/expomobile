import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CarsScreen from "../features/cars/screens/CarsScreen";
import CarDetailsScreen from "../features/cars/screens/CarDetailsScreen";
import FuelLogsScreen from "../features/cars/screens/FuelLogsScreen";
import RepairsScreen from "../features/cars/screens/RepairsScreen";
import CreateFuelScreen from "../features/cars/screens/CreateFuelScreen";
import EditFuelScreen from "../features/cars/screens/EditFuelScreen";
import { colors } from "../theme/color";

/**
 * =========================================================
 * CARS STACK PARAMS
 * =========================================================
 *
 * Здесь описываем все параметры экранов внутри машины / топлива / ремонтов.
 * Это важно для TypeScript:
 *  - навигация становится типобезопасной
 *  - меньше шансов передать неправильные данные
 */
export type CarsStackParamList = {
  CarsList: undefined;

  CarDetails: {
    carId: string;
    name: string;
  };

  FuelLogs: {
    carId: string;
    name: string;
  };

  Repairs: {
    carId: string;
    name: string;
  };

  CreateFuel: {
    carId: string;
    name: string;
  };

  EditFuel: {
    fuelLog: {
      id: string;
      carId: string;
      fuelDate: string;
      odometer: number | null;
      liters: string;
      pricePerLiter: string;
      totalPrice: string;
      fullTank: boolean;
      station: string | null;
      createdAt: string;
    };
    name: string;
  };
};

const Stack = createNativeStackNavigator<CarsStackParamList>();

/**
 * =========================================================
 * CARS STACK
 * =========================================================
 *
 * Пока делаем единый тёмный header только для car-модуля.
 * Позже, если захочешь, это можно вынести в общий navigator theme.
 */
export default function CarsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="CarsList"
        component={CarsScreen}
        options={{ title: "My Cars" }}
      />

      <Stack.Screen
        name="CarDetails"
        component={CarDetailsScreen}
        options={{ title: "Car Details" }}
      />

      <Stack.Screen
        name="FuelLogs"
        component={FuelLogsScreen}
        options={{ title: "Fuel Logs" }}
      />

      <Stack.Screen
        name="Repairs"
        component={RepairsScreen}
        options={{ title: "Repairs" }}
      />

      <Stack.Screen
        name="CreateFuel"
        component={CreateFuelScreen}
        options={{ title: "Add Fuel" }}
      />

      <Stack.Screen
        name="EditFuel"
        component={EditFuelScreen}
        options={{ title: "Edit Fuel" }}
      />
    </Stack.Navigator>
  );
}