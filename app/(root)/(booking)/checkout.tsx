import { BaggagePackageEnum, BookingRequest, PassengerSeatRequest, PaymentMethod } from "@/app/types/booking";
import { BaggagePackage, Passenger, SelectedFlight } from "@/app/types/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { createBooking } from "@/services/booking-service";
import { Ionicons } from "@expo/vector-icons"; // Import Linking
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Checkout = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    // --- Lấy dữ liệu từ các bước trước ---
    const departureFlight: SelectedFlight | null = useMemo(() => params.departureFlight ? JSON.parse(params.departureFlight as string) : null, [params.departureFlight]);
    const returnFlight: SelectedFlight | null = useMemo(() => params.returnFlight ? JSON.parse(params.returnFlight as string) : null, [params.returnFlight]);
    const passengers: Passenger[] = useMemo(() => params.passengers ? JSON.parse(params.passengers as string) : [], [params.passengers]);
    const selectedSeats: { [passengerId: number]: { id: string, number: string } } = useMemo(() => params.selectedSeats ? JSON.parse(params.selectedSeats as string) : {}, [params.selectedSeats]);
    const selectedMeals: { [passengerId: number]: boolean } = useMemo(() => params.selectedMeals ? JSON.parse(params.selectedMeals as string) : {}, [params.selectedMeals]);
    const selectedBaggages: { [passengerId: number]: BaggagePackage | null } = useMemo(() => params.selectedBaggages ? JSON.parse(params.selectedBaggages as string) : {}, [params.selectedBaggages]);
    const totalPriceFromParams = useMemo(() => parseFloat(params.totalPrice as string || '0'), [params.totalPrice]);
    const contactName = params.contactName as string;
    const contactEmail = params.contactEmail as string;

    // --- State cho trang thanh toán ---
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

    // --- Tính toán tổng chi phí ---
    const totalPrice = useMemo(() => {
        return totalPriceFromParams; // Sử dụng tổng tiền đã được tính và truyền từ màn hình trước.
    });

    const handleProcessPayment = async () => {
        if (!paymentMethod) {
            Alert.alert("Vui lòng chọn phương thức thanh toán.");
            return;
        }

        showLoading(async () => {
            try {
                // 1. Xây dựng đối tượng BookingRequest
                const passengersForRequest: PassengerSeatRequest[] = passengers.map(p => {
                    const baggage = selectedBaggages[p.id];
                    const seatId = selectedSeats[p.id]?.id;

                    return {
                        firstName: p.firstName,
                        lastName: p.lastName,
                        dateOfBirth: p.dateOfBirth,
                        passportNumber: p.passportNumber,
                        type: p.type.toUpperCase() as 'ADULT' | 'CHILD' | 'INFANT',
                        gender: p.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
                        baggagePackage: baggage && baggage.key !== 'NONE' ? (baggage.key as BaggagePackageEnum) : undefined,
                        seatAssignments: seatId ? [{ seatId: seatId, segmentOrder: 1 }] : [], // Giả sử chỉ có 1 chặng
                    };
                });

                const bookingData: BookingRequest = {
                    userId: user?.id,
                    contactName: contactName,
                    contactEmail: contactEmail,
                    totalAmount: totalPrice,
                    clientType: "MOBILE", // Chỉ định client là mobile
                    paymentMethod: paymentMethod,
                    passengers: passengersForRequest,
                    flightSegments: [
                        {
                            flightId: departureFlight!.flight.id,
                            classId: departureFlight!.ticketClass.id,
                            segmentOrder: 1,
                        },
                        // Thêm chặng về nếu có
                    ],
                    // Thêm dealCode, pointsToRedeem nếu có
                };

                // 2. Gọi API để tạo booking
                const createdBooking = await createBooking(bookingData);
                console.log("Booking created successfully:", createdBooking.bookingCode);

                // 3. Lấy checkoutUrl từ response của createBooking
                const checkoutUrl = createdBooking.payment?.checkoutUrl;

                if (!checkoutUrl) {
                    throw new Error("Không nhận được đường dẫn thanh toán từ máy chủ.");
                }

                // 4. Điều hướng đến màn hình phù hợp dựa trên phương thức thanh toán
                if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
                    // Điều hướng đến màn hình QR code
                    router.replace({
                        pathname: '/(root)/(booking)/payment-qr',
                        params: { url: checkoutUrl, bookingCode: createdBooking.bookingCode }
                    });
                } else {
                    // Điều hướng đến WebView cho PayPal
                    await Linking.openURL(checkoutUrl);
                    // Sau khi mở trình duyệt, điều hướng người dùng đến trang kết quả tạm thời hoặc hướng dẫn kiểm tra email
                    router.replace({ pathname: '/(root)/(booking)/booking-result', params: { status: 'pending', bookingCode: createdBooking.bookingCode } });
                }

            } catch (error: any) {
                console.error("Error processing payment:", error);
                Alert.alert("Lỗi", error.message || "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.");
            }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "left", "right"]}>
            <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* --- Header --- */}
                <View className="bg-white flex-row items-center p-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                    </TouchableOpacity>
                    <Text className="text-lg flex-1 text-center mr-12 font-bold text-blue-900 ml-4">Thanh toán</Text>
                </View>

                <BookingStepper currentStep={3} />
                <View className="p-4">
                    {/* --- Tóm tắt đơn hàng --- */}
                    <View className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm">
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
                        {contactName && (
                            <View className="mb-2">
                                <Text className="font-semibold text-gray-700">Người liên hệ:</Text>
                                <Text className="text-base text-gray-600">{contactName} ({contactEmail})</Text>
                            </View>
                        )}
                        <View className="mb-2">
                            <Text className="font-semibold text-gray-700">Hành khách:</Text>
                            <Text className="text-base text-gray-600">{passengers.map(p => `${p.lastName} ${p.firstName}`).join(', ')}</Text>
                        </View>
                        <View className="mb-2">
                            <Text className="font-semibold text-gray-700">Dịch vụ thêm:</Text>
                            {Object.entries(selectedBaggages).map(([passengerId, baggage]) => {
                                if (!baggage) return null;
                                const passenger = passengers.find(p => p.id.toString() === passengerId);
                                return (
                                    <Text key={passengerId} className="text-base text-gray-600">
                                        - Hành lý ({passenger?.lastName}): {baggage.label} ({baggage.price.toLocaleString('vi-VN')} ₫)
                                    </Text>
                                );
                            })}
                            {Object.values(selectedMeals).filter(v => v).length > 0 && (
                                <Text className="text-base text-gray-600">
                                    - Suất ăn: {Object.values(selectedMeals).filter(v => v).length} suất
                                </Text>
                            )}
                            {Object.keys(selectedBaggages).length === 0 && Object.keys(selectedMeals).length === 0 && <Text className="text-base text-gray-600">Không có</Text>}
                        </View>
                        <View className="mb-2">
                            <Text className="font-semibold text-gray-700">Ghế đã chọn:</Text>
                            {Object.entries(selectedSeats).map(([passengerId, seatInfo]) => {
                                const passenger = passengers.find(p => p.id.toString() === passengerId);
                                return (
                                    <Text key={passengerId} className="text-base text-gray-600">
                                        - Ghế ({passenger?.lastName}): {seatInfo.number}
                                    </Text>
                                );
                            })}
                            {Object.keys(selectedSeats).length === 0 && (
                                <Text className="text-base text-gray-600">Chưa chọn ghế nào</Text>
                            )}
                        </View>
                        <View className="border-t border-gray-200 mt-3 pt-3 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-gray-800">Tổng cộng:</Text>
                            <Text className="text-xl font-bold text-blue-900">
                                {totalPrice.toLocaleString('vi-VN')} ₫
                            </Text>
                        </View>
                    </View>

                    {/* --- Hiển thị QR Code hoặc lựa chọn thanh toán --- */}
                    <View className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <Text className="text-lg font-bold text-blue-900 mb-3 border-b border-gray-200 pb-2">Chọn phương thức thanh toán</Text>
                        {/* PayPal */}
                        <TouchableOpacity
                            onPress={() => setPaymentMethod(PaymentMethod.PAYPAL)}
                            className={`flex-row items-center p-4 border-2 rounded-lg mb-3 ${paymentMethod === PaymentMethod.PAYPAL ? 'border-blue-900 bg-blue-50' : 'border-gray-300'}`}
                        >
                            <Image
                                source={{ uri: "https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" }}
                                className="w-20 h-8"
                                resizeMode="contain"
                            />
                            <Text className="text-base font-semibold text-gray-800 ml-4">Thanh toán bằng PayPal</Text>
                            {paymentMethod === PaymentMethod.PAYPAL && <Ionicons name="checkmark-circle" size={24} color="#1e3a8a" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>

                        {/* SEpay QR */}
                        <TouchableOpacity
                            onPress={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                            className={`flex-row items-center p-4 border-2 rounded-lg ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'border-blue-900 bg-blue-50' : 'border-gray-300'}`}
                        >
                            <Image
                                source={{ uri: "https://sepay.vn/assets/img/logo_sepay_white.png" }}
                                className="w-20 h-8 bg-blue-900 rounded"
                                resizeMode="contain"
                            />
                            <Text className="text-base font-semibold text-gray-800 ml-4">QR Ngân hàng (SEpay)</Text>
                            {paymentMethod === PaymentMethod.BANK_TRANSFER && <Ionicons name="checkmark-circle" size={24} color="#1e3a8a" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* --- Nút Thanh toán --- */}
            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
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
        </SafeAreaView>
    );
};

export default Checkout;