import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth-context";
import React, { useEffect, useMemo, useState } from "react";

import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoading } from "@/context/loading-context";
import { getMyBookings } from "@/services/user-service";
import { BookingResponse } from "@/app/types/booking";
import { format } from "date-fns";

type Tab = 'upcoming' | 'completed' | 'cancelled';

const MyTrips = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [isFindBookingModalVisible, setFindBookingModalVisible] = useState(false);
  const { user } = useAuth(); // Kiểm tra trạng thái đăng nhập
  const { showLoading } = useLoading();

  const handleFindBooking = () => {
    if (!bookingCode.trim() || !lastName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Mã đặt chỗ và Họ.");
      return;
    }
    Alert.alert("Tìm kiếm", `Đang tìm kiếm mã đặt chỗ: ${bookingCode}`);
  };

  // Lấy danh sách booking khi người dùng đã đăng nhập
  useEffect(() => {
    const fetchBookings = async () => {
      if (user?.id) {
        showLoading(async () => {
          try {
            const userBookings = await getMyBookings(user.id);
            setBookings(userBookings);
          } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể tải danh sách chuyến đi.");
          }
        });
      }
    };

    fetchBookings();
  }, [user]);

  // Phân loại các chuyến đi vào các tab
  const categorizedTrips = useMemo(() => {
    const upcoming: any[] = [];
    const completed: any[] = [];
    const cancelled: any[] = [];

    bookings.forEach(booking => {
      const firstSegment = booking.flightSegments.find(s => s.segmentOrder === 1);
      if (!firstSegment) return;

      const trip = {
        id: booking.bookingId.toString(),
        bookingCode: booking.bookingCode,
        departure: { code: firstSegment.departureAirport.airportCode, time: format(new Date(firstSegment.departureTime), 'HH:mm') },
        arrival: { code: firstSegment.arrivalAirport.airportCode, time: format(new Date(firstSegment.arrivalTime), 'HH:mm') },
        date: format(new Date(firstSegment.departureTime), 'dd MMM, yyyy'),
        status: booking.status,
      };

      switch (booking.status) {
        case 'CONFIRMED':
        case 'PENDING':
          upcoming.push(trip);
          break;
        case 'COMPLETED':
          completed.push(trip);
          break;
        case 'CANCELLED':
          cancelled.push(trip);
          break;
      }
    });

    return { upcoming, completed, cancelled };
  }, [bookings]);

  const tripsToDisplay = categorizedTrips[activeTab];

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      <Text className="p-4 text-center text-white font-bold uppercase">Chuyến đi của tôi</Text>
      <ScrollView className="bg-white flex-1 rounded-t-[40px] p-4">
        {user ? (
          // --- Giao diện khi người dùng đã đăng nhập ---
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
        ) : (
          // --- Giao diện khi người dùng chưa đăng nhập ---
          <View className="items-center justify-center py-16">
            <Ionicons name="airplane-outline" size={64} color="#9ca3af" />
            <Text className="text-lg font-bold text-gray-700 mt-4">Không có chuyến bay nào</Text>
            <Text className="text-gray-500 text-center mt-2 mb-6">
              Bạn có thể thêm chuyến bay và truy xuất chi tiết bằng cách sử dụng mã đặt chỗ.
            </Text>
            <TouchableOpacity
              onPress={() => setFindBookingModalVisible(true)}
              className="bg-blue-950 py-3 px-8 rounded-full shadow-md mt-6 flex-row items-center justify-center"
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text className="text-white text-center font-bold text-base ml-2">Thêm chuyến đi</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal tìm kiếm chuyến bay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFindBookingModalVisible}
        onRequestClose={() => setFindBookingModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-blue-950">Thêm chuyến đi của bạn</Text>
                <TouchableOpacity onPress={() => setFindBookingModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#ccc" />
                </TouchableOpacity>
              </View>
              <View className="gap-4">
                <TextInput label="Mã đặt chỗ (PNR)" mode="outlined" value={bookingCode} onChangeText={setBookingCode} autoCapitalize="characters" style={{ backgroundColor: 'transparent', fontSize: 14 }} />
                <TextInput label="Họ (không dấu, viết hoa)" mode="outlined" value={lastName} onChangeText={setLastName} autoCapitalize="characters" style={{ backgroundColor: 'transparent', fontSize: 14 }} />
              </View>
              <TouchableOpacity onPress={handleFindBooking} className="bg-blue-950 py-3 rounded-full shadow-md mt-6 flex-row items-center justify-center">
                <Text className="text-white text-center font-bold text-base">Tìm chuyến đi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default MyTrips;