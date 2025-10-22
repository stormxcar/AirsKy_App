import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NotFound=()=> {
  return (
    <SafeAreaView>
      <Text className="text-xl font-bold text-blue-500">
        404 Not Found
      </Text>
    </SafeAreaView>

  );
}
export default NotFound;