import { forgotPassword, resendVerificationCode, resetPassword } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP và mật khẩu mới
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Bộ đếm thời gian cho việc gửi lại OTP
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const startCountdown = () => {
        setCountdown(60); // Bắt đầu đếm ngược từ 60 giây
    };

    // Bước 1: Gửi yêu cầu mã OTP
    const handleSendEmail = async () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            Alert.alert("Lỗi", "Vui lòng nhập một địa chỉ email hợp lệ.");
            return;
        }
        setLoading(true);
        try {
            const message = await forgotPassword(email);
            Alert.alert("Thành công", message, [{ text: "OK", onPress: () => {
                setStep(2);
                startCountdown();
            }}]);
        } catch (error: any) {
            Alert.alert("Yêu cầu thất bại", error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Gửi lại mã OTP
    const handleResendOtp = async () => {
        if (countdown > 0) return;
        setResendLoading(true);
        try {
            const message = await resendVerificationCode(email);
            Alert.alert("Thành công", message);
            startCountdown();
        } catch (error: any) {
            Alert.alert("Gửi lại thất bại", error.message);
        } finally {
            setResendLoading(false);
        }
    };

    // Bước 2: Đặt lại mật khẩu
    const handleResetPassword = async () => {
        if (otp.length !== 6) {
            Alert.alert("Lỗi", "Mã xác minh phải có 6 chữ số.");
            return;
        }

        // Cập nhật quy tắc xác thực mật khẩu
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            Alert.alert("Mật khẩu không hợp lệ", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }
        setLoading(true);
        try {
            const message = await resetPassword(email, otp, newPassword);
            Alert.alert("Thành công", message, [
                { text: "OK", onPress: () => router.replace('/(root)/(auth)/sign-in') }
            ]);
        } catch (error: any) {
            Alert.alert("Đặt lại mật khẩu thất bại", error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        if (step === 1) {
            return (
                <>
                    <View className="mb-8 items-center">
                        <Text className="text-3xl font-bold text-blue-950">Quên mật khẩu</Text>
                        <Text className="text-gray-500 mt-2 text-center">Nhập email của bạn để nhận mã xác minh.</Text>
                    </View>
                    <TextInput label="Email" mode="outlined" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    <Button mode="contained" onPress={handleSendEmail} loading={loading} disabled={loading || !email} style={styles.button} labelStyle={styles.buttonLabel}>
                        Gửi yêu cầu
                    </Button>
                </>
            );
        }

        return (
            <>
                <View className="mb-6 items-center">
                    <Text className="text-3xl font-bold text-blue-950">Đặt lại mật khẩu</Text>
                    <Text className="text-gray-500 mt-2 text-center">
                        Chúng tôi đã gửi mã xác minh đến <Text className="font-bold">{email}</Text>. Vui lòng kiểm tra email của bạn và nhập mã bên dưới.
                    </Text>
                </View>
                <TextInput label="Mã OTP" mode="outlined" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} style={styles.input} />
                <TextInput label="Mật khẩu mới" mode="outlined" value={newPassword} onChangeText={setNewPassword} secureTextEntry style={styles.input} />
                <TextInput label="Xác nhận mật khẩu mới" mode="outlined" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} />
                
                <Button mode="contained" onPress={handleResetPassword} loading={loading} disabled={loading} style={styles.button} labelStyle={styles.buttonLabel}>
                    Đặt lại mật khẩu
                </Button>

                <Button mode="text" onPress={handleResendOtp} loading={resendLoading} disabled={resendLoading || countdown > 0} style={{ marginTop: 12 }} labelStyle={{ fontSize: 14, fontWeight: 'normal' }}>
                    {countdown > 0 ? `Gửi lại OTP trong ${countdown}s` : "Gửi lại mã OTP"}
                </Button>
            </>
        );
    };

    return (
        <>
            <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-[40px]">
                {/* Tiêu đề */}
                <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)}>
                    <Ionicons name="chevron-back" size={24} color="#1e3a8a" />
                </TouchableOpacity>
                {renderStepContent()}
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        marginTop: 20,
        borderRadius: 16,
        paddingVertical: 6,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        marginTop: 12,
    }
});

export default ForgotPassword;