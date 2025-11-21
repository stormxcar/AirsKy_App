import { resendVerificationCode, verifyRegistration } from "@/services/auth-service";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const OtpCode = () => {
    const { email, from } = useLocalSearchParams<{ email: string, from: 'sign-up' | 'forgot-password' }>();
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin email. Vui lòng thử lại.");
            router.back();
        }
    }, [email]);

    const handleVerifyOtp = async () => {
        setLoading(true);
        try {
            if (!email) throw new Error("Email is missing");
            await verifyRegistration(email, otp);
            console.log("OTP verified successfully");
            Alert.alert("Thành công", "Tài khoản của bạn đã được xác thực thành công.");
            // Điều hướng chung sau khi xác thực thành công, ví dụ về trang đăng nhập
            router.replace("/(root)/(auth)/sign-in");
        } catch (error: any) {
            Alert.alert("Xác thực thất bại", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        try {
            if (!email) throw new Error("Email is missing");
            await resendVerificationCode(email);
            Alert.alert("Thành công", "Một mã OTP mới đã được gửi đến email của bạn.");
        } catch (error: any) {
            Alert.alert("Gửi lại thất bại", error.message);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <>
            <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-3xl">
                {/* Tiêu đề */}

                <View className="mb-8 items-center">
                    <Text className="text-3xl font-bold text-blue-950">Xác minh tài khoản</Text>
                    <Text className="text-gray-500 mt-2 text-center">Nhập mã OTP đã được gửi đến <Text className="font-bold">{email}</Text>.</Text>
                </View>

                {/* Form nhập */}
                <TextInput
                    label="OTP"
                    mode="outlined"
                    value={otp}
                    onChangeText={setOtp}
                    className=""
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    maxLength={6}
                />

                {/* Nút gửi */}
                <Button mode="text" onPress={handleResendOtp} loading={resendLoading} disabled={resendLoading} style={{ marginTop: 12 }} labelStyle={{ fontSize: 14, fontWeight: 'normal' }}>
                    Gửi lại mã otp
                </Button>
                {/* Nút gửi */}
                <Button mode="contained" onPress={handleVerifyOtp} loading={loading} disabled={loading || !otp || otp.length < 6} style={{ marginTop: 8, borderRadius: 16, paddingVertical: 6 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
                    Xác nhận
                </Button>

            </SafeAreaView>
        </>
    );
};

export default OtpCode;