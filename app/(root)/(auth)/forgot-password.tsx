import { forgotPassword } from "@/services/auth-service";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendRequest = async () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            Alert.alert("Lỗi", "Vui lòng nhập một địa chỉ email hợp lệ.");
            return;
        }
        setLoading(true);
        try {
            const message = await forgotPassword(email);
            Alert.alert("Thành công", message);
            router.push({
                pathname: "/(root)/(auth)/otp-code",
                params: { email: email, from: 'forgot-password' },
            });
        } catch (error: any) {
            Alert.alert("Yêu cầu thất bại", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-3xl">
                {/* Tiêu đề */}
                <View className="mb-8 items-center">
                    <Text className="text-3xl font-bold text-blue-950">Quên mật khẩu</Text>
                    <Text className="text-gray-500 mt-2 text-center">Nhập email của bạn để nhận mã xác minh.</Text>
                </View>

                {/* Form nhập */}
                <TextInput
                    label="Email"
                    mode="outlined"
                    value={email}
                    onChangeText={setEmail}
                    className=""
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                {/* Nút gửi */}
                <Button mode="contained" onPress={handleSendRequest} loading={loading} disabled={loading || !email} style={{ marginTop: 20, borderRadius: 16, paddingVertical: 6 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
                    Gửi yêu cầu
                </Button>
            </SafeAreaView>
        </>
    );
};

export default ForgotPassword;