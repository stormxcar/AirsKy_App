import { useAuth } from "@/context/auth-context";
import { login, loginWithGoogle } from "@/services/auth-service";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { FontAwesome } from '@expo/vector-icons'; 
import * as WebBrowser from 'expo-web-browser'; 
import { useAuthRequest } from 'expo-auth-session/providers/google'; 
import { jwtDecode } from 'jwt-decode';

WebBrowser.maybeCompleteAuthSession();

const SignIn = () => {
  const { setAuthData } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Định nghĩa kiểu dữ liệu cho payload của token
  type DecodedToken = {
    role: string;
  };

  const [request, response, promptAsync] = useAuthRequest({
    androidClientId: '170674226680-1m99c3tqpnmv6vsggj0chhdodqb5fbbq.apps.googleusercontent.com',
    iosClientId: '170674226680-1m99c3tqpnmv6vsggj0chhdodqb5fbbq.apps.googleusercontent.com',
    webClientId: '170674226680-1m99c3tqpnmv6vsggj0chhdodqb5fbbq.apps.googleusercontent.com',
  });

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const authData = await login({ email, password });
      console.log("Auth Data:", authData);

      // Giải mã token để kiểm tra vai trò
      const decodedToken: DecodedToken = jwtDecode(authData.accessToken);
      if (decodedToken.role !== 'CUSTOMER') {
        Alert.alert("Truy cập bị từ chối", "Tài khoản của bạn không có quyền truy cập ứng dụng di động. Vui lòng truy cập trang web để sử dụng các chức năng dành cho quản trị viên.");
        return; // Dừng quá trình đăng nhập
      }

      // Lưu thông tin xác thực vào context
      await setAuthData(authData);
      // Điều hướng đến trang chủ sau khi đăng nhập thành công
      router.replace("/(root)/(tabs)/home");

    } catch (error: any) {
      // Hiển thị lỗi cho người dùng
      Alert.alert("Đăng nhập thất bại", error.message || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        setGoogleLoading(true);
        try {
          if (response.params.id_token) {
            const authData = await loginWithGoogle(response.params.id_token);

            // Giải mã token để kiểm tra vai trò
            const decodedToken: DecodedToken = jwtDecode(authData.accessToken);
            if (decodedToken.role !== 'CUSTOMER') {
              Alert.alert("Truy cập bị từ chối", "Tài khoản của bạn không có quyền truy cập ứng dụng di động. Vui lòng truy cập trang web để sử dụng các chức năng dành cho quản trị viên.");
              return; // Dừng quá trình đăng nhập
            }
            await setAuthData(authData);
            router.replace("/(root)/(tabs)/home");
          } else {
            throw new Error("Không nhận được ID token từ Google.");
          }
        } catch (error: any) {
          Alert.alert("Đăng nhập Google thất bại", error.message);
        } finally {
          setGoogleLoading(false);
        }
      }
    };
    handleGoogleResponse();
  }, [response, setAuthData]);

  const handleGoogleSignIn = () => {
    promptAsync();
  };

  return (
    <>
      <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-3xl"> 
        {/* Tiêu đề */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-blue-900">Đăng nhập</Text>
          <Text className="text-gray-500 mt-2">Chào mừng bạn trở lại!</Text>
        </View>

        {/* Form nhập */}
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          className="mb-4"
          autoCapitalize="none" // Good practice for email inputs
          keyboardType="email-address" // Good practice for email inputs
        />

        <TextInput
          label="Mật khẩu"
          mode="outlined"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
          className="mb-4"
          right={
            <TextInput.Icon icon={isPasswordVisible ? "eye-off" : "eye"} onPress={() => setIsPasswordVisible(!isPasswordVisible)} />
          }
        />

        {/* Quên mật khẩu */}
        <TouchableOpacity
          onPress={() => router.navigate("/(root)/(auth)/forgot-password")}
          className="mt-2 mb-6 items-end" 
        >
          <Text className="text-blue-900 font-semibold">Quên mật khẩu?</Text>
        </TouchableOpacity>

        {/* Nút đăng nhập */}
        <Button
          mode="contained"
          onPress={handleSignIn}
          loading={loading}
          disabled={loading || !email || !password} // Disable if fields are empty
          style={{ borderRadius: 16, paddingVertical: 6 }} // Removed mt-10, will rely on mb-6 from forgot password
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }} // Make text bold and slightly larger
        >
          Đăng nhập
        </Button>

        {/* Divider or "OR" text */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-gray-300" />
          <Text className="text-gray-400 mx-4">HOẶC</Text>
          <View className="flex-1 h-[1px] bg-gray-300" />
        </View>

        {/* Nút Google */}
        <TouchableOpacity
          onPress={() => handleGoogleSignIn()}
          disabled={!request || googleLoading}
          className="bg-white py-3 rounded-2xl w-full items-center border border-blue-900 flex-row justify-center"
        >
          <FontAwesome name="google" size={20} color="#1e3a8a" />
          <Text className="font-semibold text-blue-900 ml-2">{googleLoading ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}</Text>
        </TouchableOpacity>

        {/* Đăng ký */}
        <View className="mt-8 flex-row justify-center"> {/* Increased mt for better separation */}
          <Text className="text-gray-600">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.navigate("/(root)/(auth)/sign-up")}>
            <Text className="font-medium text-blue-900 ">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

export default SignIn;
