import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type PassengerSelectionModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: (passengers: { adults: number, children: number, infants: number }) => void;
    initialAdults: number;
    initialChildren: number;
    initialInfants: number;
};

const PassengerSelectionModal = ({ visible, onClose, onConfirm, initialAdults, initialChildren, initialInfants }: PassengerSelectionModalProps) => {
    const [adults, setAdults] = useState(initialAdults);
    const [children, setChildren] = useState(initialChildren);
    const [infants, setInfants] = useState(initialInfants);

    useEffect(() => {
        if (visible) {
            setAdults(initialAdults);
            setChildren(initialChildren);
            setInfants(initialInfants);
        }
    }, [visible, initialAdults, initialChildren, initialInfants]);

    useEffect(() => {
        if (infants > adults) setInfants(adults);
    }, [adults, infants]);

    const handleConfirm = () => {
        onConfirm({ adults, children, infants });
        onClose();
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <SafeAreaView edges={['top']} className="flex-1 bg-black/30 justify-end">
                <View className="bg-white h-[55%] rounded-t-3xl overflow-hidden">
                    <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-blue-900">Chọn hành khách</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#ccc" /></TouchableOpacity>
                    </View>
                    <View className="p-4 flex-1">
                        {/* Adult Counter */}
                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                            <View>
                                <Text className="text-lg font-semibold text-gray-800">Người lớn</Text>
                                <Text className="text-sm text-gray-500">Từ 12 tuổi trở lên</Text>
                            </View>
                            <View className="flex-row items-center">
                                <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))} className="p-2 border border-gray-300 rounded-full"><Ionicons name="remove" size={20} color="#1e3a8a" /></TouchableOpacity>
                                <Text className="text-xl font-bold mx-4">{adults}</Text>
                                <TouchableOpacity onPress={() => setAdults(adults + 1)} className="p-2 border border-gray-300 rounded-full"><Ionicons name="add" size={20} color="#1e3a8a" /></TouchableOpacity>
                            </View>
                        </View>

                        {/* Children Counter */}
                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                            <View>
                                <Text className="text-lg font-semibold text-gray-800">Trẻ em</Text>
                                <Text className="text-sm text-gray-500">Từ 2 đến dưới 12 tuổi</Text>
                            </View>
                            <View className="flex-row items-center">
                                <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))} className="p-2 border border-gray-300 rounded-full"><Ionicons name="remove" size={20} color="#1e3a8a" /></TouchableOpacity>
                                <Text className="text-xl font-bold mx-4">{children}</Text>
                                <TouchableOpacity onPress={() => setChildren(children + 1)} className="p-2 border border-gray-300 rounded-full"><Ionicons name="add" size={20} color="#1e3a8a" /></TouchableOpacity>
                            </View>
                        </View>

                        {/* Infant Counter */}
                        <View className="flex-row justify-between items-center py-3">
                            <View>
                                <Text className="text-lg font-semibold text-gray-800">Em bé</Text>
                                <Text className="text-sm text-gray-500">Dưới 2 tuổi (ngồi lòng)</Text>
                            </View>
                            <View className="flex-row items-center">
                                <TouchableOpacity onPress={() => setInfants(Math.max(0, infants - 1))} className="p-2 border border-gray-300 rounded-full"><Ionicons name="remove" size={20} color="#1e3a8a" /></TouchableOpacity>
                                <Text className="text-xl font-bold mx-4">{infants}</Text>
                                <TouchableOpacity onPress={() => setInfants(Math.min(adults, infants + 1))} className="p-2 border border-gray-300 rounded-full"><Ionicons name="add" size={20} color="#1e3a8a" /></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View className="p-4">
                        <TouchableOpacity onPress={handleConfirm} className="bg-blue-900 py-3 rounded-full shadow-md">
                            <Text className="text-white text-center font-bold text-lg">Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default PassengerSelectionModal;