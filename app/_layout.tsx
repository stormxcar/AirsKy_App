import LoadingOverlay from "@/components/global/loading-overlay";
import { AuthProvider } from "@/context/auth-context";
import { LoadingProvider } from "@/context/loading-context";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import "./global.css";
import { AppTheme } from "./theme";

function Root() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(root)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <LoadingOverlay />
    </>
  );
}

export default function AppLayout(){
  return (
    <AuthProvider>
      <LoadingProvider>
        <PaperProvider theme={AppTheme}>
          <Root />
        </PaperProvider>
      </LoadingProvider>
    </AuthProvider>
  );
};