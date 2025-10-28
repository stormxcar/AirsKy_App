import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// Dữ liệu mẫu
const mockTrips = {
  upcoming: [
    {
      id: '1',
      bookingCode: 'XYZ789',
      departure: { code: 'SGN', city: 'TP. Hồ Chí Minh', time: '08:00' },
      arrival: { code: 'HAN', city: 'Hà Nội', time: '10:10' },
      date: '25 Thg 09, 2024',
      status: 'Confirmed',
    },
  ],
  completed: [
    {
      id: '2',
      bookingCode: 'ABC123',
      departure: { code: 'DAD', city: 'Đà Nẵng', time: '15:30' },
      arrival: { code: 'SGN', city: 'TP. Hồ Chí Minh', time: '16:45' },
      date: '10 Thg 07, 2024',
      status: 'Completed',
    },
  ],
  cancelled: [],
};

type Tab = 'upcoming' | 'completed' | 'cancelled';

const MyTrips = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const handleFindBooking = () => {
    if (!bookingCode.trim() || !lastName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Mã đặt chỗ và Họ.");
      return;
    }
    Alert.alert("Tìm kiếm", `Đang tìm kiếm mã đặt chỗ: ${bookingCode}`);
  };

  const tripsToDisplay = mockTrips[activeTab];

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      <Text className="p-4 text-center text-white font-bold uppercase">Chuyến đi của tôi</Text>
      <ScrollView className="bg-white flex-1 rounded-t-[40px] p-4">
        {/* Form tìm kiếm */}
        <View className=" p-4 rounded-xl  mb-6">
          <View className="gap-4">
            <TextInput label="Mã đặt chỗ (PNR)" mode="outlined" value={bookingCode} onChangeText={setBookingCode} autoCapitalize="characters" style={{ backgroundColor: 'transparent' }} />
            <TextInput label="Họ (không dấu, viết hoa)" mode="outlined" value={lastName} onChangeText={setLastName} autoCapitalize="characters" style={{ backgroundColor: 'transparent' }} />
          </View>
          <TouchableOpacity onPress={handleFindBooking} className="bg-blue-950 py-3 rounded-full shadow-md mt-6">
            <Text className="text-white text-center font-bold text-base">Tìm chuyến đi</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách chuyến đi của người dùng (giả sử đã đăng nhập) */}
        <View>
          {/* Tabs */}
          <View className="flex-row justify-around border-b border-gray-200 mb-4">
            {(['upcoming', 'completed', 'cancelled'] as Tab[]).map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className={`py-2 border-b-2 ${activeTab === tab ? 'border-blue-950' : 'border-transparent'}`}>
                <Text className={`font-semibold ${activeTab === tab ? 'text-blue-950' : 'text-gray-500'}`}>
                  {tab === 'upcoming' ? 'Sắp tới' : tab === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Danh sách chuyến đi */}
          {tripsToDisplay.length > 0 ? (
            tripsToDisplay.map(trip => (
              <TouchableOpacity key={trip.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-sm text-gray-500">{trip.date}</Text>
                  <Text className="text-sm font-bold text-blue-950 bg-blue-100 px-2 py-1 rounded-full">{trip.bookingCode}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="items-start">
                    <Text className="text-2xl font-bold text-blue-950">{trip.departure.code}</Text>
                    <Text className="text-gray-600">{trip.departure.time}</Text>
                  </View>
                  <View className="items-center">
                    <Ionicons name="airplane" size={24} color="#1e3a8a" />
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-blue-950">{trip.arrival.code}</Text>
                    <Text className="text-gray-600">{trip.arrival.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500">Không có chuyến đi nào trong mục này.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default MyTrips;