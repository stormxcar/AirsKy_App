import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for icons

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    // TODO: call API login here
    setTimeout(() => {
      setLoading(false);
      // For demonstration, navigate to home after successful "login"
      router.replace("/(root)/(tabs)/home");
    }, 1500);
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign-In logic
    console.log("Signing in with Google...");
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="mb-4" 
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
          onPress={handleGoogleSignIn}
          className="bg-white py-3 rounded-2xl w-full items-center border border-blue-900 flex-row justify-center"
        >
          <FontAwesome name="google" size={20} color="#1e3a8a" className="mr-2" />
          <Text className="font-semibold text-blue-900 ml-2">Đăng nhập bằng Google</Text>
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
