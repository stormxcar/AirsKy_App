import FlightItem, { Flight, TicketClass } from "@/components/screens/book-flight/flight-item";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dữ liệu mẫu cho chuyến bay
const MOCK_FLIGHTS: Flight[] = [
  {
    id: "1",
    airline: "Vietnam Airlines",
    airlineLogo: null,
    flightNumber: "VN245",
    departure: { code: "SGN", time: "08:30" },
    arrival: { code: "HAN", time: "10:35" },
    duration: "2h 05m",
    price: 1850000,
    type: "Bay thẳng",
  },
  {
    id: "2",
    airline: "Vietjet Air",
    airlineLogo: null,
    flightNumber: "VJ150",
    departure: { code: "SGN", time: "09:15" },
    arrival: { code: "HAN", time: "11:20" },
    duration: "2h 05m",
    price: 1520000,
    type: "Bay thẳng",
  },
  {
    id: "3",
    airline: "Bamboo Airways",
    airlineLogo: null,
    flightNumber: "QH202",
    departure: { code: "SGN", time: "11:00" },
    arrival: { code: "HAN", time: "13:10" },
    duration: "2h 10m",
    price: 1780000,
    type: "Bay thẳng",
  },
  {
    id: "4",
    airline: "Vietnam Airlines",
    airlineLogo: null,
    flightNumber: "VN255",
    departure: { code: "SGN", time: "14:00" },
    arrival: { code: "HAN", time: "16:05" },
    duration: "2h 05m",
    price: 2100000,
    type: "Bay thẳng",
  },
];

// Dữ liệu mẫu cho thanh chọn ngày
const MOCK_DATES = [
  { date: "T5, 15/08", price: "1.52tr" },
  { date: "T6, 16/08", price: "1.78tr", active: true },
  { date: "T7, 17/08", price: "2.1tr" },
  { date: "CN, 18/08", price: "2.5tr" },
  { date: "T2, 19/08", price: "1.6tr" },
];

function FlightList() {
  const [selectedDate, setSelectedDate] = useState("T6, 16/08");
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TicketClass | null>(null);

  // Hàm xử lý khi chọn một chuyến bay
  const handleSelectFlight = (flightId: string) => {
    // Nếu bấm vào chuyến bay đã chọn thì bỏ chọn, ngược lại thì chọn chuyến bay mới
    const newSelectedId = selectedFlightId === flightId ? null : flightId;
    setSelectedFlightId(newSelectedId);
    // Khi chọn chuyến bay mới, reset hạng vé đã chọn
    if (selectedFlightId !== flightId) {
      setSelectedClass(null);
    }
  };

  // Hàm xử lý khi chọn một hạng vé
  const handleSelectClass = (ticketClass: TicketClass | null) => {
    setSelectedClass(ticketClass);
  };

  // Tìm chuyến bay đã chọn để lấy thông tin giá
  const selectedFlight = MOCK_FLIGHTS.find(flight => flight.id === selectedFlightId);

  // Tính toán tổng giá tiền
  const totalPrice = selectedFlight && selectedClass
    ? Math.round(selectedFlight.price * selectedClass.priceModifier)
    : 0;

  const showContinueButton = !!(selectedFlightId && selectedClass && totalPrice > 0);

  return (
    <SafeAreaView className="flex-1 bg-blue-900" edges={["top"]}>
      {/* Header */}
      <View className="bg-blue-900 pb-8 pt-4 px-4 ">
        <TouchableOpacity onPress={() => router.back()} className="absolute top-4 left-4 z-10">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-lg font-bold">SGN → HAN</Text>
          <Text className="text-blue-200 text-sm">1 hành khách, Phổ thông</Text>
        </View>
      </View>

      {/* Content Area: Date Scroller + Flight List */}
      <View className="bg-white flex-1 rounded-t-[40px] -mt-4 overflow-hidden">
        {/* Date Scroller */}
        <View className="py-6 ">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {MOCK_DATES.map((item) => (
              <TouchableOpacity
                key={item.date}
                onPress={() => setSelectedDate(item.date)}
                className={`items-center justify-center px-4 py-2 rounded-lg mr-2 ${selectedDate === item.date ? "bg-blue-50 border-blue-900 border-2" : "bg-white shadow-sm"}`}
              >
                <Text className={`text-sm font-semibold ${selectedDate === item.date ? "text-blue-900" : "text-gray-500"}`}>{item.date}</Text>
                <Text className={`text-xs font-bold ${selectedDate === item.date ? "text-blue-900" : "text-gray-500"}`}>{item.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Flight List */}
        <FlatList
          data={MOCK_FLIGHTS}
          renderItem={({ item }) => (
            <FlightItem
              flight={item}
              isSelected={selectedFlightId === item.id}
              selectedClassId={selectedFlightId === item.id ? selectedClass?.id ?? null : null}
              onSelect={() => handleSelectFlight(item.id)}
              onSelectClass={handleSelectClass}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListHeaderComponent={<Text className="text-lg font-bold text-blue-900 mb-4">Chọn chuyến bay đi</Text>}
        />
      </View>

      {/* Nút Tiếp tục chỉ hiển thị khi đã chọn chuyến bay và hạng vé */}
      {showContinueButton && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => console.log(`Tiếp tục với chuyến bay ${selectedFlightId}, hạng ${selectedClass.name}`)}
            className="bg-blue-900 py-3 rounded-full shadow-md flex-row justify-between items-center px-6"
          >
            <Text className="text-white font-bold text-lg">
              Tiếp tục
            </Text>
            <Text className="text-white font-bold text-xl">{totalPrice.toLocaleString('vi-VN')} ₫</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

export default FlightList;
