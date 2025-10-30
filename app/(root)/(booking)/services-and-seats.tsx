import { SeatStatus } from "@/app/types/booking";
import { BaggagePackage, Seat, SelectedFlight } from "@/app/types/types";
import AdditionalServices from "@/components/screens/book-flight/additional-services";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import BookingSummaryModal from "@/components/screens/book-flight/modals/booking-summary-modal";
import { useBooking } from "@/context/booking-context";
import SeatMap from "@/components/screens/book-flight/seat-map";
import { useLoading } from "@/context/loading-context";
import { fetchSeatsByFlightId } from "@/services/flight-service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Định nghĩa giá cho từng loại ghế ở FE
export const SEAT_TYPE_PRICES: { [key: string]: number } = {
    'STANDARD': 0,
    'EXTRA_LEGROOM': 50000,
    'EXIT_ROW': 100000,
    'FRONT_ROW': 75000,
    'ACCESSIBLE': 25000,
    'DEFAULT': 0, // Giá mặc định nếu seatType không xác định
};
const getSeatAdditionalPrice = (seatType: string | undefined): number => {
    if (!seatType) return SEAT_TYPE_PRICES['DEFAULT'];
    return SEAT_TYPE_PRICES[seatType] || SEAT_TYPE_PRICES['DEFAULT'];
};
const ServiceAndSeatSelection = () => {
    const { showLoading, hideLoading } = useLoading();
    const router = useRouter();
    const { bookingState, dispatch } = useBooking();
    const {
        passengers = [],
        departureFlight: departureFlightData,
        returnFlight: returnFlightData
    } = bookingState;

    const isRoundTrip = !!returnFlightData;
    const [selectionPhase, setSelectionPhase] = useState<'depart' | 'return'>('depart');

    const currentFlightData = selectionPhase === 'depart' ? departureFlightData : returnFlightData;
    const flightId = currentFlightData?.flight.id ? parseInt(currentFlightData.flight.id) : null;
    const selectedClassName = currentFlightData?.ticketClass.name;

    const [seats, setSeats] = useState<Seat[]>([]);
    const [departSeats, setDepartSeats] = useState<Seat[]>([]); // State để lưu ghế chuyến đi
    const [originalSeats, setOriginalSeats] = useState<Seat[]>([]); // Lưu trạng thái ghế ban đầu
    const [selectedSeats, setSelectedSeats] = useState<{ depart: { [passengerId: number]: string }, return: { [passengerId: number]: string } }>({ depart: {}, return: {} });
    const [errorFetchingSeats, setErrorFetchingSeats] = useState<string | null>(null);

    const [showSeatMap, setShowSeatMap] = useState(true); // State để ẩn/hiện sơ đồ ghế
    useEffect(() => {
        if (flightId) {
            showLoading(async () => {
                setErrorFetchingSeats(null);
                setSeats([]); // Clear previous seats
                setOriginalSeats([]);
                try {
                    const fetchedSeats = await fetchSeatsByFlightId(flightId);
                    // Gán giá cho ghế ở FE dựa trên seatType
                    const seatsWithPrice = fetchedSeats.map(seat => ({
                        ...seat,
                        price: getSeatAdditionalPrice(seat.seatType)
                    }));
                    setOriginalSeats(seatsWithPrice); // Lưu trạng thái ban đầu đã có giá
                    if (selectionPhase === 'depart') {
                        setDepartSeats(seatsWithPrice); // Lưu lại danh sách ghế của chuyến đi
                    }
                    setSeats(seatsWithPrice); // Use seats with price
                } catch (err: any) {
                    console.error("Failed to fetch seats:", err);
                    setErrorFetchingSeats(err.message || "Không thể tải danh sách ghế.");
                }
            });
        } else {
            setErrorFetchingSeats("Không tìm thấy thông tin chuyến bay để tải ghế.");
        }
    }, [flightId, selectionPhase]); // Re-run when phase changes

    // State cho hành khách
    const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

    // Dịch vụ cộng thêm
    const [selectedBaggages, setSelectedBaggages] = useState<{
        depart: { [passengerId: number]: BaggagePackage | null },
        return: { [passengerId: number]: BaggagePackage | null }
    }>({ depart: {}, return: {} });
    const [selectedMeals, setSelectedMeals] = useState<{
        depart: { [passengerId: number]: boolean },
        return: { [passengerId: number]: boolean }
    }>({ depart: {}, return: {} });

    const currentPassenger = passengers[currentPassengerIndex];

    const handleSelectSeat = (seatId: string) => {
        if (!currentPassenger) {
            console.warn('No current passenger selected');
            return;
        }

        const seatToSelect = seats.find(s => s.id === seatId);
        if (!seatToSelect) return;

        // Kiểm tra xem ghế này đã được người khác trong đoàn chọn chưa
        const isSelectedByOther = Object.values(selectedSeats[selectionPhase]).includes(seatId);
        const currentPassengerSeatId = selectedSeats[selectionPhase][currentPassenger.id];

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

        const currentSeatId = selectedSeats[selectionPhase][currentPassenger.id];

        // Nếu người dùng nhấn lại vào ghế họ đang chọn -> Bỏ chọn ghế đó
        if (currentSeatId === seatId) {
            setSelectedSeats(prev => {
                const { [currentPassenger.id]: _, ...restPhaseSeats } = prev[selectionPhase];
                return { ...prev, [selectionPhase]: restPhaseSeats };
            });
            return;
        }

        // Nếu người dùng chọn một ghế mới:
        // Cập nhật lựa chọn cho hành khách hiện tại
        setSelectedSeats(prev => ({
            ...prev,
            [selectionPhase]: {
                ...prev[selectionPhase],
                [currentPassenger.id]: seatId
            }
        }));

        // Tự động chuyển sang hành khách tiếp theo nếu còn
        // Chỉ tự động chuyển nếu chưa chọn ghế cho hành khách tiếp theo
        if (currentPassengerIndex < passengers.length - 1 && !selectedSeats[selectionPhase][passengers[currentPassengerIndex + 1].id]) {
            setCurrentPassengerIndex(currentPassengerIndex + 1);
        }
    };

    const handleContinue = () => { // Bỏ check bắt buộc chọn ghế
        // Nếu là chuyến khứ hồi và đang ở chặng đi -> chuyển sang chặng về
        if (isRoundTrip && selectionPhase === 'depart') {
            setSelectionPhase('return');
            setCurrentPassengerIndex(0); // Reset về hành khách đầu tiên
            return;
        }

        // Tạo một đối tượng mới chứa cả seatId và seatNumber để truyền đi
        const selectedSeatsWithDetails = {
            depart: {},
            return: {}
        };

        (['depart', 'return'] as const).forEach(phase => {
            for (const passengerId in selectedSeats[phase]) {
                const seatId = selectedSeats[phase][passengerId];
                // Sử dụng departSeats cho chuyến đi và seats (đang là của chuyến về) cho chuyến về
                const seatList = (phase === 'depart' ? departSeats : seats);
                const seat = seatList.find(s => s.id === seatId);
                if (seat) {
                    selectedSeatsWithDetails[phase][passengerId] = { id: seat.id, number: seat.seatNumber };
                }
            }
        });

        // Cập nhật state trong context
        dispatch({
            type: 'UPDATE_STATE',
            payload: {
                selectedSeats: selectedSeatsWithDetails,
                selectedBaggages: selectedBaggages,
                selectedMeals: selectedMeals,
                totalPrice: totalPrice,
            }
        });
        // Điều hướng đến trang thanh toán (bước 3) và truyền dữ liệu
        router.navigate('/(root)/(booking)/checkout');
    };

    // Tính toán lại trạng thái của danh sách ghế để hiển thị trên UI
    const displayedSeats = useMemo(() => {
        const seatsSelectedByParty = Object.values(selectedSeats[selectionPhase]);
        return originalSeats.map((seat) => {
            if (seat.className !== selectedClassName) {
                return { ...seat, status: SeatStatus.DISABLED };
            }
            if (seatsSelectedByParty.includes(seat.id)) {
                return { ...seat, status: SeatStatus.SELECTED };
            }
            return seat;
        });
    }, [originalSeats, selectedSeats, selectionPhase, selectedClassName]);

    // Tính toán tổng tiền cho summary modal
    const totalPrice = useMemo(() => {
        let total = 0;
        if (departureFlightData?.ticketClass) {
            total += departureFlightData.ticketClass.finalPrice * passengers.length;
        }
        if (returnFlightData?.ticketClass) {
            total += returnFlightData.ticketClass.finalPrice * passengers.length;
        }

        (['depart', 'return'] as const).forEach(phase => {
            passengers.forEach(p => {
                // Seat price
                const seatId = selectedSeats[phase][p.id];
                if (seatId) {
                    // Lấy đúng danh sách ghế cho từng chặng
                    const seatList = phase === 'depart' ? departSeats : seats;
                    const seat = seatList.find(s => s.id === seatId);
                    if (seat) total += seat.price;
                }
                // Baggage price
                const baggage = selectedBaggages[phase][p.id];
                if (baggage) total += baggage.price;
                // Meal price
                const hasMeal = selectedMeals[phase][p.id];
                if (hasMeal) total += 50000; // Giả sử 50,000 VND/suất
            });
        });

        return total;
    }, [passengers, selectedSeats, selectedBaggages, selectedMeals, seats, departSeats, departureFlightData, returnFlightData]);

    const showContinueButton = true; // Luôn cho phép tiếp tục, bạn có thể thêm logic nếu cần

    // --- Logic mới cho dịch vụ cộng thêm ---
    const handleBaggageChange = (pkg: BaggagePackage | null) => {
        if (!currentPassenger) return;
        setSelectedBaggages(prev => ({
            ...prev,
            [selectionPhase]: {
                ...prev[selectionPhase],
                [currentPassenger.id]: pkg
            }
        }));
    };

    const handleMealChange = (value: boolean) => {
        if (!currentPassenger) return;
        setSelectedMeals(prev => ({
            ...prev,
            [selectionPhase]: {
                ...prev[selectionPhase],
                [currentPassenger.id]: value
            }
        }));
    };


    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "left", "right"]}>
            <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 180 }}>
                {/* Custom Header - Moved inside screen */}
                <View className="bg-white flex-row items-center p-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center mr-8">
                        <Text className="text-lg font-bold text-blue-900">Dịch vụ & Ghế ngồi</Text>
                        {isRoundTrip && (
                            <Text className="text-sm font-semibold text-gray-500">
                                {selectionPhase === 'depart' ? 'Chuyến đi' : 'Chuyến về'}
                            </Text>
                        )}
                    </View>
                </View>
                <BookingStepper currentStep={2} />
                <View className="p-4">
                    {/* Passenger Selector */}
                    <View className="mb-4">
                        <Text className="text-base font-bold text-blue-900 mb-2">Chọn dịch vụ & ghế cho:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {passengers.map((p: any, index: number) => {
                                const selectedSeatId = selectedSeats[selectionPhase][p.id];
                                const seatInfo = selectedSeatId ? seats.find(s => s.id === selectedSeatId) : null;
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
                                selectedSeatId={currentPassenger ? selectedSeats[selectionPhase][currentPassenger.id] : undefined}
                            />
                        )
                    )}

                </View>

                {/* Services Section - Chỉ hiển thị khi ghế đã tải xong và không có lỗi */}
                {!errorFetchingSeats && (
                    <AdditionalServices
                        selectedBaggage={currentPassenger ? selectedBaggages[selectionPhase][currentPassenger.id] : null}
                        onBaggageChange={handleBaggageChange}
                        selectedMeal={currentPassenger ? !!selectedMeals[selectionPhase][currentPassenger.id] : false}
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
                departSeats={departSeats} // Truyền danh sách ghế chuyến đi
                returnSeats={seats} // Ghế hiện tại là của chuyến về
                currentPassengerIndex={currentPassengerIndex}
                onPassengerSelect={setCurrentPassengerIndex}
                totalPrice={totalPrice}
                onContinue={handleContinue}
                showContinueButton={showContinueButton}
                isRoundTrip={isRoundTrip}
                selectionPhase={selectionPhase}
            />
        </SafeAreaView>
    );
};

export default ServiceAndSeatSelection;
