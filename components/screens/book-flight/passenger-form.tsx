import { Passenger } from '@/app/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { differenceInYears, format } from 'date-fns';
import React, { useState } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper to calculate age and determine passenger type
export const getPassengerType = (dob: Date | null): 'adult' | 'child' | 'infant' => {
    if (!dob) return 'adult'; // Default to adult if DOB is not set
    const age = differenceInYears(new Date(), dob);
    if (age < 2) return 'infant';
    if (age < 12) return 'child';
    return 'adult';
};

type PassengerFormProps = {
    passenger: Passenger;
    index: number;
    onChange: (id: number, field: keyof Passenger, value: any) => void;
    onRemove?: (id: number) => void; // Optional: for removing passengers
    canRemove: boolean; // To control if remove button is visible
};

// Helper để xóa dấu tiếng Việt và chuyển thành chữ hoa
const processNameInput = (text: string) => {
    return text
        .normalize("NFD") // Chuẩn hóa Unicode (tách dấu ra khỏi chữ)
        .replace(/[\u0300-\u036f]/g, "") // Xóa các ký tự dấu
        .replace(/đ/g, "d").replace(/Đ/g, "D") // Chuyển đổi chữ 'đ' và 'Đ'
        .toUpperCase(); // Chuyển thành chữ hoa
};

const PassengerForm = ({ passenger, index, onChange, onRemove, canRemove }: PassengerFormProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);

    const isIdCardRequired = passenger.dob ? differenceInYears(new Date(), passenger.dob) >= 14 : false;

    const handleDateChange = (event: any, selectedDate?: Date) => {
        // Luôn đóng picker sau khi chọn hoặc hủy
        setShowDatePicker(false);
        if (selectedDate) {
            onChange(passenger.id, 'dob', selectedDate);
            onChange(passenger.id, 'type', getPassengerType(selectedDate)); // Update type based on DOB
        }
    };

    const handleGenderSelect = (gender: 'male' | 'female') => {
        onChange(passenger.id, 'gender', gender);
        setShowGenderPicker(false);
    };

    return (
        <>
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-blue-900">Hành khách {index + 1} ({passenger.type === 'adult' ? 'Người lớn' : passenger.type === 'child' ? 'Trẻ em' : 'Em bé'})</Text>
                    {canRemove && onRemove && (
                        <TouchableOpacity onPress={() => onRemove(passenger.id)} className="p-2">
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
                <TextInput
                    label="Họ"
                    mode="outlined"
                    value={passenger.lastName}
                    onChangeText={(text) => onChange(passenger.id, 'lastName', processNameInput(text))}
                    className="flex-1 "
                    style={{ backgroundColor: 'transparent' }}
                    autoCapitalize="characters"
                />
                <TextInput
                    label="Tên"
                    mode="outlined"
                    value={passenger.firstName}
                    onChangeText={(text) => onChange(passenger.id, 'firstName', processNameInput(text))}
                    className="flex-1"
                    style={{ backgroundColor: 'transparent' }}
                    autoCapitalize="characters"
                />

                {/* DOB Picker */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <TextInput
                        label="Chọn ngày sinh"
                        mode="outlined"
                        value={passenger.dob ? format(passenger.dob, 'dd/MM/yyyy') : ''}
                        editable={false}
                        pointerEvents="none" // Prevent keyboard from opening
                        // right={<TextInput.Icon icon="calendar" />}
                        className="mb-3"
                        style={{ backgroundColor: 'transparent' }}
                    />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={passenger.dob || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        textColor='gray'
                    />
                )}

                {/* Gender Picker */}
                <TouchableOpacity onPress={() => setShowGenderPicker(true)}>
                    <TextInput
                        label="Chọn giới tính"
                        mode="outlined"
                        value={passenger.gender === 'male' ? 'Nam' : passenger.gender === 'female' ? 'Nữ' : ''}
                        editable={false}
                        pointerEvents="none"
                        // right={<TextInput.Icon icon="chevron-down" />}
                        className="mb-3"
                        style={{ backgroundColor: 'transparent' }}
                    />
                </TouchableOpacity>

                <Modal
                    transparent={true}
                    visible={showGenderPicker}
                    onRequestClose={() => setShowGenderPicker(false)}
                    animationType="fade"
                >
                    <SafeAreaView className="flex-1 bg-black/30 justify-end">
                        <View className="bg-white rounded-t-xl p-4">
                            <Text className="text-lg font-bold text-blue-900 mb-4 text-center">Chọn giới tính</Text>
                            <TouchableOpacity
                                onPress={() => handleGenderSelect('male')}
                                className={`p-3 rounded-lg mb-2 border-2 ${passenger.gender === 'male' ? 'border-blue-900 bg-blue-50' : 'border-gray-200'}`}
                            >
                                <Text className="text-center text-lg">Nam</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleGenderSelect('female')}
                                className={`p-3 rounded-lg border-2 ${passenger.gender === 'female' ? 'border-blue-900 bg-blue-50' : 'border-gray-200'}`}
                            >
                                <Text className="text-center text-lg">Nữ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowGenderPicker(false)} className="mt-4 bg-gray-200 p-3 rounded-lg">
                                <Text className="text-center text-lg font-semibold">Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </Modal>

                {isIdCardRequired && (
                    <TextInput
                        label="Số CCCD/Passport"
                        mode="outlined"
                        value={passenger.idCard}
                        onChangeText={(text) => onChange(passenger.id, 'idCard', text)} 
                        style={{ backgroundColor: 'transparent' }}
                    />
                )}
            </View>
        </>
    );
};

export default PassengerForm;
