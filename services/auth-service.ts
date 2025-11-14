import { LoginRequest, AuthResponse, RegisterRequest } from "@/app/types/auth";
import api from "./api";

type ApiResponse<T> = {
    data: T;
    message: string;
    status?: string;
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
 * Gửi yêu cầu đăng ký tài khoản mới.
 * @param data - Thông tin đăng ký của người dùng.
 * @returns Promise chứa thông báo từ server.
 */
export const register = async (data: RegisterRequest): Promise<string> => {
    try {
        const response = await api.post<ApiResponse<null>>('/auth/register', data);
        return response.data.message;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.');
        }
    }
};

/**
 * Gửi yêu cầu xác thực tài khoản bằng OTP.
 * @param email - Email cần xác thực.
 * @param otp - Mã OTP người dùng nhập.
 * @returns Promise chứa thông báo từ server.
 */
export const verifyAccount = async (email: string, otp: string): Promise<string> => {
    try {
        const response = await api.post<ApiResponse<null>>('/auth/verify-account', { email, otp });
        return response.data.message;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Xác thực OTP thất bại. Vui lòng thử lại.');
        }
    }
};

/**
 * Gửi yêu cầu "quên mật khẩu" để nhận OTP qua email.
 * @param email - Email của tài khoản cần reset mật khẩu.
 * @returns Promise chứa thông báo từ server.
 */
export const forgotPassword = async (email: string): Promise<string> => {
    try {
        const response = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
        return response.data.message;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Yêu cầu quên mật khẩu thất bại. Vui lòng thử lại.');
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