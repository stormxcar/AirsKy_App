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
  id: string;
  airline: string;
  airlineLogo: any; // Using require, so type is any or number
  flightNumber: string;
  departure: { code: string; time: string };
  arrival: { code: string; time: string };
  duration: string;
  price: number;
  type: "Bay thẳng" | "1 điểm dừng";
};

/**
 * Represents a ticket class for a flight.
 */
export type TicketClass = {
  id: string;
  name: string;
  priceModifier: number;
  description: string;
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