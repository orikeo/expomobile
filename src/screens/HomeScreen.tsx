import { View, Text } from "react-native";
import { Button } from "react-native";
import { useAuth } from "../context/AuthContext";

import { apiRequest } from "../api/client";
import { Alert } from "react-native";



export default function HomeScreen() {
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
    </View>
  );
}