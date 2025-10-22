import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home=()=> {
  return (
    <SafeAreaView className="bg-white flex-1">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-bold text-blue-500">
          Home
        </Text>
      </View>
    </SafeAreaView>

  );
}
export default Home;