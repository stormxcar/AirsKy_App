import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Passenger, Seat, BaggagePackage, MOCK_ANCILLARY_SERVICES } from '@/app/types/types';

const { height: screenHeight } = Dimensions.get('window');

type BookingSummaryModalProps = {
    passengers: Passenger[];
    selectedSeats: { depart: { [passengerId: number]: string }, return: { [passengerId: number]: string } };
    selectedBaggages: { depart: { [passengerId: number]: BaggagePackage | null }, return: { [passengerId: number]: BaggagePackage | null } };
    selectedAncillaryServices: { depart: { [passengerId: number]: { [serviceId: number]: boolean } }, return: { [passengerId: number]: { [serviceId: number]: boolean } } };
    departSeats: Seat[]; // Ghế chuyến đi
    returnSeats: Seat[]; // Ghế chuyến về
    currentPassengerIndex: number;
    onPassengerSelect: (index: number) => void;
    totalPrice: number;
    onContinue: () => void;
    showContinueButton: boolean;
    isRoundTrip: boolean;
    selectionPhase: 'depart' | 'return';
};

const BookingSummaryModal = ({
    passengers,
    selectedSeats,
    selectedBaggages,
    selectedAncillaryServices,
    departSeats,
    returnSeats,
    currentPassengerIndex,
    onPassengerSelect,
    totalPrice,
    onContinue,
    showContinueButton,
    isRoundTrip,
    selectionPhase,
}: BookingSummaryModalProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const animatedHeight = React.useRef(new Animated.Value(0)).current;

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    React.useEffect(() => {
        Animated.timing(animatedHeight, {
            toValue: isExpanded ? screenHeight * 0.7 : 0, // Expand to 70% of screen height
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isExpanded]);

    const summaryHeightStyle = {
        height: animatedHeight,
    };

    const getSeatInfo = (seatId: string | undefined, phase: 'depart' | 'return') => {
        if (!seatId) return 'Chưa chọn';
        const seatList = phase === 'depart' ? departSeats : returnSeats;
        const seat = seatList.find(s => s.id === seatId);
        if (!seat) return 'N/A';

        const priceText = seat.price > 0 ? ` (+${seat.price.toLocaleString('vi-VN')} ₫)` : '';
        const seatTypeText = seat.seatType !== 'STANDARD' ? ` (${seat.seatType})` : '';
        return `${seat.seatNumber}${seatTypeText}${priceText}`;
    };

    const getBaggageLabel = (pkg: BaggagePackage | null) => {
        return pkg ? pkg.label : 'Không';
    };

    const getAncillaryServicesSummary = (passengerId: number, phase: 'depart' | 'return') => {
        const services = selectedAncillaryServices?.[phase]?.[passengerId];
        if (!services || Object.keys(services).length === 0) {
            return <Text className="text-sm text-gray-600">Dịch vụ khác: Không</Text>;
        }
        const selectedServiceNames = Object.keys(services)
            .filter(serviceId => services[parseInt(serviceId)])
            .map(serviceId => {
                const serviceInfo = MOCK_ANCILLARY_SERVICES.find(s => s.serviceId === parseInt(serviceId));
                return serviceInfo ? serviceInfo.serviceName : `Dịch vụ #${serviceId}`;
            });
        return <Text className="text-sm text-gray-600">Dịch vụ khác: {selectedServiceNames.join(', ')}</Text>;
    };

    return (
        <View style={styles.container} className="bg-white border-t border-gray-200 shadow-lg">
            {/* Header / Toggle Bar - Hiển thị khi thu gọn */}
            <TouchableOpacity onPress={toggleExpand} style={styles.toggleBar} className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center">
                    <Ionicons name={isExpanded ? "chevron-down" : "chevron-up"} size={24} color="#1e3a8a" />
                    <Text className="text-lg font-bold text-blue-900 ml-2">{isExpanded ? 'Thu gọn' : 'Tóm tắt & tổng tiền'}</Text>
                </View>
                <Text className="text-xl font-bold text-red-600">{totalPrice.toLocaleString('vi-VN')} ₫</Text>
            </TouchableOpacity>

            {/* Expanded Content */}
            <Animated.View style={[styles.expandedContent, summaryHeightStyle]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {passengers.map((p, index) => (
                        <TouchableOpacity
                            key={p.id}
                            onPress={() => onPassengerSelect(index)}
                            className={`p-3 mb-2 rounded-lg border-2 ${currentPassengerIndex === index ? 'border-blue-900 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                            <Text className={`font-bold ${currentPassengerIndex === index ? 'text-blue-900' : 'text-gray-800'}`}>
                                {p.lastName} {p.firstName}
                            </Text>
                            {/* Chuyến đi */}
                            <View className="mt-1 pl-2 border-l-2 border-gray-200">
                                <Text className="text-xs font-semibold text-gray-500">Chuyến đi</Text>
                                <Text className="text-sm text-gray-600">
                                    Ghế: {getSeatInfo(selectedSeats.depart[p.id], 'depart')}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                    Hành lý: {getBaggageLabel(selectedBaggages.depart[p.id])}
                                </Text>
                                {getAncillaryServicesSummary(p.id, 'depart')}
                            </View>
                            {/* Chuyến về (nếu có) */}
                            {isRoundTrip && (
                                <View className="mt-2 pl-2 border-l-2 border-gray-200">
                                    <Text className="text-xs font-semibold text-gray-500">Chuyến về</Text>
                                    <Text className="text-sm text-gray-600">
                                        Ghế: {getSeatInfo(selectedSeats.return[p.id], 'return')}
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        Hành lý: {getBaggageLabel(selectedBaggages.return[p.id])}
                                    </Text>
                                    {getAncillaryServicesSummary(p.id, 'return')}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* Continue Button (always visible at the bottom of the modal) */}
            {showContinueButton && (
                <View className="p-4 bg-white border-t border-gray-200">
                    <TouchableOpacity onPress={onContinue} className="bg-blue-900 py-3 rounded-full shadow-md">
                        <Text className="text-white text-center font-bold text-lg">
                            {isRoundTrip && selectionPhase === 'depart'
                                ? 'Chọn cho chuyến về'
                                : 'Tiếp tục'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100, // Ensure it's above other content
    },
    toggleBar: {
        backgroundColor: 'white',
    },
    expandedContent: {
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 16,
    },
});

export default BookingSummaryModal;