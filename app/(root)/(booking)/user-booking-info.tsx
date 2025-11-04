import { Passenger } from "@/app/types/types";
import BookingStepper from "@/components/screens/book-flight/booking-stepper";
import { useBooking } from "@/context/booking-context";
import PassengerForm from "@/components/screens/book-flight/passenger-form";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { differenceInDays, differenceInYears, format, isAfter, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
    const router = useRouter();
    const { user } = useAuth(); // Lấy thông tin người dùng đã đăng nhập
    const { bookingState, dispatch } = useBooking();
    const { departureFlight, returnFlight, passengerCounts } = bookingState;

    // Tự động điền thông tin nếu người dùng đã đăng nhập
    // Sử dụng state cục bộ cho form inputs
    const [bookerName, setBookerName] = useState(user ? `${user.lastName} ${user.firstName}` : '');
    const [bookerEmail, setBookerEmail] = useState(user ? user.email : '');

    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [nextPassengerId, setNextPassengerId] = useState(0); // To generate unique IDs for new passengers

    useEffect(() => {
        // Khởi tạo danh sách hành khách dựa trên params
        const adults = passengerCounts?.adults || 1;
        const children = passengerCounts?.children || 0;
        const infants = passengerCounts?.infants || 0;
        const initialPassengers: Passenger[] = [];
        let currentId = 0;

        for (let i = 0; i < adults; i++) {
            initialPassengers.push({ id: currentId++, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'adult', dateOfBirth: '', passportNumber: '' });
        }
        for (let i = 0; i < children; i++) {
            initialPassengers.push({ id: currentId++, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'child', dateOfBirth: '', passportNumber: '' });
        }
        for (let i = 0; i < infants; i++) {
            initialPassengers.push({ id: currentId++, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'infant', dateOfBirth: '', passportNumber: '' });
        }
        setPassengers(initialPassengers);
        setNextPassengerId(currentId); // Set the next available ID

    }, [passengerCounts]);

    // Bắt đầu tính tổng tiền vé ở đây
    const baseTicketPrice = useMemo(() => {
        let total = 0;
        const depPrice = departureFlight?.ticketClass.finalPrice || 0;
        const retPrice = returnFlight?.ticketClass.finalPrice || 0;

        passengers.forEach(p => {
            let multiplier = 1.0; // Adult
            if (p.type === 'child') multiplier = 0.75;
            if (p.type === 'infant') multiplier = 0.10;

            total += (depPrice * multiplier);
            if (returnFlight) {
                total += (retPrice * multiplier);
            }
        });

        return total;
    }, [passengers, departureFlight, returnFlight]);


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
            { id: nextPassengerId, firstName: '', lastName: '', dob: null, gender: null, idCard: '', type: 'adult', dateOfBirth: '', passportNumber: '' }
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
        // 1️⃣ Validate Booker Info
        if (!bookerName.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập họ và tên người đặt vé.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!bookerEmail.trim() || !emailRegex.test(bookerEmail)) {
            Alert.alert("Lỗi", "Vui lòng nhập một địa chỉ email hợp lệ.");
            return;
        }

        // 2️⃣ Validate Passenger Info
        if (passengers.length === 0) {
            Alert.alert("Lỗi", "Vui lòng thêm ít nhất một hành khách.");
            return;
        }

        if (passengers.length > 9) {
            Alert.alert("Không hợp lệ", "Hệ thống chỉ hỗ trợ tối đa 9 hành khách trong một lần đặt vé.");
            return;
        }

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

            const age = differenceInYears(new Date(), p.dob);

            // Ngăn chặn ngày sinh ở tương lai
            if (isAfter(p.dob, new Date())) {
                Alert.alert("Không hợp lệ", `${passengerLabel} có ngày sinh trong tương lai.`);
                return;
            }

            // CCCD/Passport bắt buộc nếu >= 14 tuổi
            if (age >= 14 && !p.idCard.trim()) {
                Alert.alert("Thiếu thông tin", `${passengerLabel} từ 14 tuổi trở lên, vui lòng nhập số CCCD/Passport.`);
                return;
            }
        }

        // 3️⃣ Ràng buộc theo quy định AirSky Air
        const adultsOver18 = passengers.filter(p => {
            if (!p.dob) return false;
            const age = differenceInYears(new Date(), p.dob);
            return age >= 18;
        }).length;

        const infants = passengers.filter(p => {
            if (!p.dob) return false;
            const age = differenceInYears(new Date(), p.dob);
            return age < 2;
        }).length;

        const children = passengers.filter(p => {
            if (!p.dob) return false;
            const age = differenceInYears(new Date(), p.dob);
            return age >= 2 && age < 12;
        }).length;

        const adults = passengers.filter(p => {
            if (!p.dob) return false;
            const age = differenceInYears(new Date(), p.dob);
            return age >= 12;
        }).length; 

        // ⚠️ Không chấp nhận trẻ dưới 14 ngày tuổi
        const infantUnder14Days = passengers.find(p => {
            if (!p.dob) return false; // Add null check
            const diffDays = differenceInDays(new Date(), p.dob); // Fix: Ensure p.dob is not null
            return diffDays < 14;
        });
        if (infantUnder14Days) {
            Alert.alert("Không hợp lệ", "AirSky không vận chuyển trẻ em dưới 14 ngày tuổi.");
            return;
        }
        // ⚠️ Ràng buộc người đi cùng
        if (passengers.length > 1 && adultsOver18 === 0) {
            Alert.alert("Không hợp lệ", "Phải có ít nhất một hành khách từ 18 tuổi trở lên trong nhóm.");
            return;
        }

        // ⚠️ Em bé phải có người lớn đi cùng
        if (infants > adultsOver18) {
            Alert.alert("Không hợp lệ", "Mỗi người lớn chỉ được đi kèm 1 em bé (<2 tuổi).");
            return;
        }

        // ⚠️ Trẻ em (2–11 tuổi) phải có người lớn đi cùng
        if (children > 0 && adultsOver18 === 0) {
            Alert.alert("Không hợp lệ", "Trẻ em (2–11 tuổi) phải đi cùng ít nhất một người lớn (≥18 tuổi).");
            return;
        }

        // ⚠️ Trẻ vị thành niên đi một mình (12–13 tuổi)
        if (passengers.length === 1) {
            const onlyPassenger = passengers[0];
            const age = onlyPassenger.dob ? differenceInYears(new Date(), onlyPassenger.dob) : 0; // Fix: Add null check
            if (age < 12) {
                Alert.alert("Không hợp lệ", "Trẻ dưới 12 tuổi không được phép bay một mình theo quy định của AirSky Air.");
                return;
            }
        }

        // 4️⃣ Xác nhận trước khi tiếp tục
        Alert.alert(
            "Xác nhận thông tin",
            "Vui lòng đảm bảo tất cả thông tin đã được điền chính xác. Thông tin sai có thể ảnh hưởng đến việc làm thủ tục bay của bạn.",
            [
                { text: "Kiểm tra lại", style: "cancel" },
                {
                    text: "Xác nhận",
                    onPress: () => {
                        // Chuẩn hóa dữ liệu trước khi lưu
                        const passengersWithDobString = passengers.map(p => ({
                            ...p,
                            dateOfBirth: p.dob ? format(p.dob, 'yyyy-MM-dd') : undefined,
                            passportNumber: p.idCard,
                        }));

                        dispatch({
                            type: 'UPDATE_STATE',
                            payload: {
                                passengers: passengersWithDobString,
                                contactName: bookerName,
                                contactEmail: bookerEmail,
                                baseTicketPrice: baseTicketPrice, // Lưu giá vé gốc
                                totalPrice: baseTicketPrice,      // Tổng tiền ban đầu bằng giá vé gốc
                            },
                        });
                        router.navigate('/(root)/(booking)/services-and-seats');
                    },
                },
            ]
        );
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
                                    <View className="flex-row items-center gap-x-1">
                                        <Text className="text-base font-semibold text-gray-700">Chuyến đi</Text>
                                        <TouchableOpacity onPress={() => Alert.alert(
                                            "Cách tính giá vé",
                                            "Giá vé được tính dựa trên loại hành khách:\n\n• Người lớn (≥ 12 tuổi): 100% giá vé\n• Trẻ em (2 - 11 tuổi): ~75% giá vé\n• Em bé (< 2 tuổi): ~10% giá vé"
                                        )}>
                                            <Ionicons name="help-circle-outline" size={16} color="gray" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-lg font-bold text-blue-900">
                                        {departureFlight.flight?.departure?.code} ({departureFlight.flight?.departure?.time}) → {departureFlight.flight?.arrival?.code} ({departureFlight.flight?.arrival?.time})
                                    </Text>
                                    <Text className="text-sm text-gray-500">Ngày: {bookingState.departureDate ? format(parseISO(bookingState.departureDate), 'dd/MM/yyyy') : ''}</Text>
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
                                    <Text className="text-sm text-gray-500">Ngày: {bookingState.returnDate ? format(parseISO(bookingState.returnDate), 'dd/MM/yyyy') : ''}</Text>
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
                                    style={{ fontSize: 14 }}
                                />
                                <TextInput
                                    label="Email"
                                    mode="outlined"
                                    value={bookerEmail}
                                    onChangeText={setBookerEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    style={{ fontSize: 14 }}
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
