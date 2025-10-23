import FormSearchFlight from "@/components/screens/book-flight/form-search-flight";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";


const BookFlight = () => {
  return (
    <SafeAreaView className="flex-1 bg-blue-900" edges={["top", "left", "right"]}>
      {/* Header */}
      <FormSearchFlight/>

    </SafeAreaView>
  );
};

export default BookFlight;
