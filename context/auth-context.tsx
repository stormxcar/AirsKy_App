import { AuthResponse, User } from "@/app/types/auth";
import { getProfile } from "@/services/user-service";
import api from "@/services/api";
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

const AUTH_KEY = 'auth-data';

type AuthContextType = {
    authData: AuthResponse | null;
    user: User | null;
    setAuthData: (data: AuthResponse | null) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    authData: null,
    user: null,
    setAuthData: async () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [authData, setAuthDataState] = useState<AuthResponse | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const storedAuthData = await SecureStore.getItemAsync(AUTH_KEY);
                if (storedAuthData) {
                    const parsedData: AuthResponse = JSON.parse(storedAuthData);
                    // Cập nhật token cho axios interceptor TRƯỚC KHI gọi API
                    api.defaults.headers.common['Authorization'] = `Bearer ${parsedData.accessToken}`;
                    setAuthDataState(parsedData);
                    // Bây giờ mới gọi getProfile()
                    const profile = await getProfile();
                    setUser(profile);
                }
            } catch (error) {
                console.error("Failed to load auth data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuthData();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(root)' && segments[1] === '(auth)';

        // Chỉ tự động chuyển hướng ra khỏi màn hình đăng nhập/đăng ký KHI người dùng đã đăng nhập.
        if (authData && inAuthGroup) {
            router.replace('/(root)/(tabs)/home');
        }
    }, [authData, segments, isLoading, router]);

    const setAuthData = async (data: AuthResponse | null) => {
        setAuthDataState(data);
        if (data) {
            // Cập nhật token cho axios interceptor ngay lập tức
            api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
            await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(data));
            const profile = await getProfile();
            setUser(profile);
        } else {
            await SecureStore.deleteItemAsync(AUTH_KEY);
            setUser(null);
            // Xóa token khỏi header chỉ khi đăng xuất
            delete api.defaults.headers.common['Authorization'];
        }
    };

    const logout = () => {
        setAuthData(null);
    };

    const value = { authData, user, setAuthData, logout, isLoading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};