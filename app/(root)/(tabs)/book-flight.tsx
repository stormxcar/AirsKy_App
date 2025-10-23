import FormSearchFlight from "@/components/screens/book-flight/form-search-flight";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const BookFlight = () => {
  return (
    <SafeAreaView className="flex-1 bg-blue-900" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="bg-blue-900 py-6 ">
        <Text className="text-center text-white text-xl font-semibold">CHỌN HÀNH TRÌNH BAY</Text>
      </View>
      <FormSearchFlight/>

    </SafeAreaView>
  );
};

export default BookFlight;
