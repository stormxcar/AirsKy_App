import { PaymentMethod } from "@/app/types/booking";
import { ApiResponse } from "@/app/types/common";
import api from "./api";

interface SepayCheckResponse {
  success: boolean;
  message: string;
}

interface PaymentRequest {
  bookingId: number;
  paymentMethod: PaymentMethod;
}

interface PaymentResponse {
  paymentId: string;
  checkoutUrl?: string;
  status: string;
}

export const createPayment = async (
  paymentData: PaymentRequest
): Promise<PaymentResponse> => {
  try {
    const response = await api.post<ApiResponse<PaymentResponse>>(
      "/payments",
      paymentData
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Không thể tạo thanh toán");
    }
  }
};

export const checkSepayPayment = async (
  bookingCode: string
): Promise<SepayCheckResponse> => {
  try {
    // Backend trả về dữ liệu trực tiếp, không nằm trong ApiResponse
    const response = await api.get<SepayCheckResponse>(
      `/payments/sepay/check/${bookingCode}`
    );
    return response.data;
  } catch (error: any) {
    console.error(
      `Error checking SePay payment for ${bookingCode}:`,
      error.response
        ? JSON.stringify(error.response.data, null, 2)
        : error.message
    );
    // Trả về một đối tượng lỗi để vòng lặp có thể tiếp tục mà không bị crash
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể kiểm tra trạng thái thanh toán.",
    };
  }
};

/**
 * Thực thi thanh toán PayPal sau khi người dùng xác nhận trên trình duyệt.
 * @param paymentId ID thanh toán từ PayPal.
 * @param payerId ID người dùng từ PayPal.
 * @param bookingId ID của booking trong hệ thống.
 * @returns Promise chứa dữ liệu thanh toán đã hoàn tất.
 */
export const executePayPalPayment = async (
  paymentId: string,
  payerId: string,
  bookingId: number
): Promise<any> => {
  try {
    const response = await api.get(`/payments/success`, {
      params: { paymentId, PayerID: payerId, bookingId },
    });
    return response.data.data;
  } catch (error: any) {
    // console.error(`Error executing PayPal payment:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    throw new Error(
      error.response?.data?.message || "Không thể xác thực thanh toán PayPal."
    );
  }
};
