import FormSearchFlight from "@/components/screens/book-flight/form-search-flight";
import React from "react";
import { Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
const BookFlight = () => {

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      {/* Header */}
      <Text className="p-4 text-center text-white  font-bold uppercase">tìm chuyến bay</Text>

      <FormSearchFlight />

    </SafeAreaView>
  );
};

export default BookFlight;
