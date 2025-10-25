import { SeatStatus } from "@/app/types/booking";
import { BaggagePackage, Seat, SelectedFlight } from "@/app/types/types";
import AdditionalServices from "@/components/screens/book-flight/additional-services";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import BookingSummaryModal from "@/components/screens/book-flight/modals/booking-summary-modal";
import SeatMap from "@/components/screens/book-flight/seat-map";
import { fetchSeatsByFlightId } from "@/services/flight-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoading } from "@/context/loading-context";

// Tạm thời định nghĩa SeatTypes ở đây nếu chưa có trong types.ts
// Lý tưởng là nên có một file types.ts chung cho toàn bộ ứng dụng
enum SeatTypes {
    STANDARD = 'STANDARD', PREMIUM = 'PREMIUM', EXIT_ROW = 'EXIT_ROW',
    WINDOW = 'WINDOW', AISLE = 'AISLE', MIDDLE = 'MIDDLE',
}
const getSeatAdditionalPrice = (seatType: SeatTypes | undefined): number => {
    if (!seatType) return 0; // Giá mặc định cho ghế không có loại hoặc loại STANDARD
    return seatType === SeatTypes.PREMIUM ? 50000 : seatType === SeatTypes.EXIT_ROW ? 75000 : 0; // Ví dụ
};
const ServiceAndSeatSelection = () => {
    const params = useLocalSearchParams();
    const { showLoading, hideLoading } = useLoading();
    const router = useRouter();
    const passengers = useMemo(() => params.passengers ? JSON.parse(params.passengers as string) : [], [params.passengers]);

    // Trích xuất flightId từ chuyến bay đi đã chọn
    const departureFlightData = useMemo(() => {
        if (params.departureFlight && typeof params.departureFlight === 'string') {
            return JSON.parse(params.departureFlight) as SelectedFlight;
        }
        return null;
    }, [params.departureFlight]);
    const returnFlightData = useMemo(() => {
        if (params.returnFlight && typeof params.returnFlight === 'string') {
            return JSON.parse(params.returnFlight) as SelectedFlight;
        }
        return null;
    }, [params.returnFlight]);
    const flightId = departureFlightData?.flight.id ? parseInt(departureFlightData.flight.id) : null;

    const [seats, setSeats] = useState<Seat[]>([]);
    const [originalSeats, setOriginalSeats] = useState<Seat[]>([]); // Lưu trạng thái ghế ban đầu
    const [selectedSeats, setSelectedSeats] = useState<{ [passengerId: number]: string }>({});
    const [errorFetchingSeats, setErrorFetchingSeats] = useState<string | null>(null);

    const [showSeatMap, setShowSeatMap] = useState(true); // State để ẩn/hiện sơ đồ ghế
    useEffect(() => {
        if (flightId) {
            // Truyền toàn bộ logic tải dữ liệu vào showLoading như một "task"
            showLoading(async () => {
                setErrorFetchingSeats(null);
                try {
                    const fetchedSeats = await fetchSeatsByFlightId(flightId);
                    setOriginalSeats(fetchedSeats); // Lưu trạng thái ban đầu
                    setSeats(fetchedSeats);
                } catch (err: any) {
                    console.error("Failed to fetch seats:", err);
                    setErrorFetchingSeats(err.message || "Không thể tải danh sách ghế.");
                }
            });
        } else {
            setErrorFetchingSeats("Không tìm thấy thông tin chuyến bay để tải ghế.");
        }
    }, [flightId]);

    // State cho hành khách
    const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

    // Dịch vụ cộng thêm
    const [selectedBaggages, setSelectedBaggages] = useState<{ [passengerId: number]: BaggagePackage | null }>({});
    const [selectedMeals, setSelectedMeals] = useState<{ [passengerId: number]: boolean }>({});

    const currentPassenger = passengers[currentPassengerIndex];

    const handleSelectSeat = (seatId: string) => {
        if (!currentPassenger) {
            console.warn('No current passenger selected');
            return;
        }

        const seatToSelect = seats.find(s => s.id === seatId);
        if (!seatToSelect) return;

        // Kiểm tra xem ghế này đã được người khác trong đoàn chọn chưa
        const isSelectedByOther = Object.values(selectedSeats).includes(seatId);
        const currentPassengerSeatId = selectedSeats[currentPassenger.id];

        if (isSelectedByOther && seatId !== currentPassengerSeatId) {
            Alert.alert("Ghế đã được chọn", "Ghế này đã được một hành khách khác trong đoàn của bạn chọn. Vui lòng chọn ghế khác.");
            return;
        }

        // Kiểm tra trạng thái ghế từ dữ liệu gốc (đã có người đặt từ trước)
        const originalSeat = originalSeats.find(s => s.id === seatId);
        if (originalSeat?.status === SeatStatus.OCCUPIED) {
            Alert.alert("Ghế đã có người đặt", "Ghế này không còn trống. Vui lòng chọn ghế khác.");
            return;
        }

        const currentSeatId = selectedSeats[currentPassenger.id];

        // Nếu người dùng nhấn lại vào ghế họ đang chọn -> Bỏ chọn ghế đó
        if (currentSeatId === seatId) {
            const { [currentPassenger.id]: _, ...rest } = selectedSeats;
            setSelectedSeats(rest);
            return;
        }

        // Nếu người dùng chọn một ghế mới:
        // Cập nhật lựa chọn cho hành khách hiện tại
        setSelectedSeats(prev => ({ ...prev, [currentPassenger.id]: seatId }));

        // Tự động chuyển sang hành khách tiếp theo nếu còn
        if (currentPassengerIndex < passengers.length - 1) {
            setCurrentPassengerIndex(currentPassengerIndex + 1);
        }
    };

    const handleContinue = () => {
        if (Object.keys(selectedSeats).length !== passengers.length) {
            Alert.alert("Thiếu thông tin", "Vui lòng chọn đủ ghế cho tất cả hành khách.");
            return;
        }

        // Chuyển đổi selectedSeats từ seatId sang seatNumber
        const selectedSeatsWithNumbers: { [passengerId: number]: string } = {};
        for (const passengerId in selectedSeats) {
            const seatId = selectedSeats[passengerId];
            const seat = originalSeats.find(s => s.id === seatId);
            if (seat) {
                selectedSeatsWithNumbers[passengerId] = seat.seatNumber;
            } else {
                console.warn(`Seat with ID ${seatId} not found for passenger ${passengerId}`);
            }
        }
        // Chuyển đổi selectedSeats từ seatId sang seatNumber
        // Điều hướng đến trang thanh toán (bước 3) và truyền dữ liệu
        router.navigate({
            pathname: '/(root)/(booking)/checkout',
            params: {
                ...params,
                selectedSeats: JSON.stringify(selectedSeatsWithNumbers), // Truyền seatNumber
                selectedBaggages: JSON.stringify(selectedBaggages),
                selectedMeals: JSON.stringify(selectedMeals),
                totalPrice: totalPrice.toString(), // Truyền tổng tiền
            }
        });
    };

    // Tính toán lại trạng thái của danh sách ghế để hiển thị trên UI
    const displayedSeats = useMemo(() => {
        const seatsSelectedByParty = Object.values(selectedSeats);
        return originalSeats.map(seat => {
            if (seatsSelectedByParty.includes(seat.id)) {
                // Nếu ghế được chọn bởi bất kỳ ai trong đoàn, coi như đã bị chiếm
                return { ...seat, status: SeatStatus.SELECTED };
            }
            // Giữ nguyên trạng thái gốc (AVAILABLE, OCCUPIED, ...)
            return seat;
        });
    }, [originalSeats, selectedSeats]);

    // Tính toán tổng tiền cho summary modal
    const totalPrice = useMemo(() => {
        let total = 0;
        if (departureFlightData?.ticketClass) {
            total += departureFlightData.ticketClass.finalPrice * passengers.length;
        }
        if (returnFlightData?.ticketClass) {
            total += returnFlightData.ticketClass.finalPrice * passengers.length;
        }
        passengers.forEach(p => {
            const seatId = selectedSeats[p.id];
            if (seatId) {
                const seat = originalSeats.find(s => s.id === seatId);
                if (seat && seat.type) total += getSeatAdditionalPrice(seat.type);
            }
            const baggage = selectedBaggages[p.id];
            if (baggage) total += baggage.price;
            const hasMeal = selectedMeals[p.id];
            if (hasMeal) total += 50000; // Giả sử 50,000 VND/suất
        });
        return total;
    }, [passengers, selectedSeats, selectedBaggages, selectedMeals, originalSeats, departureFlightData, returnFlightData]);

    const showContinueButton = Object.keys(selectedSeats).length === passengers.length;

    // --- Logic mới cho dịch vụ cộng thêm ---
    const handleBaggageChange = (pkg: BaggagePackage | null) => {
        if (!currentPassenger) return;
        setSelectedBaggages(prev => ({
            ...prev,
            [currentPassenger.id]: pkg,
        }));
    };

    const handleMealChange = (value: boolean) => {
        if (!currentPassenger) return;
        setSelectedMeals(prev => ({ ...prev, [currentPassenger.id]: value }));
    };


    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "left", "right"]}>
            <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 180 }}> {/* Tăng paddingBottom */}
                {/* Custom Header - Moved inside screen */}
                <View className="bg-white flex-row items-center p-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-blue-900 flex-1 text-center mr-8">Dịch vụ & Ghế ngồi</Text>
                </View>
                <BookingStepper currentStep={2} />
                <View className="p-4">
                    {/* Passenger Selector */}
                    <View className="mb-4">
                        <Text className="text-base font-bold text-blue-900 mb-2">Chọn ghế cho:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {passengers.map((p: any, index: number) => {
                                const selectedSeatId = selectedSeats[p.id];
                                const seatInfo = selectedSeatId ? originalSeats.find(s => s.id === selectedSeatId) : null; // Dùng originalSeats
                                const seatLabel = seatInfo ? `(${seatInfo.seatNumber})` : '';

                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => setCurrentPassengerIndex(index)}
                                        className={`px-4 py-2 rounded-full mr-2 border-2 ${currentPassengerIndex === index ? 'bg-blue-900 border-blue-900' : 'bg-white border-gray-300'}`}
                                    >
                                        <Text className={`${currentPassengerIndex === index ? 'text-white' : 'text-gray-700'} font-semibold`}>{p.lastName} {p.firstName} {seatLabel}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Toggle Seat Map Button */}
                    <TouchableOpacity onPress={() => setShowSeatMap(!showSeatMap)} className="flex-row items-center justify-center py-2 mb-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Text className="text-base font-bold text-blue-900 mr-2">{showSeatMap ? "Ẩn sơ đồ ghế" : "Hiện sơ đồ ghế"}</Text>
                        <Ionicons name={showSeatMap ? "chevron-up" : "chevron-down"} size={20} color="#1e3a8a" />
                    </TouchableOpacity>

                    {/* Seat Map */}
                    {showSeatMap && (
                        errorFetchingSeats ? (
                            <Text className="text-red-500 text-center my-8">{errorFetchingSeats}</Text>
                        ) : (
                            <SeatMap
                                seats={displayedSeats}
                                onSelectSeat={handleSelectSeat}
                                selectedSeatId={currentPassenger ? selectedSeats[currentPassenger.id] : undefined}
                            />
                        )
                    )}

                </View>

                {/* Services Section - Chỉ hiển thị khi ghế đã tải xong và không có lỗi */}
                {!errorFetchingSeats && (
                    <AdditionalServices
                        selectedBaggage={currentPassenger ? selectedBaggages[currentPassenger.id] : null}
                        onBaggageChange={handleBaggageChange}
                        selectedMeal={currentPassenger ? !!selectedMeals[currentPassenger.id] : false}
                        onMealChange={handleMealChange}
                    />
                )}
            </ScrollView>

            {/* Booking Summary Modal */}
            <BookingSummaryModal
                passengers={passengers}
                selectedSeats={selectedSeats}
                selectedBaggages={selectedBaggages}
                selectedMeals={selectedMeals}
                allSeats={originalSeats} // Pass originalSeats to get seat numbers
                currentPassengerIndex={currentPassengerIndex}
                onPassengerSelect={setCurrentPassengerIndex}
                totalPrice={totalPrice}
                onContinue={handleContinue}
                showContinueButton={showContinueButton}
            />
        </SafeAreaView>
    );

};

export default ServiceAndSeatSelection;
       