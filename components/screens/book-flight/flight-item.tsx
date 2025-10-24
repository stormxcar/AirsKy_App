import { Flight, TicketClass } from "@/app/types";
import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import TicketClassCarousel from "./ticket-class-carousel";

type FlightItemProps = {
    flight: Flight;
    isSelected: boolean;
    selectedClassId: string | null;
    onSelect: () => void;
    onSelectClass: (ticketClass: TicketClass | null) => void;
};

function FlightItem({ flight, isSelected, selectedClassId, onSelect, onSelectClass }: FlightItemProps) {
    return (
        // Khi nhấn vào item, gọi hàm onSelect từ props
        <TouchableOpacity onPress={onSelect} className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
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
            <View className="border-t border-dashed border-gray-200 mt-4 pt-3 flex-row justify-between items-center">
                {/* Giá chính không thay đổi */}
                <Text className="text-lg font-bold text-blue-900">{flight.price.toLocaleString('vi-VN')} ₫</Text>
                <Text className="text-gray-500 text-xs">/khách</Text>
            </View>

            {/* Chỉ hiển thị khi item này được chọn (isSelected là true) */}
            {isSelected && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                    <Text className="text-gray-700 font-semibold mb-3">Chọn hạng vé:</Text>
                    <TicketClassCarousel
                        ticketClasses={flight.ticketClasses}
                        selectedClassId={selectedClassId}
                        onSelectClass={onSelectClass}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
}

export default FlightItem;
