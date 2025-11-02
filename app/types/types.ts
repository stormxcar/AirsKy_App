import { SeatStatus,AncillaryServiceType } from "./booking"; // Import SeatStatus từ booking.ts
import { AncillaryServiceResponse } from './ancillary-service';

/**
 * Represents an airport.
 */
export type Airport = {
  id: any;
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
  departure: {
    date: string | number | Date; code: string; time: string 
};
  arrival: { code: string; time: string };
  duration: string;
  price: number; // Giá cơ bản (basePrice)
  type: "Bay thẳng" | "1 điểm dừng" | string;
  status: string;
  // Thêm các hạng vé cho chuyến bay này
  ticketClasses: TicketClass[];
  departureTime: string;
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
// In app/types.ts

export interface BaggagePackage {
    key: string;
    label: string;
    price: number;
}

// Danh sách các gói hành lý có thể chọn
export const BAGGAGE_PACKAGES: BaggagePackage[] = [
    { key: 'NONE', label: 'Không chọn', price: 0 }, // Giữ lại để UI có thể bỏ chọn
    { key: 'KG_15', label: 'Gói 15kg', price: 200000 },
    { key: 'KG_20', label: 'Gói 20kg', price: 300000 },
    { key: 'KG_25', label: 'Gói 25kg', price: 400000 },
    { key: 'KG_30', label: 'Gói 30kg', price: 500000 },
];

/**
 * Mock data cho danh sách các dịch vụ bổ trợ (Ancillary Services).
 * Dữ liệu này tuân theo interface `AncillaryServiceResponse`.
 */
export const MOCK_ANCILLARY_SERVICES: AncillaryServiceResponse[] = [
  {
    serviceId: 1,
    serviceName: 'Suất ăn đặc biệt',
    serviceType: AncillaryServiceType.MEAL,
    serviceTypeDisplayName: 'Dịch vụ ăn uống',
    description:
      'Đặc biệt suất ăn nóng với lựa chọn món Á hoặc món Âu, phục vụ trong chuyến bay.',
    price: 150000.0,
    isActive: true,
    thumbnail: 'https://example.com/thumbnails/meal.jpg',
    maxQuantity: 5, // Có thể mua cho nhiều người
    isPerPassenger: true, // Tính phí trên mỗi hành khách
    isPerSegment: true, // Tính phí cho mỗi chặng bay (khứ hồi x2)
    createdAt: '2025-10-07T09:48:49',
    updatedAt: '2025-10-26T16:14:22.710023',
  },
  {
    serviceId: 2,
    serviceName: 'Internet trên máy bay',
    serviceType: AncillaryServiceType.WIFI,
    serviceTypeDisplayName: 'Internet trên máy bay',
    description:
      'Kết nối internet tốc độ cao trong suốt chuyến bay, hỗ trợ streaming và làm việc.',
    price: 80000.0,
    isActive: true,
    thumbnail: 'https://example.com/thumbnails/wifi.jpg',
    maxQuantity: 1,
    isPerPassenger: true, // Mỗi hành khách đăng ký riêng
    isPerSegment: true, // Tính phí cho mỗi chặng bay
    createdAt: '2025-10-07T09:48:49',
    updatedAt: '2025-10-26T16:14:22.793187',
  },
  {
    serviceId: 4,
    serviceName: 'Lên máy bay ưu tiên',
    serviceType: AncillaryServiceType.PRIORITY_BOARDING,
    serviceTypeDisplayName: 'Lên máy bay ưu tiên',
    description:
      'Lên máy bay ưu tiên với hàng đợi riêng, tiết kiệm thời gian và thuận tiện.',
    price: 120000.0,
    isActive: true,
    thumbnail: 'https://example.com/thumbnails/priority-boarding.jpg',
    maxQuantity: 1,
    isPerPassenger: true, // Mỗi hành khách đăng ký riêng
    isPerSegment: true, // Tính phí cho mỗi chặng bay
    createdAt: '2025-10-07T09:48:49',
    updatedAt: '2025-10-26T16:14:22.873352',
  },
  {
    serviceId: 5,
    serviceName: 'Bảo hiểm du lịch',
    serviceType: AncillaryServiceType.TRAVEL_INSURANCE,
    serviceTypeDisplayName: 'Bảo hiểm du lịch',
    description:
      'Bảo hiểm du lịch toàn diện bao gồm hủy chuyến, trễ chuyến và tai nạn.',
    price: 50000.0,
    isActive: true,
    thumbnail: 'https://example.com/thumbnails/travel-insurance.jpg',
    maxQuantity: 1,
    isPerPassenger: false, // Tính phí trên mỗi booking, không phải mỗi hành khách
    isPerSegment: false, // Chỉ tính phí một lần cho cả hành trình (kể cả khứ hồi)
    createdAt: '2025-10-07T09:48:49',
    updatedAt: '2025-10-07T09:48:49',
  },
];

/**
 * Represents the status and details of a seat on a plane.
 */
// export type SeatStatus = 'available' | 'occupied' | 'selected' | 'exit';
export type Seat = {
  id: string;
  status: SeatStatus;
  price: number; // Phụ phí cho loại ghế này
  seatNumber: string;
  seatType: string; // e.g., 'STANDARD', 'EXIT_ROW', 'FRONT_ROW'
  className: string; // e.g., 'Economy', 'Business', 'First'
};