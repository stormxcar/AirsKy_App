import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Button, MD3LightTheme, Provider as PaperProvider, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// Theme Paper màu xanh đậm
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#1e3a8a", // blue-900
  },
};

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignUp = () => {
    // TODO: Validate inputs and call API for registration
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to sign-in page after successful registration
      router.replace("/(root)/(auth)/sign-in");
    }, 1500);
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView className="mt-32 flex-1 bg-white px-6 justify-start rounded-t-3xl">
        {/* Tiêu đề */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-blue-900">Tạo tài khoản</Text>
          <Text className="text-gray-500 mt-2">Bắt đầu hành trình của bạn!</Text>
        </View>

        {/* Form nhập */}
        <TextInput
          label="Họ và tên"
          mode="outlined"
          value={fullName}
          onChangeText={setFullName}
          outlineColor="#ccc"
          activeOutlineColor={theme.colors.primary}
          className="mb-4"
        />
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          outlineColor="#ccc"
          activeOutlineColor={theme.colors.primary}
          className="mb-4"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          label="Mật khẩu"
          mode="outlined"
          secureTextEntry
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
          outlineColor="#ccc"
          activeOutlineColor={theme.colors.primary}
          className="mb-4"
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
          outlineColor="#ccc"
          activeOutlineColor={theme.colors.primary}
          className="mb-4"
          right={
            <TextInput.Icon
              icon={isPasswordVisible ? "eye-off" : "eye"}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            />
          }
        />

        {/* Nút đăng ký */}
        <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading} style={{ borderRadius: 16, paddingVertical: 6, marginTop: 16 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
          Đăng ký
        </Button>

        {/* Quay lại Đăng nhập */}
        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-600">Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.navigate("/(root)/(auth)/sign-in")}>
            <Text className="font-semibold text-blue-900">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default SignUp;