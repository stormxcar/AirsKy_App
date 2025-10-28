import { Flight } from "@/app/types";
import env from "@/config/env";
import { mapApiFlightToFlight } from "@/mappers/flight-mapper";

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
export const searchFlights = async ({ from, to, date }: SearchParams): Promise<Flight[]> => {
    // Build URL with query params
    const query = new URLSearchParams({ from, to, date: date || '' }).toString();
    const API_URL = `${env.API_BASE_URL}/flights/search?${query}`;

    const response = await fetch(API_URL);
    const json = await response.json();

    // Map data from API to frontend data structure
    const apiFlights = json?.data?.content || [];
    const mappedFlights = apiFlights.map(mapApiFlightToFlight);
    return mappedFlights;
};