import { useState, useEffect, useCallback } from 'react';
import { addDays, format, parseISO, startOfToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { searchUnifiedFlights } from '@/services/flight-service';

export interface DateScrollerItem {
    date: string; // YYYY-MM-DD
    displayDate: string; // "T5, 15/08"
    price: number | null; // Giá thấp nhất
    isCheapest: boolean;
}

export const useDateScroller = (searchParams: any, airportIdMap: Map<string, number>, selectionPhase: 'depart' | 'return') => {
    const [dates, setDates] = useState<DateScrollerItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Destructure các giá trị nguyên thủy từ searchParams để tránh re-render không cần thiết
    const {
        departureDate,
        originCode,
        destinationCode,
        adults,
        children,
        infants,
        tripType, // Thêm tripType để xác định logic cho chặng về
        returnDate
    } = searchParams;

    const generateDateRange = (centerDate: string, range: number = 3): Date[] => {
        const today = startOfToday();
        const central = parseISO(centerDate);
        const dateArray: Date[] = [];
        for (let i = -range; i <= range; i++) {
            const newDate = addDays(central, i);
            // Chỉ thêm những ngày từ hôm nay trở về sau
            if (newDate >= today) {
                dateArray.push(newDate);
            }
        }
        return dateArray;
    };

    const fetchPricesForDateRange = useCallback(async () => {
        // Xác định ngày trung tâm dựa trên chặng bay (đi hoặc về)
        const centerDate = (tripType === 'round_trip' && selectionPhase === 'return') ? returnDate : departureDate;
        if (!centerDate || !airportIdMap.size) return;

        setIsLoading(true);
        setError(null);

        const dateRange = generateDateRange(centerDate);
        
        // Hoán đổi điểm đi và điểm đến cho chặng về
        const isReturnPhase = tripType === 'round_trip' && selectionPhase === 'return';
        const originId = airportIdMap.get(isReturnPhase ? destinationCode : originCode); // Đúng: Lấy ID của điểm đến làm điểm đi mới
        const destinationId = airportIdMap.get(isReturnPhase ? originCode : destinationCode); // Đúng: Lấy ID của điểm đi làm điểm đến mới
        if (!originId || !destinationId) {
            setError("Không tìm thấy ID sân bay.");
            setIsLoading(false);
            return;
        }

        try {
            const pricePromises = dateRange.map(async (date) => {
                const dateString = format(date, 'yyyy-MM-dd');
                const request = {
                    tripType: 'one_way', // Luôn tìm one-way để lấy giá rẻ nhất
                    adultCount: parseInt(adults || '1'),
                    childCount: parseInt(children || '0'),
                    infantCount: parseInt(infants || '0'),                    
                    departureAirportId: originId, // Sử dụng ID đã được hoán đổi (nếu cần)
                    arrivalAirportId: destinationId, // Sử dụng ID đã được hoán đổi (nếu cần)
                    outboundDepartureDate: dateString,
                };

                try {
                    const response = await searchUnifiedFlights(request);
                    const flights = response.oneWayFlights?.content ?? []; // Sử dụng optional chaining và nullish coalescing
                    const minPrice = flights.length > 0 ? Math.min(...flights.map(f => f.basePrice)) : null;
                    return { date: dateString, price: minPrice };
                } catch (e) {
                    return { date: dateString, price: null }; // Trả về null nếu có lỗi cho ngày đó
                }
            });

            const results = await Promise.all(pricePromises);
            const validPrices = results.filter(r => r.price !== null).map(r => r.price!);
            // Xử lý trường hợp không có giá nào hợp lệ, tránh Math.min() trả về Infinity
            const minOverallPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

            const formattedDates: DateScrollerItem[] = results.map(result => ({
                date: result.date,
                displayDate: format(parseISO(result.date), "EEE, dd/MM", { locale: vi }),
                price: result.price,
                isCheapest: result.price === minOverallPrice,
            }));

            setDates(formattedDates);
        } catch (err: any) {
            setError(err.message || "Lỗi khi tải giá theo ngày.");
        } finally {
            setIsLoading(false);
        }
    }, [departureDate, returnDate, tripType, originCode, destinationCode, adults, children, infants, airportIdMap, selectionPhase]);

    useEffect(() => {
        fetchPricesForDateRange();
    }, [fetchPricesForDateRange]);

    return { dates, isLoading, error, refetch: fetchPricesForDateRange };
};
