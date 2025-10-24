import { BaggagePackage, Passenger, SelectedFlight } from "@/app/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Checkout = () => {
    const params = useLocalSearchParams();

    // --- Lấy dữ liệu từ các bước trước ---
    const departureFlight: SelectedFlight | null = useMemo(() => params.departureFlight ? JSON.parse(params.departureFlight as string) : null, [params.departureFlight]);
    const returnFlight: SelectedFlight | null = useMemo(() => params.returnFlight ? JSON.parse(params.returnFlight as string) : null, [params.returnFlight]);
    const passengers: Passenger[] = useMemo(() => params.passengers ? JSON.parse(params.passengers as string) : [], [params.passengers]);
    const selectedSeats: { [passengerId: number]: string } = useMemo(() => params.selectedSeats ? JSON.parse(params.selectedSeats as string) : {}, [params.selectedSeats]);
    const selectedMeal: boolean = useMemo(() => params.selectedMeal === 'true', [params.selectedMeal]);
    const selectedBaggage: BaggagePackage | null = useMemo(() => params.selectedBaggage ? JSON.parse(params.selectedBaggage as string) : null, [params.selectedBaggage]);

    // --- State cho trang thanh toán ---
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'qr' | null>(null);
    const [showQRCode, setShowQRCode] = useState<boolean>(false);

    // --- Tính toán tổng chi phí ---
    const totalPrice = useMemo(() => {
        let total = 0;
        if (departureFlight?.ticketClass) {
            total += departureFlight.ticketClass.finalPrice * passengers.length;
        }
        if (returnFlight?.ticketClass) {
            total += returnFlight.ticketClass.finalPrice * passengers.length;
        }
        // Thêm chi phí cho hành lý (giả sử mỗi hành khách đều mua gói này)
        if (selectedBaggage) {
            total += selectedBaggage.price * passengers.length;
        }
        // Thêm chi phí suất ăn (giả sử 50,000 VND/suất)
        if (selectedMeal) {
            total += 50000 * passengers.length;
        }

        return total;
    }, [departureFlight, returnFlight, passengers, selectedBaggage, selectedMeal]);

    const handleProcessPayment = () => {
        if (paymentMethod === 'qr' && !showQRCode) {
            setShowQRCode(true);
            console.log('Hiển thị mã QR để thanh toán.');
            return;
        }

        // --- Bắt đầu mô phỏng thanh toán và điều hướng ---
        // Trong ứng dụng thực tế, bạn sẽ gọi API backend để tạo booking
        // và nhận kết quả từ cổng thanh toán (PayPal SDK, webhook từ SEpay).
        console.log("Đang xử lý thanh toán...");

        // Giả sử thanh toán thành công
        const isPaymentSuccessful = true;

        // Điều hướng đến trang kết quả
        // Sử dụng `replace` để người dùng không thể quay lại trang thanh toán
        router.replace({
            pathname: '/(root)/(booking)/booking-result',
            params: {
                ...params,
                status: isPaymentSuccessful ? 'success' : 'failure',
                paymentMethod: paymentMethod,
                totalPrice: totalPrice.toString(),
            }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-blue-900 " edges={["top"]}>
            {/* --- Header --- */}
            <View className="bg-white flex-row items-center p-4 border-b border-gray-200 rounded-t-[40px]">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                </TouchableOpacity>
                <Text className="text-lg flex-1 text-center mr-12 font-bold text-blue-900 ml-4">Thanh toán</Text>
            </View>

            <BookingStepper currentStep={3} />

            <ScrollView className="flex-1 bg-white">
                <View className="p-4">
                    {/* --- Tóm tắt đơn hàng --- */}
                    <View className="bg-white p-4 rounded-xl mb-4 border border-gray-200">
                        <Text className="text-lg font-bold text-blue-900 mb-3 border-b border-gray-200 pb-2">Tóm tắt đơn hàng</Text>
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
                                    - Hành lý: {selectedBaggage.label} ({selectedBaggage.price.toLocaleString('vi-VN')} ₫/khách)
                                </Text>
                            )}
                            {selectedMeal && (
                                <Text className="text-base text-gray-600">- Suất ăn trên máy bay</Text>
                            )}
                            {!selectedBaggage && !selectedMeal && <Text className="text-base text-gray-600">Không có</Text>}
                        </View>
                        <View className="border-t border-gray-200 mt-3 pt-3 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-gray-800">Tổng cộng:</Text>
                            <Text className="text-xl font-bold text-blue-900">
                                {totalPrice.toLocaleString('vi-VN')} ₫
                            </Text>
                        </View>
                    </View>

                    {/* --- Hiển thị QR Code hoặc lựa chọn thanh toán --- */}
                    {showQRCode ? (
                        <View className="bg-white p-4 rounded-xl items-center border border-gray-200">
                            <Text className="text-lg font-bold text-blue-900 mb-2">Quét mã QR để thanh toán</Text>
                            <Text className="text-center text-gray-600 mb-4">Sử dụng ứng dụng ngân hàng hoặc ví điện tử của bạn để quét mã.</Text>
                            <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://sepay.vn/don-hang/${params.bookingCode}` }} // Thay bằng mã QR thật từ API
                                className="w-56 h-56 border border-gray-300 p-2 rounded-lg"
                            />
                            <Text className="text-lg font-semibold text-gray-800 mt-4">
                                Số tiền: <Text className="font-bold text-red-600">{totalPrice.toLocaleString('vi-VN')} ₫</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowQRCode(false)}
                                className="mt-4 border border-blue-900 rounded-full py-2 px-6"
                            >
                                <Text className="text-blue-900 font-bold">Chọn lại phương thức khác</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="bg-white p-4 rounded-xl border border-gray-200">
                            <Text className="text-lg font-bold text-blue-900 mb-3 border-b border-gray-200 pb-2">Chọn phương thức thanh toán</Text>
                            {/* PayPal */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('paypal')}
                                className={`flex-row items-center p-4 border-2 rounded-lg mb-3 ${paymentMethod === 'paypal' ? 'border-blue-900 bg-blue-50' : 'border-gray-300'}`}
                            >
                                <Image
                                    source={{ uri: "https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" }}
                                    className="w-20 h-8"
                                    resizeMode="contain"
                                />
                                <Text className="text-base font-semibold text-gray-800 ml-4">Thanh toán bằng PayPal</Text>
                                {paymentMethod === 'paypal' && <Ionicons name="checkmark-circle" size={24} color="#1e3a8a" style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>

                            {/* SEpay QR */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('qr')}
                                className={`flex-row items-center p-4 border-2 rounded-lg ${paymentMethod === 'qr' ? 'border-blue-900 bg-blue-50' : 'border-gray-300'}`}
                            >
                                <Image
                                    source={{ uri: "https://sepay.vn/assets/img/logo_sepay_white.png" }}
                                    className="w-20 h-8 bg-blue-900 rounded"
                                    resizeMode="contain"
                                />
                                <Text className="text-base font-semibold text-gray-800 ml-4">QR Ngân hàng (SEpay)</Text>
                                {paymentMethod === 'qr' && <Ionicons name="checkmark-circle" size={24} color="#1e3a8a" style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* --- Nút Thanh toán --- */}
            {!showQRCode && (
                <View className="p-4 bg-white border-t border-gray-200">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-lg font-bold text-gray-800">Tổng cộng:</Text>
                        <Text className="text-xl font-bold text-red-600">{totalPrice.toLocaleString('vi-VN')} ₫</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleProcessPayment}
                        disabled={!paymentMethod}
                        className={`py-3 rounded-full shadow-md ${!paymentMethod ? 'bg-gray-400' : 'bg-blue-900'}`}
                    >
                        <Text className="text-white text-center font-bold text-lg">Tiến hành thanh toán</Text>
                    </TouchableOpacity>
                </View>
            )}
            {showQRCode && (
                <View className="p-4 bg-white border-t border-gray-200">
                    <TouchableOpacity
                        onPress={handleProcessPayment}
                        className="bg-green-600 py-3 rounded-full shadow-md"
                    >
                        <Text className="text-white text-center font-bold text-lg">Xác nhận đã thanh toán</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

export default Checkout;