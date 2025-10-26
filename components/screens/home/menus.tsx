import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const menuItems = [
    { icon: 'home-outline', name: 'Trang chủ', screen: '/(root)/(tabs)/home' },
    { icon: 'airplane-outline', name: 'Đặt vé', screen: '/(root)/(tabs)/book-flight' },
    { icon: 'briefcase-outline', name: 'Chuyến đi của tôi', screen: '/(root)/(tabs)/my-trips' },
    { icon: 'ticket-outline', name: 'Làm thủ tục', screen: '/(root)/(tabs)/check-in' },
    { icon: 'person-outline', name: 'Tài khoản', screen: '/(root)/(tabs)/profile' },
    { icon: 'information-circle-outline', name: 'Về chúng tôi', screen: '/about' },
    { icon: 'call-outline', name: 'Liên hệ', screen: '/contact' },
];

type MenusProps = {
    color?: string; // Nhận màu từ component cha
};

const Menus = ({ color = '#1e3a8a' }: MenusProps) => {
    const router = useRouter();

    const handlePress = (screen: string) => {
        console.log(`Navigating to ${screen}`);
        // router.push(screen); // Bạn có thể bỏ comment dòng này để kích hoạt điều hướng
    };

    return (
        <ScrollView className="p-4">
            {menuItems.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    onPress={() => handlePress(item.screen)}
                    className="flex-row items-center p-4"
                >
                    <Ionicons name={item.icon as any} size={24} color={color} />
                    <Text style={{ color }} className="text-base ml-4 font-medium">{item.name}</Text>
                </TouchableOpacity>
            ))}
            
        </ScrollView>
    );
};

export default Menus;