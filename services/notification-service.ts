import { NotificationResponse } from "@/app/types/notification";
import { ApiResponse, PageResponse } from "@/app/types/common";
import api from "./api";

/**
 * Lấy danh sách thông báo của người dùng theo ID, có phân trang.
 * @param userId ID của người dùng.
 * @param page Số trang (mặc định là 0).
 * @param size Kích thước trang (mặc định là 20).
 * @returns Promise chứa một trang các thông báo.
 */
export const getMyNotifications = async (userId: number, page: number = 0, size: number = 20): Promise<PageResponse<NotificationResponse>> => {
    try {
        const response = await api.get<ApiResponse<PageResponse<NotificationResponse>>>(`/notifications/user/${userId}`, { params: { page, size } });
        return response.data.data;
    } catch (error: any) {
        console.error(`Error fetching notifications for user ${userId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(error.response?.data?.message || "Không thể tải danh sách thông báo.");
    }
};

/**
 * Lấy số lượng thông báo chưa đọc của người dùng.
 * @param userId ID của người dùng.
 * @returns Promise chứa số lượng thông báo chưa đọc.
 */
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
    try {
        const response = await api.get<ApiResponse<number>>(`/notifications/user/${userId}/count-unread`);
        return response.data.data;
    } catch (error: any) {
        console.error(`Error fetching unread notification count for user ${userId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(error.response?.data?.message || "Không thể đếm số thông báo chưa đọc.");
    }
};

/**
 * Đánh dấu một hoặc nhiều thông báo là đã đọc.
 * @param userId ID của người dùng.
 * @param notificationIds Mảng các ID của thông báo cần đánh dấu.
 * @returns Promise<void>
 */
export const markNotificationsAsRead = async (userId: number, notificationIds: string[]): Promise<void> => {
    await api.put(`/notifications/user/${userId}/mark-read`, notificationIds);
};

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc.
 * @param userId ID của người dùng.
 * @returns Promise<void>
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
    await api.put(`/notifications/user/${userId}/mark-read-all`);
};

/**
 * Xóa một thông báo.
 * @param notificationId ID của thông báo cần xóa.
 * @returns Promise<void>
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
        await api.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
        console.error(`Error deleting notification ${notificationId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(error.response?.data?.message || "Không thể xóa thông báo.");
    }
};