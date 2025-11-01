import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUnifiedFlights } from '@/services/flight-service';
import { mapApiFlightToFlight } from '@/mappers/flight-mapper';
import { Flight } from '@/app/types/types';
import { FlightResponse } from '@/app/types/flight';
import { fetchAllAirports } from '@/services/airport-service';

export function useFlightSearch(params: any, selectionPhase: 'depart' | 'return') {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Thêm state loading

    const { data: airports = [] } = useQuery<any[], Error>({
        queryKey: ['airports'],
        queryFn: fetchAllAirports,
    });

    // Destructure params để có các dependency ổn định (primitive values)
    const {
        tripType,
        originCode,
        destinationCode,
        departureDate,
        returnDate,
        adults,
        children,
        infants
    } = params;

    useEffect(() => {
        const search = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (airports.length === 0) {
                    // Chờ cho airports được load
                    return;
                };

                const isReturnPhase = tripType === 'round_trip' && selectionPhase === 'return';
                const from = isReturnPhase ? destinationCode : originCode;
                const to = isReturnPhase ? originCode : destinationCode;
                const date = isReturnPhase ? returnDate : departureDate;
                if (!date) {
                    setFlights([]); // Clear flights if no date
                    setIsLoading(false);
                    return;
                };

                const departureAirport = airports.find(a => a.code === from);
                const arrivalAirport = airports.find(a => a.code === to);

                if (!departureAirport || !arrivalAirport) {
                    throw new Error("Không tìm thấy thông tin sân bay.");
                }

                const searchRequest = {
                    tripType: 'one_way', // Luôn tìm one-way cho mỗi chặng
                    adultCount: parseInt(adults || '1'),
                    childCount: parseInt(children || '0'),
                    infantCount: parseInt(infants || '0'),
                    departureAirportId: departureAirport?.id,
                    arrivalAirportId: arrivalAirport?.id,
                    outboundDepartureDate: date,
                };
                
                const response = await searchUnifiedFlights(searchRequest);
                const rawFlights: FlightResponse[] = response.oneWayFlights?.content ?? []; // Sử dụng optional chaining và nullish coalescing
                const flightsData = rawFlights.filter(Boolean).map(mapApiFlightToFlight);
                setFlights(flightsData);
            } catch (e: any) {
                console.error("Lỗi khi gọi API:", e);
                setError("Không thể tải danh sách chuyến bay. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };
        search();
    }, [selectionPhase, airports, tripType, originCode, destinationCode, departureDate, returnDate, adults, children, infants]);


    return { flights, error, isLoading, refetch: () => {} }; // Tạm thời không cần refetch
}