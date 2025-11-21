import { User } from "@/app/types/auth";
import { BookingResponse } from "@/app/types/booking"; // Import BookingResponse
import api from "./api";

export interface UpdateProfileData {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string; // Format YYYY-MM-DD
    avatar?: string; // Có thể là local URI hoặc URL hiện tại
}



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
 * Cập nhật thông tin hồ sơ người dùng.
 * @param userId ID của người dùng.
 * @param data Dữ liệu cần cập nhật.
 * @returns Promise chứa thông tin người dùng đã được cập nhật.
 */
export const updateProfile = async (userId: number, data: UpdateProfileData): Promise<User> => {
    const formData = new FormData();

    // Append các trường text
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('phone', data.phone);
    formData.append('dateOfBirth', data.dateOfBirth);

    // Xử lý avatar
    if (data.avatar) {
        if (data.avatar.startsWith('file://')) {
            // Nếu là file mới từ thiết bị
            const uriParts = data.avatar.split('.');
            const fileType = uriParts[uriParts.length - 1];
            const fileName = data.avatar.split('/').pop();

            // @ts-ignore
            formData.append('avatar', {
                uri: data.avatar,
                name: fileName,
                type: `image/${fileType}`,
            });
        } else {
            // Nếu là URL đã có
            formData.append('existingAvatar', data.avatar);
        }
    }

    try {
        const response = await api.put<{ data: User }>(`/users/${userId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    } catch (error: any) {
        console.error("Failed to update profile:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin.');
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