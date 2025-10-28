import { SeatStatus } from "./booking"; // Sử dụng SeatStatus từ booking.ts

/**
 * DTO phản hồi từ backend cho thông tin hãng hàng không.
 */
export interface AirlineResponse {
  airlineId: number;
  airlineName: string;
  thumbnail?: string;
}

/**
 * DTO phản hồi từ backend cho thông tin sân bay (đơn giản hóa).
 */
export interface SimpleAirportResponse {
  airportId: number;
  airportCode: string;
  airportName: string;
  city: string;
  country: string;
}

/**
 * DTO phản hồi từ backend cho thông tin hạng vé.
 */
export interface TravelClassResponse {
  id: number;
  className: string;
  priceMultiplier: number;
  benefits: string;
}

/**
 * DTO phản hồi từ backend cho thông tin hạng vé của một chuyến bay cụ thể.
 */
export interface FlightTravelClassResponse {
  id: number;
  travelClass: TravelClassResponse;
  price: number; // Giá cho hạng vé này trên chuyến bay này
}

/**
 * DTO phản hồi từ backend cho một chuyến bay.
 * Đây là cấu trúc dữ liệu nhận được trực tiếp từ API.
 */
export interface FlightResponse {
  flightId: number;
  flightNumber: string;
  airline: AirlineResponse;
  departureAirport: SimpleAirportResponse;
  arrivalAirport: SimpleAirportResponse;
  departureTime: string; // LocalDateTime in Java
  arrivalTime: string;   // LocalDateTime in Java
  duration: number;      // In minutes
  basePrice: number;     // BigDecimal in Java
  stops: string;         // Enum: NON_STOP, ONE_STOP, etc.
  status: string;        // e.g., 'ON_TIME', 'DELAYED', 'CANCELLED'
  aircraft?: string;
  flightTravelClasses: FlightTravelClassResponse[];
  availableSeats: number;
}

/**
 * DTO phản hồi từ backend cho một ghế ngồi.
 */
export interface SeatResponse {
  seatId: number;
  seatNumber: string;
  seatType: string; // SeatTypes enum in Java (e.g., 'STANDARD', 'EXIT_ROW')
  status: SeatStatus;
  price: number; // Additional price for this seat type
  flightId: number;
  travelClassId: number;
}