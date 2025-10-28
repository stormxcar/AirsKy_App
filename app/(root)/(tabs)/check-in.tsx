import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper để xóa dấu tiếng Việt và chuyển thành chữ hoa
const processNameInput = (text: string) => {
  return text
    .normalize("NFD") // Chuẩn hóa Unicode (tách dấu ra khỏi chữ)
    .replace(/[\u0300-\u036f]/g, "") // Xóa các ký tự dấu
    .replace(/đ/g, "d").replace(/Đ/g, "D") // Chuyển đổi chữ 'đ' và 'Đ'
    .toUpperCase(); // Chuyển thành chữ hoa
};

const CheckIn = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const router = useRouter();

  const handleSearchBooking = () => {
    if (!bookingCode.trim() || !fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ Mã đặt chỗ và Họ tên.");
      return;
    }
    // TODO: Thêm logic gọi API để tìm kiếm thông tin đặt chỗ
    console.log("Searching for:", { bookingCode, fullName });
    Alert.alert("Tìm kiếm", `Đang tìm kiếm mã đặt chỗ: ${bookingCode}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      {/* Header */}
      <Text className="p-4 text-center text-white font-bold uppercase">CHECK-IN</Text>
      <View className="bg-white pt-8 flex-1 rounded-t-[40px] p-4">
        <Text className="text-gray-500 mb-4 text-center">Làm thủ tục trực tuyến từ 48 giờ đến 90 phút trước giờ khởi hành.</Text>
        
        <TouchableOpacity onPress={() => setHelpModalVisible(true)} className="flex-row items-center justify-center bg-blue-50 p-3 rounded-lg mb-6">
          <Ionicons name="help-circle-outline" size={20} color="#1e3a8a" />
          <Text className="text-blue-950 ml-2 font-semibold">Chuyến bay không do AirSky khai thác?</Text>
        </TouchableOpacity>
        
        <View className="gap-4">
          <TextInput label="Mã đặt chỗ (PNR)" mode="outlined" value={bookingCode} onChangeText={setBookingCode} autoCapitalize="characters" style={{ backgroundColor: 'transparent' }} />
          <TextInput label="Họ và tên (không dấu)" mode="outlined" value={fullName} onChangeText={(text) => setFullName(processNameInput(text))} autoCapitalize="characters" style={{ backgroundColor: 'transparent' }} />
        </View>

        <TouchableOpacity onPress={handleSearchBooking} className="bg-blue-950 py-4 rounded-full shadow-md mt-8">
          <Text className="text-white text-center font-bold text-lg">Tìm kiếm</Text>
        </TouchableOpacity>
      </View>

      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-blue-950">Chuyến bay liên danh</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ccc" />
              </TouchableOpacity>
            </View>
            <Text className="text-base text-gray-700 leading-6">
              Đối với các chuyến bay được khai thác bởi hãng hàng không đối tác (chuyến bay liên danh), vui lòng truy cập trang web của hãng hàng không đó để làm thủ tục trực tuyến.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );
}
export default CheckIn;