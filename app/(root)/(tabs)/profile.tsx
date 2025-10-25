import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const router = useRouter();
  // Giả sử bạn có một hook để kiểm tra trạng thái đăng nhập
  // const { isLoggedIn, user } = useAuth(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder

  return (
    <SafeAreaView className="bg-white flex-1">
      {isLoggedIn ? (
        // Giao diện khi người dùng đã đăng nhập
        <View className="p-4">
            <Text className="text-2xl font-bold text-blue-900">Xin chào, [Tên người dùng]</Text>
            {/* Thêm các tùy chọn khác: xem thông tin, lịch sử chuyến bay, đăng xuất... */}
            <TouchableOpacity onPress={() => setIsLoggedIn(false)} className="mt-8 bg-red-500 p-3 rounded-lg">
                <Text className="text-white text-center font-bold">Đăng xuất</Text>
            </TouchableOpacity>
        </View>
      ) : (
        // Giao diện khi người dùng chưa đăng nhập
        <View className="flex-1 justify-center items-center p-4">
            <TouchableOpacity onPress={() => (router.replace("/(root)/(auth)/sign-in"))} className="bg-blue-900 py-4 px-8 rounded-full">
                <Text className="text-lg font-bold text-white text-center">Đăng nhập để tiếp tục</Text>
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>

  );
}
export default Profile;