"use client"

import {
    type BaggagePackageEnum,
    type BookingAncillaryServiceRequest,
    type BookingRequest,
    type PassengerSeatRequest,
    PaymentMethod,
} from "@/app/types/booking"
import type { DealResponse } from "@/app/types/deal"
import { MOCK_ANCILLARY_SERVICES, type Passenger } from "@/app/types/types"
import BookingStepper from "@/components/screens/book-flight/booking-stepper"
import { useAuth } from "@/context/auth-context"
import { useBooking } from "@/context/booking-context"
import { useLoading } from "@/context/loading-context"
import { createBooking } from "@/services/booking-service"
import { getEligibleDeals } from "@/services/deal-service"
import { calculateDiscountFromPoints } from "@/services/loyalty-service"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"

// Tỷ lệ giảm giá theo hạng thành viên (đồng bộ với backend)
const LOYALTY_TIER_DISCOUNTS: { [key: string]: number } = {
    STANDARD: 0,
    SILVER: 0.02, // 2%
    GOLD: 0.05, // 5%
    PLATINUM: 0.1, // 10%
}

const getPassengerTypeLabel = (type: "adult" | "child" | "infant") => {
    switch (type) {
        case "adult":
            return "Người lớn"
        case "child":
            return "Trẻ em"
        case "infant":
            return "Em bé"
        default:
            return type
    }
}
const Checkout = () => {
    const router = useRouter()
    const { user } = useAuth()
    const { showLoading, hideLoading } = useLoading()
    const { bookingState, dispatch } = useBooking()
    // --- Lấy dữ liệu từ các bước trước ---
    const {
        departureFlight,
        returnFlight,
        passengers = [],
        selectedSeats = { depart: {}, return: {} },
        selectedBaggages = { depart: {}, return: {} },
        selectedAncillaryServices = { depart: {}, return: {} },
        contactName,
        contactEmail,
    } = bookingState

    // --- State cho trang thanh toán ---
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
    const [eligibleDeals, setEligibleDeals] = useState<DealResponse[]>([])
    const [isLoadingDeals, setIsLoadingDeals] = useState(true)
    const [selectedDeal, setSelectedDeal] = useState<DealResponse | null>(null)
    const [dealModalVisible, setDealModalVisible] = useState(false)
    const [pointsToRedeem, setPointsToRedeem] = useState("")
    const [appliedPoints, setAppliedPoints] = useState(0)
    const [pointsDiscount, setPointsDiscount] = useState(0)
    const [isRecalculating, setIsRecalculating] = useState(false)
    const [isApplyingPoints, setIsApplyingPoints] = useState(false)
    const [expandedPassengers, setExpandedPassengers] = useState<{ [key: number]: boolean }>({})
    const [displayLoyaltyPoints, setDisplayLoyaltyPoints] = useState(user?.loyaltyPoints || 0)

    // Cập nhật điểm hiển thị khi thông tin người dùng thay đổi
    useEffect(() => {
        setDisplayLoyaltyPoints(user?.loyaltyPoints || 0)
    }, [user?.loyaltyPoints])

    const updateTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                setIsLoadingDeals(true)
                // Giả sử getEligibleDeals sẽ trả về các deal có thể sử dụng
                const deals = await getEligibleDeals()
                const usableDeals = deals.filter((deal) => deal.status === "ĐANG HOẠT ĐỘNG" && deal.remainingUsage > 0)
                setEligibleDeals(usableDeals)
            } catch (error) {
                console.error("Failed to fetch deals:", error)
                // Không hiển thị lỗi cho người dùng, chỉ log lỗi
            } finally {
                setIsLoadingDeals(false)
            }
        }
        fetchDeals()
    }, [])

    // basePrice là giá gốc từ các bước trước, không thay đổi trong màn hình này.
    // Giá trị này đã được tính toán đầy đủ ở màn hình trước.
    const basePrice = useMemo(() => bookingState.totalPrice || 0, [bookingState.totalPrice])

    const { finalPrice, dealDiscount, tierDiscount } = useMemo(() => {
        let priceAfterDeal = basePrice
        let calculatedDealDiscount = 0

        // 1. Áp dụng mã giảm giá (deal)
        if (selectedDeal) {
            const discountValue = selectedDeal.discountPercentage
                ? (basePrice * selectedDeal.discountPercentage) / 100
                : selectedDeal.fixedDiscountAmount || 0
            calculatedDealDiscount = selectedDeal.maxDiscountAmount
                ? Math.min(discountValue, selectedDeal.maxDiscountAmount)
                : discountValue
        }

        // 2. Cộng dồn giảm giá từ điểm vào tổng giảm giá
        // Backend coi việc đổi điểm như tạo ra một deal giảm giá cố định, nên ta cộng dồn vào đây.
        const totalDiscountFromDealsAndPoints = calculatedDealDiscount + pointsDiscount
        priceAfterDeal = Math.max(0, basePrice - totalDiscountFromDealsAndPoints)

        // 3. Áp dụng giảm giá hạng thành viên (tính trên giá SAU khi đã trừ deal và điểm)
        let tierDiscount = 0;
        if (user?.loyaltyTier && LOYALTY_TIER_DISCOUNTS[user.loyaltyTier]) {
            // Tính giảm giá hạng thành viên trên giá gốc (basePrice) đã trừ deal
            //  tierDiscount = (basePrice - calculatedDealDiscount) * LOYALTY_TIER_DISCOUNTS[user.loyaltyTier];
            tierDiscount = priceAfterDeal * LOYALTY_TIER_DISCOUNTS[user.loyaltyTier]
        }

        // 4. Tính giá cuối cùng
        const finalPrice = Math.max(0, priceAfterDeal - tierDiscount)
      
        // Trả về tổng giảm giá từ deal và điểm để hiển thị
        return { finalPrice, dealDiscount: totalDiscountFromDealsAndPoints, tierDiscount }
    }, [basePrice, selectedDeal, user, pointsDiscount])

    // Sử dụng useLayoutEffect để đảm bảo UI được cập nhật đồng bộ
    useLayoutEffect(() => {
        setIsRecalculating(true)
        const timer = setTimeout(() => setIsRecalculating(false), 300) // Hiệu ứng skeleton
        return () => clearTimeout(timer) // Cleanup on unmount or re-run
    }, [selectedDeal, pointsDiscount]) // Re-run effect when deal or points change

    const togglePassengerExpansion = (passengerId: number) => {
        setExpandedPassengers((prev) => ({
            ...prev,
            [passengerId]: !prev[passengerId],
        }))
    }

    const handleProcessPayment = async () => {
        if (!paymentMethod) {
            Alert.alert("Vui lòng chọn phương thức thanh toán.")
            return
        }
        showLoading(async () => {
            try {
                // 1. Build BookingRequest object
                const passengersForRequest: PassengerSeatRequest[] = passengers.map((p: Passenger) => {
                    const baggageDepart = selectedBaggages.depart[p.id]
                    const baggageReturn = selectedBaggages.return[p.id]
                    const seatDepart = selectedSeats.depart[p.id]
                    const seatReturn = selectedSeats.return[p.id]

                    const seatAssignments = []
                    if (seatDepart?.id) {
                        seatAssignments.push({ seatId: seatDepart.id, segmentOrder: 1 })
                    }
                    if (seatReturn?.id) {
                        seatAssignments.push({ seatId: seatReturn.id, segmentOrder: 2 })
                    }

                    return {
                        firstName: p.firstName,
                        lastName: p.lastName,
                        dateOfBirth: p.dateOfBirth,
                        passportNumber: p.passportNumber,
                        type: (p.type?.toUpperCase() ?? "ADULT") as "ADULT" | "CHILD" | "INFANT",
                        gender: p.gender.toUpperCase() as "MALE" | "FEMALE" | "OTHER",
                        // Backend chỉ nhận 1 baggagePackage, nên ta sẽ chọn gói có trọng lượng lớn hơn giữa 2 chặng.
                        // Giả sử key của baggage package phản ánh trọng lượng (ví dụ: 'KG20', 'KG30').
                        baggagePackage: (() => {
                            const finalBaggage =
                                baggageReturn && (!baggageDepart || baggageReturn.key > baggageDepart.key)
                                    ? baggageReturn
                                    : baggageDepart
                            return finalBaggage && finalBaggage.key !== "NONE" ? (finalBaggage.key as BaggagePackageEnum) : undefined
                        })(),
                        seatAssignments: seatAssignments,
                    }
                })
                const ancillaryServicesForRequest: BookingAncillaryServiceRequest[] = []
                    ; (["depart", "return"] as const).forEach((phase) => {
                        if (selectedAncillaryServices[phase]) {
                            Object.entries(selectedAncillaryServices[phase]).forEach(([passengerId, services]) => {
                                Object.entries(services).forEach(([serviceId, isSelected]) => {
                                    if (isSelected) {
                                        const passenger = passengers.find((p) => p.id.toString() === passengerId)
                                        if (passenger) {
                                            ancillaryServicesForRequest.push({
                                                serviceId: Number.parseInt(serviceId),
                                                passengerId: passenger.id, // Gửi ID của passenger
                                                quantity: 1, // Giả sử mỗi dịch vụ chỉ chọn 1
                                            })
                                        }
                                    }
                                })
                            })
                        }
                    })
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
                        ...(returnFlight
                            ? [
                                {
                                    flightId: returnFlight.flight.id,
                                    classId: returnFlight.ticketClass.id,
                                    segmentOrder: 2,
                                },
                            ]
                            : []),
                    ],
                }
                // 2. Gọi API để tạo booking
                const createdBooking = await createBooking(bookingData)
                // 3. Lấy checkoutUrl từ response của createBooking
                // console.log("booking req:", bookingData)
                // console.log("booking:", createdBooking)
                const checkoutUrl = createdBooking.payment?.checkoutUrl
                if (!checkoutUrl) {
                    throw new Error("Không nhận được đường dẫn thanh toán từ máy chủ.")
                }
                // 4. Điều hướng NỮA, reset SAU
                const navParams = {
                    status: "pending",
                    bookingId: createdBooking.bookingId,
                    bookingCode: createdBooking.bookingCode,
                }

                if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
                    // Điều hướng đến màn hình QR code
                    router.replace({
                        pathname: "/(root)/(booking)/payment-qr",
                        params: { ...navParams, url: checkoutUrl }, // Merge params
                    })
                    // Reset SAU navigation cho BANK_TRANSFER
                    dispatch({ type: "RESET_STATE" })
                } else {
                    // Reset TRƯỚC khi mở URL ngoài (nhưng giữ context cho router)
                    dispatch({ type: "RESET_STATE" }) // Di chuyển lên đây cho PayPal
                    // Điều hướng đến WebView cho PayPal
                    await Linking.openURL(checkoutUrl)
                    // Sau đó replace (context vẫn an toàn vì Linking là async)
                    router.replace({ pathname: "/(root)/(booking)/booking-result", params: navParams })
                    return // Exit sớm để tránh conflict
                }
            } catch (error: any) {
                console.error("Error processing payment:", error)
                Alert.alert("Lỗi", error.message || "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.")
            }
        })
    }

    const handleRemoveDeal = () => {
        setSelectedDeal(null)
    }

    const handleRemovePoints = () => {
        setAppliedPoints(0)
        setPointsDiscount(0)
        setPointsToRedeem("") // Xóa cả text input
        // Trả lại điểm đã trừ vào state hiển thị
        setDisplayLoyaltyPoints(user?.loyaltyPoints || 0)
    }

    const handleApplyPoints = async () => {
        const pointsValue = Number.parseInt(pointsToRedeem)
        if (isNaN(pointsValue) || pointsValue <= 0) {
            Alert.alert("Không hợp lệ", "Vui lòng nhập một số điểm hợp lệ.")
            return
        }
        if (pointsValue < 500) {
            Alert.alert("Không hợp lệ", "Số điểm đổi tối thiểu là 500.")
            return
        }
        // Kiểm tra với số điểm đang hiển thị
        if (pointsValue > displayLoyaltyPoints) {
            Alert.alert("Không đủ điểm", `Bạn chỉ có ${user.loyaltyPoints || 0} điểm khả dụng.`)
            return
        }

        setIsApplyingPoints(true)
        try {
            // Gọi API để tính toán số tiền giảm giá
            const discountAmount = await calculateDiscountFromPoints(pointsValue)

            // Giới hạn số tiền giảm không vượt quá giá trị còn lại của đơn hàng
            const priceBeforePoints = basePrice - (dealDiscount + tierDiscount)
            const finalDiscount = Math.min(discountAmount, priceBeforePoints)

            // Cập nhật state
            setAppliedPoints(pointsValue)
            setPointsDiscount(finalDiscount)
            // Trừ điểm khỏi state hiển thị
            setDisplayLoyaltyPoints((prevPoints) => prevPoints - pointsValue)

            Alert.alert(
                "Thành công",
                `Áp dụng ${pointsValue.toLocaleString("vi-VN")} điểm thành công, giảm ${finalDiscount.toLocaleString("vi-VN")} ₫.`,
            )
        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể áp dụng điểm. Vui lòng thử lại.")
            // Reset nếu có lỗi
            handleRemovePoints()
        } finally {
            setIsApplyingPoints(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
            <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="bg-gradient-to-b from-blue-900 to-blue-800 px-4 py-3 shadow-lg">
                    <View className="flex-row items-center py-2">
                        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                            <Ionicons name="chevron-back" size={24} color="black" />            </TouchableOpacity>
                        <Text className="text-xl flex-1 text-center mr-12 font-bold text-blue-900">Thanh toán</Text>
                    </View>
                </View>
                <BookingStepper currentStep={3} />

                <View className="px-4 pt-4 pb-4 space-y-4">
                    <View className="bg-white p-5 rounded-t-2xl shadow-sm ">
                        <View className="flex-row items-center mb-4 border-b border-gray-100">
                            <Ionicons name="receipt-outline" size={20} color="#1e3a8a" />
                            <Text className="text-lg font-bold text-blue-900 ml-3">Tóm tắt đơn hàng</Text>
                        </View>
                        <View className="flex gap-4">
                            {departureFlight && (
                                <View>
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="airplane-outline" size={18} color="#1e3a8a" />
                                        <Text className="font-semibold text-gray-700 ml-3">Chuyến đi</Text>
                                    </View>
                                    <Text className="text-sm text-gray-600 ml-8 font-medium">
                                        {departureFlight.flight?.departure.code} → {departureFlight.flight?.arrival.code}
                                    </Text>
                                </View>
                            )}
                            {returnFlight && (
                                <View>
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons
                                            name="airplane-outline"
                                            size={18}
                                            color="#1e3a8a"
                                            style={{ transform: [{ rotateY: "180deg" }] }}
                                        />
                                        <Text className="font-semibold text-gray-700 ml-3">Chuyến về</Text>
                                    </View>
                                    <Text className="text-sm text-gray-600 ml-8 font-medium">
                                        {returnFlight.flight?.departure.code} → {returnFlight.flight?.arrival.code}
                                    </Text>
                                </View>
                            )}
                            {contactName && (
                                <View>
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="person-outline" size={18} color="#1e3a8a" />
                                        <Text className="font-semibold text-gray-700 ml-3">Người liên hệ</Text>
                                    </View>
                                    <Text className="text-sm text-gray-600 ml-8 font-medium">{contactName}</Text>
                                    <Text className="text-xs text-gray-500 ml-8">{contactEmail}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View className="bg-white p-5  shadow-sm ">
                        <View className="flex-row items-center pb-3 border-b border-gray-100">
                            <Ionicons name="people-outline" size={20} color="#1e3a8a" />
                            <Text className="text-lg font-bold text-blue-900 ml-3">Hành khách & Dịch vụ</Text>
                        </View>
                        <View className="space-y-2">
                            {passengers.map((p) => {
                                const isExpanded = !!expandedPassengers[p.id]
                                const isRoundTrip = !!returnFlight
                                const segmentCount = isRoundTrip ? 2 : 1

                                const seatDepart = selectedSeats.depart?.[p.id]
                                const seatReturn = selectedSeats.return?.[p.id]
                                // Giả định gói hành lý áp dụng cho cả 2 chiều và được chọn ở chặng đi
                                const baggage = selectedBaggages.depart?.[p.id]
                                const ancillary = selectedAncillaryServices.depart?.[p.id] || {}

                                // --- TÍNH TOÁN GIÁ CHI TIẾT CHO TỪNG HÀNH KHÁCH ---
                                let passengerBaseTicketPrice = 0
                                const multiplier = p.type === "child" ? 0.75 : p.type === "infant" ? 0.1 : 1.0
                                if (departureFlight?.flight.price) {
                                    passengerBaseTicketPrice += departureFlight.flight.price * multiplier
                                }
                                if (returnFlight?.flight.price) {
                                    passengerBaseTicketPrice += returnFlight.flight.price * multiplier
                                }

                                // 2. Giá dịch vụ
                                const seatPrice = (seatDepart?.price || 0) + (seatReturn?.price || 0)
                                const baggagePrice = (baggage?.price || 0) * (baggage ? segmentCount : 0)
                                // FIX: Tính giá dịch vụ cộng thêm cho từng hành khách
                                const ancillaryPrice = Object.entries(ancillary).reduce((total, [serviceId, isSelected]) => {
                                    if (isSelected) {
                                        const service = MOCK_ANCILLARY_SERVICES.find((s) => s.serviceId === Number.parseInt(serviceId))
                                        if (service) {
                                            // Nếu dịch vụ tính theo chặng, nhân với số chặng
                                            const serviceSegmentMultiplier = service.isPerSegment ? segmentCount : 1
                                            // Chỉ cộng giá của dịch vụ, không nhân với số hành khách
                                            return total + (service.price * serviceSegmentMultiplier);
                                        }
                                    }
                                    return total
                                }, 0)

                                // 3. Tổng tiền cho hành khách này
                                const passengerTotalPrice = passengerBaseTicketPrice + seatPrice + baggagePrice + ancillaryPrice

                                return (
                                    <View key={p.id} className="rounded-lg border border-gray-100 overflow-hidden">
                                        <TouchableOpacity
                                            onPress={() => togglePassengerExpansion(p.id)}
                                            className="flex-row justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-transparent"
                                        >
                                            <View className="flex-1">
                                                <Text className="text-base text-gray-800 font-semibold">
                                                    {p.lastName} {p.firstName}
                                                </Text>
                                                <Text className="text-xs text-blue-900 font-medium mt-1">{getPassengerTypeLabel(p.type)}</Text>
                                            </View>
                                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#1e3a8a" />
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View className="px-4 py-3 bg-gray-50 space-y-2 border-t border-gray-100">
                                                {/* Giá vé cơ bản cho hành khách này */}
                                                <View className="flex-row justify-between items-center pb-2 border-b border-gray-200">
                                                    <Text className="text-sm text-gray-600">Giá vé cơ bản:</Text>
                                                    <Text className="text-sm text-gray-800 font-semibold">
                                                        {passengerBaseTicketPrice.toLocaleString("vi-VN")} ₫
                                                    </Text>
                                                </View>
                                                {/* Ghế */}
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="text-sm text-gray-600">Ghế đi: {seatDepart?.number || (p.type === 'infant' ? "Không áp dụng" : "Không chọn")}</Text>
                                                    <Text className="text-sm text-gray-800 font-medium">
                                                        +{seatDepart?.price?.toLocaleString("vi-VN") || 0} ₫
                                                    </Text>
                                                </View>
                                                {isRoundTrip && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text className="text-sm text-gray-600">Ghế về: {seatReturn?.number || (p.type === 'infant' ? "Không áp dụng" : "Không chọn")}</Text>
                                                        <Text className="text-sm text-gray-800 font-medium">
                                                            +{seatReturn?.price?.toLocaleString("vi-VN") || 0} ₫
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* Hành lý */}
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="text-sm text-gray-600">Hành lý: {baggage?.label || (p.type === 'infant' ? "Không áp dụng" : "Không chọn")}</Text>
                                                    <Text className="text-sm text-gray-800 font-medium">
                                                        +{baggage?.price?.toLocaleString("vi-VN") || 0} ₫
                                                    </Text>
                                                </View>

                                                {/* Dịch vụ khác */}
                                                {Object.keys(ancillary).length > 0 &&
                                                    Object.entries(ancillary).map(([serviceId, isSelected]) => {
                                                        if (!isSelected) return null
                                                        const service = MOCK_ANCILLARY_SERVICES.find(
                                                            (s) => s.serviceId === Number.parseInt(serviceId),
                                                        )
                                                        if (!service) return null

                                                        return (
                                                            <View key={serviceId} className="flex-row justify-between items-center">
                                                                <Text className="text-sm text-gray-600">{service.serviceName}</Text>
                                                                <Text className="text-sm text-gray-800 font-medium">
                                                                    +{service.price.toLocaleString("vi-VN")} ₫
                                                                </Text>
                                                            </View>
                                                        )
                                                    })}
                                                {Object.keys(ancillary).length === 0 && !seatDepart && !seatReturn && !baggage && (
                                                    <Text className="text-sm text-gray-400 italic pt-2">{p.type === 'infant' ? "Không áp dụng" : "Không có dịch vụ nào được chọn."}</Text>
                                                )}

                                                {/* Tổng tiền cho hành khách */}
                                                <View className="flex-row justify-between items-center border-t border-gray-200 mt-2 pt-2">
                                                    <Text className="text-sm font-semibold text-gray-800">Tổng cộng:</Text>
                                                    <Text className="text-sm font-bold text-blue-900">
                                                        {passengerTotalPrice.toLocaleString("vi-VN")} ₫
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    </View>

                    <View className="bg-white p-5  shadow-sm">
                        <View className="flex-row items-center mb-4 pb-3 border-b border-gray-100">
                            <Ionicons name="gift-outline" size={20} color="#1e3a8a" />
                            <Text className="text-lg font-bold text-blue-900 ml-3">Ưu đãi & Giảm giá</Text>
                        </View>
                        {/* Chọn mã giảm giá */}
                        {selectedDeal ? (
                            <View className="flex-row items-center justify-between p-3 bg-blue-50 border-l-4 border-blue-900 rounded-lg mb-4">
                                <View className="flex-1">
                                    <Text className="text-xs text-blue-700 font-medium">Mã giảm giá đang áp dụng</Text>
                                    <Text className="text-base text-blue-900 font-bold mt-1">{selectedDeal.dealCode}</Text>
                                </View>
                                <TouchableOpacity onPress={handleRemoveDeal} className="p-1">
                                    <Ionicons name="close-circle" size={24} color="#1e3a8a" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => setDealModalVisible(true)}
                                className="flex-row items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4 active:bg-gray-50"
                            >
                                <View className="flex-row items-center flex-1">
                                    <Ionicons name="pricetag-outline" size={20} color="#1e3a8a" />
                                    <Text className="text-base text-gray-700 ml-3 font-medium">Chọn mã giảm giá</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                        {/* Đổi điểm */}
                        {user && (
                            <View className="pt-4 border-t border-gray-100">
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-row items-center gap-x-2">
                                        <Ionicons name="star-outline" size={18} color="#1e3a8a" />
                                        <Text className="text-base font-semibold text-gray-700">Đổi điểm tích lũy</Text>
                                        <TouchableOpacity
                                            onPress={() =>
                                                Alert.alert(
                                                    "Đổi điểm hoạt động như thế nào?",
                                                    "Nhập số điểm bạn muốn sử dụng để giảm trừ vào tổng số tiền thanh toán. Số tiền giảm giá tương ứng sẽ được hệ thống tính toán và áp dụng. Số điểm đổi tối thiểu là 500.",
                                                )
                                            }
                                        >
                                            <Ionicons name="help-circle-outline" size={16} color="#6b7280" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-sm text-blue-900 font-bold">{displayLoyaltyPoints.toLocaleString()}</Text>
                                </View>
                                {appliedPoints > 0 ? (
                                    <View className="flex-row items-center justify-between p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-lg">
                                        <View className="flex-1">
                                            <Text className="text-xs text-emerald-700 font-medium">Đang sử dụng</Text>
                                            <Text className="text-base text-emerald-900 font-bold mt-1">
                                                {appliedPoints.toLocaleString()} điểm
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={handleRemovePoints} className="p-1">
                                            <Ionicons name="close-circle" size={24} color="#059669" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center justify-center gap-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                                        <View className="flex-1">
                                            <TextInput
                                                label="Nhập số điểm"
                                                mode="outlined"
                                                value={pointsToRedeem}
                                                onChangeText={setPointsToRedeem}
                                                keyboardType="number-pad"
                                                style={{ backgroundColor: "transparent", fontSize: 14, height: 44, marginBottom: 6 }}
                                                disabled={isApplyingPoints}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            onPress={handleApplyPoints}
                                            disabled={isApplyingPoints || !pointsToRedeem}
                                            className="bg-blue-900 rounded-lg w-24 h-12 items-center justify-center active:bg-blue-800"
                                        >
                                            {isApplyingPoints ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <Text className="text-white font-bold text-sm">Áp dụng</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View className="bg-white p-5  shadow-sm">
                        <View className="flex-row items-center mb-4 pb-3 border-b border-gray-100">
                            <Ionicons name="calculator-outline" size={20} color="#1e3a8a" />
                            <Text className="text-lg font-bold text-blue-900 ml-3">Chi tiết thanh toán</Text>
                        </View>
                        <View className="space-y-3">
                            <View className="flex-row justify-between items-start">
                                <View className="flex-row items-center gap-x-2 flex-1">
                                    <Text className="text-sm text-gray-600">Tạm tính:</Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            Alert.alert(
                                                "Tạm tính là gì?",
                                                "Là tổng giá vé và các dịch vụ bổ sung (ghế ngồi, hành lý, suất ăn...) bạn đã chọn ở các bước trước.",
                                            )
                                        }
                                    >
                                        <Ionicons name="help-circle-outline" size={14} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-sm text-gray-800 font-semibold">{basePrice.toLocaleString("vi-VN")} ₫</Text>
                            </View>

                            {isRecalculating ? (
                                <View className="items-center justify-center py-3">
                                    <ActivityIndicator size="small" color="#1e3a8a" />
                                </View>
                            ) : (
                                <>
                                    {dealDiscount > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-emerald-600 font-medium">Giảm giá ưu đãi:</Text>
                                            <Text className="text-sm text-emerald-600 font-semibold">
                                                - {(dealDiscount - pointsDiscount).toLocaleString("vi-VN")} ₫
                                            </Text>
                                        </View>
                                    )}
                                    {tierDiscount > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-emerald-600 font-medium">Ưu đãi hạng {user?.loyaltyTier}:</Text>
                                            <Text className="text-sm text-emerald-600 font-semibold">
                                                - {tierDiscount.toLocaleString("vi-VN")} ₫
                                            </Text>
                                        </View>
                                    )}
                                    {pointsDiscount > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-sm text-emerald-600 font-medium">Giảm từ điểm:</Text>
                                            <Text className="text-sm text-emerald-600 font-semibold">
                                                - {pointsDiscount.toLocaleString("vi-VN")} ₫
                                            </Text>
                                        </View>
                                    )}

                                </>
                            )}

                            <View className="border-t border-dashed border-gray-300 mt-3 pt-3 flex-row justify-between items-center bg-gradient-to-r from-blue-50 to-transparent p-3 rounded-lg">
                                <View className="flex-row items-center gap-x-2">
                                    <Text className="text-base font-bold text-gray-800">Tổng cộng:</Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            Alert.alert(
                                                "Tổng cộng là gì?",
                                                "Là số tiền cuối cùng bạn cần thanh toán sau khi đã áp dụng tất cả các ưu đãi (mã giảm giá, điểm thưởng, hạng thành viên).",
                                            )
                                        }
                                    >
                                        <Ionicons name="help-circle-outline" size={16} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-2xl font-bold text-blue-900">{finalPrice.toLocaleString("vi-VN")} ₫</Text>
                            </View>
                        </View>
                    </View>

                    <View className="bg-white p-5 rounded-b-2xl shadow-sm">
                        <View className="flex-row items-center mb-4 pb-3 border-b border-gray-100">
                            <Ionicons name="card-outline" size={20} color="#1e3a8a" />
                            <Text className="text-lg font-bold text-blue-900 ml-3">Phương thức thanh toán</Text>
                        </View>
                        <View className="flex gap-4">
                            {/* PayPal */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod(PaymentMethod.PAYPAL)}
                                className={`flex-row items-center p-4 border-2 rounded-xl transition-all ${paymentMethod === PaymentMethod.PAYPAL ? "border-blue-900 bg-blue-50" : "border-gray-200 bg-white"}`}
                            >
                                <Image
                                    source={{ uri: "https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" }}
                                    className="w-16 h-7"
                                    resizeMode="contain"
                                />
                                <Text className="text-base font-semibold text-gray-800 ml-4 flex-1">PayPal</Text>
                                {paymentMethod === PaymentMethod.PAYPAL && (
                                    <Ionicons name="checkmark-circle" size={24} color="#1e3a8a" />
                                )}
                            </TouchableOpacity>
                            {/* Bank Transfer */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                                className={`flex-row items-center p-4 border-2 rounded-xl transition-all ${paymentMethod === PaymentMethod.BANK_TRANSFER ? "border-blue-900 bg-blue-50" : "border-gray-200 bg-white"}`}
                            >
                                <Image
                                    source={{
                                        uri: "data:image/png;base64,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",
                                    }}
                                    className="w-16 h-7 bg-white rounded"
                                    resizeMode="contain"
                                />
                                <Text className="text-base font-semibold text-gray-800 ml-4 flex-1">Chuyển khoản QR</Text>
                                {paymentMethod === PaymentMethod.BANK_TRANSFER && (
                                    <Ionicons name="checkmark-circle" size={24} color="#1e3a8a" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <SafeAreaView className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-xl">
                <TouchableOpacity
                    onPress={handleProcessPayment}
                    disabled={!paymentMethod}
                    className={`py-4 rounded-full ${!paymentMethod ? "bg-gray-300" : "bg-blue-900 active:bg-blue-800"}`}
                >
                    <Text className="text-white text-center font-bold text-lg">Tiến hành thanh toán</Text>
                </TouchableOpacity>
            </SafeAreaView>
            {/* Deal Selection Modal */}
            <Modal
                visible={dealModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setDealModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl p-4 max-h-[60%] shadow-xl">
                        <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
                            <Text className="text-xl font-bold text-blue-900">Chọn mã giảm giá</Text>
                            <TouchableOpacity onPress={() => setDealModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        {isLoadingDeals ? (
                            <ActivityIndicator size="large" color="#1e3a8a" />
                        ) : (
                            <ScrollView>
                                {eligibleDeals.map((deal) => (
                                    <TouchableOpacity
                                        key={deal.dealId}
                                        onPress={() => {
                                            setSelectedDeal(deal)
                                            setDealModalVisible(false)
                                        }}
                                        className="p-4 border-b border-gray-100 active:bg-gray-50 rounded-lg"
                                    >
                                        <Text className="text-base font-bold text-blue-900">{deal.dealCode}</Text>
                                        <Text className="text-sm text-gray-600 mt-1">{deal.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity
                            onPress={() => {
                                handleRemoveDeal()
                                setDealModalVisible(false)
                            }}
                            className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                            <Text className="text-center text-red-700 font-semibold">Không dùng mã</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default Checkout
