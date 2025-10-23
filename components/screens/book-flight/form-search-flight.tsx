import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";


type TripType = "round-trip" | "one-way" | "multi-city";

function FormSearchFlight() {
      const [tripType, setTripType] = useState<TripType>("one-way");
    
      const [origin, setOrigin] = useState("");
      const [destination, setDestination] = useState("");
      const [departureDate, setDepartureDate] = useState<string | undefined>(undefined);
      const [returnDate, setReturnDate] = useState<string | undefined>(undefined);
    return (
        <>
            <ScrollView className="bg-white flex-1 p-4 rounded-t-3xl">
                <View className="px-4 mt-4  ">
                    {/* Trip Type Tabs */}
                    <View className="flex-row bg-gray-100 rounded-full p-1 mb-5 justify-between">
                        {[
                            { key: "round-trip", label: "Khứ hồi" },
                            { key: "one-way", label: "Một chiều" },
                            // { key: "multi-city", label: "Nhiều thành phố" },

                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => setTripType(tab.key as TripType)}
                                className={`flex-1 py-2 rounded-full ${tripType === tab.key ? "bg-blue-100" : ""
                                    }`}
                            >
                                <Text
                                    className={`text-center font-semibold ${tripType === tab.key ? "text-blue-900" : "text-gray-400"
                                        }`}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Form Fields */}
                    <View className="space-y-12 flex gap-4">
                        {/* Departure */}
                        <View className="relative">
                            <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4">
                                <Text className="text-gray-400  font-semibold">{origin || "ĐIỂM ĐI"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="absolute right-4 top-12 bg-blue-900 text-white rounded-full p-5 z-30">
                                <FontAwesome name="exchange" size={14} color="white" style={{ transform: [{ rotate: "90deg" }] }} />
                            </TouchableOpacity>
                        </View>

                        {/* Arrival */}
                        <View>
                            <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4">
                                <Text className="text-gray-400  font-semibold">{destination || "ĐIỂM ĐẾN"}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Dates */}
                        <View>
                            <TouchableOpacity
                                onPress={() => console.log("Open date picker modal")}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4 flex-row justify-between items-center"
                            >
                                {/* Depart */}
                                <View className="flex-1">
                                    <Text className="text-gray-400 font-semibold">NGÀY ĐI</Text>
                                </View>

                                {/* Nếu là round-trip thì mới có phần Return */}
                                {tripType === "round-trip" && (
                                    <>
                                        {/* Divider */}
                                        <View className="w-[1px] h-4 bg-gray-300 mx-4" />

                                        {/* Return */}
                                        <View className="flex-1 items-end">
                                            <Text className="text-gray-400 font-semibold">NGÀY VỀ</Text>
                                        </View>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>


                        {/* Passengers */}
                        <View>

                            <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4 flex-row justify-between items-center">
                                <Text className="text-gray-400 font-semibold">1 HÀNH KHÁCH</Text>
                                <Ionicons name="chevron-down" size={18} color="#444" />
                            </TouchableOpacity>
                        </View>

                        {/* Promo Code */}
                        <View>
                            <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4">
                                <Text className="text-gray-400  font-semibold">MÃ KHUYẾN MÃI</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Button */}
                        <TouchableOpacity className="bg-blue-900 py-4 rounded-full mt-6 shadow-md">
                            <Text className="text-white text-center font-bold text-lg">
                                TÌM CHUYÉN BAY
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </>


    )
}

export default FormSearchFlight;
