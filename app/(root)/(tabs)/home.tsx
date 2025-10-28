import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  // Placeholder images and logo
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
    {
      id: '3',
      title: 'Discover new destinations',
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
  ];

  return (
    <View className="flex-1 bg-white" >
      <ScrollView className="flex-1">
        {/* Header Section */}
        <ImageBackground
          source={{ uri: HEADER_BACKGROUND_IMAGE }}
          className="h-[470px] justify-between p-4"
        >
          {/* Nền đen mờ overlay */}
          <View className="absolute inset-0 bg-black/40" />

          {/* Nội dung Header */}
          <View className="flex-row justify-between items-center mt-12 px-2 relative z-10">
            <TouchableOpacity onPress={() => console.log("Menu pressed")}>
              <Ionicons name="menu-outline" size={28} color="white" />
            </TouchableOpacity>

            <Text className="font-bold text-white uppercase">AirSky</Text>

            <TouchableOpacity onPress={() => console.log("Notification pressed")}>
              <Ionicons name="notifications-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </ImageBackground>


        {/* Shortcut Section */}
        <View className="bg-white rounded-t-[40px] -mt-10  p-4 shadow-lg">
          <View className="flex-row justify-around items-start py-4">
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-900 justify-center items-center mb-1">
                <MaterialCommunityIcons name="airplane-takeoff" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">MHflypass</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-900 justify-center items-center mb-1">
                <Ionicons name="gift-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">MHvoucher</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-900 justify-center items-center mb-1">
                <Ionicons name="qr-code-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">Boarding Passes</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-14 h-14 rounded-full bg-blue-900 justify-center items-center mb-1">
                <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="white" />
              </View>
              <Text className="text-xs text-gray-700 font-medium text-center">More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotions Section */}
        <View className="p-4 bg-white">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-blue-900">Promotions For You</Text>
            <TouchableOpacity onPress={() => console.log("View All Promotions")}>
              <Text className="text-blue-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PROMOTIONS.map((promo) => (
              <TouchableOpacity key={promo.id} className="w-64 h-60 mr-4 rounded-xl overflow-hidden shadow-md bg-blue-900">
                <ImageBackground
                  // source={{ uri: promo.image }}
                  className="flex-1 justify-end p-3"
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View className="bg-black/40 rounded-md p-2">
                    <Text className="text-white font-bold text-lg">{promo.title}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Placeholder for more content */}
        <View className="h-20 bg-white"></View>
      </ScrollView>
    </View>
  );
};

export default Home;
