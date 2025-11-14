import LoadingOverlay from "@/components/global/loading-overlay";
import { AuthProvider } from "@/context/auth-context";
import { LoadingProvider } from "@/context/loading-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { NotificationProvider } from "@/context/notification-context";
import "./global.css";
import { AppTheme } from "./theme";

const queryClient = new QueryClient();

export default function AppLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <AuthProvider>
          <NotificationProvider>
            <PaperProvider theme={AppTheme}>
              <Stack screenOptions={{ headerShown: false }} />
              <LoadingOverlay />
            </PaperProvider>
          </NotificationProvider>
        </AuthProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
};