import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Screen</Text>

      <Button
        title="Fake Login"
        onPress={() => navigation.replace("Home")}
      />
    </View>
  );
}

// StyleSheet — создаёт объект стилей
// Это не CSS, а JS-объект, оптимизированный RN
const styles = StyleSheet.create({
  container: {
    flex: 1, // занять весь экран
    justifyContent: "center", // центр по вертикали
    alignItems: "center", // центр по горизонтали
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
});