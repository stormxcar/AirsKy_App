import { NotificationResponse } from '@/app/types/notification';
import { useAuth } from '@/context/auth-context';
import { useLoading } from '@/context/loading-context';
import { useNotification } from '@/context/notification-context';
import { getBookingDetailsById } from '@/services/booking-service';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

type NotificationsProps = {
    onClose?: () => void; // Thêm prop để đóng modal
};

const Notifications = ({ onClose }: NotificationsProps) => {
    const { user } = useAuth();
    const { notifications, isLoading, fetchNotifications, markAsRead } = useNotification();
    const router = useRouter();
    const { showLoading } = useLoading();

    const handleNotificationPress = async (item: NotificationResponse) => {
        // Đánh dấu thông báo là đã đọc
        if (!item.isRead) {
            markAsRead([item.notificationId]);
        }

        // Đóng modal ngay lập tức
        if (onClose) onClose();

        if (item.type.startsWith('BOOKING_') && item.relatedId) {
            await showLoading(async () => { // Wrap toàn bộ để loading cover fetch + navigation
                const bookingDetails = await getBookingDetailsById(item.relatedId!);

                // Serialize và pass full data (hoặc partial nếu cần)
                const initialDetails = JSON.stringify(bookingDetails);

                // Push với initialDetails
                router.push({
                    pathname: '/(root)/(booking)/booking-result',
                    params: {
                        bookingId: bookingDetails.bookingId.toString(),
                        status: bookingDetails.status,
                        bookingCode: bookingDetails.bookingCode,
                        initialDetails, // JSON string
                    },
                });
            }, 500); // Min 500ms để mượt, cover navigation
        }
    };

    const getIconForType = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'BOOKING_CONFIRMED': return 'checkmark-circle';
            case 'BOOKING_CANCELLED': return 'close-circle';
            case 'FLIGHT_REMINDER': return 'alarm';
            case 'SYSTEM_ANNOUNCEMENT': return 'megaphone';
            case 'DEAL_ACTIVATED': return 'pricetag';
            default: return 'notifications';
        }
    };

    // Filter out invalid notifications
    const validNotifications = notifications.filter(
        item => item && item.title && item.message && item.notificationId
    );

    if (isLoading && validNotifications.length === 0) {
        return <ActivityIndicator size="large" color="#1e3a8a" className="my-8" />;
    }

    // Nếu người dùng chưa đăng nhập, hiển thị màn hình trống
    if (!user) {
        return (
            <View className="flex-1 justify-center items-center py-10 ">
                <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" className='pt-56'/>
                <Text className="text-gray-500 mt-4">Bạn chưa có thông báo nào.</Text>
            </View>
        );
    }
    return (
        <FlatList
            data={validNotifications}
            keyExtractor={(item) => item.notificationId}
            onRefresh={fetchNotifications}
            refreshing={isLoading}
            ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-10  ">
                    <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" className='pt-56' />
                    <Text className="text-gray-500 mt-4">Bạn chưa có thông báo nào.</Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    className={`p-4 border-b border-gray-100 flex-row items-start ${!item.isRead ? 'bg-blue-50' : 'bg-white'}`}
                >
                    <View className="mr-4 mt-1">
                        <Ionicons name={getIconForType(item.type)} size={24} color={!item.isRead ? '#1e3a8a' : '#9ca3af'} />
                    </View>
                    <View className="flex-1">
                        <Text className={`text-base font-bold ${!item.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {item.title || 'Thông báo'}
                        </Text>
                        <Text className={`text-sm my-1 ${!item.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                            {item.message || 'Nội dung thông báo'}
                        </Text>
                        <Text className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                        </Text>
                    </View>
                    {!item.isRead && <View className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center ml-2" />}
                </TouchableOpacity>
            )}
        />
    );
};

export default Notifications;