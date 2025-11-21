import { useLoading } from "@/context/loading-context";
import { executePayPalPayment } from "@/services/payment-service";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

const PaymentResultHandler = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showLoading } = useLoading();
  const isProcessing = useRef(false); // Cờ để ngăn xử lý lặp lại

  const handlePaymentRedirect = async (redirectParams: any) => {
    const paymentId = redirectParams.paymentId as string;
    const payerId = redirectParams.PayerID as string;
    const bookingId = redirectParams.bookingId as string;
    const returnTo = redirectParams.returnTo as string; 
    const paymentType = redirectParams.type as string;

    if (!bookingId) return;

    if (paymentId && payerId && bookingId) {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        await executePayPalPayment(paymentId, payerId, parseInt(bookingId));

        if (paymentType === "SEAT_CHANGE" && returnTo === "check-in") {
          router.replace({
            pathname: "/(root)/(tabs)/check-in",
            params: {
              paymentSuccess: "true",
              returnTo: "check-in",
              bookingCode: redirectParams.bookingCode,
              passengerFullName: redirectParams.passengerFullName,
              passengerId: redirectParams.passengerId,
              newSeatId: redirectParams.newSeatId,
              segmentId: redirectParams.segmentId,
            },
          });
        } else {
          router.replace({
            pathname: "/(root)/(booking)/booking-result",
            params: { status: "success", bookingId },
          });
        }
      } catch (error: any) {
        console.error("Error executing PayPal payment:", error);
        const isCompleted =
          error.message && error.message.includes("COMPLETED");

        if (isCompleted) {
          if (paymentType === "SEAT_CHANGE" && returnTo === "check-in") {
            router.replace({
              pathname: "/(root)/(tabs)/check-in",
              params: { paymentSuccess: "true", returnTo: "check-in" },
            });
          } else {
            router.replace({
              pathname: "/(root)/(booking)/booking-result",
              params: { status: "success", bookingId },
            });
          }
          return;
        }

        Alert.alert(
          "Lỗi thanh toán",
          error.message ||
            "Không thể hoàn tất thanh toán PayPal. Vui lòng thử lại hoặc liên hệ hỗ trợ."
        );

        if (paymentType === "SEAT_CHANGE" && returnTo === "check-in") {
          router.replace({
            pathname: "/(root)/(tabs)/check-in",
            params: { paymentError: "true" },
          });
        } else {
          router.replace({
            pathname: "/(root)/(booking)/booking-result",
            params: { status: "failure", bookingCode: bookingId },
          });
        }
      }
    } else {
      // Nếu chỉ có bookingCode, default pending
      router.replace({
        pathname: "/(root)/(booking)/booking-result",
        params: { ...redirectParams, status: redirectParams.status || "pending" },
      });
    }
  };

  useEffect(() => {
    // 1️⃣ Nếu app được mở bằng URL (custom scheme)
    const handleUrl = (event: { url: string }) => {
      const { queryParams } = Linking.parse(event.url);
      handlePaymentRedirect(queryParams);
    };

    const subscription = Linking.addEventListener("url", handleUrl);

    // 2️⃣ Nếu app được mở từ trạng thái đóng
    Linking.getInitialURL().then((url) => {
      if (url) {
        const { queryParams } = Linking.parse(url);
        handlePaymentRedirect(queryParams);
      }
    });

    // 3️⃣ Xử lý params truyền trực tiếp từ router (fallback)
    handlePaymentRedirect(params);

    return () => subscription.remove();
  }, [params]);

  return null;
};

export default PaymentResultHandler;
