import { BaggagePackage, BAGGAGE_PACKAGES } from '@/app/types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type AdditionalServicesProps = {
    selectedBaggage: BaggagePackage | null;
    onBaggageChange: (pkg: BaggagePackage | null) => void;
    selectedMeal: boolean;
    onMealChange: (value: boolean) => void;
};

const AdditionalServices = ({ selectedBaggage, onBaggageChange, selectedMeal, onMealChange }: AdditionalServicesProps) => {
    return (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-blue-900 mb-3">Dịch vụ cộng thêm</Text>

            {/* Extra Baggage */}
            <View className=" py-3 border-b border-gray-100 gap-2">
                <View className='mb-3'>
                    <Text className="text-base font-semibold text-gray-800">Hành lý ký gửi</Text>
                    <Text className="text-sm text-gray-500">Chọn gói hành lý cho hành khách này</Text>
                </View>
                {BAGGAGE_PACKAGES.map((pkg) => {
                    const isSelected = selectedBaggage?.key === pkg.key;
                    return (
                        <TouchableOpacity key={pkg.key} onPress={() => onBaggageChange(isSelected ? null : pkg)} className={`p-4 border-2 rounded-xl flex-row justify-between items-center ${isSelected ? 'border-blue-900 bg-blue-50' : 'border-gray-300'}`}>
                            <Text className={`font-bold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{pkg.label}</Text>
                            <MaterialCommunityIcons name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={28} color={isSelected ? "#1e3a8a" : "#ccc"} />
                        </TouchableOpacity>
                    );
                })}
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