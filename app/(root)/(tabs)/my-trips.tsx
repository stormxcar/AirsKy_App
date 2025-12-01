import { BookingResponse } from "@/app/types/booking";
import { useAuth } from "@/context/auth-context";
import { lookupBooking } from "@/services/booking-service";
import { getMyBookings } from "@/services/user-service";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = 'pending' | 'upcoming' | 'completed' | 'cancelled';

const MyTrips = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [isFindBookingModalVisible, setFindBookingModalVisible] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  // useQuery object syntax
  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<BookingResponse[]>({
    queryKey: ['myBookings', user?.id],
    queryFn: () => getMyBookings(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    onError: (error: any) => Alert.alert("Lỗi", error.message || "Không thể tải danh sách chuyến đi.")
  });

  // useMutation object syntax
  const findBookingMutation = useMutation({
    mutationFn: (code: string) => lookupBooking(code.toUpperCase(), ''),
    onSuccess: (bookingDetails) => {
      setFindBookingModalVisible(false);
      setBookingCode('');
      router.push({
        pathname: '/(root)/(booking)/booking-result',
        params: {
          bookingId: bookingDetails.bookingId.toString(),
          status: bookingDetails.status,
          bookingCode: bookingDetails.bookingCode
        }
      });
    },
    onError: (error: any) => Alert.alert("Tìm kiếm thất bại", error.message)
  });

  const handleFindBooking = () => {
    if (!bookingCode.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Mã đặt chỗ.");
      return;
    }
    findBookingMutation.mutate(bookingCode);
  };

  // --- Phân loại chuyến đi theo tab ---
  const categorizedTrips = useMemo(() => {
    const pending: any[] = [];
    const upcoming: any[] = [];
    const completed: any[] = [];
    const cancelled: any[] = [];

    (bookings as BookingResponse[]).forEach((booking: BookingResponse) => {
      const firstSegment = booking.flightSegments.find(s => s.segmentOrder === 1);

      if (!firstSegment) return;
      const now = new Date();
      const trip = {
        id: booking.bookingId.toString(),
        bookingCode: booking.bookingCode,
        departure: { code: firstSegment.departureAirport.airportCode, time: format(new Date(firstSegment.departureTime), 'HH:mm') },
        arrival: { code: firstSegment.arrivalAirport.airportCode, time: format(new Date(firstSegment.arrivalTime), 'HH:mm') },
        date: format(new Date(firstSegment.departureTime), 'dd MMM, yyyy'),
        status: booking.status,
        totalAmount: booking.totalAmount.toLocaleString('vi-VN') + ' ₫',
        flightStatus: booking.flightSegments,
        cancellationReason: booking.cancellationReason,
      };

      switch (booking.status) {
        case 'PENDING':
          pending.push(trip);
          break;
        case 'CONFIRMED':
          if (new Date(firstSegment.departureTime) > now) {
            upcoming.push(trip);
          } else {
            completed.push(trip);
          }
          break;
        case 'COMPLETED':
          completed.push(trip);
          break;
        case 'CANCELLED':
          cancelled.push(trip);
          break;
      }
    });

    return { pending, upcoming, completed, cancelled };
  }, [bookings]);

  const tripsToDisplay = categorizedTrips[activeTab];

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      <Text className="p-4 text-center text-white font-bold uppercase">Chuyến đi của tôi</Text>
      <ScrollView className="bg-white flex-1 rounded-t-[40px] p-4">
        {user ? (
          <View>
            {/* Tabs */}
            <View className="border-b border-gray-200 mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['pending', 'upcoming', 'completed', 'cancelled'] as Tab[]).map(tab => (
                  <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className={`py-2 border-b-2 ${activeTab === tab ? 'border-blue-950' : 'border-transparent'} px-4`}>
                    <Text className={`font-semibold whitespace-nowrap ${activeTab === tab ? 'text-blue-950' : 'text-gray-500'}`}>
                      {tab === 'pending' ? 'Chờ thanh toán' : tab === 'upcoming' ? 'Sắp tới' : tab === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Loading */}
            {isBookingsLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#1e3a8a" />
              </View>
            ) : tripsToDisplay.length > 0 ? (
              tripsToDisplay.map(trip => (
                <TouchableOpacity
                  key={trip.id}
                  onPress={() => router.replace({
                    pathname: '/(root)/(booking)/booking-result',
                    params: { status: trip.status, bookingId: trip.id, bookingCode: trip.bookingCode }
                  })}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <Text className="text-sm text-gray-500">{trip.date}</Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-blue-950 bg-blue-100 px-2 py-1 rounded-full">{trip.bookingCode}</Text>
                      {(activeTab === 'completed' || activeTab === 'upcoming') && (
                        <TouchableOpacity
                          onPress={() => {
                            // Navigate to check-in screen with booking code to view boarding pass
                            router.push({
                              pathname: '/(root)/(tabs)/check-in',
                              params: {
                                prefillBookingCode: trip.bookingCode,
                                viewBoardingPass: 'true'
                              }
                            });
                          }}
                          className="bg-blue-900 px-3 py-1 rounded-full"
                        >
                          <Text className="text-white text-xs font-bold">Boarding Pass</Text>
                        </TouchableOpacity>
                      )}
                    </View>
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
                  <View className="items-end pt-6">
                    <Text className="text-xl font-bold text-blue-900">{trip.totalAmount}</Text>
                  </View>
                  {activeTab === 'cancelled' && (
                    <View className="mt-3 pt-3 border-t border-dashed border-gray-200">
                      <Text className="text-sm text-red-600"><Text className="font-bold">Lý do hủy:</Text> {trip.cancellationReason || 'Quá hạn thanh toán'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500">Không có chuyến đi nào trong mục này.</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="items-center justify-center py-16">
            <Ionicons name="airplane-outline" size={64} color="#9ca3af" />
            <Text className="text-lg font-bold text-gray-700 mt-4">Không có chuyến bay nào</Text>
            <Text className="text-gray-500 text-center mt-2 mb-6">
              Bạn có thể tìm chuyến đi của mình và truy xuất chi tiết bằng cách sử dụng mã đặt chỗ hoặc đăng nhập để hiển thị toàn bộ lịch sử.
            </Text>
            <TouchableOpacity
              onPress={() => setFindBookingModalVisible(true)}
              className="bg-blue-950 py-3 px-8 rounded-full shadow-md mt-6 flex-row items-center justify-center"
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text className="text-white text-center font-bold text-base ml-2">Tìm chuyến đi</Text>
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
                <Text className="text-xl font-bold text-blue-950">Tìm chuyến đi của bạn</Text>
                <TouchableOpacity onPress={() => setFindBookingModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#ccc" />
                </TouchableOpacity>
              </View>
              <View className="gap-4">
                <TextInput
                  label="Mã đặt chỗ (PNR)"
                  mode="outlined"
                  value={bookingCode}
                  onChangeText={setBookingCode}
                  autoCapitalize="characters"
                  style={{ backgroundColor: 'transparent', fontSize: 14 }}
                />
              </View>
              <TouchableOpacity
                onPress={handleFindBooking}
                className="bg-blue-950 py-3 rounded-full shadow-md mt-6 flex-row items-center justify-center"
              >
                {findBookingMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-bold text-base">Tìm chuyến đi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default MyTrips;
