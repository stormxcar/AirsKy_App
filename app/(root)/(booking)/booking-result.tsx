import { AncillaryServiceType, BookingResponse } from "@/app/types/booking";
import { useLoading } from "@/context/loading-context";
import { getBookingDetailsById } from "@/services/booking-service";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Share, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper để dịch tên loại ghế
const getSeatTypeName = (seatType: string) => {
    switch (seatType) {
        case 'FRONT_ROW': return 'Hàng đầu';
        case 'EXIT_ROW': return 'Lối thoát hiểm';
        case 'EXTRA_LEGROOM': return 'Để chân rộng';
        case 'ACCESSIBLE': return 'Ghế ưu tiên';
        case 'STANDARD': return 'Tiêu chuẩn';
        default: return seatType;
    }
};

// Helper để lấy icon cho từng loại dịch vụ
const getServiceIcon = (serviceType: AncillaryServiceType | 'BAGGAGE' | 'SEAT'): { name: any; library: 'Ionicons' | 'MaterialIcons' } => {
    switch (serviceType) {
        case 'BAGGAGE': return { name: 'briefcase-outline', library: 'Ionicons' };
        case 'SEAT': return { name: 'airline-seat-recline-normal', library: 'MaterialIcons' };
        case AncillaryServiceType.WIFI: return { name: 'wifi', library: 'Ionicons' };
        case AncillaryServiceType.MEAL: return { name: 'fast-food-outline', library: 'Ionicons' };
        case AncillaryServiceType.PRIORITY_BOARDING: return { name: 'rocket-outline', library: 'Ionicons' };
        default: return { name: 'add-circle-outline', library: 'Ionicons' };
    }
};

