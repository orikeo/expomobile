import { View, Text, Button, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
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
      <Text>Home Screen</Text>

      <Button title="Logout" onPress={logout} />

      <Button title="Test Protected Route" onPress={testRequest} />

      <Button
        title="Open Weight Tracker"
        onPress={() => navigation.navigate("Weights")}
      />
    </View>
  );
}