import { Stack } from "expo-router";
import React from "react";

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        // Hiển thị header 
        headerShown: false,
        // Header trong suốt để nền của màn hình được hiển thị 
        headerTransparent: true,
        // Không hiển thị tiêu đề mặc định của header 
        headerTitle: "",
        // // Ẩn chữ "Back" trên iOS 
        // headerBackTitleVisible: false,
        // Đặt màu nền chung cho tất cả các màn hình trong Stack này 
        contentStyle: { backgroundColor: "#172554" }, // bg-blue-50
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
};

export default AuthLayout;