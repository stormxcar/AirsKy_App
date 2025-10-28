import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '@/config/env';

// Tạo một instance của axios với cấu hình cơ bản
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header của mỗi yêu cầu
api.interceptors.request.use(
  async (config) => {
    // Lấy token từ AsyncStorage (hoặc bất kỳ nơi nào bạn lưu trữ nó)
    const token = await AsyncStorage.getItem('userToken');
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
  (error) => {
    if (error.response && error.response.status === 401) {
      // Xử lý khi token hết hạn hoặc không hợp lệ
      // Ví dụ: Đăng xuất người dùng và điều hướng về trang đăng nhập
      console.log('Unauthorized, logging out...');
      // router.replace('/(root)/(auth)/sign-in');
    }
    return Promise.reject(error);
  }
);

export default api;