/**
 * Represents an airport.
 */
export type Airport = {
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
  departure: { code: string; time: string };
  arrival: { code: string; time: string };
  duration: string;
  price: number; // Giá cơ bản (basePrice)
  type: "Bay thẳng" | "1 điểm dừng" | string;
  // Thêm các hạng vé cho chuyến bay này
  ticketClasses: TicketClass[];
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

/**
 * Represents the status and details of a seat on a plane.
 */
export type SeatStatus = 'available' | 'occupied' | 'selected' | 'exit';
export type Seat = { id: string; status: SeatStatus; price?: number };