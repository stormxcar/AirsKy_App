import { register, resendVerificationCode, verifyRegistration } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, Checkbox, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUp = () => {
  const [step, setStep] = useState(1); // 1: Đăng ký, 2: Xác thực OTP
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);

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

  // Bước 1: Xử lý đăng ký
  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !agreedToTerms) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Lỗi", "Địa chỉ email không hợp lệ.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert("Mật khẩu không hợp lệ", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt.");
      return;
    }

    setLoading(true);
    try {
      const message = await register({ firstName, lastName, email, password, phoneNumber });
      Alert.alert("Thành công", message, [{
        text: "OK", onPress: () => {
          setStep(2);
          startCountdown();
        }
      }]);
    } catch (error: any) {
      Alert.alert("Đăng ký thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xử lý xác thực OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Lỗi", "Mã OTP phải có 6 chữ số.");
      return;
    }
    setLoading(true);
    try {
      const message = await verifyRegistration(email, otp);
      Alert.alert("Thành công", message, [
        { text: "OK", onPress: () => router.replace('/(root)/(auth)/sign-in') }
      ]);
    } catch (error: any) {
      Alert.alert("Xác thực thất bại", error.message);
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

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-blue-950">Tạo tài khoản</Text>
            <Text className="text-gray-500 mt-2">Bắt đầu hành trình của bạn!</Text>
          </View>
          <TextInput label="Họ" mode="outlined" value={firstName} onChangeText={setFirstName} className="mb-4" />
          <TextInput label="Tên" mode="outlined" value={lastName} onChangeText={setLastName} className="mb-4" />
          <TextInput label="Số điện thoại" mode="outlined" value={phoneNumber} onChangeText={setPhoneNumber} className="mb-4" autoCapitalize="none" keyboardType="phone-pad" />
          <TextInput label="Email" mode="outlined" value={email} onChangeText={setEmail} className="mb-4" autoCapitalize="none" keyboardType="email-address" />
          <TextInput label="Mật khẩu" mode="outlined" secureTextEntry={!isPasswordVisible} value={password} onChangeText={setPassword} className="mb-4" right={<TextInput.Icon icon={isPasswordVisible ? "eye-off" : "eye"} onPress={() => setIsPasswordVisible(!isPasswordVisible)} />} />
          <TextInput label="Xác nhận mật khẩu" mode="outlined" secureTextEntry={!isConfirmPasswordVisible} value={confirmPassword} onChangeText={setConfirmPassword} className="mb-4" right={<TextInput.Icon icon={isConfirmPasswordVisible ? "eye-off" : "eye"} onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} />} />

          {/* Điều khoản và điều kiện */}
          <View className="flex-row items-center mt-2 mb-4 ">
            <Checkbox.Android
              status={agreedToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              color="#1e3a8a"
            />
            <Text className="text-gray-600" onPress={() => setAgreedToTerms(!agreedToTerms)}>
              Tôi đồng ý với

            </Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
              <Text className="text-blue-950 font-semibold underline"> Điều khoản & Điều kiện</Text>
            </TouchableOpacity>

          </View>

          <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading || !firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !agreedToTerms} style={{ borderRadius: 16, paddingVertical: 6, marginTop: 8 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }} >
            Đăng ký
          </Button>
          <View className="mt-8 flex-row justify-center pb-4">
            <Text className="text-gray-600">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.navigate("/(root)/(auth)/sign-in")}>
              <Text className="font-semibold text-blue-950">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return (
      <>
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-blue-950">Xác minh tài khoản</Text>
          <Text className="text-gray-500 mt-2 text-center">Nhập mã OTP đã được gửi đến <Text className="font-bold">{email}</Text>.</Text>
        </View>
        <TextInput label="Mã OTP" mode="outlined" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
        <Button mode="contained" onPress={handleVerifyOtp} loading={loading} disabled={loading || otp.length < 6} style={{ marginTop: 20, borderRadius: 16, paddingVertical: 6 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
          Xác nhận
        </Button>
        <Button mode="text" onPress={handleResendOtp} loading={resendLoading} disabled={resendLoading || countdown > 0} style={{ marginTop: 12 }} labelStyle={{ fontSize: 14, fontWeight: 'normal' }}>
          {countdown > 0 ? `Gửi lại mã trong ${countdown}s` : "Gửi lại mã OTP"}
        </Button>
      </>
    );
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-blue-950" edges={"top"}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-white mt-20 rounded-t-[40px] px-6 pt-4">
            <ScrollView showsVerticalScrollIndicator={false} className="pt-2">
              <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)}>
                <Ionicons name="chevron-back" size={24} color="#1e3a8a" />
              </TouchableOpacity>
              {renderStepContent()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Modal Điều khoản */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={isTermsModalVisible}
          onRequestClose={() => setTermsModalVisible(false)}
        >
          <SafeAreaView className="p-2 flex-1">
            <View style={styles.modalHeader}>
              <Text className="text-xl font-bold text-center mx-auto pt-8 text-blue-950">Điều khoản & Điều kiện</Text>

            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.paragraph}>
                Chào mừng bạn đến với AirSky. Bằng cách sử dụng ứng dụng của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện sau đây.
              </Text>
              <Text style={styles.subHeader}>1. Phạm vi sử dụng</Text>
              <Text style={styles.paragraph}>
                Bạn đồng ý chỉ sử dụng ứng dụng cho các mục đích hợp pháp, bao gồm tìm kiếm và đặt vé máy bay, quản lý các chuyến đi và các dịch vụ liên quan khác do chúng tôi cung cấp.
              </Text>
              <Text style={styles.subHeader}>2. Tài khoản người dùng</Text>
              <Text style={styles.paragraph}>
                Bạn chịu trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Mọi hoạt động diễn ra dưới tài khoản của bạn sẽ được coi là do bạn thực hiện.
              </Text>
              <Text style={styles.subHeader}>3. Quyền sở hữu trí tuệ</Text>
              <Text style={styles.paragraph}>
                Tất cả nội dung, logo, và thiết kế trên ứng dụng này là tài sản của AirSky và được bảo vệ bởi luật sở hữu trí tuệ.
              </Text>
              <Text style={styles.subHeader}>4. Giới hạn trách nhiệm</Text>
              <Text style={styles.paragraph}>
                Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp nào phát sinh từ việc sử dụng hoặc không thể sử dụng ứng dụng.
              </Text>

            </ScrollView>
            <Button mode="contained" onPress={() => setTermsModalVisible(false)} style={{ marginTop: 24, marginBottom: 24 }}>
              Tôi đã hiểu
            </Button>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  modalContent: {
    padding: 16,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#111827',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});

export default SignUp;