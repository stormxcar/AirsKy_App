import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FlightSegment } from "@/services/checkin-service";

interface CheckInFlightSelectorProps {
  flightSegments: FlightSegment[];
  onSelectFlight: (segment: FlightSegment) => void;
}

// Helper để kiểm tra segment có thể check-in được không (trong 24h trước giờ khởi hành)
const canCheckInSegment = (segment: FlightSegment): boolean => {
  const now = new Date();
  const departureTime = new Date(segment.departureTime);
  const checkInStartTime = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000); // 24h trước

  return now >= checkInStartTime && now < departureTime;
};

const CheckInFlightSelector: React.FC<CheckInFlightSelectorProps> = ({
  flightSegments,
  onSelectFlight,
}) => {
  const handleSelectFlight = (segment: FlightSegment) => {
    if (!canCheckInSegment(segment)) {
      Alert.alert(
        "Chưa mở check-in",
        "Check-in chỉ khả dụng từ 24 giờ trước giờ khởi hành.",
        [{ text: "OK" }]
      );
      return;
    }

    onSelectFlight(segment);
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-xl font-bold text-blue-900 mb-4">
        Chọn chuyến bay
      </Text>

      {flightSegments.map((segment, index) => {
        const canCheckIn = canCheckInSegment(segment);
        const departureTime = new Date(segment.departureTime);
        const now = new Date();
        const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        return (
          <TouchableOpacity
            key={segment.segmentId}
            onPress={() => handleSelectFlight(segment)}
            disabled={!canCheckIn}
            className={`border rounded-xl p-4 mb-3 shadow-sm ${
              canCheckIn
                ? "bg-white border-gray-200"
                : "bg-gray-50 border-gray-300 opacity-60"
            }`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`font-bold text-lg ${
                canCheckIn ? "text-blue-900" : "text-gray-500"
              }`}>
                {segment.flightNumber}
              </Text>
              <View className="flex-row items-center">
                <Text className={`font-semibold mr-2 ${
                  canCheckIn ? "text-blue-600" : "text-gray-500"
                }`}>
                  Chặng {segment.segmentOrder}
                </Text>
                {canCheckIn ? (
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-700 font-semibold text-xs">
                      Có thể check-in
                    </Text>
                  </View>
                ) : (
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-gray-600 font-semibold text-xs">
                      Chưa mở check-in
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className={`font-bold text-2xl ${
                  canCheckIn ? "text-gray-800" : "text-gray-500"
                }`}>
                  {segment.departureAirport.airportCode}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {format(new Date(segment.departureTime), "HH:mm", {
                    locale: vi,
                  })}
                </Text>
              </View>

              <View className="flex-1 items-center mx-4">
                <Ionicons
                  name="airplane"
                  size={20}
                  color={canCheckIn ? "#9ca3af" : "#d1d5db"}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  {segment.duration}
                </Text>
              </View>

              <View className="items-end">
                <Text className={`font-bold text-2xl ${
                  canCheckIn ? "text-gray-800" : "text-gray-500"
                }`}>
                  {segment.arrivalAirport.airportCode}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {format(new Date(segment.arrivalTime), "HH:mm", { locale: vi })}
                </Text>
              </View>
            </View>

            <View className="mt-3">
              <Text className={`text-center text-sm ${
                canCheckIn ? "text-gray-600" : "text-gray-500"
              }`}>
                {format(new Date(segment.departureTime), "dd/MM/yyyy", {
                  locale: vi,
                })}{" "}
                • Hạng {segment.className}
              </Text>
              {!canCheckIn && hoursUntilDeparture > 24 && (
                <Text className="text-center text-orange-600 text-xs mt-1">
                  Check-in mở sau {Math.ceil(hoursUntilDeparture - 24)} giờ nữa
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default CheckInFlightSelector;