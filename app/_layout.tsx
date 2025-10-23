import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import "./global.css";
import { AppTheme } from "./theme";

export default function AppLayout(){
  return (
    <PaperProvider theme={AppTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" /> {/* index.tsx sẽ là màn hình khởi đầu */}
        <Stack.Screen name="(root)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </PaperProvider>
  );
};