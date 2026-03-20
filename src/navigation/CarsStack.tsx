import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CarsScreen from "../features/cars/screens/CarsScreen";
import CarDetailsScreen from "../features/cars/screens/CarDetailsScreen";
import FuelLogsScreen from "../features/cars/screens/FuelLogsScreen";
import RepairsScreen from "../features/cars/screens/RepairsScreen";
import CreateFuelScreen from "../features/cars/screens/CreateFuelScreen";

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
};

const Stack = createNativeStackNavigator<CarsStackParamList>();

export default function CarsStack() {
  return (
    <Stack.Navigator>
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
    </Stack.Navigator>
  );
}