import { BaggagePackage, Passenger, SelectedFlight } from "@/app/types/types";
import React, { createContext, useContext, useReducer } from 'react';

interface BookingState {
    // Search params
    tripType?: 'one_way' | 'round_trip';
    originCode?: string;
    destinationCode?: string;
    departureDate?: string;
    returnDate?: string;
    passengerCounts?: {
        adults: number;
        children: number;
        infants: number;
    };

    // Selected flights
    departureFlight?: SelectedFlight | null;
    returnFlight?: SelectedFlight | null;

    // User and passenger info
    contactName?: string;
    contactEmail?: string;
    passengers?: Passenger[];

    // Services and seats
    selectedSeats?: { depart: { [key: string]: any }, return: { [key: string]: any } };
    selectedBaggages?: { depart: { [passengerId: number]: BaggagePackage | null }, return: { [passengerId: number]: BaggagePackage | null } };
    selectedAncillaryServices?: {
        depart: { [passengerId: number]: { [serviceId: number]: boolean } }, return: { [passengerId: number]: { [serviceId: number]: boolean } }
    };

    // Pricing
    totalPrice?: number;
    departSeats:[];
    returnSeats:[];
}

// Định nghĩa các hành động cho reducer
type Action =
    | { type: 'UPDATE_STATE'; payload: Partial<BookingState> }
    | { type: 'RESET_STATE' };

interface BookingContextType {
    bookingState: BookingState;
    dispatch: React.Dispatch<Action>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialBookingState: BookingState = {
    departureFlight: null,
    returnFlight: null,
    passengers: [],
    selectedSeats: { depart: {}, return: {} },
    selectedBaggages: { depart: {}, return: {} },
    selectedAncillaryServices: { depart: {}, return: {} },
    totalPrice: 0,
};

// Reducer để quản lý trạng thái đặt vé
const bookingReducer = (state: BookingState, action: Action): BookingState => {
    switch (action.type) {
        case 'UPDATE_STATE':
            return { ...state, ...action.payload };
        case 'RESET_STATE':
            return initialBookingState;
        default:
            return state;
    }
};

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
    const [bookingState, dispatch] = useReducer(bookingReducer, initialBookingState);

    return (
        <BookingContext.Provider value={{
            bookingState,
            dispatch
        }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
};