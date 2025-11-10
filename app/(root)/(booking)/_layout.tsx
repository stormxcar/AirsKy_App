import { BookingProvider } from "@/context/booking-context";
import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <BookingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Không cần liệt kê <Stack.Screen> – Expo Router auto-discover từ file names */}
      </Stack>
    </BookingProvider>
  );
}