import Menus from "@/components/screens/home/menus";
import Notifications from "@/components/screens/home/notifications";
import SideModal from "@/components/screens/home/side-modal";
import { useAuth } from "@/context/auth-context";
import { useNotification } from "@/context/notification-context"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ImageBackground, Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler, 
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

// Tạo một component Ionicons có thể được animate
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

const Home = () => { 
  const { user } = useAuth();
  const { unreadCount, markAllAsRead } = useNotification();
  // --- Reanimated Setup ---
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const scrollY = useSharedValue(0);
  const HEADER_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1753958509957-c18ef30ffbba?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAxfHxmbGlnaHQlMjBhdHRlbmRhbnQlMjB0YWtlJTIwY2FyZSUyMGN1c3RvbWVyfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=500";
  const MALAYSIA_AIRLINES_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Malaysia_Airlines_logo.svg/1200px-Malaysia_Airlines_logo.svg.png";

  const PROMOTIONS = [
    {
      id: '1',
      title: 'Time for KATA',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961dde?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: '2',
      title: 'More flights, more freedom to explore',
      image: 'https://images.unsplash.com/photo-1501785888041-af3ba6f60648?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Style cho nền header
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollY.value,
      [0, 50], // Khoảng giá trị cuộn
      ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'] // Màu tương ứng
    );
    const shadowOpacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 0.1],
      Extrapolate.CLAMP
    );
    return {
      backgroundColor,
      shadowOpacity,
    };
  });

  // Style cho màu của text và icon
  const animatedHeaderContentStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      scrollY.value,
      [0, 50],
      ['#FFFFFF', '#172554'] // white -> blue-950
    );
    return { color };
  });

  return (
    <View className="flex-1 bg-white">
      {/* Nội dung Header - Đã được đưa ra ngoài ScrollView */}
      <Animated.View style={animatedHeaderStyle} className="absolute top-0 left-0 right-0 z-10 pt-16 px-4 pb-2 shadow-lg">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <AnimatedIonicons name="menu-outline" size={28} style={animatedHeaderContentStyle} />
          </TouchableOpacity>

          <Animated.Text className="font-bold uppercase" style={animatedHeaderContentStyle}>AirSky</Animated.Text>

          <TouchableOpacity onPress={() => user ? setNotificationsVisible(true) : router.push('/(root)/(auth)/sign-in')} className="relative"> 
            <AnimatedIonicons name="notifications-outline" size={28} style={animatedHeaderContentStyle} />
            {user && unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-blue-950 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <ImageBackground
          source={{ uri: HEADER_BACKGROUND_IMAGE }}
          className="h-[470px]"
        >
          {/* Nền đen mờ overlay */}
          <View className="absolute inset-0 bg-black/40" />
        </ImageBackground>


        {/* Shortcut Section */}
        <View className="bg-white rounded-t-[40px] -mt-10  p-4 shadow-lg">
          <View className="flex-row justify-around items-start py-4">
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-950 justify-center items-center mb-1">
                <MaterialCommunityIcons name="airplane-takeoff" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">MHflypass</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-950 justify-center items-center mb-1">
                <Ionicons name="gift-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">MHvoucher</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-950 justify-center items-center mb-1">
                <Ionicons name="qr-code-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">Boarding Passes</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-950 justify-center items-center mb-1">
                <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotions Section */}
        <View className="p-4 bg-white">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-blue-900">Ưu đãi dành cho bạn</Text>
            <TouchableOpacity onPress={() => console.log("View All Promotions")}>
              <Text className="text-blue-900 font-semibold">Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PROMOTIONS.map((promo) => (
              <TouchableOpacity key={promo.id} className="w-96 h-60 mr-4 rounded-xl overflow-hidden shadow-md bg-blue-950">
                <ImageBackground
                  source={{ uri: promo.image }}
                  className="flex-1 justify-end p-3"
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View className="bg-black/40 rounded-md p-2">
                    <Text className="text-white font-bold text-lg">{promo.title}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Placeholder for more content */}
        <View className="h-20 bg-white"></View>
      </Animated.ScrollView>

      {/* Modals */}
      <SideModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        direction="left"
        title="Menu"
      >
        <Menus />
      </SideModal>

      <SideModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        direction="right"
        title="Thông báo"
      >
        <Notifications onClose={() => setNotificationsVisible(false)} />
      </SideModal>

    </View>
  );
};

export default Home;
