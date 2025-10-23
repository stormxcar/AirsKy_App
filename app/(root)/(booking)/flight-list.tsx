import FlightItem, { Flight, TicketClass } from "@/components/screens/book-flight/flight-item";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SelectionPhase = 'depart' | 'return';

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
  const params = useLocalSearchParams<{
    tripType: 'one-way' | 'round-trip';
    originCode: string;
    destinationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: string;
    children: string;
    infants: string;
  }>();

  // State để quản lý giai đoạn chọn (đi hoặc về)
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>('depart');

  const [selectedDate, setSelectedDate] = useState("T6, 16/08");

  // State cho chuyến bay đi
  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState<{ flight: Flight, ticketClass: TicketClass } | null>(null);

  // State cho lựa chọn hiện tại (có thể là đi hoặc về)
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TicketClass | null>(null);

  // Hàm xử lý khi chọn một chuyến bay
  const handleSelectFlight = (flightId: string) => {
    const newSelectedId = selectedFlightId === flightId ? null : flightId;
    setSelectedFlightId(newSelectedId);
    if (selectedFlightId !== flightId) {
      setSelectedClass(null);
    }
  };

  const handleSelectClass = (ticketClass: TicketClass | null) => {
    setSelectedClass(ticketClass);
  };

  const handleContinue = () => {
    if (!selectedFlight || !selectedClass) return;

    if (params.tripType === 'round-trip' && selectionPhase === 'depart') {
      // 1. Lưu chuyến bay đi đã chọn
      setSelectedDepartureFlight({ flight: selectedFlight, ticketClass: selectedClass });
      // 2. Chuyển sang giai đoạn chọn chuyến về
      setSelectionPhase('return');
      // 3. Reset lựa chọn cho chuyến về
      setSelectedFlightId(null);
      setSelectedClass(null);
    } else {
      // Điều hướng đến trang tiếp theo (thanh toán, thông tin hành khách,...)
      const departureFlightData = params.tripType === 'round-trip' ? selectedDepartureFlight : { flight: selectedFlight, ticketClass: selectedClass };
      const returnFlightData = params.tripType === 'round-trip' ? { flight: selectedFlight, ticketClass: selectedClass } : null;

      const navigationParams = {
        ...params, // Pass along original search params like passenger counts
        departureFlight: JSON.stringify(departureFlightData),
        ...(returnFlightData && { returnFlight: JSON.stringify(returnFlightData) }),
      };

      router.navigate({
        pathname: '/(root)/(booking)/user-booking-info',
        params: navigationParams
      });
    }
  };

  const selectedFlight = MOCK_FLIGHTS.find(flight => flight.id === selectedFlightId);

  const totalPrice = selectedFlight && selectedClass
    ? Math.round(selectedFlight.price * selectedClass.priceModifier)
    : 0;

  const showContinueButton = !!(selectedFlightId && selectedClass && totalPrice > 0);

  // Tùy chỉnh header dựa trên giai đoạn chọn
  const headerInfo = useMemo(() => {
    const totalPassengers = parseInt(params.adults || '1') + parseInt(params.children || '0');
    const passengerText = `${totalPassengers} hành khách`;

    if (selectionPhase === 'return') {
      return {
        title: `${params.destinationCode} → ${params.originCode}`,
        subtitle: passengerText,
        listTitle: "Chọn chuyến bay về"
      };
    }
    // Mặc định là 'depart'
    return {
      title: `${params.originCode} → ${params.destinationCode}`,
      subtitle: passengerText,
      listTitle: "Chọn chuyến bay đi"
    };
  }, [
      selectionPhase, 
      params.originCode, 
      params.destinationCode, 
      params.adults, 
      params.children
    ]
  );

  return (
    <SafeAreaView className="flex-1 bg-blue-900" edges={["top"]}>
      {/* Header */}
      <View className="bg-blue-900 pb-8 pt-4 px-4 ">
        <TouchableOpacity onPress={() => {
          // Nếu đang chọn chuyến về, nút back sẽ quay lại chọn chuyến đi
          if (params.tripType === 'round-trip' && selectionPhase === 'return') {
            setSelectionPhase('depart');
            setSelectedFlightId(selectedDepartureFlight?.flight.id || null);
            setSelectedClass(selectedDepartureFlight?.ticketClass || null);
            setSelectedDepartureFlight(null);
          } else {
            router.back();
          }
        }} className="absolute top-4 left-4 z-10">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-lg font-bold">{headerInfo.title}</Text>
          <Text className="text-blue-200 text-sm">{headerInfo.subtitle}</Text>
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
          ListHeaderComponent={<Text className="text-lg font-bold text-blue-900 mb-4">{headerInfo.listTitle}</Text>}
        />
      </View>

      {/* Nút Tiếp tục chỉ hiển thị khi đã chọn chuyến bay và hạng vé */}
      {showContinueButton && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200">
          <TouchableOpacity onPress={handleContinue}
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
