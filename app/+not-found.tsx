import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NotFound=()=> {
  return (
    <SafeAreaView>
      <Text className="text-xl font-bold text-blue-900 text-center">
        404 Not Found
      </Text>
    </SafeAreaView>

  );
}
export default NotFound;