import { Flight, TicketClass } from "@/app/types";
import FlightItem from "@/components/screens/book-flight/flight-item";
import FlightItemSkeleton from "@/components/screens/book-flight/flight-item-skeleton";
import { useLoading } from "@/context/loading-context";
import { searchFlights } from "@/services/flight-service";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

// Số lượng skeleton item sẽ hiển thị khi đang tải
const SKELETON_COUNT = 3;
type SelectionPhase = 'depart' | 'return';


// Dữ liệu mẫu cho thanh chọn ngày
const MOCK_DATES = [
  { date: "T5, 15/08", price: "1.52tr" },
  { date: "T6, 16/08", price: "1.78tr", active: true },
  { date: "T7, 17/08", price: "2.1tr" },
  { date: "CN, 18/08", price: "2.5tr" },
  { date: "T2, 19/08", price: "1.6tr" },
];

function FlightList() {
  const { showLoading } = useLoading();
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

  // State cho dữ liệu chuyến bay, loading và lỗi
  const [flights, setFlights] = useState<Flight[]>([]); // Bắt đầu với mảng rỗng
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState("T6, 16/08");

  // State cho chuyến bay đi
  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState<{ flight: Flight, ticketClass: TicketClass } | null>(null);

  // State cho lựa chọn hiện tại trên list
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TicketClass | null>(null);

  useEffect(() => {
    // Reset state khi các tham số tìm kiếm chính thay đổi (ví dụ: người dùng quay lại và tìm kiếm lại)
    setSelectionPhase('depart');
    setSelectedDepartureFlight(null);
    setSelectedFlightId(null);
    setSelectedClass(null);

    const fetchFlights = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Xác định tham số cho API call dựa trên giai đoạn chọn (đi hoặc về)
        const isReturnPhase = params.tripType === 'round-trip' && selectionPhase === 'return';
        const from = isReturnPhase ? params.destinationCode : params.originCode;
        const to = isReturnPhase ? params.originCode : params.destinationCode;
        const date = isReturnPhase ? params.returnDate : params.departureDate;

        // Gọi hàm từ service để lấy dữ liệu đã được map
        const mappedFlights = await searchFlights({ from, to, date: date || '' });
        setFlights(mappedFlights);
      } catch (e: any) {
        console.error("Lỗi khi gọi API:", e);
        setError("Không thể tải danh sách chuyến bay. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlights();
  }, [selectionPhase, params.originCode, params.destinationCode, params.departureDate, params.returnDate]);

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

    // Tìm lại selectedFlight để đảm bảo nó không undefined trước khi tiếp tục
    const currentSelectedFlight = flights.find(f => f.id === selectedFlightId);
    if (!currentSelectedFlight) return; // An toàn: không làm gì nếu không tìm thấy chuyến bay

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
      const departureFlightData = params.tripType === 'round-trip' ? selectedDepartureFlight : { flight: currentSelectedFlight, ticketClass: selectedClass };
      const returnFlightData = params.tripType === 'round-trip' ? { flight: currentSelectedFlight, ticketClass: selectedClass } : null;

      const navigationParams = {
        ...params, // Pass along original search params like passenger counts
        departureFlight: JSON.stringify(departureFlightData),
        ...(returnFlightData && { returnFlight: JSON.stringify(returnFlightData) }),
      };

      // Bật loading trước khi chuyển màn hình
      showLoading();
      // Dùng setTimeout để đảm bảo UI kịp hiển thị loading overlay trước khi bắt đầu tác vụ nặng (chuyển trang)
      setTimeout(() => {
        router.navigate({
          pathname: '/(root)/(booking)/user-booking-info',
          params: navigationParams
        });
      }, 50); // 50ms là đủ
    }
  };

  const selectedFlight = flights.find(flight => flight.id === selectedFlightId);

  const totalPrice = selectedFlight && selectedClass
    ? selectedClass.finalPrice // Sử dụng giá cuối cùng đã có từ API
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

        {isLoading ? (
          // Hiển thị Skeleton khi đang tải dữ liệu
          <FlatList
            data={Array.from({ length: SKELETON_COUNT })} // Tạo mảng rỗng với số lượng phần tử bằng SKELETON_COUNT
            renderItem={() => <FlightItemSkeleton />}
            keyExtractor={(_, index) => `skeleton-${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            ListHeaderComponent={<Text className="text-lg font-bold text-blue-900 mb-4">{headerInfo.listTitle}</Text>}
          />
        ) : (
          // Hiển thị danh sách chuyến bay thực tế khi đã tải xong
          <FlatList
            data={flights}
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
            ListEmptyComponent={
              <View className="items-center mt-10 p-4">
                {error ? ( // Hiển thị lỗi nếu có
                  <Text className="text-red-500 text-center">{error}</Text>
                ) : ( // Hoặc thông báo không tìm thấy chuyến bay
                  <Text>Không tìm thấy chuyến bay nào.</Text>
                )}
              </View>
            }
          />
        )}
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
