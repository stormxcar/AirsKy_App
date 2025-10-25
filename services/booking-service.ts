import { BookingRequest, BookingResponse } from "@/app/types/booking";
import { ApiResponse } from "@/app/types/common"; 
import api from "./api"; 

/**
 * Gửi yêu cầu tạo một booking mới đến backend.
 * @param bookingData Dữ liệu booking tuân thủ theo BookingRequest interface.
 * @returns Promise chứa dữ liệu của booking đã được tạo (BookingResponse).
 */
export const createBooking = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    console.log("Sending booking request to API:", JSON.stringify(bookingData, null, 2));
    // API backend trả về dữ liệu trong cấu trúc ApiResponse
    const response = await api.post<ApiResponse<BookingResponse>>('/bookings', bookingData);
    return response.data.data; // Trả về phần 'data' thực sự từ ApiResponse

  } catch (error: any) {
    console.error("Error creating booking:", error.response ? error.response.data : error.message);
    // Ném lỗi ra ngoài để component có thể bắt và xử lý (ví dụ: hiển thị thông báo cho người dùng)
    throw new Error(error.response?.data?.message || "An unexpected error occurred while creating the booking.");
  }
};