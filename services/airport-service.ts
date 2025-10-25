
// import api from "./api"; 
// import { AirportResponse, mapAirportResponseToUIAirport } from "@/app/types/airport";
// import { PageResponse, ApiResponse } from "@/app/types/common";
// import { Airport as UIAirport } from "@/app/types/types"; // Kiểu Airport dành cho UI

// interface FetchAirportsParams {
//   page?: number;
//   size?: number;
//   // Thêm các tham số tìm kiếm khác nếu backend hỗ trợ (ví dụ: search term)
// }

// /**
//  * Lấy danh sách tất cả các sân bay từ backend (có phân trang).
//  * @param params Các tham số phân trang và tìm kiếm.
//  * @returns Promise chứa dữ liệu phân trang của các sân bay (đã được map sang kiểu UI).
//  */
// export const fetchAirports = async (params?: FetchAirportsParams): Promise<PageResponse<UIAirport>> => {
//   try {
//     console.log("Fetching airports with params:", params);
//     const response = await api.get<ApiResponse<PageResponse<AirportResponse>>>('/airports', { params });
    
//     // Map API response content to UI Airport type
//     const mappedContent = response.data.data.content.map(mapAirportResponseToUIAirport);

//     return {
//       ...response.data.data, // Giữ nguyên thông tin phân trang
//       content: mappedContent, // Cập nhật nội dung đã được map
//     };

//   } catch (error: any) {
//     console.error("Error fetching airports:", error.response ? error.response.data : error.message);
//     throw new Error(error.response?.data?.message || "An unexpected error occurred while fetching airports.");
//   }
// };

// /**
//  * Lấy thông tin một sân bay theo mã sân bay (airport code).
//  * @param airportCode Mã sân bay.
//  * @returns Promise chứa thông tin sân bay (đã được map sang kiểu UI).
//  */
// export const fetchAirportByCode = async (airportCode: string): Promise<UIAirport> => {
//   try {
//     console.log("Fetching airport by code:", airportCode);
//     const response = await api.get<ApiResponse<AirportResponse>>(`/airports/code/${airportCode}`);
//     return mapAirportResponseToUIAirport(response.data.data);
//   } catch (error: any) {
//     console.error(`Error fetching airport with code ${airportCode}:`, error.response ? error.response.data : error.message);
//     throw new Error(error.response?.data?.message || `An unexpected error occurred while fetching airport ${airportCode}.`);
//   }
// };