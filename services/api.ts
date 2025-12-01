import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import env from '@/config/env';

// Tạo một instance của axios với cấu hình cơ bản
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// console.log(env.API_BASE_URL)

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
    const originalRequest = error.config;

    // Chỉ xử lý lỗi 401 và không phải là yêu cầu refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang có một yêu cầu refresh token khác, thêm yêu cầu hiện tại vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authDataString = await SecureStore.getItemAsync('auth-data');
        if (!authDataString) throw new Error("No auth data found");

        const refreshToken = JSON.parse(authDataString).refreshToken;
        if (!refreshToken) throw new Error("No refresh token found");

        // Gọi API để làm mới token
        const { data: newAuthData } = await api.post('/auth/refresh-token', { refreshToken });

        // Lưu token mới
        await SecureStore.setItemAsync('auth-data', JSON.stringify(newAuthData));
        api.defaults.headers.common['Authorization'] = `Bearer ${newAuthData.accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAuthData.accessToken}`;

        // Xử lý các yêu cầu trong hàng đợi với token mới
        processQueue(null, newAuthData.accessToken);

        // Thử lại yêu cầu ban đầu
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token thất bại, xử lý các yêu cầu trong hàng đợi với lỗi
        processQueue(refreshError, null);
        // Đăng xuất người dùng
        await SecureStore.deleteItemAsync('auth-data');
        delete api.defaults.headers.common['Authorization'];
        router.replace('/(root)/(auth)/sign-in');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;