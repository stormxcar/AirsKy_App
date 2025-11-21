import { Blog } from "@/app/types/types";
import Menus from "@/components/screens/home/menus";
import Notifications from "@/components/screens/home/notifications";
import SideModal from "@/components/screens/home/side-modal";
import VoucherModal from "@/components/screens/home/voucher-modal";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { useNotification } from "@/context/notification-context";
import { fetch5Blog } from "@/services/blog-service";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
const SCREEN_W = Dimensions.get("window").width;
const ITEM_WIDTH = SCREEN_W * 0.8;

// Skeleton Component cho Blog Card
const BlogCardSkeleton = () => (
  <View style={{ width: ITEM_WIDTH, marginRight: 12, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" }}>
    {/* Skeleton cho ảnh */}
    <View style={{ width: ITEM_WIDTH, height: 180, backgroundColor: '#e5e7eb' }} />
    <View style={{ padding: 12 }}>
      {/* Skeleton cho category */}
      <View style={{ backgroundColor: '#e5e7eb', height: 12, width: '30%', borderRadius: 4, marginBottom: 8 }} />
      {/* Skeleton cho title */}
      <View style={{ backgroundColor: '#e5e7eb', height: 16, width: '90%', borderRadius: 4, marginBottom: 6 }} />
      <View style={{ backgroundColor: '#e5e7eb', height: 16, width: '60%', borderRadius: 4, marginBottom: 8 }} />
      {/* Skeleton cho excerpt */}
      <View style={{ backgroundColor: '#e5e7eb', height: 14, width: '100%', borderRadius: 4, marginBottom: 4 }} />
      <View style={{ backgroundColor: '#e5e7eb', height: 14, width: '80%', borderRadius: 4 }} />
    </View>
  </View>
);

const Home = () => {
  const { user } = useAuth();
  const { unreadCount, markAllAsRead } = useNotification();
  // --- Reanimated Setup ---
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const { showLoading } = useLoading();
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);

  const scrollY = useSharedValue(0);
  const HEADER_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1753958509957-c18ef30ffbba?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAxfHxmbGlnaHQlMjBhdHRlbmRhbnQlMjB0YWtlJTIwY2FyZSUyMGN1c3RvbWVyfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=500";

  const {
    data: blogs = [],
    isLoading: isLoadingBlogs,
    isError: isErrorBlogs,
  } = useQuery<Blog[], Error>({
    queryKey: ["latest5Blogs"],
    queryFn: fetch5Blog,
  });

  useEffect(() => {
    if (isErrorBlogs) Alert.alert("Lỗi", "Không thể tải các bài viết mới nhất.");
  }, [isErrorBlogs]);

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

          <TouchableOpacity onPress={() => setNotificationsVisible(true)} className="relative">
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
              <Text className="text-xs text-gray-700 font-medium text-center">ASflypass</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setVoucherModalVisible(true)} className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-950 justify-center items-center mb-1">
                <Ionicons name="gift-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">ASvoucher</Text>
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
            <Text className="text-xl font-bold text-blue-900">Theo dõi bài viết</Text>
            <TouchableOpacity onPress={() => router.push('/(root)/(blog)/all-blog')}>
              <Text className="text-blue-900 font-semibold">Xem tất cả</Text>
            </TouchableOpacity>
          </View>



          {isLoadingBlogs ? (
            // Sử dụng Skeleton Loader
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              <BlogCardSkeleton />
              <BlogCardSkeleton />
            </ScrollView>
          ) : (
            <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {blogs.map((item) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: `/(root)/(blog)/${item.id}`,
                      params: { blog: JSON.stringify(item) },
                    })
                  }
                  style={{ width: ITEM_WIDTH, marginRight: 12, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" }}
                >
                  <ImageBackground
                    source={{ uri: item.featuredImage }}
                    style={{ width: ITEM_WIDTH, height: 180 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 12, color: "#2563eb", fontWeight: "bold", marginBottom: 4 }}>
                      {item.categories?.[0]?.name ?? "Không phân loại"}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }} numberOfLines={2}>
                      {item.excerpt}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          )}

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
      <VoucherModal
        visible={voucherModalVisible}
        onClose={() => setVoucherModalVisible(false)}
      />
    </View>
  );
};

export default Home;
