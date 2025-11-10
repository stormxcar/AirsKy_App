export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PassengerType {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  INFANT = 'INFANT',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  SELECTED = 'SELECTED',
  EXIT = 'EXIT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BaggageType {
  CHECK_IN = 'CHECK_IN',
  CABIN = 'CABIN',
}

/**
 * Enum cho các loại dịch vụ bổ trợ (Ancillary Service).
 * Phản ánh AncillaryServiceType.java từ backend.
 */
export enum AncillaryServiceType {
  MEAL = 'MEAL',
  SEAT = 'SEAT',
  ENTERTAINMENT = 'ENTERTAINMENT',
  WIFI = 'WIFI',
  PRIORITY_BOARDING = 'PRIORITY_BOARDING',
  LOUNGE_ACCESS = 'LOUNGE_ACCESS',
  EXTRA_LEGROOM = 'EXTRA_LEGROOM',
  PET_TRANSPORT = 'PET_TRANSPORT',
  INFANT_MEAL = 'INFANT_MEAL',
  SPECIAL_ASSISTANCE = 'SPECIAL_ASSISTANCE',
  TRAVEL_INSURANCE = 'TRAVEL_INSURANCE',
  OTHER = 'OTHER',
}

// Enum này phản ánh cách backend sử dụng BaggagePackage
export enum BaggagePackageEnum {
  NONE = 'NONE',
  PKG_20KG = 'PKG_20KG',
  PKG_30KG = 'PKG_30KG',
  PKG_40KG = 'PKG_40KG',
}

export enum CheckinStatus {
  PENDING = 'PENDING',
  ELIGIBLE = 'ELIGIBLE',
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
  BOOKING_NOT_CONFIRMED = 'BOOKING_NOT_CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  COMPLETED = 'COMPLETED',
}

export interface FlightSegmentRequest {
  flightId: number;
  classId: number;
  segmentOrder: number;
}

export interface FlightSegmentResponse {
  segmentId: number;
  segmentOrder: number;
  flightId: number;
  flightNumber: string;
  travelClassId: number;
  travelClassName: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: string; // LocalDateTime in Java
  arrivalTime: string;   // LocalDateTime in Java
  duration?: string;
  aircraft?: string;
  price: number; // BigDecimal in Java
}

export interface SeatAssignmentRequest {
  seatId: number;
  segmentOrder: number;
  seatType?: string;
}

export interface PassengerSeatAssignmentResponse {
  assignmentId: number;
  seatId: number;
  seatNumber: string;
  seatType: string; // SeatTypes enum in Java
  segmentId: number;
  status: SeatStatus;
}

export interface PassengerSeatRequest {
  firstName: string;
  lastName:string;
  dateOfBirth: string; // "YYYY-MM-DD"
  passportNumber?: string;
  type: PassengerType;
  gender: Gender;
  email?: string;
  phone?: string;
  seatAssignments?: SeatAssignmentRequest[];
  baggagePackage?: BaggagePackageEnum; // Thêm gói hành lý vào request
}

export interface PassengerSeatResponse {
  passengerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  passportNumber?: string;
  type: PassengerType;
  gender: Gender;
  email?: string;
  phone?: string;
  seatNumber?: string; // Main seat number
  seatType?: string; // Main seat type
  seatAssignments?: PassengerSeatAssignmentResponse[];
}

export interface BookingRequest {
  userId?: number;
  flightSegments: FlightSegmentRequest[];
  passengers: PassengerSeatRequest[];
  paymentMethod: PaymentMethod;
  dealCode?: string;
  contactEmail?: string;
  contactName?: string;
  ancillaryServices?: BookingAncillaryServiceRequest[]; // Thêm dịch vụ phụ trợ vào request
  pointsToRedeem?: number; // Số điểm muốn đổi
}

export interface BookingAncillaryServiceRequest {
  serviceId: number;
  passengerId?: number; // ID của hành khách áp dụng dịch vụ (nếu có)
  quantity: number;
  notes?: string;
}

export interface BaggageResponse {
  baggageId: number;
  checkinId: number;
  type: BaggageType;
  purchasedPackage: BaggagePackageEnum; // Sử dụng enum mới
  packagePrice: number; // BigDecimal in Java
  actualWeight?: number; // BigDecimal in Java
  excessWeight?: number; // BigDecimal in Java
  excessFee?: number; // BigDecimal in Java
}

export interface BookingAncillaryServiceResponse {
  bookingServiceId: number;
  serviceId: number;
  serviceName: string;
  serviceType: string; // AncillaryServiceType enum in Java
  serviceTypeDisplayName: string;
  passengerId?: number;
  passengerName?: string;
  quantity: number;
  unitPrice: number; // BigDecimal in Java
  totalPrice: number; // BigDecimal in Java
  notes?: string;
}

export interface SeatTypePricingDetail {
  passengerName: string;
  seatNumber: string;
  seatType: string; // SeatTypes enum in Java
  additionalPrice: number; // BigDecimal in Java
}

export interface CheckinEligiblePassengerResponse {
  passengerId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  passportNumber?: string;
  seatNumber?: string;
  ticketPrice: number; // BigDecimal in Java
  checkedIn: boolean;
  boardingpassurl?: string;
  checkinStatus: CheckinStatus;
}

export interface PaymentResponse {
  paymentId: number;
  bookingId: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number; // BigDecimal in Java
  paymentDate: string; // LocalDateTime in Java
  transactionId?: string;
  payerId?: string;
  checkoutUrl?: string;
}

export interface BookingResponse {
  bookingId: number;
  bookingCode: string;
  bookingDate: string; // LocalDateTime in Java
  status: BookingStatus;
  totalAmount: number; // BigDecimal in Java
  contactEmail?: string;
  contactName?: string;
  passengers: PassengerSeatResponse[];
  flightSegments: FlightSegmentResponse[];
  payment?: PaymentResponse;
  appliedDealCode?: string;
  discountPercentage?: number; // BigDecimal in Java
  discountAmount?: number; // BigDecimal in Java
  pointsRedeemed?: number;
  pointsDiscountAmount?: number; // BigDecimal in Java
  baggage?: BaggageResponse[];
  ancillaryServices?: BookingAncillaryServiceResponse[];
  ancillaryServicesAmount?: number; // BigDecimal in Java
  seatTypeAmount?: number; // BigDecimal in Java
  seatTypeDetails?: SeatTypePricingDetail[];
}
