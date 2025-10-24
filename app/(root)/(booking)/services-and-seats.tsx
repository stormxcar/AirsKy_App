import { BaggagePackage, Seat } from "@/app/types";
import AdditionalServices from "@/components/screens/book-flight/additional-services";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import SeatMap from "@/components/screens/book-flight/seat-map";
import { MOCK_SEATS } from "@/constants/data";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ServiceAndSeatSelection = () => {
    const params = useLocalSearchParams();
    const passengers = useMemo(() => params.passengers ? JSON.parse(params.passengers as string) : [], [params.passengers]);

    const [seats, setSeats] = useState<Seat[]>(MOCK_SEATS);
    const [selectedSeats, setSelectedSeats] = useState<{ [passengerId: number]: string }>({});
    const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

    // Dịch vụ cộng thêm
    const [selectedBaggage, setSelectedBaggage] = useState<BaggagePackage | null>(null);
    const [selectedMeal, setSelectedMeal] = useState(false); // Áp dụng cho tất cả hành khách

    const currentPassenger = passengers[currentPassengerIndex];

    const handleSelectSeat = (seatId: string) => {
        const seat = seats.find(s => s.id === seatId);
        if (!seat || seat.status === 'occupied') {
            Alert.alert("Ghế đã có người", "Vui lòng chọn một ghế khác.");
            return;
        }

        // Bỏ chọn ghế hiện tại của hành khách nếu có
        const currentSeatId = selectedSeats[currentPassenger.id];
        if (currentSeatId) {
            setSeats(prev => prev.map(s => s.id === currentSeatId ? { ...s, status: s.id.includes('12') || s.id.includes('14') ? 'exit' : 'available' } : s));
        }

        // Nếu ghế được chọn lại là ghế đang chọn, thì bỏ chọn
        if (currentSeatId === seatId) {
            const { [currentPassenger.id]: _, ...rest } = selectedSeats;
            setSelectedSeats(rest);
            return;
        }

        // Cập nhật ghế mới
        setSelectedSeats(prev => ({ ...prev, [currentPassenger.id]: seatId }));
        setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: 'selected' } : s));

        // Tự động chuyển sang hành khách tiếp theo nếu còn
        if (currentPassengerIndex < passengers.length - 1) {
            setCurrentPassengerIndex(currentPassengerIndex + 1);
        }
    };

    const handleContinue = () => {
        // if (Object.keys(selectedSeats).length !== passengers.length) {
        //     Alert.alert("Thiếu thông tin", "Vui lòng chọn đủ ghế cho tất cả hành khách.");
        //     return;
        // }
        
        // Điều hướng đến trang thanh toán (bước 3) và truyền dữ liệu
        router.navigate({
            pathname: '/(root)/(booking)/checkout',
            params: { 
                ...params, 
                selectedSeats: JSON.stringify(selectedSeats),
                selectedBaggage: selectedBaggage ? JSON.stringify(selectedBaggage) : '',
                selectedMeal: selectedMeal.toString(),
                // Thêm mã booking giả lập, bạn sẽ thay bằng mã thật từ API
                bookingCode: `BKG${Math.floor(Math.random() * 90000) + 10000}`
            }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
            {/* Custom Header */}
            <View className="bg-white flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-blue-900 ml-4">Dịch vụ & Ghế ngồi</Text>
            </View>

            <BookingStepper currentStep={2} />

            <ScrollView>
                <View className="p-4">
                    {/* Passenger Selector */}
                    <View className="mb-4">
                        <Text className="text-base font-bold text-blue-900 mb-2">Chọn ghế cho:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {passengers.map((p: any, index: number) => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => setCurrentPassengerIndex(index)}
                                    className={`px-4 py-2 rounded-full mr-2 border-2 ${currentPassengerIndex === index ? 'bg-blue-900 border-blue-900' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={`${currentPassengerIndex === index ? 'text-white' : 'text-gray-700'} font-semibold`}>
                                        {p.lastName} {p.firstName} {selectedSeats[p.id] ? `(${selectedSeats[p.id]})` : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Seat Map */}
                    <SeatMap
                        seats={seats}
                        onSelectSeat={handleSelectSeat}
                        selectedSeatId={selectedSeats[currentPassenger?.id]}
                    />

                    {/* Services Section */}
                    <AdditionalServices
                        selectedBaggage={selectedBaggage}
                        onBaggageChange={setSelectedBaggage}
                        selectedMeal={selectedMeal}
                        onMealChange={setSelectedMeal}
                    />
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View className="p-4 bg-white border-t border-gray-200">
                <TouchableOpacity onPress={handleContinue} className="bg-blue-900 py-3 rounded-full shadow-md">
                    <Text className="text-white text-center font-bold text-lg">Tiếp tục</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ServiceAndSeatSelection;