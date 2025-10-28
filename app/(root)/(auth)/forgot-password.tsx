import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendLink = () => {
    // TODO: Call API to send password reset link
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Optionally, show a success message and navigate back
      alert("Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.");
      router.back();
    }, 1500);
  };

  return (
    <>
      <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-3xl">
        {/* Tiêu đề */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-blue-900">Quên mật khẩu</Text>
          <Text className="text-gray-500 mt-2 text-[12px] text-center">Nhập email của bạn để nhận mã đặt lại mật khẩu.</Text>
        </View>

        {/* Form nhập */}
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          className="p-6"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Nút gửi */}
        <Button mode="contained" onPress={handleSendLink} loading={loading} disabled={loading || !email} style={{ marginTop: 20,borderRadius: 16, paddingVertical: 6 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
          Gửi mã
        </Button>

      </SafeAreaView> 
    </>
  );
};

export default ForgotPassword;