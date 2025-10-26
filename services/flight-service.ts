import { Flight,Seat } from "@/app/types/types";
import { FlightResponse, SeatResponse } from "@/app/types/flight";
import { mapApiFlightToFlight, mapApiSeatToSeat } from "@/mappers/flight-mapper";
import { ApiResponse, PageResponse, UnifiedFlightSearchResponse } from "@/app/types/common";
import api from "./api"; // Import axios instance

/**
 * Định nghĩa cấu trúc của request body cho API /search-unified.
 */
export interface UnifiedSearchParams {
    tripType: 'one-way' | 'round-trip' | 'multi-city';
    adultCount: number;
    childCount: number;
    infantCount: number;
    travelClass?: string;
    // Các trường mà backend thực sự mong đợi
    departureAirportId: number;
    arrivalAirportId: number;
    outboundDepartureDate: string;
    returnDate?: string;
};

/**
 * Tìm kiếm chuyến bay thống nhất (one-way, round-trip, multi-city) bằng cách gọi API /search-unified.
 * @param request - Đối tượng request chứa thông tin tìm kiếm.
 * @returns Promise chứa dữ liệu trả về từ API, đã được map.
 */
export const searchUnifiedFlights = async (request: UnifiedSearchParams): Promise<UnifiedFlightSearchResponse> => {
    try {
        console.log("Sending unified search request to API:", JSON.stringify(request, null, 2));
        // Backend mong muốn một POST request với request body
        const response = await api.post<ApiResponse<UnifiedFlightSearchResponse>>('/flights/search-unified', request);
        return response.data.data;
    } catch (error: any) {
        console.error("Error in unified flight search:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || "An unexpected error occurred while searching flights.");
    }
};

/**
 * Lấy danh sách ghế ngồi cho một chuyến bay cụ thể.
 * @param flightId ID của chuyến bay.
 * @returns Promise chứa một mảng các đối tượng Seat.
 */
export const fetchSeatsByFlightId = async (flightId: number): Promise<Seat[]> => {
    try {
        const response = await api.get<ApiResponse<SeatResponse[]>>(`/flights/${flightId}/seats`);

        const apiSeats = response.data.data || [];
        return apiSeats.map(mapApiSeatToSeat);
    } catch (error: any) {
        console.error(`Error fetching seats for flight ${flightId}:`, error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || `An unexpected error occurred while fetching seats for flight ${flightId}.`);
    }
};

/**
 * @deprecated Use searchUnifiedFlights instead.
 * This function is kept for backward compatibility but should be removed in the future.
 */
export const searchFlights = searchUnifiedFlights;