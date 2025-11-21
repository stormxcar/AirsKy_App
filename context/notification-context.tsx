import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './auth-context';
import { NotificationResponse } from '@/app/types/notification';
import { getMyNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationsAsRead } from '@/services/notification-service';
import { Alert }
from 'react-native';
import env from '@/config/env';

interface NotificationContextType {
    notifications: NotificationResponse[];
    unreadCount: number;
    fetchNotifications: (page?: number, size?: number) => Promise<void>;
    markAsRead: (ids: string[]) => void;
    markAllAsRead: () => void;
    isConnected: boolean;
    isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user, authData } = useAuth();
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInitialData = useCallback(async () => {
        if (user?.id) {
            try {
                const [initialNotifications, initialUnreadCount] = await Promise.all([
                    getMyNotifications(user.id, 0, 20),
                    getUnreadNotificationCount(user.id)
                ]);
                setNotifications(initialNotifications.content);
                setUnreadCount(initialUnreadCount);
            } catch (error) {
                console.error("Failed to fetch initial notification data:", error);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && authData?.accessToken) {
            fetchInitialData();

            const client = new Client({
                // Truyền token qua query parameter để Handshake Interceptor có thể xác thực
                webSocketFactory: () => new SockJS(`${env.API_SOCKET_URL}ws?token=${authData.accessToken}`),
                connectHeaders: {
                    // Vẫn giữ lại header này, một số cấu hình STOMP có thể cần
                    // Authorization: `Bearer ${authData.accessToken}`,
                },
                debug: (str) => {
                    console.log('STOMP: ' + str);
                },
                reconnectDelay: 5000,
                onConnect: () => {
                    console.log('WebSocket Connected!');
                    setIsConnected(true);

                    // Subscribe to user-specific notifications
                    client.subscribe(`/topic/notifications/${user.id}`, (message: IMessage) => {
                        try {
                            const newNotification: NotificationResponse = JSON.parse(message.body);
                            if (newNotification && newNotification.title && newNotification.message) {
                                setNotifications(prev => [newNotification, ...prev]);
                                setUnreadCount(prev => prev + 1);
                                Alert.alert(
                                    newNotification.title || 'Thông báo',
                                    newNotification.message || 'Nội dung thông báo'
                                );
                            }
                        } catch (error) {
                            console.error('Failed to parse notification message:', error);
                        }
                    });

                    // Subscribe to system-wide announcements
                    client.subscribe('/topic/notifications/system', (message: IMessage) => {
                        try {
                            const newNotification: NotificationResponse = JSON.parse(message.body);
                            if (newNotification && newNotification.title && newNotification.message) {
                                setNotifications(prev => [newNotification, ...prev]);
                                setUnreadCount(prev => prev + 1);
                                Alert.alert(
                                    newNotification.title || 'Thông báo hệ thống',
                                    newNotification.message || 'Nội dung thông báo hệ thống'
                                );
                            }
                        } catch (error) {
                            console.error('Failed to parse system notification message:', error);
                        }
                    });
                },
                onDisconnect: () => {
                    console.log('WebSocket Disconnected!');
                    setIsConnected(false);
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                },
            });

            client.activate();
            setStompClient(client);

            return () => {
                if (client) {
                    client.deactivate();
                    setIsConnected(false);
                }
            };
        } else {
            // User logged out, disconnect
            if (stompClient) {
                stompClient.deactivate();
                setIsConnected(false);
            }
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, authData, fetchInitialData]);

    const fetchNotifications = async (page = 0, size = 20) => {
        if (user?.id) {
            setIsLoading(true);
            try {
                const fetched = await getMyNotifications(user.id, page, size);
                setNotifications(fetched.content);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const markAsRead = async (ids: string[]) => {
        if (!user?.id) return;
        try {
            // Cập nhật UI ngay lập tức để có trải nghiệm tốt hơn
            const unreadCountToDecrease = notifications.filter(n => ids.includes(n.notificationId) && !n.isRead).length;
            setNotifications(prev =>
                prev.map(n => (ids.includes(n.notificationId) ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - unreadCountToDecrease));
            // Gọi API ở chế độ nền
            await markNotificationsAsRead(user.id, ids);
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            // Có thể rollback state ở đây nếu cần
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id || unreadCount === 0) return;
        try {
            // Cập nhật UI ngay lập tức
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            // Gọi API ở chế độ nền
            await markAllNotificationsAsRead(user.id);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            // Rollback state nếu API thất bại
            fetchInitialData();
        }
    };

    const value = {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        isConnected,
        isLoading,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};