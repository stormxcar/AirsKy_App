import { Passenger, SelectedFlight } from "@/app/types/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import PassengerForm from "@/components/screens/book-flight/passenger-form";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { differenceInYears, format, parseISO } from "date-fns";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
// Helper để tính tuổi và xác định loại hành khách
const getPassengerType = (dob: Date | null): 'adult' | 'child' | 'infant' => {
    if (!dob) return 'adult'; // Mặc định
    const age = differenceInYears(new Date(), dob);
    if (age < 2) return 'infant';
    if (age < 12) return 'child';
    return 'adult';
};

function UserBookingInfo() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth(); // Lấy thông tin người dùng đã đăng nhập
    const [departureFlight, setDepartureFlight] = useState<SelectedFlight | null>(null);
    const [returnFlight, setReturnFlight] = useState<SelectedFlight | null>(null);

    // Tự động điền thông tin nếu người dùng đã đăng nhập
    const [bookerName, setBookerName] = useState(user ? `${user.lastName} ${user.firstName}` : '');
    const [bookerEmail, setBookerEmail] = useState(user ? user.email : '');

    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [nextPassengerId, setNextPassengerId] = useState(0); // To generate unique IDs for new passengers

    useEffect(() => {
        // Parse dữ liệu chuyến bay từ params
        if (params.departureFlight && typeof params.departureFlight === 'string') {
            setDepartureFlight(JSON.parse(params.departureFlight));
        }
        if (params.returnFlight && typeof params.returnFlight === 'string') {
            setReturnFlight(JSON.parse(params.returnFlight));
        }

        // Khởi tạo danh sách hành khách dựa trên params
        const adults = parseInt(params.adults as string || '1');
        const children = parseInt(params.children as string || '0');
        const infants = parseInt(params.infants as string || '0');
        const initialPassengers: Passenger[] = [];
        let currentId = 0;

        for (let i = 0; i < adults; i++) {
            initialPassengers.push({ id: currentId++, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'adult' });
        }
        for (let i = 0; i < children; i++) {
            initialPassengers.push({ id: currentId++, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'child' });
        }
        for (let i = 0; i < infants; i++) {
            initialPassengers.push({ id: currentId++, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'infant' });
        }
        setPassengers(initialPassengers);
        setNextPassengerId(currentId); // Set the next available ID

    }, [
        // Dependency array for useEffect
        params.departureFlight,
        params.returnFlight,
        params.adults,
        params.children,
        params.infants,
    ]);


    const handlePassengerChange = (id: number, field: keyof Passenger, value: any) => {
        setPassengers(prev =>
            prev.map(p => {
                if (p.id === id) {
                    const updatedPassenger = { ...p, [field]: value };
                    // Tự động cập nhật loại hành khách khi ngày sinh thay đổi
                    if (field === 'dob' && value instanceof Date) { // Ensure value is a Date object
                        updatedPassenger.type = getPassengerType(value);
                    }
                    return updatedPassenger;
                }
                return p;
            })
        );
    };

    const handleAddPassenger = () => {
        setPassengers(prev => [
            ...prev,
            { id: nextPassengerId, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'adult' }
        ]);
        setNextPassengerId(prev => prev + 1);
    };

    const handleRemovePassenger = (idToRemove: number) => {
        // Ensure at least one adult remains
        const currentAdults = passengers.filter(p => p.type === 'adult').length;
        const passengerToRemove = passengers.find(p => p.id === idToRemove);

        if (passengerToRemove?.type === 'adult' && currentAdults <= 1) {
            Alert.alert("Không thể xóa", "Phải có ít nhất một người lớn trong danh sách hành khách.");
            return;
        }

        setPassengers(prev => prev.filter(p => p.id !== idToRemove));
    };

    // Check if there's more than one adult to allow removal
    const canRemoveAdult = passengers.filter(p => p.type === 'adult').length > 1;

    const handleContinue = () => {
        // 1. Validate Booker Info
        if (!bookerName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập họ và tên người đặt vé.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!bookerEmail.trim() || !emailRegex.test(bookerEmail)) {
            Alert.alert("Lỗi", "Vui lòng nhập một địa chỉ email hợp lệ.");
            return;
        }

        // 2. Validate Passenger Info
        for (let i = 0; i < passengers.length; i++) {
            const p = passengers[i];
            const passengerLabel = `Hành khách ${i + 1}`;

            if (!p.lastName.trim() || !p.firstName.trim()) {
                Alert.alert("Thiếu thông tin", `Vui lòng nhập đầy đủ Họ và Tên cho ${passengerLabel}.`);
                return;
            }
            if (!p.dob) {
                Alert.alert("Thiếu thông tin", `Vui lòng chọn ngày sinh cho ${passengerLabel}.`);
                return;
            }
            if (!p.gender) {
                Alert.alert("Thiếu thông tin", `Vui lòng chọn giới tính cho ${passengerLabel}.`);
                return;
            }
            // Kiểm tra CCCD nếu hành khách từ 14 tuổi trở lên
            const age = differenceInYears(new Date(), p.dob);
            if (age >= 14 && !p.idCard.trim()) {
                Alert.alert("Thiếu thông tin", `${passengerLabel} từ 14 tuổi trở lên, vui lòng nhập số CCCD/Passport.`);
                return;
            }
        }

        // 3. Show Confirmation Dialog
        Alert.alert(
            "Xác nhận thông tin",
            "Vui lòng đảm bảo tất cả thông tin đã được điền chính xác. Thông tin sai có thể ảnh hưởng đến việc làm thủ tục bay của bạn.",
            [
                { text: "Kiểm tra lại", style: "cancel" },
                {
                    text: "Xác nhận", 
                    onPress: () => {
                        router.navigate({
                            pathname: '/(root)/(booking)/services-and-seats',
                            params: { 
                                ...params, 
                                passengers: JSON.stringify(passengers),
                                contactName: bookerName,
                                contactEmail: bookerEmail,
                            }
                        });
                    },
                }
            ]
        );


      // router.navigate({
      //     pathname: '/(root)/(booking)/services-and-seats',
      //     params: { ...params, passengers: JSON.stringify(passengers) }
      // });
    };

    return (
        <>
            <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "left", "right"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 80 }}>
                        {/* Custom Header - Moved inside screen */}
                        <View className="bg-white flex-row items-center p-4 border-b border-gray-200">
                            <TouchableOpacity onPress={() => router.back()} className="p-1">
                                <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
                            </TouchableOpacity>
                            <Text className="text-lg font-bold flex-1 text-center text-blue-900 mr-6">Thông tin hành khách</Text>
                        </View>
                        <BookingStepper currentStep={1} />

                        <View className="p-4 ">
                            {/* Flight Info Summary */}
                            {departureFlight && (
                                <View className="bg-white rounded-xl p-4 mb-2 border border-gray-200 shadow-sm">
                                    <Text className="text-base font-semibold text-gray-700">Chuyến đi:</Text>
                                    <Text className="text-lg font-bold text-blue-900">
                                        {departureFlight.flight?.departure?.code} ({departureFlight.flight?.departure?.time}) → {departureFlight.flight?.arrival?.code} ({departureFlight.flight?.arrival?.time})
                                    </Text>
                                    <Text className="text-sm text-gray-500">Ngày: {format(parseISO(params.departureDate as string), 'dd/MM/yyyy')}</Text>
                                    <Text className="text-sm text-gray-500">Hãng: {departureFlight.flight?.airline} - {departureFlight.flight?.flightNumber}</Text>
                                    <Text className="text-sm text-gray-500">Hạng vé: {departureFlight.ticketClass?.name}</Text>
                                </View>
                            )}
                            {returnFlight && (
                                <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
                                    <Text className="text-base font-semibold text-gray-700">Chuyến về:</Text>
                                    <Text className="text-lg font-bold text-blue-900">
                                        {returnFlight.flight?.departure?.code} ({returnFlight.flight?.departure?.time}) → {returnFlight.flight?.arrival?.code} ({returnFlight.flight?.arrival?.time})
                                    </Text>
                                    <Text className="text-sm text-gray-500">Ngày: {format(parseISO(params.returnDate as string), 'dd/MM/yyyy')}</Text>
                                    <Text className="text-sm text-gray-500">Hãng: {returnFlight.flight?.airline} - {returnFlight.flight?.flightNumber}</Text>
                                    <Text className="text-sm text-gray-500">Hạng vé: {returnFlight.ticketClass?.name}</Text>
                                </View>
                            )}

                            {/* Booker Info */}
                            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
                                <Text className="text-lg font-bold text-blue-900 mb-3">Thông tin người đặt vé</Text>
                                <Text className="text-sx  text-gray-500 mb-3">Thông tin đặt vé sẽ được gửi đến email này</Text>

                                <TextInput
                                    label="Họ và tên"
                                    mode="outlined"
                                    value={bookerName}
                                    onChangeText={setBookerName}
                                    autoCapitalize="words"
                                />
                                <TextInput
                                    label="Email"
                                    mode="outlined"
                                    value={bookerEmail}
                                    onChangeText={setBookerEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Passenger Info */}
                            {passengers.map((p, index) => (
                                <PassengerForm
                                    key={p.id}
                                    passenger={p}
                                    index={index}
                                    onChange={handlePassengerChange}
                                    onRemove={handleRemovePassenger}
                                    canRemove={p.type !== 'adult' || canRemoveAdult}
                                />
                            ))}

                            {/* Add Passenger Button */}
                            <TouchableOpacity onPress={handleAddPassenger} className="bg-blue-100 border border-blue-900 rounded-xl p-4 mb-4 flex-row items-center justify-center">
                                <Ionicons name="add-circle-outline" size={24} color="#1e3a8a" />
                                <Text className="text-blue-900 font-bold text-lg ml-2">Thêm hành khách</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Continue Button */}
                    <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                        <TouchableOpacity onPress={handleContinue} className="bg-blue-900 py-3 rounded-full shadow-md">
                            <Text className="text-white text-center font-bold text-lg">Tiếp tục</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

export default UserBookingInfo;
