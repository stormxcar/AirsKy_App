import { Flight } from "@/app/types";
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
 * Maps a raw flight object from the API to the frontend Flight type.
 * @param apiFlight - The raw flight object from the API.
 * @returns A Flight object formatted for the frontend.
 */
export const mapApiFlightToFlight = (apiFlight: any): Flight => {
    // Use the price of the lowest-priced ticket class as the main display price
    const basePrice = apiFlight.flightTravelClasses?.[0]?.price || apiFlight.basePrice;

    return {
        id: apiFlight.flightId.toString(),
        airline: apiFlight.airline.airlineName,
        airlineLogo: apiFlight.airline.thumbnail,
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
        price: basePrice,
        type: apiFlight.stops === 'NON_STOP' ? 'Bay thẳng' : `${apiFlight.stops} điểm dừng`,
        ticketClasses: (apiFlight.flightTravelClasses || []).map((tc: any) => ({
            id: tc.travelClass.id.toString(),
            name: tc.travelClass.className,
            priceModifier: tc.travelClass.priceMultiplier,
            description: tc.travelClass.benefits,
            finalPrice: tc.price,
        })),
    };
};