const BookingResult = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

    const status = params.status as 'success' | 'failure' | 'pending';
    const bookingCode = params.bookingCode as string;

    const [bookingDetails, setBookingDetails] = useState<BookingResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isSuccess = status === 'success';

    useEffect(() => {
        if (isSuccess && bookingCode) {
            showLoading(async () => {
                try {
                    setError(null);
                    const details = await getBookingDetailsById(bookingCode);
                    console.log("Payment price:", details.totalAmount);
                    setBookingDetails(details);
                } catch (err: any) {
                    setError(err.message || "Không thể tải chi tiết đơn đặt vé.");
                }
            });
        }
    }, [isSuccess, bookingCode]); // Không cần thêm showLoading vào dependencies

    const handleShare = async () => {
        if (!bookingDetails) {
            Alert.alert("Chưa có thông tin", "Không thể chia sẻ vì chưa tải được chi tiết đặt vé.");
            return;
        }

        try {
            const departureSegment = bookingDetails.flightSegments.find(s => s.segmentOrder === 1);
            const returnSegment = bookingDetails.flightSegments.find(s => s.segmentOrder === 2);

            // 🧾 Xây dựng nội dung chia sẻ đẹp hơn
            let message = `🎫 *XÁC NHẬN ĐẶT VÉ THÀNH CÔNG - AIRSKY*\n\n`;

            message += `*Mã đặt chỗ:* ${bookingDetails.bookingCode}\n`;
            message += `*Trạng thái:* ${bookingDetails.status === 'CONFIRMED' ? '✅ Đã xác nhận' : bookingDetails.status}\n\n`;

            if (departureSegment) {
                message += ` *CHUYẾN ĐI*\n`;
                message += `• ${departureSegment.departureAirport.airportName} (${departureSegment.departureAirport.airportCode}) → ${departureSegment.arrivalAirport.airportName} (${departureSegment.arrivalAirport.airportCode})\n`;
                message += `🗓️ ${new Date(departureSegment.departureTime).toLocaleDateString('vi-VN', {
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
                })}\n`;
                message += `⏰ ${new Date(departureSegment.departureTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit'
                })} → ${new Date(departureSegment.arrivalTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit'
                })}\n\n`;
            }

            if (returnSegment) {
                message += `🛬 *CHUYẾN VỀ*\n`;
                message += `• ${returnSegment.departureAirport.airportName} (${returnSegment.departureAirport.airportCode}) → ${returnSegment.arrivalAirport.airportName} (${returnSegment.arrivalAirport.airportCode})\n`;
                message += `🗓️ ${new Date(returnSegment.departureTime).toLocaleDateString('vi-VN', {
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
                })}\n`;
                message += `⏰ ${new Date(returnSegment.departureTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit'
                })} → ${new Date(returnSegment.arrivalTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit'
                })}\n\n`;
            }

            message += `👤 *Hành khách:* ${bookingDetails.passengers.map(p => `${p.lastName} ${p.firstName}`).join(', ')}\n`;
            message += `💺 *Dịch vụ:* ${bookingDetails.ancillaryServices?.length || 0} dịch vụ bổ sung\n`;
            message += `💰 *Tổng tiền:* ${bookingDetails.totalAmount.toLocaleString('vi-VN')} ₫\n\n`;
            message += `Cảm ơn bạn đã lựa chọn ✈️ *AirsKy Airlines*!\n`;
            message += `Chúc bạn có chuyến bay an toàn và thoải mái 🌤️`;

            await Share.share({
                message,
                title: `Thông tin đặt vé AirsKy: ${bookingDetails.bookingCode}`,
            });
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };


    // Nhóm các dịch vụ theo loại để hiển thị
    const groupedServices = useMemo(() => {
        if (!bookingDetails) return {};

        const servicesByPassenger: { [passengerId: number]: { [groupName: string]: { name: string, icon: { name: any; library: 'Ionicons' | 'MaterialIcons' } }[] } } = {};

        bookingDetails.passengers.forEach(p => {
            servicesByPassenger[p.passengerId] = {};

            // Nhóm ghế ngồi
            if (p.seatAssignments && p.seatAssignments.length > 0) {
                servicesByPassenger[p.passengerId]['Ghế đã chọn'] = p.seatAssignments
                    .sort((a, b) => a.segmentOrder - b.segmentOrder) // Sắp xếp theo thứ tự chặng bay
                    .map(seat => ({
                        name: `${seat.segmentOrder === 1 ? 'Chuyến đi' : 'Chuyến về'}: ${seat.seatNumber} (${getSeatTypeName(seat.seatType)})`,
                        icon: getServiceIcon('SEAT')
                    }));
            }

            // Nhóm hành lý
            if (bookingDetails.baggage && bookingDetails.baggage.length > 0) {
                servicesByPassenger[p.passengerId]['Hành lý ký gửi'] = bookingDetails.baggage.map(bag => ({
                    name: `Gói ${bag.purchasedPackage.replace('KG_', '')}kg`,
                    icon: getServiceIcon('BAGGAGE')
                }));
            }

            // Nhóm các dịch vụ khác
            const otherServices = bookingDetails.ancillaryServices?.filter(s => s.passengerId === p.passengerId) || [];
            if (otherServices.length > 0) {
                servicesByPassenger[p.passengerId]['Dịch vụ cộng thêm'] = otherServices.map(s => ({ name: s.serviceName, icon: getServiceIcon(s.serviceType as AncillaryServiceType) }));
            }
        });
        return servicesByPassenger;
    }, [bookingDetails]);

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
                                    <Text className="text-base font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">{bookingDetails?.bookingCode}</Text>
                                </View>

                                {isSuccess && !bookingDetails && (
                                    <Text className="text-gray-600 mt-2 text-center">
                                        Thông tin chi tiết về chuyến bay đã được gửi đến email của bạn.
                                        Bạn cũng có thể xem lại trong mục "Chuyến đi của tôi".
                                    </Text>
                                )}
                            </View>
                            {/* --- Hiển thị chi tiết nếu thành công và có dữ liệu --- */}
                            {isSuccess && bookingDetails && (
                                <View className="w-full mt-4 space-y-4">
                                    {/* Flight Segments */}
                                    {bookingDetails.flightSegments.map((segment, index) => (
                                        <View key={index} className="bg-white p-4 rounded-xl w-full border border-gray-200">
                                            <Text className="text-lg font-bold text-blue-900 mb-3">
                                                {segment.segmentOrder === 1 ? 'Chuyến đi' : 'Chuyến về'}
                                            </Text>
                                            <View className="flex-row justify-between items-center">
                                                <View className="items-start">
                                                    <Text className="text-xl font-bold text-blue-900">{new Date(segment.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                                                    <Text className="text-gray-500 font-semibold">{segment.departureAirport.airportCode}</Text>
                                                </View>
                                                <View className="items-center">
                                                    <Ionicons name="airplane" size={24} color="#1e3a8a" />
                                                    <Text className="text-xs text-gray-500">{segment.duration}</Text>
                                                </View>
                                                <View className="items-end">
                                                    <Text className="text-xl font-bold text-blue-900">{new Date(segment.arrivalTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                                                    <Text className="text-gray-500 font-semibold">{segment.arrivalAirport.airportCode}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-sm text-gray-500 text-center mt-2">
                                                {new Date(segment.departureTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </Text>
                                        </View>
                                    ))}

                                    {/* Passengers & Services */}
                                    <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
                                        <Text className="text-lg font-bold text-blue-900 mb-2">Hành khách & Dịch vụ</Text>
                                        {bookingDetails.passengers.map((p, index) => (
                                            <View key={index} className="py-3 border-b border-gray-100 last:border-b-0">
                                                <Text className="text-base font-semibold text-gray-800">{p.lastName} {p.firstName}</Text>
                                                {/* Hiển thị dịch vụ đã nhóm */}
                                                {Object.entries(groupedServices[p.passengerId] || {}).map(([groupName, services], gIdx) => (
                                                    <View key={gIdx} className="mt-2">
                                                        <Text className="text-sm font-semibold text-gray-700">{groupName}:</Text>
                                                        {services.map((service, sIdx) => (
                                                            <View key={sIdx} className="flex-row items-center ml-2 mt-1">
                                                                {service.icon.library === 'Ionicons' ? (
                                                                    <Ionicons name={service.icon.name} size={14} color="#4b5563" />
                                                                ) : (
                                                                    <MaterialIcons name={service.icon.name} size={14} color="#4b5563" />
                                                                )}
                                                                <Text className="text-sm text-gray-600 ml-1">{service.name}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                ))}
                                            </View>
                                        ))}
                                    </View>

                                    {/* Payment Summary */}
                                    <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
                                        <Text className="text-lg font-bold text-blue-900 mb-2">Thanh toán</Text>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-base text-gray-600">Tổng cộng:</Text>
                                            <Text className="text-xl font-bold text-red-600">{bookingDetails.totalAmount.toLocaleString('vi-VN')} ₫</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center mt-1">
                                            <Text className="text-base text-gray-600">Phương thức:</Text>
                                            <Text className="text-base font-semibold text-gray-800">{bookingDetails.payment?.paymentMethod}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                    {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}
                </View>

            </ScrollView>

            {/* --- Nút hành động --- */}
            <View className="p-4 bg-white border-t border-gray-200 flex-row items-center gap-x-3">
                {isSuccess && (
                    <TouchableOpacity
                        onPress={handleShare}
                        className="bg-gray-200 p-3 rounded-full shadow-md"
                    >
                        <Ionicons name="share-social-outline" size={24} color="#1e3a8a" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => router.replace('/(root)/(tabs)/home')}
                    className="bg-blue-900 py-3 rounded-full shadow-md flex-1"
                >
                    <Text className="text-white text-center font-bold text-lg">Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default BookingResult;
