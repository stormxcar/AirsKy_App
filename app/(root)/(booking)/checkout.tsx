import { BaggagePackageEnum, BookingAncillaryServiceRequest, BookingRequest, PassengerSeatRequest, PaymentMethod } from "@/app/types/booking";
import { BaggagePackage, MOCK_ANCILLARY_SERVICES, Passenger, SelectedFlight } from "@/app/types/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import { useBooking } from "@/context/booking-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { createBooking } from "@/services/booking-service";
import { Ionicons } from "@expo/vector-icons"; 
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Checkout = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const { bookingState, dispatch } = useBooking();

    // --- Lấy dữ liệu từ các bước trước ---
    const {
        departureFlight,
        returnFlight,
        passengers = [],
        selectedSeats = { depart: {}, return: {} },
        selectedBaggages = { depart: {}, return: {} },
        selectedAncillaryServices = { depart: {}, return: {} },
        totalPrice = 0,
        contactName,
        contactEmail
    } = bookingState;

    // --- State cho trang thanh toán ---
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

    const handleProcessPayment = async () => {
        if (!paymentMethod) {
            Alert.alert("Vui lòng chọn phương thức thanh toán.");
            return;
        }

        showLoading(async () => {
            try {
                // 1. Build BookingRequest object
                const passengersForRequest: PassengerSeatRequest[] = passengers.map((p: Passenger) => {
                    const baggageDepart = selectedBaggages.depart[p.id];
                    const baggageReturn = selectedBaggages.return[p.id];
                    const seatDepart = selectedSeats.depart[p.id];
                    const seatReturn = selectedSeats.return[p.id];
            
                    const seatAssignments = [];
                    if (seatDepart?.id) {
                        seatAssignments.push({ seatId: seatDepart.id, segmentOrder: 1 });
                    }
                    if (seatReturn?.id) {
                        seatAssignments.push({ seatId: seatReturn.id, segmentOrder: 2 });
                    }
            
                    return {
                        firstName: p.firstName,
                        lastName: p.lastName,
                        dateOfBirth: p.dateOfBirth,
                        passportNumber: p.passportNumber,
                        type: (p.type?.toUpperCase() ?? 'ADULT') as 'ADULT' | 'CHILD' | 'INFANT',
                        gender: p.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
                        // Backend chỉ nhận 1 baggagePackage, nên ta sẽ chọn gói có trọng lượng lớn hơn giữa 2 chặng.
                        // Giả sử key của baggage package phản ánh trọng lượng (ví dụ: 'KG20', 'KG30').
                        baggagePackage: (() => {
                            const finalBaggage = baggageReturn && (!baggageDepart || baggageReturn.key > baggageDepart.key)
                                ? baggageReturn
                                : baggageDepart;

                            return finalBaggage && finalBaggage.key !== 'NONE' ? (finalBaggage.key as BaggagePackageEnum) : undefined;
                        })(),
                        seatAssignments: seatAssignments,
                    };
                });

                const ancillaryServicesForRequest: BookingAncillaryServiceRequest[] = [];
                (['depart', 'return'] as const).forEach(phase => {
                    if (selectedAncillaryServices[phase]) {
                        Object.entries(selectedAncillaryServices[phase]).forEach(([passengerId, services]) => {
                            Object.entries(services).forEach(([serviceId, isSelected]) => {
                                if (isSelected) {
                                    const passenger = passengers.find(p => p.id.toString() === passengerId);
                                    if (passenger) {
                                        ancillaryServicesForRequest.push({
                                            serviceId: parseInt(serviceId),
                                            passengerId: passenger.id, // Gửi ID của passenger
                                            quantity: 1, // Giả sử mỗi dịch vụ chỉ chọn 1
                                        });
                                    }
                                }
                            });
                        });
                    }
                });


                const bookingData: BookingRequest = {
                    userId: user?.id,
                    contactName: contactName,
                    contactEmail: contactEmail,
                    totalAmount: totalPrice,
                    clientType: "MOBILE",
                    paymentMethod: paymentMethod,
                    passengers: passengersForRequest,
                    ancillaryServices: ancillaryServicesForRequest,
                    flightSegments: [
                        {
                            flightId: departureFlight!.flight.id,
                            classId: departureFlight!.ticketClass.id,
                            segmentOrder: 1,
                        },
                        ...(returnFlight ? [{
                            flightId: returnFlight.flight.id,
                            classId: returnFlight.ticketClass.id,
                            segmentOrder: 2,
                        }] : [])
                    ],
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
                    dispatch({ type: 'RESET_STATE' }); // Reset state trước khi điều hướng
                    router.replace({
                        pathname: '/(root)/(booking)/payment-qr',
                        params: { url: checkoutUrl, bookingCode: createdBooking.bookingCode }
                    });
                } else {
                    // Reset state trước khi mở URL ngoài
                    dispatch({ type: 'RESET_STATE' });
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
                            {Object.keys(selectedBaggages.depart).length > 0 && <Text className="text-sm font-semibold text-gray-500 mt-1">Chuyến đi:</Text>}
                            {passengers.map(p => {
                                const baggage = selectedBaggages.depart[p.id];
                                const services = selectedAncillaryServices.depart[p.id];
                                const serviceNames = services ? Object.keys(services).filter(id => services[parseInt(id)]).map(id => MOCK_ANCILLARY_SERVICES.find(s => s.serviceId === parseInt(id))?.serviceName).join(', ') : '';
                                if (!baggage && !serviceNames) return null;
                                return (
                                    <View key={`dep-srv-${p.id}`} className="ml-2">
                                        <Text className="text-base text-gray-600 font-medium">{p.lastName} {p.firstName}:</Text>
                                        {baggage && <Text className="text-base text-gray-600 ml-2">- Hành lý: {baggage.label}</Text>}
                                        {serviceNames && <Text className="text-base text-gray-600 ml-2">- Dịch vụ khác: {serviceNames}</Text>}
                                    </View>
                                );
                            })}

                            {returnFlight && Object.keys(selectedBaggages.return).length > 0 && <Text className="text-sm font-semibold text-gray-500 mt-1">Chuyến về:</Text>}
                            {returnFlight && passengers.map(p => {
                                const baggage = selectedBaggages.return[p.id];
                                // Tương tự có thể thêm các dịch vụ khác cho chuyến về
                                if (!baggage) return null;
                                return <Text key={`bag-ret-${p.id}`} className="text-base text-gray-600 ml-2">- Hành lý ({p.lastName}): {baggage.label}</Text>;
                            })}
                            {Object.keys(selectedBaggages.depart).length === 0 && Object.keys(selectedAncillaryServices.depart).length === 0 && Object.keys(selectedBaggages.return).length === 0 && Object.keys(selectedAncillaryServices.return).length === 0 && <Text className="text-base text-gray-600">Không có</Text>}
                        </View>
                        <View className="mb-2">
                            <Text className="font-semibold text-gray-700">Ghế đã chọn:</Text>
                            {Object.keys(selectedSeats.depart).length > 0 && <Text className="text-sm font-semibold text-gray-500 mt-1">Chuyến đi:</Text>}
                            {Object.entries(selectedSeats.depart).map(([passengerId, seatInfo]) => (
                                seatInfo && <Text key={`seat-dep-${passengerId}`} className="text-base text-gray-600 ml-2">- Ghế ({passengers.find(p => p.id.toString() === passengerId)?.lastName}): {seatInfo.number}</Text>
                            ))}

                            {returnFlight && Object.keys(selectedSeats.return).length > 0 && <Text className="text-sm font-semibold text-gray-500 mt-1">Chuyến về:</Text>}
                            {returnFlight && Object.entries(selectedSeats.return).map(([passengerId, seatInfo]) => (
                                seatInfo && <Text key={`seat-ret-${passengerId}`} className="text-base text-gray-600 ml-2">- Ghế ({passengers.find(p => p.id.toString() === passengerId)?.lastName}): {seatInfo.number}</Text>
                            ))}

                            {Object.keys(selectedSeats.depart).length === 0 && Object.keys(selectedSeats.return).length === 0 && (
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