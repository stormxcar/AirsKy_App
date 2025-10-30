import { Passenger } from '@/app/types';
import GenderSelectionModal from '@/components/screens/book-flight/modals/gender-selection-modal';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { differenceInYears, format } from 'date-fns';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-paper';

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
            <View className="bg-white rounded-xl p-4 gap-2 mb-4 border border-gray-200">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-blue-900">Hành khách {index + 1} ({passenger.type === 'adult' ? 'Người lớn' : passenger.type === 'child' ? 'Trẻ em' : 'Em bé'})</Text>
                    {canRemove && onRemove && (
                        <TouchableOpacity onPress={() => onRemove(passenger.id)} className="p-2">
                            <Ionicons name="trash-outline" size={24} color="#1e3a8a" />
                        </TouchableOpacity>
                    )}
                </View>
                <TextInput
                    label="Họ"
                    mode="outlined"
                    value={passenger.lastName}
                    onChangeText={(text) => onChange(passenger.id, 'lastName', processNameInput(text))}
                    className="flex-1 "
                    style={{ backgroundColor: 'transparent',fontSize:14 }}
                    autoCapitalize="characters"
                    
                />
                <TextInput
                    label="Tên"
                    mode="outlined"
                    value={passenger.firstName}
                    onChangeText={(text) => onChange(passenger.id, 'firstName', processNameInput(text))}
                    className="flex-1"
                    style={{ backgroundColor: 'transparent',fontSize:14 }}
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
                        style={{ backgroundColor: 'transparent',fontSize:14 }}
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
                        style={{ backgroundColor: 'transparent',fontSize:14 }}
                    />
                </TouchableOpacity>

                <GenderSelectionModal
                    visible={showGenderPicker}
                    onClose={() => setShowGenderPicker(false)}
                    onSelect={handleGenderSelect}
                    currentGender={passenger.gender}
                />

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
