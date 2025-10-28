import { Seat } from '@/app/types/types';
import { SeatStatus } from '@/app/types/booking';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View, InteractionManager } from 'react-native';

type SeatMapProps = {
    seats: Seat[];
    onSelectSeat: (seatId: string) => void;
    selectedSeatId?: string; // Ghế được chọn bởi hành khách hiện tại
};

// --- Sub-component cho một ghế, được bọc trong React.memo ---
const SeatItem = React.memo(({ item, onSelectSeat, isSeatSelectedByCurrent }: { item: Seat, onSelectSeat: (id: string) => void, isSeatSelectedByCurrent: boolean }) => {
    // Map status to style object (tương đương getSeatColor)
    const getSeatStyle = (status: SeatStatus) => {
        switch (status) {
            case SeatStatus.AVAILABLE:
                return { backgroundColor: 'white', borderColor: '#1e40af' };
            case SeatStatus.OCCUPIED:
                return { backgroundColor: '#fca5a5', borderColor: '#ef4444' }; // red-300/red-500
            case SeatStatus.SELECTED:
                return { backgroundColor: '#fca5a5', borderColor: '#ef4444' }; // Ghế người khác trong đoàn chọn cũng hiển thị như đã đặt
            case SeatStatus.PENDING_PAYMENT:
                return { backgroundColor: '#fde68a', borderColor: '#f59e0b' };
            default:
                return { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' };
        }
    };

    // Ưu tiên style cho ghế đang được chọn, nếu không thì dùng style theo trạng thái
    const seatStyle = isSeatSelectedByCurrent
        ? styles.seatSelectedByCurrentUser
        : getSeatStyle(item.status);

    return (
        <TouchableOpacity
            onPress={() => onSelectSeat(item.id)}
            disabled={item.status === SeatStatus.OCCUPIED}
            style={[
                styles.seatBase,
                seatStyle,
            ]}
        >
            <Text style={[styles.seatText, item.status === SeatStatus.OCCUPIED && styles.seatTextOccupied]}>{item.seatNumber}</Text>
        </TouchableOpacity>
    );
});

const SeatMap = ({ seats, onSelectSeat, selectedSeatId }: SeatMapProps) => {

    const renderSeat = ({ item }: { item: Seat }) => {
        const isSeatSelectedByCurrent = selectedSeatId === item.id;
        return <SeatItem item={item} onSelectSeat={onSelectSeat} isSeatSelectedByCurrent={isSeatSelectedByCurrent} />;
    };

    return (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-blue-900 mb-2 text-center">Sơ đồ ghế ngồi</Text>
            <View className="flex-row justify-around mb-4">
                <View className="flex-row items-center">
                    <View className="w-4 h-4 bg-white border-2 border-blue-900 rounded-sm mr-2" /><Text className="text-xs text-gray-600">Còn trống</Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-4 h-4 bg-blue-900 rounded-sm mr-2" /><Text className="text-xs text-gray-600">Ghế bạn chọn</Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-4 h-4 bg-red-300 rounded-sm mr-2" /><Text className="text-xs text-gray-600">Đã đặt</Text>
                </View>
            </View>
            <FlatList
                data={seats}
                renderItem={renderSeat}
                keyExtractor={item => item.id}
                numColumns={6}
                contentContainerStyle={{ alignItems: 'center' }}
                scrollEnabled={false}
                // Tối ưu hóa FlatList
                initialNumToRender={30} // Render số lượng ghế ban đầu vừa đủ màn hình
                windowSize={5} // Giảm vùng render ngoài màn hình
            />
        </View>
    );
};

const styles = {
    seatBase: {
        width: 40,
        height: 40,
        margin: 4,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    seatSelectedByCurrentUser: {
        backgroundColor: '#1e3a8a', // blue-900
        borderColor: '#1e40af',
        // Thêm hiệu ứng ring bằng shadow
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
        elevation: 8,
    },
    seatText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1f2937', // gray-800
    },
    seatTextOccupied: {
        color: 'white', // gray-50
    }
};

export default SeatMap;