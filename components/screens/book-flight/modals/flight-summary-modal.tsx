import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Flight, TicketClass } from "@/app/types/types";

interface FlightSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  departureFlight?: { flight: Flight; ticketClass: TicketClass } | null;
  returnFlight?: { flight: Flight; ticketClass: TicketClass } | null;
}

export default function FlightSummaryModal({
  visible,
  onClose,
  departureFlight,
  returnFlight,
}: FlightSummaryModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-blue-900">Chuyến bay đã chọn</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-down" size={24} color="#1e3a8a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Chuyến đi */}
            {departureFlight && (
              <View className="mb-4 border-b border-gray-200 pb-3">
                <Text className="font-semibold text-blue-900 mb-1">
                  Chuyến đi: {departureFlight.flight.origin} → {departureFlight.flight.destination}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {departureFlight.flight.flightNumber} —{" "}
                  {format(new Date(departureFlight.flight.departureTime), "dd/MM HH:mm")}
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Hạng vé: {departureFlight.ticketClass.name}
                </Text>
                <Text className="text-blue-900 font-bold mt-1">
                  {departureFlight.ticketClass.finalPrice.toLocaleString("vi-VN")} ₫
                </Text>
              </View>
            )}

            {/* Chuyến về */}
            {returnFlight && (
              <View className="mb-4 border-b border-gray-200 pb-3">
                <Text className="font-semibold text-blue-900 mb-1">
                  Chuyến về: {returnFlight.flight.origin} → {returnFlight.flight.destination}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {returnFlight.flight.flightNumber} —{" "}
                  {format(new Date(returnFlight.flight.departureTime), "dd/MM HH:mm")}
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Hạng vé: {returnFlight.ticketClass.name}
                </Text>
                <Text className="text-blue-900 font-bold mt-1">
                  {returnFlight.ticketClass.finalPrice.toLocaleString("vi-VN")} ₫
                </Text>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
