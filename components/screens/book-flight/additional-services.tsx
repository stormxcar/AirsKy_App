import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type AdditionalServicesProps = {
    extraBaggage: number;
    onBaggageChange: (value: number) => void;
    selectedMeal: boolean;
    onMealChange: (value: boolean) => void;
};

const AdditionalServices = ({ extraBaggage, onBaggageChange, selectedMeal, onMealChange }: AdditionalServicesProps) => {
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
                    <TouchableOpacity onPress={() => onBaggageChange(Math.max(0, extraBaggage - 5))} className="p-2 border border-gray-300 rounded-full"><Ionicons name="remove" size={20} color="#1e3a8a" /></TouchableOpacity>
                    <Text className="text-lg font-bold mx-3 w-12 text-center">{extraBaggage} kg</Text>
                    <TouchableOpacity onPress={() => onBaggageChange(extraBaggage + 5)} className="p-2 border border-gray-300 rounded-full"><Ionicons name="add" size={20} color="#1e3a8a" /></TouchableOpacity>
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