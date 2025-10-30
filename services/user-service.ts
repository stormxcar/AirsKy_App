import { User } from "@/app/types/auth";
import { BookingResponse } from "@/app/types/booking"; // Import BookingResponse
import api from "./api";

/**
 * Lấy thông tin hồ sơ của người dùng đã đăng nhập.
 * @returns Promise chứa thông tin người dùng.
 */
export const getProfile = async (): Promise<User> => {
    try {
        // API trả về ApiResponse<UserResponse>, ta cần lấy data.data
        const response = await api.get<{ data: User }>('/auth/profile/me');
        return response.data.data;
    } catch (error: any) {
        console.error("Failed to fetch profile:", error);
        throw new Error(error.response?.data?.message || 'Không thể tải thông tin người dùng.');
    }
};

/**
 * Lấy danh sách các booking của một người dùng.
 * @param userId - ID của người dùng.
 * @returns Promise chứa một mảng các booking.
 */
export const getMyBookings = async (userId: number): Promise<BookingResponse[]> => {
    try {
        // Endpoint chính xác từ backend là /api/v1/users/{id}/bookings
        // API trả về ApiResponse<List<BookingResponse>>, ta cần lấy data.data
        const response = await api.get<{ data: BookingResponse[] }>(`/users/${userId}/bookings`);
        return response.data.data;
    } catch (error: any) {
        console.error(`Failed to fetch bookings for user ${userId}:`, error);
        throw new Error(error.response?.data?.message || 'Không thể tải danh sách chuyến đi.');
    }
};