import { BaggagePackageEnum, BookingAncillaryServiceRequest, BookingRequest, PassengerSeatRequest, PaymentMethod } from "@/app/types/booking";
import { BaggagePackage, MOCK_ANCILLARY_SERVICES, Passenger, SelectedFlight } from "@/app/types/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import { useBooking } from "@/context/booking-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { createBooking } from "@/services/booking-service"; 
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; 
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
                        <View className="space-y-4">
                            {departureFlight && (
                                <View>
                                    <View className="flex-row items-center mb-1">
                                        <Ionicons name="airplane-outline" size={18} color="#4b5563" className="mr-2" />
                                        <Text className="font-semibold text-gray-700">Chuyến đi</Text>
                                    </View>
                                    <Text className="text-base text-gray-600 ml-7">
                                    {departureFlight.flight?.departure.code} → {departureFlight.flight?.arrival.code}
                                    </Text>
                                </View>
                            )}
                            {returnFlight && (
                                <View>
                                    <View className="flex-row items-center mb-1">
                                        <Ionicons name="airplane-outline" size={18} color="#4b5563" className="mr-2" style={{ transform: [{ rotateY: '180deg' }] }} />
                                        <Text className="font-semibold text-gray-700">Chuyến về</Text>
                                    </View>
                                    <Text className="text-base text-gray-600 ml-7">
                                    {returnFlight.flight?.departure.code} → {returnFlight.flight?.arrival.code}
                                    </Text>
                                </View>
                            )}
                            {contactName && (
                                <View>
                                    <View className="flex-row items-center mb-1">
                                        <Ionicons name="person-circle-outline" size={18} color="#4b5563" className="mr-2" />
                                        <Text className="font-semibold text-gray-700">Người liên hệ</Text>
                                    </View>
                                    <Text className="text-base text-gray-600 ml-7">{contactName} ({contactEmail})</Text>
                                </View>
                            )}
                            {/* --- Hành khách & Dịch vụ --- */}
                            <View className="pt-2">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="people-outline" size={18} color="#4b5563" className="mr-2" />
                                    <Text className="font-semibold text-gray-700">Hành khách & Dịch vụ</Text>
                                </View>
                                <View className="ml-7 space-y-3">
                                    {passengers.map((p, index) => {
                                        const seatDepart = selectedSeats.depart[p.id];
                                        const seatReturn = selectedSeats.return[p.id];
                                        const baggageDepart = selectedBaggages.depart[p.id];
                                        const baggageReturn = selectedBaggages.return?.[p.id];
                                        const servicesDepart = selectedAncillaryServices.depart[p.id];
                                        const serviceNamesDepart = servicesDepart ? Object.keys(servicesDepart).filter(id => servicesDepart[parseInt(id)]).map(id => MOCK_ANCILLARY_SERVICES.find(s => s.serviceId === parseInt(id))?.serviceName).join(', ') : '';
                                        const servicesReturn = selectedAncillaryServices.return?.[p.id];
                                        const serviceNamesReturn = servicesReturn ? Object.keys(servicesReturn).filter(id => servicesReturn[parseInt(id)]).map(id => MOCK_ANCILLARY_SERVICES.find(s => s.serviceId === parseInt(id))?.serviceName).join(', ') : '';

                                        return (
                                            <View key={p.id} className={index > 0 ? "border-t border-gray-100 pt-3" : ""}>
                                                <Text className="text-base text-gray-800 font-semibold">{p.lastName} {p.firstName}</Text>
                                                <View className="ml-2 mt-1 space-y-1">
                                                    {/* Ghế */}
                                                    {(seatDepart || seatReturn) && (
                                                        <Text className="text-sm text-gray-600">
                                                            <MaterialIcons name="airline-seat-recline-normal" size={14} color="black" /> Ghế: {seatDepart?.number || 'N/A'} {returnFlight && `/ ${seatReturn?.number || 'N/A'}`}
                                                        </Text>
                                                    )}
                                                    {/* Hành lý */}
                                                    {(baggageDepart || baggageReturn) && (
                                                        <Text className="text-sm text-gray-600">
                                                            <Ionicons name="briefcase-outline" size={14} /> Hành lý: {baggageDepart?.label || 'Không'} {returnFlight && `/ ${baggageReturn?.label || 'Không'}`}
                                                        </Text>
                                                    )}
                                                    {/* Dịch vụ khác */}
                                                    {(serviceNamesDepart || serviceNamesReturn) && (
                                                        <Text className="text-sm text-gray-600">
                                                            <Ionicons name="add-circle-outline" size={14} /> Dịch vụ khác: {serviceNamesDepart || 'Không'} {returnFlight && `/ ${serviceNamesReturn || 'Không'}`}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
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
                                source={{ uri: "data:image/png;base64,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" }}
                                className="w-20 h-8 bg-white rounded"
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