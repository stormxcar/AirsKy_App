import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef } from 'react';
import { Animated, View } from "react-native";

// Component con cho các khối placeholder
const Placeholder = ({ width, height, style }: { width: number | string, height: number, style?: any }) => {
    return <View style={[{ width, height, backgroundColor: '#e0e0e0', borderRadius: 4 }, style]} />;
};

const FlightItemSkeleton = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 500 }),
                Animated.timing(opacity, { toValue: 0.3, useNativeDriver: true, duration: 800 }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View style={{ opacity }} className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
            {/* Airline Info */}
            <View className="flex-row items-center mb-3">
                <View style={{ width: 24, height: 24, backgroundColor: '#e0e0e0', borderRadius: 12, marginRight: 8 }} />
                <Placeholder width={100} height={16} />
            </View>

            {/* Flight Details */}
            <View className="flex-row justify-between items-center">
                {/* Departure */}
                <View className="items-start">
                    <Placeholder width={80} height={24} style={{ marginBottom: 4 }} />
                    <Placeholder width={50} height={16} />
                </View>

                {/* Duration & Type */}
                <View className="items-center">
                    <Placeholder width={60} height={12} style={{ marginBottom: 6 }} />
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full border border-gray-300" />
                        <View className="flex-1 h-[1px] bg-gray-300 w-12" />
                        <FontAwesome name="plane" size={16} color="#e0e0e0" />
                    </View>
                    <Placeholder width={70} height={12} style={{ marginTop: 6 }} />
                </View>

                {/* Arrival */}
                <View className="items-end">
                    <Placeholder width={80} height={24} style={{ marginBottom: 4 }} />
                    <Placeholder width={50} height={16} />
                </View>
            </View>

            {/* Price */}
            <View className="border-t border-dashed border-gray-200 mt-4 pt-3">
                <Placeholder width={120} height={20} />
            </View>
        </Animated.View>
    );
};

export default FlightItemSkeleton;