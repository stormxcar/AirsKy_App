import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BookFlight = () => {
  return (
    <SafeAreaView className="bg-white flex-1">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-bold text-blue-500">
          Book Flight
        </Text>
      </View>
    </SafeAreaView>

  );
}
export default BookFlight;