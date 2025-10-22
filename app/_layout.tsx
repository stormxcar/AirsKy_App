import { Stack } from "expo-router";
import "./global.css";
export default function AppLayout(){
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> {/* index.tsx sẽ là màn hình khởi đầu */}
      <Stack.Screen name="(root)" /> 
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};