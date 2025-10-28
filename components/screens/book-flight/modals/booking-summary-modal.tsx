import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Passenger, Seat, BaggagePackage } from '@/app/types/types';

const { height: screenHeight } = Dimensions.get('window');

type BookingSummaryModalProps = {
    passengers: Passenger[];
    selectedSeats: { [passengerId: number]: string }; // passengerId -> seatId
    selectedBaggages: { [passengerId: number]: BaggagePackage | null };
    selectedMeals: { [passengerId: number]: boolean };
    allSeats: Seat[]; // To get seatNumber from seatId
    currentPassengerIndex: number;
    onPassengerSelect: (index: number) => void;
    totalPrice: number;
    onContinue: () => void;
    showContinueButton: boolean;
};

const BookingSummaryModal = ({
    passengers,
    selectedSeats,
    selectedBaggages,
    selectedMeals,
    allSeats,
    currentPassengerIndex,
    onPassengerSelect,
    totalPrice,
    onContinue,
    showContinueButton,
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

    const getSeatNumber = (seatId: string | undefined) => {
        if (!seatId) return 'Chưa chọn';
        const seat = allSeats.find(s => s.id === seatId);
        return seat ? seat.seatNumber : 'N/A';
    };

    const getBaggageLabel = (pkg: BaggagePackage | null) => {
        return pkg ? pkg.label : 'Không';
    };

    const getMealLabel = (hasMeal: boolean) => {
        return hasMeal ? 'Có' : 'Không';
    };

    return (
        <View style={styles.container} className="bg-white border-t border-gray-200 shadow-lg">
            {/* Header / Toggle Bar */}
            <TouchableOpacity onPress={toggleExpand} style={styles.toggleBar} className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center">
                    <Ionicons name={isExpanded ? "chevron-down" : "chevron-up"} size={24} color="#1e3a8a" />
                    <Text className="text-lg font-bold text-blue-900 ml-2">Tổng số tiền:</Text>
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
                            <Text className="text-sm text-gray-600">
                                Ghế: {getSeatNumber(selectedSeats[p.id])}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                Hành lý: {getBaggageLabel(selectedBaggages[p.id])}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                Suất ăn: {getMealLabel(selectedMeals[p.id])}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* Continue Button (always visible at the bottom of the modal) */}
            {showContinueButton && (
                <View className="p-4 bg-white border-t border-gray-200">
                    <TouchableOpacity onPress={onContinue} className="bg-blue-900 py-3 rounded-full shadow-md">
                        <Text className="text-white text-center font-bold text-lg">Tiếp tục</Text>
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