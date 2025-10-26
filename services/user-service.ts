import { User } from "@/app/types/auth";
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