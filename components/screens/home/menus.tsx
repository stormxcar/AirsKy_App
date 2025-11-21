import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const menuItems = [
    { icon: 'home-outline', name: 'Trang chủ', screen: '/(root)/(tabs)/home' },
    { icon: 'airplane-outline', name: 'Đặt vé', screen: '/(root)/(tabs)/book-flight' },
    { icon: 'briefcase-outline', name: 'Chuyến đi của tôi', screen: '/(root)/(tabs)/my-trips' },
    { icon: 'ticket-outline', name: 'Làm thủ tục', screen: '/(root)/(tabs)/check-in' },
    { icon: 'person-outline', name: 'Tài khoản', screen: '/(root)/(tabs)/profile' },
    { icon: 'information-circle-outline', name: 'Về chúng tôi', screen: 'about_modal' },
    { icon: 'call-outline', name: 'Liên hệ', screen: 'contact_modal' },
];

type MenusProps = {
    onClose?: () => void; // Hàm để đóng menu
    onOpenAboutModal?: () => void; // Hàm để mở modal "Về chúng tôi"
    onOpenContactModal?: () => void; // Hàm để mở modal "Liên hệ"
};

const Menus = ({ onClose, onOpenAboutModal, onOpenContactModal }: MenusProps) => {
    const router = useRouter();

    const handlePress = (screen: string) => {
        if (screen === 'about_modal') {
            onOpenAboutModal?.(); // Chỉ gọi hàm mở modal
        } else if (screen === 'contact_modal') {
            onOpenContactModal?.(); // Chỉ gọi hàm mở modal
        } else {
            // Đối với các mục khác, đóng menu và chuyển trang
            onClose?.();
            setTimeout(() => {
                router.push(screen as any);
            }, 250); // Đợi animation đóng menu mượt hơn
        }
    };


    return (
        <View className="flex-1">
            <ScrollView className="p-4">
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handlePress(item.screen)}
                        className="flex-row items-center p-4"
                    >
                        <Ionicons name={item.icon as any} size={24} color="white" />
                        <Text className="text-base ml-4 font-medium text-white">{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View className="p-4 border-t border-blue-800">
                <Text className="text-center text-blue-400 text-xs">AirSky v1.0.0</Text>
            </View>
        </View>
    );
};

export default Menus;