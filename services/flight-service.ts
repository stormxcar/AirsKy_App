import { Flight,Seat } from "@/app/types/types";
import { FlightResponse, SeatResponse } from "@/app/types/flight";
import { mapApiFlightToFlight, mapApiSeatToSeat } from "@/mappers/flight-mapper";
import { ApiResponse, PageResponse } from "@/app/types/common";
import api from "./api"; // Import axios instance

type SearchParams = {
    from: string;
    to: string;
    date: string;
}

/**
 * Fetches and searches for flights from the API.
 * @param params - The search parameters { from, to, date }.
 * @returns A promise that resolves to an array of Flight objects.
 */
export const searchFlights = async (params: SearchParams): Promise<PageResponse<Flight>> => {
    try {
        console.log("Searching flights with params:", params);
        const response = await api.get<ApiResponse<PageResponse<FlightResponse>>>('/flights/search', { params });

        const apiFlights = response.data.data.content || [];
        const mappedFlights = apiFlights.map(mapApiFlightToFlight);

        return {
            ...response.data.data, 
            content: mappedFlights, 
        };
    } catch (error: any) {
        console.error("Error searching flights:", error.response ? error.response.data : error.message);
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
        const mappedSeats = apiSeats.map(mapApiSeatToSeat);
        return mappedSeats;
    } catch (error: any) {
        console.error(`Error fetching seats for flight ${flightId}:`, error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || `An unexpected error occurred while fetching seats for flight ${flightId}.`);
    }
};

interface FetchAllFlightsParams {
    page?: number;
    size?: number;
}

/**
 * Lấy tất cả các chuyến bay từ backend (có phân trang).
 * @param params Các tham số phân trang (page, size).
 * @returns Promise chứa dữ liệu phân trang của các chuyến bay.
 */
export const fetchAllFlights = async (params?: FetchAllFlightsParams): Promise<PageResponse<Flight>> => {
    try {
        console.log("Fetching all flights with params:", params);
        const response = await api.get<ApiResponse<PageResponse<FlightResponse>>>('/flights', { params });

        const apiFlights = response.data.data.content || [];
        const mappedFlights = apiFlights.map(mapApiFlightToFlight);

        return {
            ...response.data.data,
            content: mappedFlights,
        };
    } catch (error: any) {
        console.error("Error fetching all flights:", error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || "An unexpected error occurred while fetching all flights.");
    }
};