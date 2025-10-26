import { SeatStatus } from "./booking"; // Import SeatStatus từ booking.ts
/**
 * Represents an airport.
 */
export type Airport = {
  id: any;
  code: string;
  name:string;
  city: string;
};

/**
 * Represents a flight.
 */
export type Flight = {
  id: string; // Sẽ được map từ flightId (number)
  airline: string;
  airlineLogo: string | null; // URL ảnh từ API
  flightNumber: string;
  departure: {
    date: string | number | Date; code: string; time: string 
};
  arrival: { code: string; time: string };
  duration: string;
  price: number; // Giá cơ bản (basePrice)
  type: "Bay thẳng" | "1 điểm dừng" | string;
  status: string;
  // Thêm các hạng vé cho chuyến bay này
  ticketClasses: TicketClass[];
  departureTime: string;
};

/**
 * Represents a ticket class for a flight.
 */
export type TicketClass = {
  id: string;
  name: string;
  priceModifier: number; // Sẽ được map từ travelClass.priceMultiplier
  description: string; // Sẽ được map từ travelClass.benefits
  finalPrice: number; // Giá cuối cùng cho hạng vé này
};

/**
 * Represents a flight selected by the user, including the chosen ticket class.
 */
export type SelectedFlight = {
  flight: Flight;
  ticketClass: TicketClass;
};

/**
 * Represents a passenger.
 */
export type Passenger = {
  id: number;
  firstName: string;
  lastName: string;
  dob: Date | null;
  gender: 'male' | 'female' | null;
  idCard: string;
  type: 'adult' | 'child' | 'infant';
};
// In app/types.ts

export interface BaggagePackage {
    key: string;
    label: string;
    price: number;
}

// Danh sách các gói hành lý có thể chọn
export const BAGGAGE_PACKAGES: BaggagePackage[] = [
    { key: 'NONE', label: 'Không chọn', price: 0 },
    { key: 'PKG_20KG', label: 'Gói 20kg', price: 250000 },
    { key: 'PKG_30KG', label: 'Gói 30kg', price: 350000 },
    { key: 'PKG_40KG', label: 'Gói 40kg', price: 450000 },
];

/**
 * Represents the status and details of a seat on a plane.
 */
// export type SeatStatus = 'available' | 'occupied' | 'selected' | 'exit';
export type Seat = { id: string; status: SeatStatus; price?: number, seatNumber?: string }; // SeatStatus giờ đây được import