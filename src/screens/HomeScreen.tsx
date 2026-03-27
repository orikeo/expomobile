import { View, Text, Button, Alert } from "react-native";
import { useAuth } from "../features/auth/context/AuthContext";
import { apiRequest } from "../api/client";

import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../navigation/MainTabs";

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList, "Home">;
};

export default function HomeScreen({ navigation }: Props) {
  const { logout } = useAuth();

  const testRequest = async () => {
    try {
      const data = await apiRequest("/notes");
      Alert.alert("Success", JSON.stringify(data));
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Screen v1</Text>

      <Button title="Logout" onPress={logout} />

      <Button
        title="Open Weight Tracker"
        onPress={() => navigation.navigate("Weights")}
      />

    
    </View>
  );
}