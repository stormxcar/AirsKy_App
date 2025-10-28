import { Flight, TicketClass } from "@/app/types/types";
import FlightItem from "@/components/screens/book-flight/flight-item";
import SortFilterModal, { FilterOptions, SortOption } from "@/components/screens/book-flight/modals/sort-filter-modal";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useFlightDisplay } from "@/hooks/useFlightDisplay";
import { SafeAreaView } from "react-native-safe-area-context";
import FlightSummaryModal from "@/components/screens/book-flight/modals/flight-summary-modal";

type SelectionPhase = 'depart' | 'return';
// Dữ liệu mẫu cho thanh chọn ngày
const MOCK_DATES = [
  { date: "T5, 15/08", price: "1.52tr" },
  { date: "T2, 27/10", price: "1.78tr", active: true },
  { date: "T7, 17/08", price: "2.1tr" },
  { date: "CN, 18/08", price: "2.5tr" },
  { date: "T2, 19/08", price: "1.6tr" },
];

function FlightList() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tripType: 'one_way' | 'round_trip'; // Sửa lại định dạng snake_case
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
  const [summaryVisible, setSummaryVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState(params.departureDate); // State cho ngày đang được chọn trên thanh scroller
  // State cho sắp xếp và lọc
  const [sortFilterModalVisible, setSortFilterModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('time_asc'); // Mặc định sắp xếp theo giờ bay sớm nhất
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    airlines: [],
    stops: [],
    timesOfDay: [],
  });

  // State cho chuyến bay đi
  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState<{ flight: Flight, ticketClass: TicketClass } | null>(null);

  // State cho lựa chọn hiện tại trên list
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TicketClass | null>(null);

  // --- Custom Hooks ---
  const { flights, error } = useFlightSearch(params, selectionPhase);
  const displayedFlights = useFlightDisplay(flights, sortOption, filterOptions);

  useEffect(() => {
    // Cập nhật ngày hiển thị trên thanh scroller khi phase thay đổi
    const dateToDisplay = (params.tripType === 'round_trip' && selectionPhase === 'return')
      ? params.returnDate
      : params.departureDate;
    setSelectedDate(dateToDisplay || '');
  }, [selectionPhase, params.departureDate, params.returnDate]);

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
    const currentSelectedFlight = displayedFlights.find(f => f.id === selectedFlightId);
    if (!currentSelectedFlight) return; // An toàn: không làm gì nếu không tìm thấy chuyến bay

    // Sửa lại điều kiện để khớp với giá trị từ params
    if (params.tripType === 'round_trip' && selectionPhase === 'depart') {
      // 1. Lưu chuyến bay đi đã chọn
      setSelectedDepartureFlight({ flight: selectedFlight, ticketClass: selectedClass });
      // 2. Chuyển sang giai đoạn chọn chuyến về
      setSelectionPhase('return');
      // 3. Reset lựa chọn cho chuyến về
      setSelectedFlightId(null);
      setSelectedClass(null);
    } else {
      // Điều hướng đến trang tiếp theo (thanh toán, thông tin hành khách,...)
      const departureFlightData = params.tripType === 'round_trip' ? selectedDepartureFlight : { flight: currentSelectedFlight, ticketClass: selectedClass };
      const returnFlightData = params.tripType === 'round_trip' ? { flight: currentSelectedFlight, ticketClass: selectedClass } : null;

      const navigationParams = {
        ...params, // Pass along original search params like passenger counts
        departureFlight: JSON.stringify(departureFlightData),
        ...(returnFlightData && { returnFlight: JSON.stringify(returnFlightData) }),
      };

      // Điều hướng trực tiếp, không dùng showLoading để bọc
      router.navigate({
        pathname: '/(root)/(booking)/user-booking-info',
        params: navigationParams
      });
    }
  };

  const selectedFlight = displayedFlights.find(flight => flight.id === selectedFlightId);

  const totalPrice = selectedFlight && selectedClass
    ? selectedClass.finalPrice // Sử dụng giá cuối cùng đã có từ API
    : 0;

  const showContinueButton = !!(selectedFlightId && selectedClass && totalPrice > 0);

  // Tùy chỉnh header dựa trên giai đoạn chọn
  const headerInfo = useMemo(() => {
    const totalPassengers = parseInt(params.adults || '1') + parseInt(params.children || '0');
    const passengerText = `${totalPassengers} hành khách`;

    if (params.tripType === 'round_trip' && selectionPhase === 'return') {
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
  }, [params.adults, params.children, params.tripType, params.originCode, params.destinationCode, selectionPhase]
  );

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-blue-950 pb-8 pt-4 px-4 ">
        <TouchableOpacity onPress={() => {
          // Nếu đang chọn chuyến về, nút back sẽ quay lại chọn chuyến đi
          if (params.tripType === 'round_trip' && selectionPhase === 'return') {
            setSelectionPhase('depart');
            setSelectedFlightId(selectedDepartureFlight?.flight.id || null);
            setSelectedClass(selectedDepartureFlight?.ticketClass || null);
            setSelectedDepartureFlight(null);
          } else {
            router.back();
          }
        }} className="absolute top-4 left-4 z-10">
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-lg font-bold">{headerInfo.title}</Text>
          <Text className="text-blue-200 text-sm">{headerInfo.subtitle}</Text>
        </View>
      </View>

      {/* Content Area: Date Scroller + Flight List */}
      <View className="bg-white flex-1 rounded-t-[40px] -mt-4 overflow-hidden">
        {/* Date Scroller */}
        {/* Date Scroller */}<View className="py-6 ">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {MOCK_DATES.map((item) => (
              <TouchableOpacity
                key={item.date}
                onPress={() => { console.log('date click noop'); /* no-op */ }}
                className={`items-center justify-center px-4 py-2 rounded-lg mr-2 ${selectedDate === item.date ? "bg-blue-50 border-blue-900 border-2" : "bg-white shadow-sm"}`}
              >
                <Text className={`text-sm font-semibold ${selectedDate === item.date ? "text-blue-900" : "text-gray-500"}`}>{item.date}</Text>
                <Text className={`text-xs font-bold ${selectedDate === item.date ? "text-blue-900" : "text-gray-500"}`}>{item.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FlatList sẽ được render, nhưng bị che bởi loading overlay */}
        <FlatList
          data={displayedFlights}
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          ListHeaderComponent={
            <>
              <Text className="text-lg font-bold text-blue-900 mb-4">{headerInfo.listTitle}</Text>
            </>
          }
          ListEmptyComponent={
            <View className="items-center mt-10 p-4">
              {error ? (
                <Text className="text-red-500 text-center">{error}</Text>
              ) : (
                <Text>Không tìm thấy chuyến bay nào.</Text>
              )}
            </View>
          }
        />
      </View>

      {/* Hiển thị tóm tắt chuyến đi đã chọn */}
      {selectionPhase === 'return' && selectedDepartureFlight && (
        <TouchableOpacity
          onPress={() => setSummaryVisible(true)}
          className="absolute bottom-20  bg-white p-4 w-full flex-row justify-between items-center"
        >
          <View>
            <Text className="text-blue-900 font-semibold">Xem tóm tắt chuyến bay</Text>
            <Text className="text-gray-600 text-sm">
              {selectedDepartureFlight && selectionPhase === "return"
                ? "Đã chọn chuyến đi"
                : "Đang chọn chuyến đi"}
            </Text>
          </View>
          <Ionicons name="chevron-up" size={20} color="#1e3a8a" />
        </TouchableOpacity>
      )}
      <FlightSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        departureFlight={selectedDepartureFlight}
        returnFlight={
          params.tripType === "round_trip" &&
            selectionPhase === "return" &&
            selectedFlight &&
            selectedClass
            ? { flight: selectedFlight, ticketClass: selectedClass }
            : null
        }
       
      />
      {/* Nút Sắp xếp & Lọc */}
      <View className="absolute bottom-44 right-4 z-20">
        <TouchableOpacity onPress={() => setSortFilterModalVisible(true)} className="bg-blue-950 p-4 rounded-full shadow-lg">
          <Ionicons name="options" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <SortFilterModal
        visible={sortFilterModalVisible}
        onClose={() => setSortFilterModalVisible(false)}
        onApply={(sort, filters) => { setSortOption(sort); setFilterOptions(filters); }}
        initialSort={sortOption}
        initialFilters={filterOptions}
        allFlights={flights} // Truyền danh sách gốc để lấy các hãng bay
      />
      {/* Nút Tiếp tục chỉ hiển thị khi đã chọn chuyến bay và hạng vé */}
      {showContinueButton && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4">
          <TouchableOpacity onPress={handleContinue}
            className="bg-blue-900 py-3 rounded-full flex-row justify-between items-center px-6"
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
