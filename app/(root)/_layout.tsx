import { Stack } from "expo-router";
// global.css đã được import ở app/_layout.tsx, không cần import lại ở đây.
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(booking)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
};