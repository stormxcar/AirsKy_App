import { Airport, Flight, TicketClass } from "@/app/types/types";
import SortFilterModal, { FilterOptions, SortOption } from "@/components/screens/book-flight/modals/sort-filter-modal";
import { useBooking } from "@/context/booking-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {  ScrollView, Text, TouchableOpacity, View, Dimensions, RefreshControl } from 'react-native';
import { useFlightSearch } from "@/hooks/use-flight-search";
import { useFlightDisplay } from "@/hooks/use-flight-display";
import { SafeAreaView } from "react-native-safe-area-context";
import FlightSummaryModal from "@/components/screens/book-flight/modals/flight-summary-modal";
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useDateScroller } from "@/hooks/use-date-scroller";
import { useQuery } from "@tanstack/react-query";
import { fetchAllAirports } from "@/services/airport-service";
import FlightListContent from '@/components/screens/book-flight/flight-list-content';
import { useLoading } from "@/context/loading-context";

type SelectionPhase = 'depart' | 'return';

const { width: screenWidth } = Dimensions.get('window');

function FlightList() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tripType: 'one_way' | 'round_trip'; 
    originCode: string;
    destinationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: string;
    children: string;
    infants: string;
  }>();
  const { bookingState, dispatch } = useBooking();
  const { showLoading, hideLoading } = useLoading();

  // Sử dụng state cục bộ để quản lý params, vì params từ useLocalSearchParams là read-only
  // và không thể thay đổi trực tiếp để trigger re-render.
  const [searchParams, setSearchParams] = useState(params);

  // State để quản lý giai đoạn chọn (đi hoặc về)
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>('depart');
  const [summaryVisible, setSummaryVisible] = useState(false);

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
  const { flights, error, isLoading: isLoadingFlights, refetch: refetchFlights } = useFlightSearch(searchParams, selectionPhase);
  const displayedFlights = useFlightDisplay(flights, sortOption, filterOptions);

  // Lấy dữ liệu sân bay để tạo map (code -> id)
  const { data: airports = [] } = useQuery<Airport[], Error>({
    queryKey: ['airports'],
    queryFn: fetchAllAirports,
    staleTime: Infinity, // Dữ liệu sân bay ít thay đổi, cache vô hạn
  });
  const airportIdMap = useMemo(() => new Map(airports.map(a => [a.code, a.id])), [airports]);

  const { dates: dateScrollerData, isLoading: isLoadingDates, refetch: refetchDates } = useDateScroller(searchParams, airportIdMap, selectionPhase);

  // Refs và States cho Date Scroller
  const dateScrollViewRef = useRef<ScrollView>(null);
  const dateItemLayouts = useRef(new Map<string, { x: number, width: number }>());
  const [scrollPosition, setScrollPosition] = useState({ x: 0, contentWidth: 0, layoutWidth: 0 });

  const SCROLL_AMOUNT = screenWidth * 0.7; // Lượng cuộn khi nhấn nút


  // Quản lý trạng thái loading tổng thể
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Gọi lại API cho cả date scroller và flight list
      await Promise.all([refetchDates(), refetchFlights()]);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchDates, refetchFlights]);

  useEffect(() => {
    // Khi vào trang lần đầu, tải dữ liệu ban đầu
    if (isInitialLoading) {
      showLoading(async () => {
        await refetchDates();
      }).finally(() => {
        setIsInitialLoading(false); // Đánh dấu đã tải xong lần đầu
      });
    }
  }, []); // Chỉ chạy 1 lần khi mount

  // Tải lại dữ liệu ngày và chuyến bay mỗi khi chặng bay thay đổi
  useEffect(() => {
    if (!isInitialLoading) { // Chỉ chạy khi không phải lần tải đầu
      refetchDates();
      refetchFlights();
    }
  }, [selectionPhase]);

  // Khởi tạo booking state khi component được mount lần đầu
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STATE',
      payload: {
        tripType: params.tripType,
        originCode: params.originCode,
        destinationCode: params.destinationCode,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengerCounts: {
          adults: parseInt(params.adults || '0'),
          children: parseInt(params.children || '0'),
          infants: parseInt(params.infants || '0'),
        }
      }
    });
  }, []); // Chạy 1 lần duy nhất
  // console.log(flights)
  // Tự động cuộn đến ngày được chọn
  useEffect(() => {
    const selectedDate = selectionPhase === 'depart' ? searchParams.departureDate : searchParams.returnDate;
    if (selectedDate && dateScrollViewRef.current && dateItemLayouts.current.has(selectedDate)) {
      // Dùng setTimeout để đảm bảo layout đã được tính toán xong
      setTimeout(() => {
        const layout = dateItemLayouts.current.get(selectedDate);
        if (layout) {
          const scrollX = layout.x - (screenWidth / 2) + (layout.width / 1.3);
          dateScrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
        }
      }, 150);
    }
  }, [dateScrollerData, selectionPhase, searchParams.departureDate, searchParams.returnDate]); // Đã bao gồm selectionPhase


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

  const handleSelectDateFromScroller = (date: string) => {
    // Reset lựa chọn khi đổi ngày
    setSelectedFlightId(null);
    setSelectedClass(null);

    // Thay vì điều hướng lại toàn bộ trang (gây reset state),
    // chúng ta sẽ cập nhật state trong context và trigger refetch.
    // Điều này giữ lại được thông tin chuyến đi đã chọn.
    if (selectionPhase === 'depart') {
      setSearchParams(prev => ({ ...prev, departureDate: date }));
    } else {
      setSearchParams(prev => ({ ...prev, returnDate: date }));
    }

    // Các hook useFlightSearch và useDateScroller sẽ tự động chạy lại
    // vì chúng phụ thuộc vào searchParams, không cần gọi refetch thủ công.
  };

  const handleContinue = () => {
    const selectedFlight = displayedFlights.find(flight => flight.id === selectedFlightId);
    if (!selectedFlight || !selectedClass) {
      return;
    }

    // Tìm lại selectedFlight để đảm bảo nó không undefined trước khi tiếp tục
    const currentSelectedFlight = displayedFlights.find(f => f.id === selectedFlightId);
    if (!currentSelectedFlight) return; // An toàn: không làm gì nếu không tìm thấy chuyến bay

    // Sửa lại điều kiện để khớp với giá trị từ params
    if (params.tripType === 'round_trip' && selectionPhase === 'depart') {
      // 1. Lưu chuyến bay đi đã chọn
      dispatch({ type: 'UPDATE_STATE', payload: { departureFlight: { flight: selectedFlight, ticketClass: selectedClass } } });
      // 2. Chuyển sang giai đoạn chọn chuyến về
      setSelectionPhase('return');
      // 3. Reset lựa chọn cho chuyến về
      setSelectedFlightId(null);
      setSelectedClass(null);
    } else {
      // Cập nhật state và điều hướng
      const departureFlightData = params.tripType === 'round_trip' ? bookingState.departureFlight : { flight: currentSelectedFlight, ticketClass: selectedClass };
      const returnFlightData = params.tripType === 'round_trip' ? { flight: currentSelectedFlight, ticketClass: selectedClass } : null;

      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          departureFlight: departureFlightData,
          returnFlight: returnFlightData,
        }
      });
      // Điều hướng trực tiếp, không dùng showLoading để bọc
      router.navigate({
        pathname: '/(root)/(booking)/user-booking-info'
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
    const totalPassengers = parseInt(searchParams.adults || '1') + parseInt(searchParams.children || '0');
    const passengerText = `${totalPassengers} hành khách`;

    if (searchParams.tripType === 'round_trip' && selectionPhase === 'return') {
      return {
        title: `${searchParams.destinationCode} → ${searchParams.originCode}`,
        subtitle: passengerText,
        listTitle: "Chọn chuyến bay về"
      };
    }
    // Mặc định là 'depart'
    return {
      title: `${searchParams.originCode} → ${searchParams.destinationCode}`,
      subtitle: passengerText,
      listTitle: "Chọn chuyến bay đi",
    };
  }, [searchParams, selectionPhase]
  );

  // Animated style cho nút tóm tắt chuyến bay
  const summaryButtonAnimatedStyle = useAnimatedStyle(() => {
    // Chiều cao của khu vực nút "Tiếp tục" là khoảng 92px.
    // Khi nút "Tiếp tục" hiện, nút tóm tắt sẽ cách đáy 92px.
    // Khi nút "Tiếp tục" ẩn, nút tóm tắt sẽ cách đáy 0.
    return {
      bottom: withTiming(showContinueButton ? 92 : 10, { duration: 300 }),
    };
  });

  // Animated style cho nút "Tiếp tục"
  const continueButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      // Khi nút hiển thị, trượt lên (translateY: 0).
      // Khi nút ẩn, trượt xuống dưới màn hình (translateY: 100).
      transform: [
        { translateY: withTiming(showContinueButton ? 0 : 100, { duration: 300 }) },
      ],
    };
  });

  // Animated style cho nút "Sắp xếp & Lọc"
  const filterButtonAnimatedStyle = useAnimatedStyle(() => {
    let bottomValue = 16; // Vị trí cơ bản (cách đáy 16px)
    if (showContinueButton) {
      // Nếu nút "Tiếp tục" hiện, đẩy nút lọc lên trên nó (92px là chiều cao nút Tiếp tục)
      bottomValue += 92;
    }
    if (selectionPhase === 'return' && bookingState.departureFlight) {
      // Nếu nút "Tóm tắt" hiện, đẩy nút lọc lên trên nó nữa (khoảng 60px)
      bottomValue += 60;
    }
    return { bottom: withTiming(bottomValue, { duration: 300 }) };
  });
  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top"]}>
      {/* Header */}
      <View className="bg-blue-950 pb-8 pt-4 px-4 ">
        <TouchableOpacity onPress={() => {
          // Nếu đang chọn chuyến về, nút back sẽ quay lại chọn chuyến đi
          if (searchParams.tripType === 'round_trip' && selectionPhase === 'return') {
            const departureFlight = bookingState.departureFlight;
            setSelectionPhase('depart');
            setSelectedFlightId(departureFlight?.flight.id || null);
            setSelectedClass(departureFlight?.ticketClass || null);
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

      <FlightListContent
        isInitialLoading={isInitialLoading}
        selectionPhase={selectionPhase}
        params={searchParams}
        dateScrollerData={dateScrollerData}
        handleSelectDateFromScroller={handleSelectDateFromScroller}
        dateScrollViewRef={dateScrollViewRef}
        scrollPosition={scrollPosition}
        setScrollPosition={setScrollPosition}
        SCROLL_AMOUNT={SCROLL_AMOUNT}
        dateItemLayouts={dateItemLayouts}
        isLoadingDates={isLoadingDates}
        isLoadingFlights={isLoadingFlights}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        displayedFlights={displayedFlights}
        selectedFlightId={selectedFlightId}
        selectedClass={selectedClass}
        handleSelectFlight={handleSelectFlight}
        handleSelectClass={handleSelectClass}
        headerInfo={headerInfo}
        error={error}
      />

      {/* Hiển thị tóm tắt chuyến đi đã chọn */}
      {selectionPhase === 'return' && bookingState.departureFlight && (
        <Animated.View style={summaryButtonAnimatedStyle} className="absolute w-full">
          <TouchableOpacity
            onPress={() => setSummaryVisible(true)}
            className="bg-white p-4 flex-row justify-between items-center border-t border-gray-200"
          >
            <Text className="text-blue-900 font-semibold">Xem tóm tắt chuyến bay</Text>
            <Ionicons name="chevron-up" size={20} color="#1e3a8a" />
          </TouchableOpacity>
        </Animated.View>
      )}
      <FlightSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        departureFlight={bookingState.departureFlight}
        returnFlight={
          searchParams.tripType === "round_trip" &&
            selectionPhase === "return" &&
            selectedFlight &&
            selectedClass
            ? { flight: selectedFlight, ticketClass: selectedClass }
            : null
        }
       
      />
      {/* Nút Sắp xếp & Lọc */}
      <Animated.View style={filterButtonAnimatedStyle} className="absolute right-4 z-20">
          <TouchableOpacity onPress={() => setSortFilterModalVisible(true)} className="bg-blue-900 p-4 rounded-full shadow-lg">
              <Ionicons name="options" size={24} color="white" />
          </TouchableOpacity>
      </Animated.View>

      <SortFilterModal
        visible={sortFilterModalVisible}
        onClose={() => setSortFilterModalVisible(false)}
        onApply={(sort, filters) => { setSortOption(sort); setFilterOptions(filters); }}
        initialSort={sortOption}
        initialFilters={filterOptions}
        allFlights={flights} // Truyền danh sách gốc để lấy các hãng bay
      />
      {/* Nút Tiếp tục với hiệu ứng trượt */}
      <Animated.View style={continueButtonAnimatedStyle} className="absolute bottom-0 left-0 right-0">
        <View className="bg-white p-4 border-t border-gray-200 h-[92px]">
          <TouchableOpacity onPress={handleContinue}
            className="bg-blue-900 py-3 rounded-full flex-row justify-center items-center px-6"
          >
            <Text className="text-white font-bold text-lg">
              Tiếp tục
            </Text>
            {/* <Text className="text-white font-bold text-xl">{totalPrice.toLocaleString('vi-VN')} ₫</Text> */}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export default FlightList;
