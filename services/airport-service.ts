import { Airport } from "@/app/types/types";
import api from "./api"; // Giả sử bạn có một file api.ts để cấu hình axios instance

/**
 * Lấy danh sách tất cả các sân bay từ API.
 * @returns Promise<Airport[]> - Danh sách các sân bay đã được map.
 */
export const fetchAllAirports = async (): Promise<Airport[]> => {
    try {
        const response = await api.get('/airports', {
            params: { page: 0, size: 1000 } // Giả sử 1000 là đủ
        });
        return response.data.data.content.map((airport: any) => ({
            id: airport.airportId, // Thêm dòng này để lấy ID
            code: airport.airportCode,
            city: (airport.cityNames && airport.cityNames.length > 0) ? airport.cityNames[0] : (airport.cityName || ''),
            name: airport.airportName,
            country: airport.country,
        }));
    } catch (error) {
        console.error("Error fetching airports:", error);
        throw new Error("Không thể tải danh sách sân bay.");
    }
};