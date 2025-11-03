import { BaggagePackageEnum, BookingAncillaryServiceRequest, BookingRequest, PassengerSeatRequest, PaymentMethod } from "@/app/types/booking";
import { BaggagePackage, MOCK_ANCILLARY_SERVICES, Passenger } from "@/app/types/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import { useBooking } from "@/context/booking-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { createBooking } from "@/services/booking-service";
import { getEligibleDeals } from "@/services/deal-service";
import { DealResponse } from "@/app/types/deal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View, Linking, Modal, ActivityIndicator } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const POINTS_TO_VND_RATE = 1; // 1 điểm = 1 VND

// Tỷ lệ giảm giá theo hạng thành viên (đồng bộ với backend)
const LOYALTY_TIER_DISCOUNTS: { [key: string]: number } = {
    STANDARD: 0,
    SILVER: 0.02,   // 2%
    GOLD: 0.05,     // 5%
    PLATINUM: 0.10, // 10%
};

const getPassengerTypeLabel = (type: 'adult' | 'child' | 'infant') => {
        switch (type) {
            case 'adult': return 'Người lớn';
            case 'child': return 'Trẻ em';
            case 'infant': return 'Em bé';
            default: return type;
        }
    };
const Checkout = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const { bookingState, dispatch } = useBooking();
    console.log(user)
    // --- Lấy dữ liệu từ các bước trước ---
    const {
        departureFlight,
        returnFlight,
        passengers = [],
        selectedSeats = { depart: {}, return: {} },
        selectedBaggages = { depart: {}, return: {} },
        selectedAncillaryServices = { depart: {}, return: {} },
        contactName,
        contactEmail
    } = bookingState;

    // --- State cho trang thanh toán ---
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [eligibleDeals, setEligibleDeals] = useState<DealResponse[]>([]);
    const [isLoadingDeals, setIsLoadingDeals] = useState(true);
    const [selectedDeal, setSelectedDeal] = useState<DealResponse | null>(null);
    const [dealModalVisible, setDealModalVisible] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const [appliedPoints, setAppliedPoints] = useState(0);
    const [isRecalculating, setIsRecalculating] = useState(false);

    const updateTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                setIsLoadingDeals(true);
                // Giả sử getEligibleDeals sẽ trả về các deal có thể sử dụng
                const deals = await getEligibleDeals();
                const usableDeals = deals.filter(deal => deal.status === 'ĐANG HOẠT ĐỘNG' && deal.remainingUsage > 0);
                setEligibleDeals(usableDeals);
            } catch (error) {
                console.error("Failed to fetch deals:", error);
                // Không hiển thị lỗi cho người dùng, chỉ log lỗi
            } finally {
                setIsLoadingDeals(false);
            }
        };
        fetchDeals();
    }, []);

    // basePrice là giá gốc từ các bước trước, không thay đổi trong màn hình này.
    // Giá trị này đã được tính toán đầy đủ ở màn hình trước.
    const basePrice = useMemo(() => bookingState.totalPrice || 0, [bookingState.totalPrice]);

    const { finalPrice, dealDiscount, tierDiscount, pointsDiscount } = useMemo(() => {
        let priceAfterDeal = basePrice;
        let dealDiscount = 0;
        if (selectedDeal) {
            const discountValue = selectedDeal.discountPercentage ? (basePrice * selectedDeal.discountPercentage) / 100 : (selectedDeal.fixedDiscountAmount || 0);
            // Áp dụng mức giảm giá tối đa nếu có
            dealDiscount = selectedDeal.maxDiscountAmount ? Math.min(discountValue, selectedDeal.maxDiscountAmount) : discountValue;
            priceAfterDeal = Math.max(0, basePrice - dealDiscount);
        }

        // Áp dụng giảm giá hạng thành viên (nếu có)
        let tierDiscount = 0;
        if (user?.loyaltyTier && LOYALTY_TIER_DISCOUNTS[user.loyaltyTier]) {
            // SỬA LỖI: Giảm giá hạng thành viên phải được tính trên giá SAU KHI đã áp dụng deal, để khớp với backend.
            tierDiscount = priceAfterDeal * LOYALTY_TIER_DISCOUNTS[user.loyaltyTier];
        }

        // Tính giá sau khi trừ deal và tier
        const priceAfterAllDiscounts = Math.max(0, priceAfterDeal - tierDiscount);
        const pointsDiscount = Math.min(priceAfterAllDiscounts, appliedPoints * POINTS_TO_VND_RATE);
        const finalPrice = Math.max(0, priceAfterAllDiscounts - pointsDiscount);

        return { finalPrice, dealDiscount, tierDiscount, pointsDiscount };
    }, [basePrice, selectedDeal, appliedPoints, user]);

    // Sử dụng useLayoutEffect để đảm bảo UI được cập nhật đồng bộ
    useLayoutEffect(() => {
        setIsRecalculating(true);
        const timer = setTimeout(() => setIsRecalculating(false), 300); // Hiệu ứng skeleton
        return () => clearTimeout(timer);
    }, [selectedDeal, appliedPoints]);

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
                    totalAmount: finalPrice, // Gửi giá cuối cùng
                    clientType: "MOBILE",
                    paymentMethod: paymentMethod,
                    dealCode: selectedDeal ? selectedDeal.dealCode : undefined,
                    pointsToRedeem: appliedPoints > 0 ? appliedPoints : undefined,
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
                console.log("=== DEBUG PRICE ===");
                console.log("basePrice:", basePrice.toLocaleString('vi-VN'));
                console.log("selectedDeal:", selectedDeal?.dealCode, "discount:", dealDiscount.toLocaleString('vi-VN'));
                console.log("appliedPoints:", appliedPoints, "pointsDiscount:", pointsDiscount.toLocaleString('vi-VN'));
                console.log("finalPrice gửi backend:", finalPrice.toLocaleString('vi-VN'));
                console.log("Booking created successfully:", createdBooking.bookingCode, ",Total price:", finalPrice.toLocaleString('vi-VN'));
                // 3. Lấy checkoutUrl từ response của createBooking
                const checkoutUrl = createdBooking.payment?.checkoutUrl;
                if (!checkoutUrl) {
                    throw new Error("Không nhận được đường dẫn thanh toán từ máy chủ.");
                }
                // 4. Điều hướng NỮA, reset SAU
                let navParams = { status: 'pending', bookingCode: createdBooking.bookingCode };

                if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
                    // Điều hướng đến màn hình QR code
                    router.replace({
                        pathname: '/(root)/(booking)/payment-qr',
                        params: { ...navParams, url: checkoutUrl }  // Merge params
                    });
                    // Reset SAU navigation cho BANK_TRANSFER
                    dispatch({ type: 'RESET_STATE' });
                } else {
                    // Reset TRƯỚC khi mở URL ngoài (nhưng giữ context cho router)
                    dispatch({ type: 'RESET_STATE' });  // Di chuyển lên đây cho PayPal
                    // Điều hướng đến WebView cho PayPal
                    await Linking.openURL(checkoutUrl);
                    // Sau đó replace (context vẫn an toàn vì Linking là async)
                    router.replace({ pathname: '/(root)/(booking)/booking-result', params: navParams });
                    return;  // Exit sớm để tránh conflict
                }
            } catch (error: any) {
                console.error("Error processing payment:", error);
                Alert.alert("Lỗi", error.message || "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.");
            }
        });
    };

    const handleApplyPoints = () => {
        const points = parseInt(pointsToRedeem);
        if (isNaN(points) || points < 0) {
            Alert.alert("Lỗi", "Vui lòng nhập một số điểm hợp lệ.");
            return;
        }
        if (user && points > (user.points || 0)) {
            Alert.alert("Không đủ điểm", `Bạn chỉ có ${user.points || 0} điểm khả dụng.`);
            return;
        }
        setAppliedPoints(points);
        Alert.alert("Thành công", `Đã áp dụng ${points} điểm.`);
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
                                        console.log(p)
                                        return (
                                            <View key={p.id} className={index > 0 ? "border-t border-gray-100 pt-3" : ""}>
                                                <Text className="text-base text-gray-800 font-semibold">{p.lastName} {p.firstName} ({getPassengerTypeLabel(p.type)})</Text>
                                                <View className="ml-2 mt-1 space-y-1">
                                                    {/* Ghế */}
                                                    {(seatDepart || seatReturn) && (
                                                        <View className="flex-row items-center">
                                                            <MaterialIcons name="event-seat" size={14} color="black" className="mr-2" />
                                                            <Text className="text-sm text-gray-600">Ghế: {seatDepart?.number || 'N/A'} {returnFlight && `/ ${seatReturn?.number || 'N/A'}`}</Text>
                                                        </View>
                                                    )}
                                                    {/* Hành lý */}
                                                    {(baggageDepart || baggageReturn) && (
                                                        <View className="flex-row items-center">
                                                            <Ionicons name="briefcase-outline" size={14} className="mr-2" />
                                                            <Text className="text-sm text-gray-600">Hành lý: {baggageDepart?.label || 'Không'} {returnFlight && `/ ${baggageReturn?.label || 'Không'}`}</Text>
                                                        </View>
                                                    )}
                                                    {/* Dịch vụ khác */}
                                                    {(serviceNamesDepart || serviceNamesReturn) && (
                                                        <View className="flex-row items-center">
                                                            <Ionicons name="add-circle-outline" size={14} className="mr-2" />
                                                            <Text className="text-sm text-gray-600">Dịch vụ khác: {serviceNamesDepart || 'Không'} {returnFlight && `/ ${serviceNamesReturn || 'Không'}`}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                        {/* --- Chi tiết giá --- */}
                        <View className="border-t border-gray-200 mt-3 pt-3 space-y-2" key={`price-section-${isRecalculating ? 'loading' : 'loaded'}`}>
                            {isRecalculating ? (
                                // Thêm key để force remount, và style inline cho animation safe
                                <View className="space-y-2">
                                    <View className="h-5 bg-gray-200 rounded w-3/4" style={{ animation: 'none' }} />  {/* Tắt animation mặc định */}
                                    <View className="h-5 bg-gray-200 rounded w-1/2" style={{ animation: 'none' }} />
                                    <View className="h-8 bg-gray-300 rounded w-full mt-2" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />  {/* Chỉ pulse cái cuối */}
                                </View>
                            ) : (
                                <View className="space-y-2">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-base text-gray-600">Giá vé & dịch vụ:</Text>
                                        <Text className="text-base text-gray-700">{basePrice.toLocaleString('vi-VN')} ₫</Text>
                                    </View>
                                    {dealDiscount > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-base text-green-600">Giảm giá ({selectedDeal?.dealCode}):</Text>
                                            <Text className="text-base text-green-600">- {dealDiscount.toLocaleString('vi-VN')} ₫</Text>
                                        </View>
                                    )}
                                    {tierDiscount > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-base text-green-600">Ưu đãi hạng {user?.loyaltyTier}:</Text>
                                            <Text className="text-base text-green-600">- {tierDiscount.toLocaleString('vi-VN')} ₫</Text>
                                        </View>
                                    )}
                                    {pointsDiscount > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-base text-green-600">Giảm từ điểm:</Text>
                                            <Text className="text-base text-green-600">- {pointsDiscount.toLocaleString('vi-VN')} ₫</Text>
                                        </View>
                                    )}
                                    <View className="border-t border-dashed border-gray-200 mt-2 pt-2 flex-row justify-between items-center">
                                        {/* <Text className="text-lg font-bold text-gray-800">Tạm tính:</Text> */}
                                        {/* <Text className="text-xl font-bold text-red-600">
                                            {finalPrice.toLocaleString('vi-VN')} ₫
                                        </Text> */}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                    {/* --- Mã giảm giá & Đổi điểm --- */}
                    <View className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm">
                        <Text className="text-lg font-bold text-blue-900 mb-3">Ưu đãi & Giảm giá</Text>
                        {/* Chọn mã giảm giá */}
                        <TouchableOpacity
                            onPress={() => setDealModalVisible(true)}
                            className="flex-row items-center justify-between p-3 border border-dashed border-gray-400 rounded-lg"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="pricetag-outline" size={20} color="#f59e0b" />
                                <Text className="text-base text-gray-700 ml-2">{selectedDeal ? `Đã chọn: ${selectedDeal.dealCode}` : 'Chọn mã giảm giá'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                        {/* Đổi điểm */}
                        {user && (
                            <View className="mt-4 pt-4 border-t border-gray-100">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-base font-semibold text-gray-700">Đổi điểm tích lũy</Text>
                                    <Text className="text-sm text-blue-900 font-bold">Điểm khả dụng: {(user.loyaltyPoints || 0).toLocaleString()}</Text>
                                </View>
                                <View className="flex-row items-center gap-x-2">
                                    <View className="flex-1">
                                        <TextInput
                                            label="Nhập số điểm"
                                            mode="outlined"
                                            value={pointsToRedeem}
                                            onChangeText={setPointsToRedeem}
                                            keyboardType="number-pad"
                                            style={{ backgroundColor: 'transparent', fontSize: 14 }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleApplyPoints}
                                        className="bg-blue-100 p-3 rounded-lg border border-blue-200"
                                    >
                                        <Text className="text-blue-900 font-bold">Áp dụng</Text>
                                    </TouchableOpacity>
                                </View>
                                {appliedPoints > 0 && (
                                    <Text className="text-green-600 text-sm mt-1">
                                        Đang áp dụng {appliedPoints.toLocaleString()} điểm, tương đương giảm {pointsDiscount.toLocaleString('vi-VN')} ₫.
                                    </Text>
                                )}
                            </View>
                        )}
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
                    <Text className="text-xl font-bold text-red-600">{finalPrice.toLocaleString('vi-VN')} ₫</Text>
                </View>
                <TouchableOpacity
                    onPress={handleProcessPayment}
                    disabled={!paymentMethod}
                    className={`py-3 rounded-full shadow-md ${!paymentMethod ? 'bg-gray-400' : 'bg-blue-900'}`}
                >
                    <Text className="text-white text-center font-bold text-lg">Tiến hành thanh toán</Text>
                </TouchableOpacity>
            </View>
            {/* Deal Selection Modal */}
            <Modal
                visible={dealModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setDealModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-2xl p-4 max-h-[60%]">
                        <Text className="text-lg font-bold text-center mb-4">Chọn mã giảm giá</Text>
                        {isLoadingDeals ? (
                            <ActivityIndicator size="large" color="#1e3a8a" />
                        ) : (
                            <ScrollView>
                                {eligibleDeals.map(deal => (
                                    <TouchableOpacity
                                        key={deal.dealId}
                                        onPress={() => { setSelectedDeal(deal); setDealModalVisible(false); }}
                                        className="p-4 border-b border-gray-100"
                                    >
                                        <Text className="text-base font-bold text-blue-900">{deal.dealCode}</Text>
                                        <Text className="text-sm text-gray-600">{deal.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity onPress={() => { setSelectedDeal(null); setDealModalVisible(false); }} className="mt-2 p-3 bg-red-100 rounded-lg"><Text className="text-center text-red-700 font-semibold">Không dùng mã</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setDealModalVisible(false)} className="mt-4 p-3"><Text className="text-center text-gray-600">Đóng</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default Checkout;