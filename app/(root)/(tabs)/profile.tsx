import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const router = useRouter();
  return (
    <SafeAreaView className="bg-white flex-1">
      <View className="flex-1 justify-center items-center">
        <TouchableOpacity onPress={() => (router.replace("/(root)/(auth)/sign-in"))} className="bg-blue-900 p-4 rounded-full">
          <Text className="text-xl font-bold text-white text-center">
            Đănng nhập để tiếp tục
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>

  );
}
export default Profile;