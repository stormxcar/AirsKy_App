import { BaggagePackage, Passenger, SelectedFlight } from "@/app/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BookingInfo = () => {
    const params = useLocalSearchParams();

    // --- Lấy dữ liệu từ các bước trước ---
    const status = params.status as 'success' | 'failure';
    const bookingCode = params.bookingCode as string;
    const departureFlight: SelectedFlight | null = useMemo(() => params.departureFlight ? JSON.parse(params.departureFlight as string) : null, [params.departureFlight]);
    const returnFlight: SelectedFlight | null = useMemo(() => params.returnFlight ? JSON.parse(params.returnFlight as string) : null, [params.returnFlight]);
    const passengers: Passenger[] = useMemo(() => params.passengers ? JSON.parse(params.passengers as string) : [], [params.passengers]);
    const selectedSeats: { [passengerId: number]: string } = useMemo(() => params.selectedSeats ? JSON.parse(params.selectedSeats as string) : {}, [params.selectedSeats]);
    const selectedMeal: boolean = useMemo(() => params.selectedMeal === 'true', [params.selectedMeal]);
    const selectedBaggage: BaggagePackage | null = useMemo(() => params.selectedBaggage ? JSON.parse(params.selectedBaggage as string) : null, [params.selectedBaggage]);
    const totalPrice = params.totalPrice as string;

    const isSuccess = status === 'success';

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
            <ScrollView className="flex-1">
                <View className="p-4 items-center">
                    {/* --- Trạng thái đặt vé --- */}
                    <View className="items-center my-6">
                        <View className={`w-24 h-24 rounded-full items-center justify-center ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Ionicons name={isSuccess ? "checkmark-circle" : "close-circle"} size={80} color={isSuccess ? "#16a34a" : "#dc2626"} />
                        </View>
                        <Text className={`text-2xl font-bold mt-4 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                            {isSuccess ? "Đặt vé thành công!" : "Đặt vé thất bại"}
                        </Text>
                        <Text className="text-gray-600 mt-1 text-center">
                            {isSuccess ? "Cảm ơn bạn đã sử dụng dịch vụ của AirsKy." : "Đã có lỗi xảy ra. Vui lòng thử lại."}
                        </Text>
                    </View>

                    {isSuccess && (
                        <>
                            {/* --- Thông tin đặt vé --- */}
                            <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
                                <Text className="text-lg font-bold text-blue-900 mb-3 border-b border-gray-200 pb-2">Thông tin đặt vé</Text>

                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-base text-gray-600">Mã đặt chỗ:</Text>
                                    <Text className="text-base font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">{bookingCode}</Text>
                                </View>

                                {departureFlight && (
                                    <View className="mb-2">
                                        <Text className="font-semibold text-gray-700">Chuyến đi:</Text>
                                        <Text className="text-base text-gray-600">
                                            {departureFlight.flight?.departure.code} → {departureFlight.flight?.arrival.code}
                                        </Text>
                                    </View>
                                )}
                                {returnFlight && (
                                    <View className="mb-2">
                                        <Text className="font-semibold text-gray-700">Chuyến về:</Text>
                                        <Text className="text-base text-gray-600">
                                            {returnFlight.flight?.departure.code} → {returnFlight.flight?.arrival.code}
                                        </Text>
                                    </View>
                                )}
                                <View className="mb-2">
                                    <Text className="font-semibold text-gray-700">Hành khách:</Text>
                                    <Text className="text-base text-gray-600">{passengers.map(p => `${p.lastName} ${p.firstName}`).join(', ')}</Text>
                                </View>
                                <View className="mb-2">
                                    <Text className="font-semibold text-gray-700">Ghế đã chọn:</Text>
                                    <Text className="text-base text-gray-600">{Object.values(selectedSeats).join(', ')}</Text>
                                </View>
                                <View className="mb-2">
                                    <Text className="font-semibold text-gray-700">Dịch vụ thêm:</Text>
                                    {selectedBaggage && (
                                        <Text className="text-base text-gray-600">
                                            - Hành lý: {selectedBaggage.label}
                                        </Text>
                                    )}
                                    {selectedMeal && (
                                        <Text className="text-base text-gray-600">- Suất ăn trên máy bay</Text>
                                    )}
                                    {!selectedBaggage && !selectedMeal && <Text className="text-base text-gray-600">Không có</Text>}
                                </View>
                                <View className="border-t border-gray-200 mt-3 pt-3 flex-row justify-between items-center">
                                    <Text className="text-lg font-bold text-gray-800">Tổng cộng đã thanh toán:</Text>
                                    <Text className="text-xl font-bold text-red-600">
                                        {parseInt(totalPrice).toLocaleString('vi-VN')} ₫
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* --- Nút hành động --- */}
            <View className="p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                    onPress={() => router.replace('/(root)/(tabs)/my-trips')}
                    className="bg-blue-900 py-3 rounded-full shadow-md"
                >
                    <Text className="text-white text-center font-bold text-lg">Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default BookingInfo;

