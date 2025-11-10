import { BookingRequest, BookingResponse } from "@/app/types/booking";
import { ApiResponse } from "@/app/types/common"; 
import api from "./api"; 

/**
 * Gửi yêu cầu tạo một booking mới đến backend.
 * @param bookingData Dữ liệu booking tuân thủ theo BookingRequest interface.
 * @returns Promise chứa dữ liệu của booking đã được tạo (BookingResponse).
 */
export const createBooking = async (
  bookingData: BookingRequest
): Promise<BookingResponse> => {
    try {
        console.log(
            "Sending booking request to API:",
            JSON.stringify(bookingData, null, 2)
        );
        // API backend trả về dữ liệu trong cấu trúc ApiResponse<BookingResponse>
        const response = await api.post<ApiResponse<BookingResponse>>(
            "/bookings",
            bookingData
        );
        // Trả về phần 'data' thực sự từ ApiResponse, chính là BookingResponse
        return response.data.data;
    } catch (error: any) {
        console.error("Error creating booking:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        // Ném lỗi ra ngoài để component có thể bắt và xử lý (ví dụ: hiển thị thông báo cho người dùng)
        throw new Error(error.response?.data?.message || "Đã có lỗi không mong muốn xảy ra khi tạo đặt vé.");
    }
};

/**
 * Lấy thông tin chi tiết của một booking dựa vào booking code.
 * @param bookingCode Mã đặt chỗ.
 * @returns Promise chứa dữ liệu chi tiết của booking.
 */
export const getBooking = async (bookingCode: string): Promise<BookingResponse> => {
    try {
        console.log(`Fetching booking details for code: ${bookingCode}`);
        const response = await api.get<ApiResponse<BookingResponse>>(`/bookings/code/${bookingCode}`);
        return response.data.data;
    } catch (error: any) {
        console.error(`Error fetching booking ${bookingCode}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(error.response?.data?.message || "Không thể tải thông tin đặt vé.");
    }
};

export const getBookingDetailsById = async (bookingId: string): Promise<BookingResponse> => {
    try {
        console.log(`Fetching booking details for id: ${bookingId}`);
        const response = await api.get<ApiResponse<BookingResponse>>(`/bookings/${bookingId}`);
        return response.data.data;
    } catch (error: any) {
        console.error(`Error fetching booking ${bookingId}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(error.response?.data?.message || "Không thể tải thông tin đặt vé.");
    }
};