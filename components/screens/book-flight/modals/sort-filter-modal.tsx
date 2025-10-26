import { Flight } from '@/app/types/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type SortOption = 'time_asc' | 'time_desc' | 'price_asc' | 'price_desc' | 'duration_asc';
export type TimeOfDayFilter = 'morning' | 'afternoon' | 'evening' | 'night';

export interface FilterOptions {
    airlines: string[];
    stops: ('direct' | 'one_stop')[];
    timesOfDay: TimeOfDayFilter[];
}

const SORT_OPTIONS: { key: SortOption, label: string }[] = [
    { key: 'time_asc', label: 'Giờ bay sớm nhất' },
    { key: 'time_desc', label: 'Giờ bay muộn nhất' },
    { key: 'price_asc', label: 'Giá thấp nhất' },
    { key: 'price_desc', label: 'Giá cao nhất' },
    { key: 'duration_asc', label: 'Thời gian bay ngắn nhất' },
];

const TIME_OF_DAY_OPTIONS: { key: TimeOfDayFilter, label: string }[] = [
    { key: 'morning', label: 'Sáng (00:00 - 12:00)' },
    { key: 'afternoon', label: 'Trưa (12:00 - 18:00)' },
    { key: 'evening', label: 'Chiều (18:00 - 21:00)' },
    { key: 'night', label: 'Tối (21:00 - 24:00)' },
];

const STOP_OPTIONS: { key: 'direct' | 'one_stop', label: string }[] = [
    { key: 'direct', label: 'Bay thẳng' },
    { key: 'one_stop', label: '1 điểm dừng' },
];

type SortFilterModalProps = {
    visible: boolean;
    onClose: () => void;
    onApply: (sort: SortOption, filters: FilterOptions) => void;
    initialSort: SortOption;
    initialFilters: FilterOptions;
    allFlights: Flight[]; // Cần danh sách gốc để lấy ra các hãng bay
};

const SortFilterModal = ({ visible, onClose, onApply, initialSort, initialFilters, allFlights }: SortFilterModalProps) => {
    const [sort, setSort] = useState(initialSort);
    const [filters, setFilters] = useState(initialFilters);

    const availableAirlines = useMemo(() => {
        const airlines = new Set(allFlights.map(f => f.airline));
        return Array.from(airlines);
    }, [allFlights]);

    const handleApply = () => {
        onApply(sort, filters);
        onClose();
    };

    const handleReset = () => {
        setSort('time_asc');
        setFilters({ airlines: [], stops: [], timesOfDay: [] });
    };

    const toggleFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K][number]) => {
        setFilters(prev => {
            const currentValues = prev[key] as any[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [key]: newValues };
        });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                    <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
                    <Text className="text-lg font-bold text-blue-900">Sắp xếp & Lọc</Text>
                    <TouchableOpacity onPress={handleReset}><Text className="text-blue-900 font-semibold">Đặt lại</Text></TouchableOpacity>
                </View>

                <ScrollView className="p-4">
                    {/* Sắp xếp */}
                    <View className="mb-6">
                        <Text className="text-base font-bold text-gray-800 mb-3">Sắp xếp theo</Text>
                        {SORT_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt.key} onPress={() => setSort(opt.key)} className="flex-row items-center justify-between py-3">
                                <Text className={`text-base ${sort === opt.key ? 'font-bold text-blue-900' : 'text-gray-700'}`}>{opt.label}</Text>
                                {sort === opt.key && <Ionicons name="checkmark" size={24} color="#1e3a8a" />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Lọc theo hãng */}
                    <View className="mb-6">
                        <Text className="text-base font-bold text-gray-800 mb-3">Hãng hàng không</Text>
                        {availableAirlines.map(airline => (
                            <TouchableOpacity key={airline} onPress={() => toggleFilter('airlines', airline)} className="flex-row items-center justify-between py-3">
                                <Text className={`text-base ${filters.airlines.includes(airline) ? 'font-bold text-blue-900' : 'text-gray-700'}`}>{airline}</Text>
                                <Ionicons name={filters.airlines.includes(airline) ? "checkbox" : "square-outline"} size={24} color="#1e3a8a" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Lọc theo thời gian */}
                    <View className="mb-6">
                        <Text className="text-base font-bold text-gray-800 mb-3">Thời gian bay</Text>
                        {TIME_OF_DAY_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt.key} onPress={() => toggleFilter('timesOfDay', opt.key)} className="flex-row items-center justify-between py-3">
                                <Text className={`text-base ${filters.timesOfDay.includes(opt.key) ? 'font-bold text-blue-900' : 'text-gray-700'}`}>{opt.label}</Text>
                                <Ionicons name={filters.timesOfDay.includes(opt.key) ? "checkbox" : "square-outline"} size={24} color="#1e3a8a" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Lọc theo điểm dừng */}
                    <View className="mb-6">
                        <Text className="text-base font-bold text-gray-800 mb-3">Điểm dừng</Text>
                        {STOP_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt.key} onPress={() => toggleFilter('stops', opt.key)} className="flex-row items-center justify-between py-3">
                                <Text className={`text-base ${filters.stops.includes(opt.key) ? 'font-bold text-blue-900' : 'text-gray-700'}`}>{opt.label}</Text>
                                <Ionicons name={filters.stops.includes(opt.key) ? "checkbox" : "square-outline"} size={24} color="#1e3a8a" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View className="p-4 border-t border-gray-200">
                    <TouchableOpacity onPress={handleApply} className="bg-blue-900 py-3 rounded-full shadow-md">
                        <Text className="text-white text-center font-bold text-lg">Áp dụng</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default SortFilterModal;