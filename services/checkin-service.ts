import api from "./api";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface SeatResponse {
  seatId: number;
  seatNumber: string;
  seatType: string;
  status: string; // 'AVAILABLE', 'OCCUPIED', 'PENDING_PAYMENT'
  additionalPrice?: number;
  row: number;
  column: string;
  flightId: number;
  className: string;
  travelClassId: number;
  bookedBy?: string;
  bookedByPassengerId?: number;
  bookedByUserId?: number;
  // Computed property
  isAvailable?: boolean;
}

export interface CheckinLookupRequest {
  bookingCode: string;
  fullName: string;
}

export interface CheckinRequest {
  bookingCode: string;
  passengerFullName: string;
  passengerId: number;
  newSeatId?: number;
  segmentId: number;
}

export interface PassengerSeatAssignment {
  assignmentId: number;
  segmentOrder: number;
  seatNumber: string;
  seatType: string;
  status: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
}

export interface CheckinEligiblePassenger {
  passengerId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  passportNumber: string;
  type: string;
  seatNumber: string;
  ticketPrice: number;
  checkinStatus: string;
  boardingpassurl?: string;
  flightNumber: string;
  segmentId?: number;
  segmentOrder: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  checkedIn: boolean;
}

export interface FlightSegment {
  segmentId: number;
  segmentOrder: number;
  flightId: number;
  flightNumber: string;
  classId: number;
  className: string;
  departureAirport: {
    airportId: number;
    airportCode: string;
    airportName: string;
    cityNames: string[];
  };
  arrivalAirport: {
    airportId: number;
    airportCode: string;
    airportName: string;
    cityNames: string[];
  };
  price: number;
  aircraft: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
}

export interface AvailableSeats {
  segmentId: number;
  segmentOrder: number;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  availableSeats: string[];
}

export interface BookingLookupResponse {
  bookingId: number;
  flightNumber: string;
  bookingCode: string;
  contactName: string;
  contactEmail: string;
  travelClass: string;
  bookingDate: string;
  totalAmount: number;
  status: string;
  passengers: Array<{
    passengerId: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passportNumber: string;
    type: string;
    seatAssignments: PassengerSeatAssignment[];
    className: string;
    gender: string;
    email: string;
    phone: string;
    membershipCode?: string;
    nationality?: string;
    currentResidence?: string;
  }>;
  payment: {
    paymentId: number;
    bookingId: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    transactionId: string;
  };
  flightSegments: FlightSegment[];
  checkinEligiblePassengers: CheckinEligiblePassenger[];
  availableSeats: AvailableSeats[];
}

export interface CheckinResponse {
  checkinId: number;
  bookingId: number;
  passengerId: number;
  passengerName: string;
  seatNumber: string;
  seatType: string;
  ticketPrice: number;
  issueDate: string;
  boardingPassUrl: string;
  oldSeatNumber?: string;
  newSeatNumber?: string;
  seatChangeCharge?: number;
  totalCharge: number;
  updatedTotalAmount?: number;
  status: string;
  message: string;
  paymentRequired: boolean;
}

export interface PaymentRequest {
  bookingId: number;
  amount: number;
  description: string;
  additionalData?: {
    type: string;
    passengerId: number;
    newSeatId?: number;
    segmentId?: number;
  };
}

export interface UpdateBookingTotalRequest {
  additionalAmount: number;
  reason: string;
  paymentMethod?: string; // Thêm payment method để có thể tạo checkoutUrl
}

export interface UpdateBookingTotalResponse {
  bookingId: number;
  previousTotal: number;
  newTotal: number;
  additionalAmount: number;
  updated: boolean;
  payment?: {
    checkoutUrl: string;
  };
}

export interface SeatChangeCalculationRequest {
  bookingCode: string;
  passengerId: number;
  newSeatId: number;
  newSeatNumber?: string; // Fallback if newSeatId not provided
  servicesToAdd?: Array<{
    serviceId: number;
    quantity: number;
  }>; // Ancillary services to add
}

export interface SeatChangeCalculationResponse {
  priceDifference: number; // seatCharge
  oldSeatPrice: number;
  newSeatPrice: number;
  oldSeatType: string;
  newSeatType: string;
  oldSeatNumber: string;
  newSeatNumber: string;
  servicesCharge: number;
  servicesAdded: string[];
  totalCharge: number;
  requiresPayment: boolean;
  message: string;
}

export interface PaymentRequest {
  bookingId: number;
  amount: number;
  description: string;
  additionalData?: {
    type: string;
    passengerId: number;
    newSeatId?: number;
    segmentId?: number;
  };
}

/**
 * Tìm kiếm booking để check-in
 */
export const lookupBookingForCheckin = async (
  bookingCode: string,
  fullName: string
): Promise<BookingLookupResponse> => {
  try {
    const response = await api.get<ApiResponse<BookingLookupResponse>>(
      `/bookings/lookup`,
      {
        params: {
          bookingCode,
          fullName,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Không tìm thấy booking hoặc có lỗi xảy ra");
    }
  }
};

/**
 * Thực hiện check-in
 */
export const processCheckin = async (
  checkinData: CheckinRequest
): Promise<CheckinResponse> => {
  try {
    const response = await api.put<ApiResponse<CheckinResponse>>(
      `/bookings/checkin`,
      checkinData
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Check-in thất bại. Vui lòng thử lại.");
    }
  }
};

/**
 * Lấy danh sách ghế theo flight và travel class
 */
export const getSeatsByFlightAndClass = async (
  flightId: number,
  travelClassId: number
): Promise<SeatResponse[]> => {
  try {
    const response = await api.get<ApiResponse<any[]>>(
      `/flights/${flightId}/seats/${travelClassId}`
    );

    // Transform API data to match our interface
    const seats: SeatResponse[] = response.data.data.map((seat: any) => {
      // Extract row and column from seatNumber (e.g., "14A" -> row: 14, column: "A")
      const seatMatch = seat.seatNumber.match(/(\d+)([A-F])/);
      const row = seatMatch ? parseInt(seatMatch[1]) : 0;
      const column = seatMatch ? seatMatch[2] : "";

      return {
        seatId: seat.seatId,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status: seat.status,
        additionalPrice: seat.additionalPrice || 0,
        row: row,
        column: column,
        flightId: seat.flightId,
        className: seat.className,
        travelClassId: seat.travelClassId,
        bookedBy: seat.bookedBy,
        bookedByPassengerId: seat.bookedByPassengerId,
        bookedByUserId: seat.bookedByUserId,
        isAvailable: seat.status === "AVAILABLE",
      };
    });

    return seats;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Không thể tải danh sách ghế. Vui lòng thử lại.");
    }
  }
};

/**
 * Cập nhật tổng giá booking trước khi thanh toán
 */
export const updateBookingTotal = async (
  bookingId: number,
  request: UpdateBookingTotalRequest
): Promise<UpdateBookingTotalResponse> => {
  try {
    const response = await api.put<ApiResponse<UpdateBookingTotalResponse>>(
      `/bookings/${bookingId}/update-total`,
      request
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Không thể cập nhật tổng giá booking");
    }
  }
};

/**
 * Tính toán phí thay đổi ghế
 */
export const calculateSeatChange = async (
  request: SeatChangeCalculationRequest
): Promise<SeatChangeCalculationResponse> => {
  try {
    const response = await api.post<ApiResponse<SeatChangeCalculationResponse>>(
      `/bookings/calculate-seat-change`,
      request
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Không thể tính toán phí thay đổi ghế");
    }
  }
};
