import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData, MarkedDates } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

type DatePickerModalProps = {
    visible: boolean;
    onClose: () => void;
    onDayPress: (day: DateData) => void;
    markedDates: MarkedDates;
    tripType: "round-trip" | "one-way" | "multi-city";
};

const DatePickerModal = ({ visible, onClose, onDayPress, markedDates, tripType }: DatePickerModalProps) => {
    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <SafeAreaView edges={['top']} className="flex-1 bg-black/30 justify-end">
                <View className="bg-white h-[60%] rounded-t-3xl overflow-hidden">
                    <View className="p-4 border-b border-gray-200">
                        <Text className="text-lg font-bold text-center text-blue-900">
                            {tripType === 'one-way' ? 'Chọn ngày đi' : 'Chọn ngày đi và ngày về'}
                        </Text>
                        <TouchableOpacity onPress={onClose} className="absolute top-4 right-4">
                            <Ionicons name="close-circle" size={28} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                    <Calendar
                        onDayPress={onDayPress}
                        markingType={'period'}
                        markedDates={markedDates}
                        minDate={new Date().toISOString().split('T')[0]}
                        theme={{
                            todayTextColor: '#ef4444',
                            arrowColor: '#1e3a8a',
                            'stylesheet.calendar.header': {
                                week: { marginTop: 5, flexDirection: 'row', justifyContent: 'space-around' },
                            }
                        }}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default DatePickerModal;