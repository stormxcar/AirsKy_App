import { BaggagePackage, BAGGAGE_PACKAGES } from '@/app/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type AdditionalServicesProps = {
    selectedBaggage: BaggagePackage | null;
    onBaggageChange: (pkg: BaggagePackage | null) => void;
    selectedMeal: boolean;
    onMealChange: (value: boolean) => void;
};

const AdditionalServices = ({ selectedBaggage, onBaggageChange, selectedMeal, onMealChange }: AdditionalServicesProps) => {
    const handleBaggageChange = (direction: 'next' | 'prev') => {
        const currentIndex = selectedBaggage ? BAGGAGE_PACKAGES.findIndex(p => p.key === selectedBaggage.key) : -1;
        if (direction === 'next') {
            const nextIndex = (currentIndex + 1) % BAGGAGE_PACKAGES.length;
            onBaggageChange(BAGGAGE_PACKAGES[nextIndex]);
        } else {
            const prevIndex = (currentIndex - 1 + BAGGAGE_PACKAGES.length) % BAGGAGE_PACKAGES.length;
            onBaggageChange(BAGGAGE_PACKAGES[prevIndex]);
        }
    };

    return (
        <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-lg font-bold text-blue-900 mb-3">Dịch vụ cộng thêm</Text>

            {/* Extra Baggage */}
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View>
                    <Text className="text-base font-semibold text-gray-800">Hành lý ký gửi</Text>
                    <Text className="text-sm text-gray-500">Thêm hành lý cho chuyến bay</Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => handleBaggageChange('prev')} className="p-2 border border-gray-300 rounded-full"><Ionicons name="remove" size={20} color="#1e3a8a" /></TouchableOpacity>
                    <Text className="text-lg font-bold mx-3 w-24 text-center">{selectedBaggage?.label ?? 'Không chọn'}</Text>
                    <TouchableOpacity onPress={() => handleBaggageChange('next')} className="p-2 border border-gray-300 rounded-full"><Ionicons name="add" size={20} color="#1e3a8a" /></TouchableOpacity>
                </View>
            </View>

            {/* Meal Selection */}
            <TouchableOpacity onPress={() => onMealChange(!selectedMeal)}>
                <View className="flex-row justify-between items-center py-3">
                    <View>
                        <Text className="text-base font-semibold text-gray-800">Suất ăn trên máy bay</Text>
                        <Text className="text-sm text-gray-500">Thưởng thức bữa ăn nóng</Text>
                    </View>
                    <MaterialCommunityIcons name={selectedMeal ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={28} color={selectedMeal ? "#1e3a8a" : "#ccc"} />
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default AdditionalServices;