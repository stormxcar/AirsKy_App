import { Airport } from '@/app/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type AirportSelectionModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (airport: Airport) => void;
    airports: Airport[];
    editingField: 'origin' | 'destination' | null;
};

const AirportSelectionModal = ({ visible, onClose, onSelect, airports, editingField }: AirportSelectionModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Reset search query when modal is opened
    useEffect(() => {
        if (visible) {
            setSearchQuery('');
        }
    }, [visible]);

    const filteredAirports = useMemo(() =>
        airports.filter(airport =>
            airport.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            airport.code.toLowerCase().includes(searchQuery.toLowerCase())
        ), [searchQuery, airports]);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <SafeAreaView edges={['top']} className="flex-1 bg-black/30 justify-end">
                <View className="bg-white h-[90%] rounded-t-3xl overflow-hidden">
                    <View className="p-4 border-b border-gray-200">
                        <Text className="text-lg font-bold text-center text-blue-900">
                            {editingField === 'origin' ? 'Chọn điểm đi' : 'Chọn điểm đến'}
                        </Text>
                        <TouchableOpacity onPress={onClose} className="absolute top-4 right-4">
                            <Ionicons name="close-circle" size={28} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                    <View className="p-4">
                        <TextInput placeholder="Tìm kiếm thành phố hoặc sân bay..." value={searchQuery} onChangeText={setSearchQuery} className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-200" />
                    </View>
                    <FlatList
                        data={filteredAirports}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onSelect(item)} className="px-6 py-4 border-b border-gray-100 flex-row items-center">
                                <View className="w-16"><Text className="text-xl font-bold text-blue-900">{item.code}</Text></View>
                                <View><Text className="font-semibold text-gray-800">{item.city}</Text><Text className="text-sm text-gray-500">{item.name}</Text></View>
                            </TouchableOpacity>
                        )} />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default AirportSelectionModal;