
import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
export type Flight = {
    id: string;
    airline: string;
    airlineLogo: any; // Sử dụng require, nên kiểu là any hoặc number
    flightNumber: string;
    departure: { code: string; time: string };
    arrival: { code: string; time: string };
    duration: string;
    price: number;
    type: "Bay thẳng" | "1 điểm dừng";
};

// Define TicketClass type
export type TicketClass = {
    id: string;
    name: string;
    priceModifier: number; // e.g., 1 for Economy, 1.5 for Business, 2 for First
    description: string;
};

const TICKET_CLASSES: TicketClass[] = [
    { id: "economy", name: "Economy", priceModifier: 1, description: "Giá tiết kiệm" },
    { id: "business", name: "Business", priceModifier: 1.8, description: "Thoải mái hơn" },
    { id: "first", name: "First", priceModifier: 2.5, description: "Trải nghiệm cao cấp" },
];

type FlightItemProps = {
  flight: Flight;
  isSelected: boolean;
  selectedClassId: string | null;
  onSelect: () => void;
  onSelectClass: (ticketClass: TicketClass | null) => void;
};

// Lấy chiều rộng màn hình để tính toán chiều rộng cho mỗi item hạng vé
// Trừ đi padding của FlatList (16*2) và padding của card (16*2)
const TICKET_CLASS_ITEM_WIDTH = Dimensions.get('window').width - 32 - 32;

function FlightItem({ flight, isSelected, selectedClassId, onSelect, onSelectClass }: FlightItemProps) {
    return (
        // Khi nhấn vào item, gọi hàm onSelect từ props
        <TouchableOpacity onPress={onSelect} className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
            {/* Airline Info */}
            <View className="flex-row items-center mb-3">
                {flight.airlineLogo && <Image source={flight.airlineLogo} className="w-6 h-6 rounded-full mr-2" />}
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
                    <ScrollView
                        horizontal
                        pagingEnabled // Bật chế độ lật trang
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToInterval={TICKET_CLASS_ITEM_WIDTH} // Quan trọng: đảm bảo nó dừng đúng ở mỗi item
                        className="-mx-1" // Bù lại cho mx-1 của item con
                    >
                        {TICKET_CLASSES.map((ticketClass) => (
                            <TouchableOpacity
                                key={ticketClass.id}
                                // Bấm để chọn hoặc bỏ chọn hạng vé
                                onPress={() => onSelectClass(selectedClassId === ticketClass.id ? null : ticketClass)}
                                style={{ width: TICKET_CLASS_ITEM_WIDTH }}
                                className={`items-center p-4 mx-1 rounded-lg border-2 ${selectedClassId === ticketClass.id ? "border-blue-900 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                            >
                                <Text className={`text-lg font-bold ${selectedClassId === ticketClass.id ? "text-blue-900" : "text-gray-500"}`}>
                                    {ticketClass.name}
                                </Text>
                                <Text className={`text-xl font-bold mt-2 ${selectedClassId === ticketClass.id ? "text-blue-900" : "text-gray-500"}`}>
                                    {Math.round(flight.price * ticketClass.priceModifier).toLocaleString('vi-VN')} ₫
                                </Text>
                                <Text className="text-sm text-gray-500 mt-1">{ticketClass.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default FlightItem;
