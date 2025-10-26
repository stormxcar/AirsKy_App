import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const notificationsData = [
    {
        id: '1',
        icon: 'airplane',
        title: 'Nhắc nhở làm thủ tục',
        message: 'Chuyến bay SGN-HAN của bạn sắp khởi hành. Vui lòng làm thủ tục trước 2 giờ.',
        time: '2 giờ trước',
        read: false,
    },
    {
        id: '2',
        icon: 'pricetag',
        title: 'Ưu đãi đặc biệt!',
        message: 'Giảm giá 30% cho các chuyến bay đến Đà Nẵng trong tháng 9. Đừng bỏ lỡ!',
        time: 'Hôm qua',
        read: false,
    },
    {
        id: '3',
        icon: 'checkmark-circle',
        title: 'Đặt vé thành công',
        message: 'Bạn đã đặt thành công vé cho chuyến bay HAN-DAD ngày 25/08.',
        time: '2 ngày trước',
        read: true,
    },
];

type NotificationsProps = {
    color?: string;
};

const Notifications = ({ color = '#1e3a8a' }: NotificationsProps) => {
    return (
        <ScrollView className="p-4">
            {notificationsData.map((item) => (
                <TouchableOpacity key={item.id} className={`p-4 border-b border-gray-100 flex-row ${!item.read ? 'bg-blue-50' : 'bg-white'}`}>
                    <View className="mr-4 mt-1">
                        <Ionicons name={item.icon as any} size={24} color={color} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-800">{item.title}</Text>
                        <Text className="text-sm text-gray-600 my-1">{item.message}</Text>
                        <Text className="text-xs text-gray-400">{item.time}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export default Notifications;