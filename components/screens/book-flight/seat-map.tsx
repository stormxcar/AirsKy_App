import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

// --- Types ---
export type SeatStatus = 'available' | 'occupied' | 'selected' | 'exit';
export type Seat = { id: string; status: SeatStatus; price?: number };

type SeatMapProps = {
    seats: Seat[];
    onSelectSeat: (seatId: string) => void;
    selectedSeatId?: string; // Ghế được chọn bởi hành khách hiện tại
};

const getSeatColor = (status: SeatStatus) => {
    switch (status) {
        case 'available': return 'bg-gray-200 border-gray-400';
        case 'occupied': return 'bg-gray-400 border-gray-500';
        case 'selected': return 'bg-green-500 border-green-700';
        case 'exit': return 'bg-yellow-300 border-yellow-500';
        default: return 'bg-gray-200';
    }
};

const SeatMap = ({ seats, onSelectSeat, selectedSeatId }: SeatMapProps) => {

    const renderSeat = ({ item }: { item: Seat }) => {
        const isSeatSelectedByCurrent = selectedSeatId === item.id;
        return (
            <TouchableOpacity
                onPress={() => onSelectSeat(item.id)}
                disabled={item.status === 'occupied'}
                className={`w-10 h-10 m-1 rounded-md justify-center items-center border-2 ${getSeatColor(item.status)} ${isSeatSelectedByCurrent && 'ring-2 ring-blue-500'}`}
            >
                <Text className="text-xs font-bold">{item.id.replace(/\d+/g, '')}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-lg font-bold text-blue-900 mb-2 text-center">Sơ đồ ghế ngồi</Text>
            <View className="flex-row justify-around mb-4">
                <View className="flex-row items-center"><View className="w-4 h-4 bg-gray-200 rounded-sm mr-2" /><Text>Còn trống</Text></View>
                <View className="flex-row items-center"><View className="w-4 h-4 bg-green-500 rounded-sm mr-2" /><Text>Đang chọn</Text></View>
                <View className="flex-row items-center"><View className="w-4 h-4 bg-gray-400 rounded-sm mr-2" /><Text>Đã đặt</Text></View>
                <View className="flex-row items-center"><View className="w-4 h-4 bg-yellow-300 rounded-sm mr-2" /><Text>Thoát hiểm</Text></View>
            </View>
            <FlatList data={seats} renderItem={renderSeat} keyExtractor={item => item.id} numColumns={6} contentContainerStyle={{ alignItems: 'center' }} scrollEnabled={false} />
        </View>
    );
};

export default SeatMap;