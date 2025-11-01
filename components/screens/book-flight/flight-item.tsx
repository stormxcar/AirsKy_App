import { Flight, TicketClass } from "@/app/types";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import Animated, { useAnimatedStyle, withTiming, Easing, useSharedValue } from 'react-native-reanimated';
import { Image, Text, TouchableOpacity, View } from "react-native";
import TicketClassCarousel from "./ticket-class-carousel";

type FlightItemProps = {
    flight: Flight;
    isSelected: boolean;
    selectedClassId: string | null;
    onSelect: () => void;
    onSelectClass: (ticketClass: TicketClass | null) => void;
};

const FlightItem = memo(({ flight, isSelected, selectedClassId, onSelect, onSelectClass }: FlightItemProps) => {
    // Sử dụng useSharedValue để lưu trữ chiều cao của nội dung
    const contentHeight = useSharedValue(0);

    // Tạo style động cho container của phần chọn hạng vé
    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            // Animate chiều cao để tạo hiệu ứng trượt
            // Nếu được chọn, chiều cao sẽ là giá trị đã đo, ngược lại là 0
            height: withTiming(isSelected ? contentHeight.value : 0, {
                duration: 300,
                easing: Easing.inOut(Easing.ease),
            }),
            // Animate độ mờ để hiệu ứng mượt hơn
            opacity: withTiming(isSelected ? 1 : 0, { duration: 150 }),
            overflow: 'hidden', // Quan trọng: ẩn nội dung khi chiều cao là 0
        };
    });

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onSelect} className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm overflow-hidden">
            {/* Airline Info */}
            <View className="flex-row items-center mb-3">
                {/* Sử dụng uri để tải ảnh từ URL */}
                {flight.airlineLogo && <Image source={{ uri: flight.airlineLogo }} className="w-6 h-6 rounded-full mr-2" />}
                <Text className="text-gray-600 font-medium">{flight.airline}</Text>
                <Text className="text-gray-400 text-xs mx-1">•</Text>
                <Text className="text-gray-500 text-sm">{flight.flightNumber}</Text>
            </View>

            {/* Flight Details */}
            <View className="flex-row justify-between items-center">
                {/* Departure */}
                <View className="items-start">
                    <Text className="text-xl font-bold text-blue-900">{flight.departure.time}</Text>
                    <Text className="text-gray-500 font-semibold">{flight.departure.code}</Text>
                </View>

                {/* Duration & Type */}
                <View className="items-center">
                    <Text className="text-gray-500 text-xs mb-1">{flight.duration}</Text>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full border border-blue-800" />
                        <View className="flex-1 h-[1px] bg-gray-300 w-12" />
                        <FontAwesome name="plane" size={16} color="#1e3a8a" />
                    </View>
                    <Text className="text-blue-900 text-xs mt-1 font-medium">{flight.type}</Text>
                </View>

                {/* Arrival */}
                <View className="items-end">
                    <Text className="text-xl font-bold text-blue-900">{flight.arrival.time}</Text>
                    <Text className="text-gray-500 font-semibold">{flight.arrival.code}</Text>
                </View>
            </View>

            {/* Price */}
            <View className="border-t border-dashed border-gray-200 mt-4 pt-3 flex-row justify-between items-center ">
                <View className="flex-row items-baseline">
                    <Text className="text-lg font-bold text-blue-900">{flight.price.toLocaleString('vi-VN')} ₫</Text>
                    <Text className="text-gray-500 text-xs ml-1">/khách</Text>
                </View>

                {/* Nút mới để mở/đóng phần chọn hạng vé */}
                <TouchableOpacity onPress={onSelect} className="p-2">
                    <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={24} color="#1e3a8a" />
                </TouchableOpacity>
            </View>

            {/* Phần chọn hạng vé với hiệu ứng động */}
            <Animated.View style={animatedContainerStyle}>
                {/* View này dùng để đo chiều cao thực tế của nội dung */}
                <View
                    onLayout={(event) => {
                        const { height } = event.nativeEvent.layout;
                        // Chỉ cập nhật nếu chiều cao thay đổi để tránh vòng lặp render không cần thiết
                        if (height > 0 && contentHeight.value !== height) {
                            contentHeight.value = height;
                        }
                    }}
                    className="mt-4 pt-4 border-t border-gray-100 absolute top-0 left-0 right-0 opacity-0"
                >
                    <Text className="text-gray-700 font-semibold mb-3">Chọn hạng vé:</Text>
                    <TicketClassCarousel
                        ticketClasses={flight.ticketClasses}
                        selectedClassId={selectedClassId}
                        onSelectClass={onSelectClass}
                    />
                </View>
                {/* View này hiển thị nội dung thực tế */}
                <View className="mt-4 pt-4 border-t border-gray-100">
                    <Text className="text-gray-700 font-semibold mb-3">Chọn hạng vé:</Text>
                    <TicketClassCarousel
                        ticketClasses={flight.ticketClasses}
                        selectedClassId={selectedClassId}
                        onSelectClass={onSelectClass}
                    />
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
});

export default FlightItem;
