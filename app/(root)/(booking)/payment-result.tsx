import { useLoading } from "@/context/loading-context";
import { executePayPalPayment } from "@/services/payment-service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PaymentResultHandler = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showLoading, hideLoading } = useLoading();
    const isProcessing = useRef(false); // Cờ để ngăn việc xử lý lặp lại

    useEffect(() => {
        showLoading(
            async () => {
            // Nếu đang xử lý rồi thì không làm gì cả
            if (isProcessing.current) {
                console.log("Payment is already being processed. Skipping duplicate call.");
                return;
            }

            const paymentId = params.paymentId as string;
            const payerId = params.PayerID as string;
            const bookingId = params.bookingId as string;

            // Kiểm tra xem có phải là redirect từ PayPal không
            if (paymentId && payerId && bookingId) {
                isProcessing.current = true; // Đánh dấu là bắt đầu xử lý

                
                try {
                    // Gọi API backend để thực thi thanh toán
                    await executePayPalPayment(paymentId, payerId, parseInt(bookingId));

                    // Thanh toán thành công, điều hướng đến trang kết quả cuối cùng
                    router.replace({
                        pathname: '/(root)/(booking)/booking-result',
                        params: { status: 'success', bookingId: bookingId }
                    });
                } catch (error: any) {
                    console.error("Error executing PayPal payment:", error);

                    // Xử lý trường hợp thanh toán đã được hoàn tất trước đó
                    if (error.message && error.message.includes("COMPLETED")) {
                        router.replace({
                            pathname: '/(root)/(booking)/booking-result',
                            params: { status: 'success', bookingId: bookingId }
                        });
                        return; // Dừng xử lý thêm
                    }

                    Alert.alert("Lỗi thanh toán", error.message || "Không thể hoàn tất thanh toán PayPal. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
                    router.replace({
                        pathname: '/(root)/(booking)/booking-result', // Vẫn truyền bookingId để người dùng biết đơn nào lỗi
                        params: { status: 'failure', bookingCode: bookingId }
                    });
                }
            } else if (params.bookingCode) {
                // Trường hợp người dùng tự quay lại hoặc từ luồng QR
                router.replace({
                    pathname: '/(root)/(booking)/booking-result',
                    params: { ...params, status: params.status || 'pending' }
                });
            }
        }
        );

      

    }, [params]);

    return null;
};

export default PaymentResultHandler;
