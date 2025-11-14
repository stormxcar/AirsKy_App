export interface NotificationResponse {
    notificationId: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string; // e.g., 'BOOKING_CONFIRMED', 'SYSTEM_ANNOUNCEMENT'
    relatedId: string | null;
    createdAt: string; // ISO 8601 date string
    userId: string | null;
}