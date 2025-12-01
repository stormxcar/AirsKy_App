/**
 * Định nghĩa các kiểu dữ liệu liên quan đến xác thực người dùng.
 */

/**
 * Dữ liệu gửi đi khi yêu cầu đăng nhập.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Dữ liệu gửi đi khi yêu cầu đăng ký.
 */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

/**
 * Dữ liệu gửi đi khi yêu cầu đổi mật khẩu.
 */
export interface ChangePasswordRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}


/**
 * Dữ liệu nhận về sau khi đăng nhập thành công.
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

/**
 * Thông tin chi tiết của người dùng.
 * Cấu trúc này nên tương ứng với UserResponse DTO từ backend.
 */
export interface User {
  membershipCode: string;
  authProvider: string;
  dateOfBirth: any;
  passportNumber: string;
  passportExpiry: any;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  roles: string[]; // e.g., ['ROLE_USER', 'ROLE_ADMIN']
  loyaltyTier?: string; // e.g., 'BRONZE', 'SILVER'
  loyaltyPoints?: number;
}
