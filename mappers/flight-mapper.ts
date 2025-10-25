import { Flight, Seat } from "@/app/types/types";
import { FlightResponse, FlightTravelClassResponse, SeatResponse } from "@/app/types/flight";
import { format, parseISO } from "date-fns";

/**
 * Formats duration from minutes to a "Xh Ym" string.
 * @param minutes - The duration in minutes.
 * @returns The formatted duration string.
 */
const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

/**
 * Formats the 'stops' enum from the API into a user-friendly string.
 * @param stops - The stops enum string (e.g., 'NON_STOP', 'ONE_STOP').
 * @returns The formatted string.
 */
const formatStops = (stops: string): string => {
    if (stops === 'NON_STOP') return 'Bay thẳng';
    if (stops === 'ONE_STOP') return '1 điểm dừng';
    // Add more cases if needed, e.g., 'TWO_STOPS'
    return stops.replace('_', ' ').toLowerCase(); // Fallback
};

/**
 * Maps a raw flight object from the API to the frontend Flight type.
 * @param apiFlight - The raw flight object from the API.
 * @returns A Flight object formatted for the frontend UI.
 */
export const mapApiFlightToFlight = (apiFlight: FlightResponse): Flight => {
    // Use the price of the lowest-priced ticket class as the main display price
    const displayPrice = apiFlight.flightTravelClasses?.[0]?.price ?? apiFlight.basePrice;

    return {
        id: apiFlight.flightId.toString(),
        airline: apiFlight.airline.airlineName,
        airlineLogo: apiFlight.airline.thumbnail ?? null,
        flightNumber: apiFlight.flightNumber,
        departure: {
            code: apiFlight.departureAirport.airportCode,
            time: format(parseISO(apiFlight.departureTime), 'HH:mm'),
        },
        arrival: {
            code: apiFlight.arrivalAirport.airportCode,
            time: format(parseISO(apiFlight.arrivalTime), 'HH:mm'),
        },
        duration: formatDuration(apiFlight.duration),
        price: displayPrice,
        type: formatStops(apiFlight.stops),
        status: apiFlight.status,
        ticketClasses: (apiFlight.flightTravelClasses || []).map((tc: FlightTravelClassResponse) => ({
            id: tc.travelClass.id.toString(),
            name: tc.travelClass.className,
            priceModifier: tc.travelClass.priceMultiplier,
            description: tc.travelClass.benefits,
            finalPrice: tc.price,
        })),
    };
};

/**
 * Maps a raw seat object from the API to the frontend Seat type.
 * @param apiSeat - The raw seat object from the API.
 * @returns A Seat object formatted for the frontend UI.
 */
export const mapApiSeatToSeat = (apiSeat: SeatResponse): Seat => {
    return {
        id: apiSeat.seatId.toString(),
        status: apiSeat.status,
        price: apiSeat.price,
        seatNumber: apiSeat.seatNumber,
    };
};