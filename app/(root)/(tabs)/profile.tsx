import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { showLoading } = useLoading();

  useEffect(() => {
    // Chỉ thực hiện khi quá trình xác thực ban đầu đã hoàn tất và người dùng chưa đăng nhập
    if (!isAuthLoading && !user) {
      // Hiển thị loading overlay, sau 3 giây thì chuyển đến trang đăng nhập
      showLoading(() => {
        router.replace("/(root)/(auth)/sign-in");
      }, 3000);
    }
  }, [isAuthLoading, user]);
  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      {user ? (
        <ScrollView className="bg-white rounded-t-[40px]">
          {/* User Header */}
          <View className="bg-white p-6 items-center shadow-sm border-b border-gray-200">
            <Image
              source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D8ABC&color=fff` }}
              className="w-24 h-24 rounded-full mb-3 border-2 border-blue-200"
            />
            <Text className="text-2xl font-bold text-blue-900">{user.firstName} {user.lastName}</Text>
            <Text className="text-gray-600 mt-1">{user.email}</Text>
          </View>

          {/* Loyalty Program Card */}
          <View className="p-4">
            <View className="bg-blue-950 rounded-xl p-5 shadow-lg">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold">Hạng thành viên</Text>
                <Text className="text-blue-950 font-bold text-lg">{user.loyaltyTier || 'STANDARD'}</Text>
              </View>
              <View className="mt-4">
                <Text className="text-white font-semibold">Điểm tích lũy</Text>
                <Text className="text-white font-bold text-3xl mt-1">{user.loyaltyPoints?.toLocaleString('vi-VN') || 0}</Text>
              </View>
            </View>
          </View>

          {/* Account Options */}
          <View className="px-4 space-y-2">
            <View className="bg-white rounded-xl p-2">
              <TouchableOpacity className="flex-row items-center p-3">
                <Ionicons name="person-outline" size={22} color="#4b5563" />
                <Text className="text-base text-gray-700 ml-4">Chỉnh sửa thông tin</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              <View className="h-[1px] bg-gray-100 mx-3" />
              <TouchableOpacity className="flex-row items-center p-3">
                <Ionicons name="lock-closed-outline" size={22} color="#4b5563" />
                <Text className="text-base text-gray-700 ml-4">Đổi mật khẩu</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-xl p-2">
              <TouchableOpacity className="flex-row items-center p-3">
                <Ionicons name="settings-outline" size={22} color="#4b5563" />
                <Text className="text-base text-gray-700 ml-4">Cài đặt</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-xl p-2">
              <TouchableOpacity onPress={logout} className="flex-row items-center p-3">
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                <Text className="text-base text-red-500 ml-4 font-semibold">Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        // Hiển thị màn hình trống trong khi chờ chuyển hướng
        <View className="flex-1 bg-white justify-center items-center" />
      )}
    </SafeAreaView>

  );
}
export default Profile;