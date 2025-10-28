import { BaggagePackage, Passenger, SelectedFlight } from "@/app/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BookingResult = () => {
    const params = useLocalSearchParams();
    const router = useRouter();

    // --- Lấy dữ liệu từ các bước trước ---
    const status = params.status as 'success' | 'failure' | 'pending';
    const bookingCode = params.bookingCode as string;
    // TODO: Lấy thông tin chi tiết booking từ API bằng bookingCode thay vì truyền qua params
    // const departureFlight: SelectedFlight | null = useMemo(() => params.departureFlight ? JSON.parse(params.departureFlight as string) : null, [params.departureFlight]);
    // const returnFlight: SelectedFlight | null = useMemo(() => params.returnFlight ? JSON.parse(params.returnFlight as string) : null, [params.returnFlight]);
    // const passengers: Passenger[] = useMemo(() => params.passengers ? JSON.parse(params.passengers as string) : [], [params.passengers]);
    // const selectedSeats: { [passengerId: number]: {id: string, number: string} } = useMemo(() => params.selectedSeats ? JSON.parse(params.selectedSeats as string) : {}, [params.selectedSeats]);
    // const selectedBaggages: { [passengerId: number]: BaggagePackage | null } = useMemo(() => params.selectedBaggages ? JSON.parse(params.selectedBaggages as string) : {}, [params.selectedBaggages]);
    // const totalPrice = params.totalPrice as string;
    const isSuccess = status === 'success';

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
            <ScrollView className="flex-1">
                <View className="p-4 items-center">
                    {/* --- Trạng thái đặt vé --- */}
                    <View className="items-center my-6">
                        <View className={`w-24 h-24 rounded-full items-center justify-center ${status === 'success' ? 'bg-green-100' : status === 'failure' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                            <Ionicons 
                                name={status === 'success' ? "checkmark-circle" : status === 'failure' ? "close-circle" : "hourglass"} 
                                size={80} 
                                color={status === 'success' ? "#16a34a" : status === 'failure' ? "#dc2626" : "#f59e0b"} 
                            />
                        </View>
                        <Text className={`text-2xl font-bold mt-4 ${status === 'success' ? 'text-green-700' : status === 'failure' ? 'text-red-700' : 'text-yellow-600'}`}>
                            {status === 'success' ? "Đặt vé thành công!" : status === 'failure' ? "Đặt vé thất bại" : "Chờ thanh toán"}
                        </Text>
                        <Text className="text-gray-600 mt-1 text-center">
                            {status === 'success' ? "Cảm ơn bạn đã sử dụng dịch vụ của AirsKy." 
                             : status === 'failure' ? "Đã có lỗi xảy ra. Vui lòng thử lại." 
                             : "Vui lòng hoàn tất thanh toán trong trình duyệt và quay lại ứng dụng."}
                        </Text>
                    </View>

                    {/* Chỉ hiển thị thông tin chi tiết nếu có bookingCode */}
                    {bookingCode && (
                        <>
                            {/* --- Thông tin đặt vé --- */}
                            <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
                                <Text className="text-lg font-bold text-blue-900 mb-3 border-b border-gray-200 pb-2">Thông tin đặt vé</Text>

                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-base text-gray-600">Mã đặt chỗ:</Text>
                                    <Text className="text-base font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">{bookingCode}</Text>
                                </View>

                                {isSuccess && (
                                    <Text className="text-gray-600 mt-2 text-center">
                                        Thông tin chi tiết về chuyến bay đã được gửi đến email của bạn.
                                        Bạn cũng có thể xem lại trong mục "Chuyến đi của tôi".
                                    </Text>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* --- Nút hành động --- */}
            <View className="p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                    onPress={() => router.replace('/(root)/(tabs)/home')}
                    className="bg-blue-900 py-3 rounded-full shadow-md"
                >
                    <Text className="text-white text-center font-bold text-lg">Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default BookingResult;
