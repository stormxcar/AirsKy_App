import { useLoading } from "@/context/loading-context";
import { executePayPalPayment } from "@/services/payment-service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

const PaymentResultHandler = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showLoading, hideLoading } = useLoading();
  const isProcessing = useRef(false); // Cờ để ngăn việc xử lý lặp lại

  useEffect(() => {
    showLoading(async () => {
      // Nếu đang xử lý rồi thì không làm gì cả
      if (isProcessing.current) {
        console.log(
          "Payment is already being processed. Skipping duplicate call."
        );
        return;
      }

      const paymentId = params.paymentId as string;
      const payerId = params.PayerID as string;
      const bookingId = params.bookingId as string;
      const returnTo = params.returnTo as string; // Để biết return về đâu
      const paymentType = params.type as string; // BOOKING hoặc SEAT_CHANGE

      // Kiểm tra xem có phải là redirect từ PayPal không
      if (paymentId && payerId && bookingId) {
        isProcessing.current = true; // Đánh dấu là bắt đầu xử lý

        try {
          // Gọi API backend để thực thi thanh toán
          await executePayPalPayment(paymentId, payerId, parseInt(bookingId));

          // Thanh toán thành công - route dựa trên type và returnTo
          if (paymentType === "SEAT_CHANGE" && returnTo === "check-in") {
            // Return về check-in với payment success params
            router.replace({
              pathname: "/(root)/(tabs)/check-in",
              params: {
                paymentSuccess: "true",
                returnTo: "check-in",
                bookingCode: params.bookingCode,
                passengerFullName: params.passengerFullName,
                passengerId: params.passengerId,
                newSeatId: params.newSeatId,
                segmentId: params.segmentId,
              },
            });
          } else {
            // Default booking flow
            router.replace({
              pathname: "/(root)/(booking)/booking-result",
              params: { status: "success", bookingId: bookingId },
            });
          }
        } catch (error: any) {
          console.error("Error executing PayPal payment:", error);

          // Xử lý trường hợp thanh toán đã được hoàn tất trước đó
          if (error.message && error.message.includes("COMPLETED")) {
            if (paymentType === "SEAT_CHANGE" && returnTo === "check-in") {
              router.replace({
                pathname: "/(root)/(tabs)/check-in",
                params: {
                  paymentSuccess: "true",
                  returnTo: "check-in",
                  bookingCode: params.bookingCode,
                  passengerFullName: params.passengerFullName,
                  passengerId: params.passengerId,
                  newSeatId: params.newSeatId,
                  segmentId: params.segmentId,
                },
              });
            } else {
              router.replace({
                pathname: "/(root)/(booking)/booking-result",
                params: { status: "success", bookingId: bookingId },
              });
            }
            return; // Dừng xử lý thêm
          }

          Alert.alert(
            "Lỗi thanh toán",
            error.message ||
              "Không thể hoàn tất thanh toán PayPal. Vui lòng thử lại hoặc liên hệ hỗ trợ."
          );

          if (paymentType === "SEAT_CHANGE" && returnTo === "check-in") {
            // Return về check-in với error
            router.replace({
              pathname: "/(root)/(tabs)/check-in",
              params: { paymentError: "true" },
            });
          } else {
            router.replace({
              pathname: "/(root)/(booking)/booking-result", // Vẫn truyền bookingId để người dùng biết đơn nào lỗi
              params: { status: "failure", bookingCode: bookingId },
            });
          }
        }
      } else if (params.bookingCode) {
        // Trường hợp người dùng tự quay lại hoặc từ luồng QR
        router.replace({
          pathname: "/(root)/(booking)/booking-result",
          params: { ...params, status: params.status || "pending" },
        });
      }
    });
  }, [params]);

  return null;
};

export default PaymentResultHandler;
