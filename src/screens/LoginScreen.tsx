import { View, Text, Button } from "react-native";

type Props = {
  navigation: any;
};

export default function LoginScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login Screen</Text>

      <Button
        title="Fake Login"
        onPress={() => navigation.replace("Home")}
      />
    </View>
  );
}