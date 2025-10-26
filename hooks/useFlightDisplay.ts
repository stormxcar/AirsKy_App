import { useMemo } from 'react';
import { Flight } from '@/app/types/types';
import { FilterOptions, SortOption } from '@/components/screens/book-flight/modals/sort-filter-modal';

export function useFlightDisplay(flights: Flight[], sortOption: SortOption, filterOptions: FilterOptions) {
    const displayedFlights = useMemo(() => {
        let sortedAndFilteredFlights = [...flights];

        // Lọc
        sortedAndFilteredFlights = sortedAndFilteredFlights.filter(flight => {
            if (filterOptions.airlines.length > 0 && !filterOptions.airlines.includes(flight.airline)) {
                return false;
            }
            if (filterOptions.stops.length > 0) {
                const isDirect = flight.type === 'Bay thẳng';
                if (filterOptions.stops.includes('direct') && !isDirect) return false;
                if (filterOptions.stops.includes('one_stop') && isDirect) return false;
            }
            if (filterOptions.timesOfDay.length > 0) {
                const hour = parseInt(flight.departure.time.split(':')[0], 10);
                const isInTimeRange = filterOptions.timesOfDay.some(time => {
                    if (time === 'morning' && (hour >= 0 && hour < 12)) return true;
                    if (time === 'afternoon' && (hour >= 12 && hour < 18)) return true;
                    if (time === 'evening' && (hour >= 18 && hour < 21)) return true;
                    if (time === 'night' && (hour >= 21 && hour < 24)) return true;
                    return false;
                });
                if (!isInTimeRange) return false;
            }
            return true;
        });

        // Sắp xếp
        sortedAndFilteredFlights.sort((a, b) => {
            switch (sortOption) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'time_desc': return b.departure.time.localeCompare(a.departure.time);
                case 'duration_asc':
                    const parseDuration = (durationStr: string) => {
                        const parts = durationStr.match(/(\d+)h\s*(\d+)?m?/);
                        if (!parts) return 0;
                        return (parseInt(parts[1]) * 60) + (parseInt(parts[2]) || 0);
                    };
                    return parseDuration(a.duration) - parseDuration(b.duration);
                case 'time_asc':
                default:
                    return a.departure.time.localeCompare(b.departure.time);
            }
        });

        return sortedAndFilteredFlights;
    }, [flights, sortOption, filterOptions]);

    return displayedFlights;
}