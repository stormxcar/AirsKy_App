import React, { useEffect, useRef } from 'react';
import { Animated, View } from "react-native";

const DateScrollerItemSkeleton = () => {
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
        <Animated.View style={{ opacity }} className="items-center justify-center px-4 py-2 rounded-lg mx-1 w-28 h-[56px] bg-gray-200">
            <View className="h-4 w-20 bg-gray-300 rounded mb-2" />
            <View className="h-3 w-12 bg-gray-300 rounded" />
        </Animated.View>
    );
};

export default DateScrollerItemSkeleton;