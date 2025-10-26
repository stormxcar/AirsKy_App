import { Airport } from '@/app/types';
import AirportSelectionModal from '@/components/screens/book-flight/modals/airport-selection-modal';
import DatePickerModal from '@/components/screens/book-flight/modals/date-picker-modal';
import PassengerSelectionModal from '@/components/screens/book-flight/modals/passenger-selection-modal';
import { AIRPORTS } from '@/constants/data';
import { useLoading } from "@/context/loading-context";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { DateData } from 'react-native-calendars';

type TripType = "round-trip" | "one-way" | "multi-city";

function FormSearchFlight() {
    const [tripType, setTripType] = useState<TripType>("one-way");
  const {showLoading} = useLoading();

    const [origin, setOrigin] = useState({ code: "SGN", city: "TP. Hồ Chí Minh" });
    const [destination, setDestination] = useState({ code: "HAN", city: "Hà Nội" });
    const [departureDate, setDepartureDate] = useState<string | null>(null);
    const [returnDate, setReturnDate] = useState<string | null>(null);

    // State cho hành khách
    const [adults, setAdults] = useState(1); // Mặc định ít nhất 1 người lớn
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0); // Em bé (dưới 2 tuổi, ngồi lòng)

    const [airportModalVisible, setAirportModalVisible] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [passengerModalVisible, setPassengerModalVisible] = useState(false);

    const [editingField, setEditingField] = useState<'origin' | 'destination' | null>(null);

    useEffect(() => {
        if (infants > adults) setInfants(adults); // Đảm bảo số em bé không vượt quá số người lớn
    }, [adults, infants]);

    // Side effect để xử lý khi thay đổi loại chuyến đi
    useEffect(() => {
        if (tripType === 'one-way') {
            setReturnDate(null); // Nếu là một chiều, luôn xóa ngày về
        }
    }, [tripType]);

    const openModal = (field: 'origin' | 'destination') => {
        setEditingField(field);
        setAirportModalVisible(true);
    };

    const handleSelectLocation = (airport: Airport) => {
        if (editingField === 'origin') {
            setOrigin(airport);
        } else if (editingField === 'destination') {
            setDestination(airport);
        }
        setAirportModalVisible(false);
    };

    // --- Date Picker Modal Logic ---
    const handleDayPress = (day: DateData) => {
        if (tripType === 'one-way') {
            setDepartureDate(day.dateString);
            setReturnDate(null); // Reset return date for one-way
            setDateModalVisible(false); // Close modal after selection
        } else { // Round-trip
            if (!departureDate || (departureDate && returnDate)) {
                // Start new selection or reset
                setDepartureDate(day.dateString);
                setReturnDate(null);
            } else if (day.dateString < departureDate) {
                // If selected day is before departure, reset and start new
                setDepartureDate(day.dateString);
                setReturnDate(null);
            } else if (day.dateString > departureDate) {
                // Set return date
                setReturnDate(day.dateString);
                setDateModalVisible(false); // Close modal after selecting range
            }
        }
    };

    const markedDates = useMemo(() => {
        const marked: { [key: string]: any } = {};
        if (departureDate) {
            marked[departureDate] = { startingDay: true, color: '#1e3a8a', textColor: 'white' };
        }
        if (returnDate) {
            marked[returnDate] = { endingDay: true, color: '#1e3a8a', textColor: 'white' };
            // Mark period between dates
            let currentDate = new Date(departureDate!);
            const endDate = new Date(returnDate);
            currentDate.setDate(currentDate.getDate() + 1);

            while (currentDate < endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                marked[dateString] = { color: '#bfdbfe', textColor: '#1e3a8a' };
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        // If only departure is selected in round-trip, mark it differently
        if (tripType === 'round-trip' && departureDate && !returnDate) {
            marked[departureDate] = { ...marked[departureDate], endingDay: true };
        }

        return marked;
    }, [departureDate, returnDate, tripType]);

    const formatDateDisplay = (dateString: string | null) => {
        if (!dateString) return null;
        return format(new Date(dateString), "EEE, dd 'thg' MM", { locale: vi });
    };

    const openDateModal = () => {
        // Chỉ cần mở modal, không reset ngày đã chọn
        setDateModalVisible(true);
    }

    const handleConfirmPassengers = (passengers: { adults: number, children: number, infants: number }) => {
        setAdults(passengers.adults);
        setChildren(passengers.children);
        setInfants(passengers.infants);
    };

    const handleSearch = () => {
        if (!departureDate) {
            Alert.alert("Thông báo", "Vui lòng chọn ngày đi.");
            return;
        }
        if (tripType === 'round-trip' && !returnDate) {
            Alert.alert("Thông báo", "Vui lòng chọn ngày về cho chuyến khứ hồi.");
            return;
        }

        const params = {
            tripType,
            originCode: origin.code,
            destinationCode: destination.code,
            departureDate,
            returnDate: returnDate ?? '', // Ensure it's a string
            adults: adults.toString(),
            children: children.toString(),
            infants: infants.toString(),
        };
        showLoading();
        router.navigate({ pathname: '/(root)/(booking)/flight-list', params });
    };

    return (
        <>
            <ScrollView className="bg-white flex-1 p-4 rounded-t-[40px]">
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
                                    className={`text-center font-semibold ${tripType === tab.key ? "text-blue-950" : "text-gray-400"
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
                            <TouchableOpacity onPress={() => openModal('origin')} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <Text className="text-gray-400 text-xs font-semibold mb-1">ĐIỂM ĐI</Text>
                                <Text className="text-blue-950 text-xl font-bold">{origin.code}</Text>
                                <Text className="text-gray-600">{origin.city}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    // Hoán đổi điểm đi và điểm đến
                                    const temp = origin;
                                    setOrigin(destination);
                                    setDestination(temp);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-6 bg-blue-950 text-white rounded-full p-4 z-30 border-4 border-white">
                                <FontAwesome name="exchange" size={14} color="white" style={{ transform: [{ rotate: "90deg" }] }} />
                            </TouchableOpacity>
                        </View>

                        {/* Arrival */}
                        <View>
                            <TouchableOpacity onPress={() => openModal('destination')} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <Text className="text-gray-400 text-xs font-semibold mb-1">ĐIỂM ĐẾN</Text>
                                <Text className="text-blue-950 text-xl font-bold">{destination.code}</Text>
                                <Text className="text-gray-600">{destination.city}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Dates */}
                        <View>
                            <TouchableOpacity
                                onPress={openDateModal}
                                className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4 flex-row justify-between items-center"
                            >
                                {/* Depart */}
                                <View className="flex-1">
                                    <Text className="text-gray-400 font-semibold">NGÀY ĐI</Text>
                                    {departureDate && (
                                        <Text className="text-blue-950 font-bold text-[13px] mt-1">{formatDateDisplay(departureDate)}</Text>
                                    )}
                                </View>

                                {/* Nếu là round-trip thì mới có phần Return */}
                                {tripType === "round-trip" && (
                                    <>
                                        {/* Divider */}
                                        <View className="w-[1px] h-full bg-gray-200 mx-4" />

                                        {/* Return */}
                                        <View className="flex-1 items-end">
                                            <Text className="text-gray-400 font-semibold">NGÀY VỀ</Text>
                                            {returnDate && (
                                                <Text className="text-blue-950 font-bold text-[13px] mt-1">{formatDateDisplay(returnDate)}</Text>
                                            )}
                                        </View>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>


                        {/* Passengers */}
                        <View>

                            <TouchableOpacity onPress={() => setPassengerModalVisible(true)} className="bg-gray-50 border border-gray-200 rounded-xl py-6 px-4 flex-row justify-between items-center">
                                <Text className="text-blue-950 font-semibold">
                                    {adults} Người lớn
                                    {children > 0 ? `, ${children} Trẻ em` : ''}
                                    {infants > 0 ? `, ${infants} Em bé` : ''}
                                </Text>

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
                        <TouchableOpacity onPress={handleSearch} className="bg-blue-950 py-4 rounded-full shadow-md">
                            <Text className="uppercase text-white text-center font-bold text-lg">
                                go
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <AirportSelectionModal
                visible={airportModalVisible}
                onClose={() => setAirportModalVisible(false)}
                onSelect={handleSelectLocation}
                airports={AIRPORTS}
                editingField={editingField}
            />

            <DatePickerModal
                visible={dateModalVisible}
                onClose={() => setDateModalVisible(false)}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                tripType={tripType}
            />

            <PassengerSelectionModal
                visible={passengerModalVisible}
                onClose={() => setPassengerModalVisible(false)}
                onConfirm={handleConfirmPassengers}
                initialAdults={adults}
                initialChildren={children}
                initialInfants={infants}
            />
        </>
    )
}

export default FormSearchFlight;
