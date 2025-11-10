import { SEAT_TYPE_PRICES } from '@/app/(root)/(booking)/services-and-seats';
import { SeatStatus } from '@/app/types/booking';
import { Seat } from '@/app/types/types';
import * as React from 'react';
import { Alert, FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';

type SeatMapProps = {
    seats: Seat[];
    onSelectSeat: (seatId: string) => void;
    selectedSeatId?: string;
};

const SeatItem = React.memo(
    ({
        item,
        onSelectSeat,
        isSeatSelectedByCurrent,
    }: {
        item: Seat;
        onSelectSeat: (id: string) => void;
        isSeatSelectedByCurrent: boolean;
    }) => {
        const getSeatStyle = (status: SeatStatus, seatType: string) => {
            switch (status) {
                case SeatStatus.AVAILABLE:
                    switch (seatType) {
                        case 'FRONT_ROW':
                            return { backgroundColor: '#fef08a', borderColor: '#facc15' }; // Hàng đầu
                        case 'EXIT_ROW':
                            return { backgroundColor: '#fecaca', borderColor: '#f87171' }; // Lối thoát hiểm
                        case 'EXTRA_LEGROOM':
                            return { backgroundColor: '#dcfce7', borderColor: '#4ade80' }; // Thêm không gian chân
                        case 'ACCESSIBLE':
                            return { backgroundColor: '#cffafe', borderColor: '#22d3ee' }; // Ghế ưu tiên
                        default:
                            return { backgroundColor: 'white', borderColor: '#1e40af' }; // Tiêu chuẩn
                    }
                case SeatStatus.OCCUPIED:
                    return { backgroundColor: '#dc2626', borderColor: '#ef4444' }; // Đã đặt
                case SeatStatus.SELECTED:
                    return { backgroundColor: '#fca5a5', borderColor: '#ef4444' }; // Người khác chọn
                case SeatStatus.PENDING_PAYMENT:
                    return { backgroundColor: '#fde68a', borderColor: '#f59e0b' };
                case SeatStatus.DISABLED:
                    return { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' }; // Khác hạng vé / không dùng
                default:
                    return { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' };
            }
        };

        const seatStyle = isSeatSelectedByCurrent
            ? styles.seatSelectedByCurrentUser
            : getSeatStyle(item.status, item.seatType);

        const getSeatTypeName = (seatType: string) => {
            switch (seatType) {
                case 'FRONT_ROW':
                    return 'Hàng đầu';
                case 'EXIT_ROW':
                    return 'Lối thoát hiểm';
                case 'EXTRA_LEGROOM':
                    return 'Thêm không gian chân';
                case 'ACCESSIBLE':
                    return 'Ghế cho người khuyết tật';
                default:
                    return 'Tiêu chuẩn';
            }
        };

        const handleLongPress = () => {
            const seatTypeName = getSeatTypeName(item.seatType);
            const priceString = item.price.toLocaleString('vi-VN');
            Alert.alert(
                `Thông tin ghế ${item.seatNumber}`,
                `Loại ghế: ${seatTypeName}\nPhụ phí: +${priceString} ₫`
            );
        };

        return (
            <Pressable onLongPress={handleLongPress}>
                <TouchableOpacity
                    onPress={() => onSelectSeat(item.id)}
                    disabled={item.status === SeatStatus.OCCUPIED || item.status === SeatStatus.DISABLED}
                    style={[styles.seatBase, seatStyle]}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.seatText,
                            (item.status === SeatStatus.OCCUPIED || item.status === SeatStatus.DISABLED) &&
                                styles.seatTextOccupied,
                        ]}
                    >
                        {item.seatNumber}
                    </Text>
                </TouchableOpacity>
            </Pressable>
        );
    }
);

const SeatMap = ({ seats, onSelectSeat, selectedSeatId }: SeatMapProps) => {
    const seatRows = React.useMemo(() => {
        const rows = new Map<string, Seat[]>();
        seats.forEach(seat => {
            const rowNumber = seat.seatNumber.match(/^(\d+)/)?.[1];
            if (rowNumber) {
                if (!rows.has(rowNumber)) {
                    rows.set(rowNumber, []);
                }
                rows.get(rowNumber)?.push(seat);
            }
        });

        rows.forEach(rowSeats => {
            rowSeats.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
        });

        return Array.from(rows.entries())
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([rowNumber, seatsInRow]) => ({ rowNumber, seats: seatsInRow }));
    }, [seats]);

    const renderRow = ({ item: row }: { item: { rowNumber: string; seats: Seat[] } }) => (
        <View className="flex-row items-center justify-center my-1">
            {row.seats.slice(0, 3).map(seat => (
                <SeatItem
                    key={seat.id}
                    item={seat}
                    onSelectSeat={onSelectSeat}
                    isSeatSelectedByCurrent={selectedSeatId === seat.id}
                />
            ))}

            <View className="w-8 items-center justify-center">
                <Text className="font-bold text-gray-500">{row.rowNumber}</Text>
            </View>

            {row.seats.slice(3).map(seat => (
                <SeatItem
                    key={seat.id}
                    item={seat}
                    onSelectSeat={onSelectSeat}
                    isSeatSelectedByCurrent={selectedSeatId === seat.id}
                />
            ))}
        </View>
    );

    return (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
            <FlatList
                data={seatRows}
                renderItem={renderRow}
                keyExtractor={item => item.rowNumber}
                contentContainerStyle={{ alignItems: 'center' }}
                scrollEnabled={false}
                ListHeaderComponent={
                    <>
                        <Text className="text-lg font-bold text-blue-900 mb-4 text-center">Sơ đồ ghế ngồi</Text>
                        <View className="w-48 h-24 bg-gray-200 rounded-t-full mb-2 self-center" />
                    </>
                }
                ListFooterComponent={
                    <>
                        <View className="w-48 h-12 bg-gray-200 rounded-b-xl mt-2 self-center" />

                        {/* Legend */}
                        <View className="mt-6 space-y-2">
                            <Text className="text-base font-bold text-center text-blue-900 mb-2">Chú thích</Text>

                            <View className="flex justify-start gap-x-4 gap-y-2 p-5">
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#1e3a8a' }]} />
                                    <Text className="text-xs text-gray-600">Ghế bạn chọn</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#dc2626' }]} />
                                    <Text className="text-xs text-gray-600">Đã đặt</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#e5e7eb' }]} />
                                    <Text className="text-xs text-gray-600">Khác hạng vé</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: 'white', borderColor: '#1e40af' }]} />
                                    <Text className="text-xs text-gray-600">
                                        Tiêu chuẩn (+{SEAT_TYPE_PRICES.STANDARD.toLocaleString('vi-VN')}đ)
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#fef08a', borderColor: '#facc15' }]} />
                                    <Text className="text-xs text-gray-600">
                                        Hàng đầu (+{SEAT_TYPE_PRICES.FRONT_ROW.toLocaleString('vi-VN')}đ)
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#fecaca', borderColor: '#f87171' }]} />
                                    <Text className="text-xs text-gray-600">
                                        Lối thoát hiểm (+{SEAT_TYPE_PRICES.EXIT_ROW.toLocaleString('vi-VN')}đ)
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#dcfce7', borderColor: '#4ade80' }]} />
                                    <Text className="text-xs text-gray-600">
                                        Thêm không gian chân (+{SEAT_TYPE_PRICES.EXTRA_LEGROOM.toLocaleString('vi-VN')}đ)
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View style={[styles.legendBox, { backgroundColor: '#cffafe', borderColor: '#22d3ee' }]} />
                                    <Text className="text-xs text-gray-600">
                                        Ghế ưu tiên (+{SEAT_TYPE_PRICES.ACCESSIBLE.toLocaleString('vi-VN')}đ)
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                }
                initialNumToRender={30}
                windowSize={5}
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
        backgroundColor: '#1e3a8a',
        borderColor: '#1e40af',
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
        elevation: 8,
    },
    seatText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    seatTextOccupied: {
        color: 'white',
    },
    legendBox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
};

export default SeatMap;
