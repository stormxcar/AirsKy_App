import { checkSepayPayment } from "@/services/payment-service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_TIMEOUT = 600;

const PaymentQR = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { url, bookingCode } = params as { url: string; bookingCode: string };

  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT);
  const intervalRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Hàm kiểm tra thanh toán
  const checkPaymentStatus = async () => {
    if (!bookingCode) return;
    console.log(`Checking payment for ${bookingCode}...`);
    try {
      const result = await checkSepayPayment(bookingCode);
      if (result.success) {
        console.log("Payment successful!");
        navigateToResult(true);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  // Điều hướng đến trang kết quả
  const navigateToResult = (success: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check if this is seat change payment
    if (params.type === "SEAT_CHANGE" && params.returnTo === "check-in") {
      // Return về check-in với payment result
      router.replace({
        pathname: "/(root)/(tabs)/check-in",
        params: {
          paymentSuccess: success ? "true" : "false",
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
        params: { ...params, status: success ? "success" : "failure" },
      });
    }
  };

  // Effect để đếm ngược và kiểm tra thanh toán
  useEffect(() => {
    // Bắt đầu kiểm tra ngay lập tức
    checkPaymentStatus();

    // Thiết lập kiểm tra định kỳ mỗi 5 giây
    intervalRef.current = setInterval(checkPaymentStatus, 5000);

    // Thiết lập đếm ngược thời gian
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigateToResult(false); // Hết giờ, coi như thất bại
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Dọn dẹp khi component unmount
    return () => {
      clearInterval(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingCode]);

  // Xử lý khi người dùng quay lại app
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log(
            "App has come to the foreground, checking payment status..."
          );
          checkPaymentStatus();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Hủy thanh toán?",
              "Bạn có chắc muốn hủy giao dịch này?",
              [
                { text: "Ở lại" },
                {
                  text: "Hủy",
                  onPress: () => router.back(),
                  style: "destructive",
                },
              ]
            )
          }
          className="p-1"
        >
          <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-blue-900 flex-1 text-center mr-8">
          Thanh toán QR
        </Text>
      </View>
      <View className="flex-1 items-center justify-center p-6 bg-gray-50">
        <Text className="text-lg font-bold text-blue-900 mb-2">
          Quét mã để thanh toán
        </Text>
        <Text className="text-center text-gray-600 mb-4">
          Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử hỗ trợ VietQR để hoàn tất.
        </Text>
        {url ? (
          <Image
            source={{ uri: url }}
            className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"
          />
        ) : (
          <Text>Đang tải mã QR...</Text>
        )}
        <Text className="text-2xl font-bold text-red-600 mt-6">
          {formatTime(timeLeft)}
        </Text>
        <Text className="text-gray-500 mt-2">
          Mã QR sẽ hết hạn sau {formatTime(timeLeft)}
        </Text>
        <Text className="text-sm text-gray-500 mt-8 text-center">
          Giao dịch sẽ được tự động xác nhận sau khi bạn thanh toán thành công.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default PaymentQR;
