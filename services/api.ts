import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import env from '@/config/env';

// Tạo một instance của axios với cấu hình cơ bản
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log(env.API_BASE_URL)
// Interceptor để thêm token vào header của mỗi yêu cầu
api.interceptors.request.use(
  async (config) => {
    // Lấy authData từ SecureStore
    const authDataString = await SecureStore.getItemAsync('auth-data');
    let token = null;
    if (authDataString) {
      token = JSON.parse(authDataString).accessToken;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi chung (ví dụ: lỗi 401 - Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Xử lý khi token hết hạn hoặc không hợp lệ
      // Xóa token cũ và điều hướng về trang đăng nhập
      console.log('Unauthorized, logging out...');
      await SecureStore.deleteItemAsync('auth-data');
      // Dùng replace để người dùng không thể back lại trang cũ
      router.replace('/(root)/(auth)/sign-in');
    }
    return Promise.reject(error);
  }
);

export default api;