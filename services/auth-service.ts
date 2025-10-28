import { LoginRequest, AuthResponse } from "@/app/types/auth";
import api from "./api";

type ApiResponse<T> = {
    data: T;
    message: string;
};

/**
 * Gửi yêu cầu đăng nhập đến server.
 * @param credentials - Email và mật khẩu của người dùng.
 * @returns Promise chứa AuthResponse với access và refresh token.
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
        return response.data.data; // Trả về đúng object chứa token
    } catch (error: any) {
        // Ném lại lỗi để component có thể xử lý và hiển thị thông báo
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Đã có lỗi xảy ra. Vui lòng thử lại.');
        }
    }
};

/**
 * Gửi Google ID Token đến server để xác thực.
 * @param idToken - ID Token nhận được từ Google Sign-In.
 * @returns Promise chứa AuthResponse với access và refresh token của hệ thống.
 */
export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
    try {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/google-login', { idToken });
        console.log("Login with Google response:", response)
        return response.data.data; 
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
        }
    }
};