import LoadingOverlay from "@/components/global/loading-overlay";
import { LoadingProvider, useLoading } from "@/context/loading-context";
import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "./global.css";
import { AppTheme } from "./theme";

/**
 * A component that handles global logic, like listening to route changes
 * to show a global loading indicator.
 */
function Root() {
  const { hideLoading } = useLoading();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs whenever the route changes.
    // We add a delay before hiding the loading screen to ensure it's visible
    // for a minimum duration, improving user experience.
    const timer = setTimeout(() => {
      hideLoading();
    }, 2000); // Đợi 1 giây (1000ms) rồi mới ẩn. Bạn có thể điều chỉnh thời gian này.

    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [pathname, hideLoading]);
  
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
    <LoadingProvider>
      <PaperProvider theme={AppTheme}>
        <Root />
      </PaperProvider>
    </LoadingProvider>
  );
};