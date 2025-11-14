import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { register } from "@/services/auth-service";

const SignUp = () => {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Lỗi", "Địa chỉ email không hợp lệ.");
      return;
    }
try {
      const message = await register({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
      });
      Alert.alert("Thành công", message);
      // Chuyển đến trang OTP với email đã đăng ký
      router.push({
        pathname: "/(root)/(auth)/otp-code",
        params: { email: email, from: 'sign-up' },
      });
    } catch (error: any) {
      Alert.alert("Đăng ký thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

    return (
      <>
        <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-3xl">
          {/* Tiêu đề */}
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-blue-950">Tạo tài khoản</Text>
            <Text className="text-gray-500 mt-2">Bắt đầu hành trình của bạn!</Text>
          </View>

         
          {/* Form nhập */}
          <TextInput
            label="Họ"
            mode="outlined"
            value={firstName}
            onChangeText={setFirstName}
            className=" "
          />
           {/* Form nhập */}
          <TextInput
            label="Tên"
            mode="outlined"
            value={lastName}
            onChangeText={setLastName}
            className=" "
          />
          <TextInput
            label="Số điện thoại"
            mode="outlined"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className=" "
            autoCapitalize="none"
            keyboardType="phone-pad"
          />
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            className=" "
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            label="Mật khẩu"
            mode="outlined"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
            className=" "
            right={
              <TextInput.Icon
                icon={isPasswordVisible ? "eye-off" : "eye"}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            }
          />
          <TextInput
            label="Xác nhận mật khẩu"
            mode="outlined"
            secureTextEntry={!isPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            className=" "
            right={
              <TextInput.Icon
                icon={isPasswordVisible ? "eye-off" : "eye"}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            }
          />

          {/* Nút đăng ký */}
          <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading} style={{ borderRadius: 16, paddingVertical: 6, marginTop: 16 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }} >
            Đăng ký
          </Button>

          {/* Quay lại Đăng nhập */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-600">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.navigate("/(root)/(auth)/sign-in")}>
              <Text className="font-semibold text-blue-950">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  };

  export default SignUp;