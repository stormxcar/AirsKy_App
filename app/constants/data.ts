import { Airport, Flight, Seat, SeatStatus, TicketClass } from "@/app/types";

// --- AIRPORTS ---
export const AIRPORTS: Airport[] = [
    { code: "SGN", name: "Tân Sơn Nhất", city: "TP. Hồ Chí Minh" },
    { code: "HAN", name: "Nội Bài", city: "Hà Nội" },
    { code: "DAD", name: "Sân bay Đà Nẵng", city: "Đà Nẵng" },
    { code: "CXR", name: "Cam Ranh", city: "Nha Trang" },
    { code: "PQC", name: "Phú Quốc", city: "Phú Quốc" },
    { code: "HPH", name: "Cát Bi", city: "Hải Phòng" },
    { code: "VCA", name: "Sân bay Cần Thơ", city: "Cần Thơ" },
];

// --- TICKET CLASSES ---
export const TICKET_CLASSES: TicketClass[] = [
    { id: "economy", name: "Economy", priceModifier: 1, description: "Giá tiết kiệm" },
    { id: "business", name: "Business", priceModifier: 1.8, description: "Thoải mái hơn" },
    { id: "first", name: "First", priceModifier: 2.5, description: "Trải nghiệm cao cấp" },
];

// --- MOCK FLIGHTS ---
export const MOCK_FLIGHTS: Flight[] = [
  { id: "1", airline: "Vietnam Airlines", airlineLogo: null, flightNumber: "VN245", departure: { code: "SGN", time: "08:30" }, arrival: { code: "HAN", time: "10:35" }, duration: "2h 05m", price: 1850000, type: "Bay thẳng" },
  { id: "2", airline: "Vietjet Air", airlineLogo: null, flightNumber: "VJ150", departure: { code: "SGN", time: "09:15" }, arrival: { code: "HAN", time: "11:20" }, duration: "2h 05m", price: 1520000, type: "Bay thẳng" },
  { id: "3", airline: "Bamboo Airways", airlineLogo: null, flightNumber: "QH202", departure: { code: "SGN", time: "11:00" }, arrival: { code: "HAN", time: "13:10" }, duration: "2h 10m", price: 1780000, type: "Bay thẳng" },
  { id: "4", airline: "Vietnam Airlines", airlineLogo: null, flightNumber: "VN255", departure: { code: "SGN", time: "14:00" }, arrival: { code: "HAN", time: "16:05" }, duration: "2h 05m", price: 2100000, type: "Bay thẳng" },
];

// --- MOCK SEATS ---
/**
 * Generates a mock list of seats for a plane.
 */
export const generateMockSeats = (): Seat[] => {
    const seats: Seat[] = [];
    const rows = 30;
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 1; i <= rows; i++) {
        cols.forEach(col => {
            const id = `${i}${col}`;
            let status: SeatStatus = 'available';
            let price: number | undefined = 50000; // Standard seat price

            // Simulate some occupied seats
            if (Math.random() > 0.8) status = 'occupied';
            // Simulate exit rows (higher price)
            if (i === 12 || i === 14) {
                status = 'exit';
                price = 150000;
            }
            // Window seats (A, F) are slightly more expensive
            if (col === 'A' || col === 'F') price += 20000;

            if (status === 'occupied') price = undefined;

            seats.push({ id, status, price });
        });
    }
    return seats;
};

export const MOCK_SEATS = generateMockSeats();