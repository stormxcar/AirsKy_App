import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Không cần liệt kê <Stack.Screen> – Expo Router auto-discover từ file names */}
    </Stack>
  );
}