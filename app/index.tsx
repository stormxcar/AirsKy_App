import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const App = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const animationStarted = useRef(false); // Thêm ref để theo dõi trạng thái animation
  const router = useRouter();

  useEffect(() => {
    // Chỉ chạy animation nếu nó chưa được bắt đầu
    if (!animationStarted.current) {
      animationStarted.current = true; // Đánh dấu là đã bắt đầu
      // Chạy thanh tiến trình trong 5 giây
      Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(() => {
        // Sau khi hoàn tất, điều hướng thẳng sang trang home
        router.replace("/(root)/(tabs)/home");
      });
    }
  }, []);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView className="bg-white flex-1">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-bold text-blue-900 mb-5">
          Welcome to AirSky
        </Text>

        {/* Thanh tiến trình */}
        <View className="w-3/4 h-3 bg-gray-200 rounded-full overflow-hidden">
          <Animated.View
            style={{
              width,
              height: "100%",
              backgroundColor: "#1e3a8a", // blue-500
            }}
          />
        </View>

      </View>
    </SafeAreaView>
  );
};

export default App;
