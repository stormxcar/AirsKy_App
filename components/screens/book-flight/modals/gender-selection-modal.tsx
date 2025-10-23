import { Passenger } from "@/app/types";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type GenderSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (gender: 'male' | 'female') => void;
  currentGender: Passenger['gender'];
};

const GenderSelectionModal = ({ visible, onClose, onSelect, currentGender }: GenderSelectionModalProps) => {
  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose} animationType="fade">
      <SafeAreaView className="flex-1 bg-black/30 justify-end">
        <View className="bg-white rounded-t-xl p-4">
          <Text className="text-lg font-bold text-blue-900 text-center">Chọn giới tính</Text>
          <TouchableOpacity onPress={() => onSelect('male')} className={`p-3 rounded-lg mb-2 border-2 ${currentGender === 'male' ? 'border-blue-900 bg-blue-50' : 'border-gray-200'}`}>
            <Text className="text-center text-lg">Nam</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSelect('female')} className={`p-3 rounded-lg border-2 ${currentGender === 'female' ? 'border-blue-900 bg-blue-50' : 'border-gray-200'}`}>
            <Text className="text-center text-lg">Nữ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="mt-4 bg-gray-200 p-3 rounded-lg">
            <Text className="text-center text-lg font-semibold">Hủy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default GenderSelectionModal;