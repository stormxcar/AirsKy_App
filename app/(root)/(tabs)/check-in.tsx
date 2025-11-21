import { PaymentMethod } from "@/app/types/booking";
import {
  BookingLookupResponse,
  calculateSeatChange,
  CheckinEligiblePassenger,
  CheckinResponse,
  FlightSegment,
  getSeatsByFlightAndClass,
  lookupBookingForCheckin,
  processCheckin,
  SeatResponse,
  updateBookingTotal,
  UpdateBookingTotalRequest,
} from "@/services/checkin-service";
import { createPayment } from "@/services/payment-service";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

enum CheckinStep {
  SEARCH = 1,
  SELECT_FLIGHT = 2,
  SELECT_PASSENGER = 3,
  CONFIRM_AND_COMPLETE = 4,
}

// Helper để xóa dấu tiếng Việt và chuyển thành chữ hoa
const processNameInput = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
};

// Helper để format thời gian check-in
const formatCheckinTime = (hoursUntilCheckin: number): string => {
  if (hoursUntilCheckin < 24) {
    return `${Math.ceil(hoursUntilCheckin)} giờ nữa`;
  } else {
    const days = Math.floor(hoursUntilCheckin / 24);
    const remainingHours = hoursUntilCheckin % 24;

    if (days === 1) {
      return remainingHours > 0
        ? `1 ngày ${Math.ceil(remainingHours)} giờ nữa`
        : "1 ngày nữa";
    } else if (days < 7) {
      return remainingHours > 0
        ? `${days} ngày ${Math.ceil(remainingHours)} giờ nữa`
        : `${days} ngày nữa`;
    } else {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;

      if (weeks === 1) {
        return remainingDays > 0
          ? `1 tuần ${remainingDays} ngày nữa`
          : "1 tuần nữa";
      } else {
        return remainingDays > 0
          ? `${weeks} tuần ${remainingDays} ngày nữa`
          : `${weeks} tuần nữa`;
      }
    }
  }
};

// Helper để kiểm tra segment có thể check-in được không (trong 24h trước giờ khởi hành)
const canCheckInSegment = (segment: FlightSegment): boolean => {
  const now = new Date();
  const departureTime = new Date(segment.departureTime);
  const checkInStartTime = new Date(
    departureTime.getTime() - 24 * 60 * 60 * 1000
  ); // 24h trước

  const canCheckIn = now >= checkInStartTime && now < departureTime;

  console.log("🔍 Check-in time validation:", {
    flightNumber: segment.flightNumber,
    departureTime: departureTime.toISOString(),
    checkInStartTime: checkInStartTime.toISOString(),
    now: now.toISOString(),
    hoursUntilDeparture: (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    canCheckIn: canCheckIn
  });

  return canCheckIn;
};

const CheckIn = () => {
  // URL params để handle return từ payment
  const params = useLocalSearchParams();

  const [currentStep, setCurrentStep] = useState<CheckinStep>(
    CheckinStep.SEARCH
  );
  const [bookingCode, setBookingCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Data states
  const [bookingData, setBookingData] = useState<BookingLookupResponse | null>(
    null
  );
  const [selectedSegment, setSelectedSegment] = useState<FlightSegment | null>(
    null
  );
  const [selectedPassenger, setSelectedPassenger] =
    useState<CheckinEligiblePassenger | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [availableSeats, setAvailableSeats] = useState<SeatResponse[]>([]);
  const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(
    null
  );

  // Seat change states
  const [seatChangeCalculation, setSeatChangeCalculation] = useState<
    any | null
  >(null);
  const [showSeatChangeConfirmation, setShowSeatChangeConfirmation] =
    useState(false);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PaymentMethod.PAYPAL);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Handle payment return from payment screens
  useEffect(() => {
    if (params.paymentSuccess === "true" && params.returnTo === "check-in") {
      console.log("💰 Payment successful, completing seat change...");
      handlePostPaymentSeatChange();
    } else if (
      params.paymentError === "true" ||
      params.paymentSuccess === "false"
    ) {
      console.log("❌ Payment failed or cancelled");
      Alert.alert(
        "Thanh toán thất bại",
        "Thanh toán không thành công. Vui lòng thử lại."
      );
      // Clear payment-related params
      router.replace("/check-in");
    }
  }, [params]);

  // Handle prefill booking code and view boarding pass from My Trips
  useEffect(() => {
    if (params.prefillBookingCode && params.viewBoardingPass === "true") {
      console.log("🎫 Auto-filling booking code for boarding pass view:", params.prefillBookingCode);
      setBookingCode(params.prefillBookingCode as string);
      // Note: We don't auto-search here as user might need to enter their name
      // The search will happen when they enter their name and tap search
    }
  }, [params]);

  // Complete seat change sau khi payment thành công
  const handlePostPaymentSeatChange = async () => {
    try {
      if (
        !params.bookingCode ||
        !params.passengerFullName ||
        !params.passengerId ||
        !params.newSeatId ||
        !params.segmentId
      ) {
        Alert.alert("Lỗi", "Thiếu thông tin để hoàn thành thay đổi ghế");
        return;
      }

      setLoading(true);
      console.log("🪑 Completing seat change after payment...");

      // Process check-in với ghế mới
      const checkinResult = await processCheckin({
        bookingCode: params.bookingCode as string,
        passengerFullName: params.passengerFullName as string,
        passengerId: parseInt(params.passengerId as string),
        newSeatId: parseInt(params.newSeatId as string),
        segmentId: parseInt(params.segmentId as string),
      });

      // Update UI states và reload booking data
      await handleSearch(); // Reload booking để có data mới nhất
      setSelectedSeatId(parseInt(params.newSeatId as string));
      setCheckinResult(checkinResult);
      setCurrentStep(CheckinStep.CONFIRM_AND_COMPLETE);

      // Clear payment-related params
      router.replace("/check-in");

      Alert.alert(
        "Thành công!",
        `Đã thanh toán thành công và hoàn thành check-in. Boarding pass đã được tạo.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("❌ Post-payment seat change error:", error);
      Alert.alert(
        "Lỗi",
        "Không thể hoàn thành thay đổi ghế sau thanh toán. Vui lòng liên hệ hỗ trợ."
      );
    } finally {
      setLoading(false);
    }
  };

  // Chỉ cho phép check-in khi đã chọn ghế và không có payment pending
  const canProceedCheckin = selectedSeat && selectedSeatId && !needsPayment;

  // Hàm hiển thị tùy chọn xem boarding pass cho các segments đã check-in
  const showBoardingPassOptions = (checkedInSegments: any[]) => {
    if (checkedInSegments.length === 1) {
      // Chỉ có 1 segment, hiển thị trực tiếp boarding pass
      const segment = checkedInSegments[0].segment;
      const passenger = checkedInSegments[0].passengers.find((p: any) => p.checkinStatus === "ALREADY_CHECKED_IN");

      if (passenger) {
        const mockCheckinResult: CheckinResponse = {
          checkinId: Date.now(),
          bookingId: 0,
          passengerId: passenger.passengerId,
          passengerName: passenger.fullName,
          seatNumber: passenger.seatNumber,
          seatType: "ECONOMY",
          ticketPrice: passenger.ticketPrice,
          issueDate: new Date().toISOString(),
          boardingPassUrl: passenger.boardingpassurl || "",
          totalCharge: passenger.ticketPrice,
          status: "SUCCESS",
          message: "Check-in completed successfully",
          paymentRequired: false
        };
        setCheckinResult(mockCheckinResult);
        setCurrentStep(CheckinStep.CONFIRM_AND_COMPLETE);
      }
    } else {
      // Nhiều segments, cho user chọn segment nào muốn xem boarding pass
      const options = checkedInSegments.map((segmentInfo, index) => ({
        text: `${segmentInfo.segment.flightNumber} (${segmentInfo.segment.departureAirport.airportCode}→${segmentInfo.segment.arrivalAirport.airportCode})`,
        onPress: () => {
          const passenger = segmentInfo.passengers.find((p: any) => p.checkinStatus === "ALREADY_CHECKED_IN");
          if (passenger) {
            const mockCheckinResult: CheckinResponse = {
              checkinId: Date.now(),
              bookingId: 0,
              passengerId: passenger.passengerId,
              passengerName: passenger.fullName,
              seatNumber: passenger.seatNumber,
              seatType: "ECONOMY",
              ticketPrice: passenger.ticketPrice,
              issueDate: new Date().toISOString(),
              boardingPassUrl: passenger.boardingpassurl || "",
              totalCharge: passenger.ticketPrice,
              status: "SUCCESS",
              message: "Check-in completed successfully",
              paymentRequired: false
            };
            setCheckinResult(mockCheckinResult);
            setCurrentStep(CheckinStep.CONFIRM_AND_COMPLETE);
          }
        }
      }));

      options.push({ text: "Hủy", onPress: () => {} });

      Alert.alert(
        "Chọn chuyến bay",
        "Bạn muốn xem boarding pass của chuyến bay nào?",
        options
      );
    }
  };

  // Step 1: Tìm kiếm booking
  const handleSearch = async () => {
    if (!bookingCode.trim() || !fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã đặt chỗ và tên hành khách");
      return;
    }

    setLoading(true);
    try {
      const result = await lookupBookingForCheckin(
        bookingCode.trim().toUpperCase(),
        processNameInput(fullName.trim())
      );

      // Kiểm tra xem có chuyến bay nào đã qua thời gian khởi hành không
      const now = new Date();
      const hasDepartedFlights = result.flightSegments.some(
        (segment: FlightSegment) => new Date(segment.departureTime) < now
      );

      if (hasDepartedFlights) {
        // Tìm chuyến bay đã khởi hành gần nhất để hiển thị thông tin
        const departedSegments = result.flightSegments.filter(
          (segment: FlightSegment) => new Date(segment.departureTime) < now
        );
        const latestDepartedSegment = departedSegments.reduce(
          (latest, current) =>
            new Date(current.departureTime) > new Date(latest.departureTime)
              ? current
              : latest
        );

        const departureTime = new Date(latestDepartedSegment.departureTime);
        const timeDiff = now.getTime() - departureTime.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

        Alert.alert(
          "Chuyến bay đã khởi hành",
          `Chuyến bay ${latestDepartedSegment.flightNumber} từ ${latestDepartedSegment.departureAirport.airportCode} → ${latestDepartedSegment.arrivalAirport.airportCode} đã khởi hành ${hoursAgo > 0 ? `${hoursAgo} giờ trước` : "vừa mới khởi hành"}.\n\nKhông thể thực hiện check-in cho chuyến bay đã khởi hành.`,
          [
            { text: "Tìm kiếm khác" },
            {
              text: "OK",
              onPress: () => {
                // Vẫn hiển thị thông tin nhưng không cho phép check-in
                setBookingData(result);
                setCurrentStep(CheckinStep.SELECT_FLIGHT);
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      setBookingData(result);

      // Phân tích chi tiết check-in status cho từng segment
      const allPassengers = result.checkinEligiblePassengers || [];
      const flightSegments = result.flightSegments;

      // Phân tích trạng thái check-in cho từng segment
      const segmentAnalysis = flightSegments.map(segment => {
        const segmentPassengers = allPassengers.filter(p =>
          p.segmentId === segment.segmentId || p.segmentId === null
        );

        const checkedInCount = segmentPassengers.filter(p => p.checkinStatus === "ALREADY_CHECKED_IN").length;
        const eligibleCount = segmentPassengers.filter(p =>
          p.checkinStatus === "ELIGIBLE" || p.checkinStatus === "PENDING"
        ).length;
        const totalPassengers = segmentPassengers.length;

        return {
          segment,
          passengers: segmentPassengers,
          checkedInCount,
          eligibleCount,
          totalPassengers,
          allCheckedIn: checkedInCount === totalPassengers && totalPassengers > 0,
          hasEligible: eligibleCount > 0,
          canCheckIn: canCheckInSegment(segment)
        };
      });

      console.log("Segment analysis:", segmentAnalysis);

      // Đếm tổng số segment đã check-in hoàn toàn
      const fullyCheckedInSegments = segmentAnalysis.filter(s => s.allCheckedIn).length;
      const totalSegments = segmentAnalysis.length;

      // Kiểm tra xem có segment nào đã check-in hoàn toàn không
      const hasAnyCheckedInSegments = fullyCheckedInSegments > 0;

      if (hasAnyCheckedInSegments) {
        // Có ít nhất một segment đã check-in hoàn toàn
        const checkedInSegments = segmentAnalysis.filter(s => s.allCheckedIn);
        const pendingSegments = segmentAnalysis.filter(s => !s.allCheckedIn);

        if (fullyCheckedInSegments === totalSegments) {
          // Tất cả segments đã check-in hoàn toàn
          const firstCheckedInPassenger = allPassengers.find(p => p.checkinStatus === "ALREADY_CHECKED_IN");

          Alert.alert(
            "✅ Đã check-in thành công!",
            totalSegments === 1
              ? `Hành khách đã hoàn thành check-in cho chuyến bay ${checkedInSegments[0]?.segment.flightNumber || 'N/A'}.\n\nBạn có muốn xem boarding pass không?`
              : `Hành khách đã hoàn thành check-in cho tất cả ${totalSegments} chuyến bay.\n\nBạn có muốn xem boarding pass không?`,
            [
              { text: "Để sau" },
              {
                text: "Xem boarding pass",
                onPress: () => showBoardingPassOptions(checkedInSegments)
              }
            ]
          );
        } else {
          // Một số segments đã check-in, một số chưa (round-trip với mixed status)
          const checkedInSegmentNames = checkedInSegments.map(s =>
            `${s.segment.flightNumber} (${s.segment.departureAirport.airportCode}→${s.segment.arrivalAirport.airportCode})`
          ).join(", ");

          Alert.alert(
            "Thông tin check-in",
            `Đã check-in hoàn tất cho: ${checkedInSegmentNames}\n\nCòn ${pendingSegments.length} chuyến bay có thể check-in tiếp.\n\nBạn có muốn xem boarding pass hoặc tiếp tục check-in không?`,
            [
              { text: "Để sau" },
              {
                text: "Xem boarding pass",
                onPress: () => showBoardingPassOptions(checkedInSegments)
              },
              {
                text: "Tiếp tục check-in",
                onPress: () => setCurrentStep(CheckinStep.SELECT_FLIGHT)
              }
            ]
          );
        }
        setLoading(false);
        return;
      } else if (segmentAnalysis.some(s => s.hasEligible && s.canCheckIn)) {
        // Có ít nhất một segment có thể check-in
        // Tiếp tục với logic hiện tại
      } else {
        // Không có segment nào có thể check-in
        const reasons = segmentAnalysis.map(s => {
          if (!s.canCheckIn) return `${s.segment.flightNumber}: Check-in chưa mở (còn >24h)`;
          if (!s.hasEligible) return `${s.segment.flightNumber}: Không có hành khách đủ điều kiện`;
          return `${s.segment.flightNumber}: Không thể check-in`;
        }).join("\n");

        Alert.alert(
          "Không thể check-in",
          `Không có chuyến bay nào khả dụng để check-in:\n\n${reasons}`,
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // Xử lý logic cho single segment hoặc multiple segments như cũ
      if (result.flightSegments.length === 1) {
        const singleSegment = result.flightSegments[0];
        const segmentInfo = segmentAnalysis[0];

        if (segmentInfo.hasEligible && segmentInfo.canCheckIn) {
          setSelectedSegment(singleSegment);
          setCurrentStep(CheckinStep.SELECT_PASSENGER);
        } else {
          setCurrentStep(CheckinStep.SELECT_FLIGHT);
        }
      } else {
        setCurrentStep(CheckinStep.SELECT_FLIGHT);
      }
    } catch (error: any) {
      Alert.alert(
        "Không tìm thấy",
        error.message || "Không tìm thấy thông tin booking"
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Chọn chuyến bay (nếu có nhiều segment)
  const handleSelectFlight = (segment: FlightSegment) => {
    console.log("handleSelectFlight called with segment:", segment);
    console.log("segment.segmentId:", segment.segmentId);

    // Kiểm tra checkinStatus từ backend trước
    const eligiblePassengers = bookingData?.checkinEligiblePassengers || [];
    console.log("eligiblePassengers:", eligiblePassengers);

    const segmentPassengers = eligiblePassengers.filter(
      (p) => p.segmentId === segment.segmentId || p.segmentId === null
    );
    console.log("segmentPassengers for segmentId", segment.segmentId, ":", segmentPassengers);

    // Nếu không có passenger nào eligible cho segment này
    if (segmentPassengers.length === 0) {
      console.log("No eligible passengers found for this segment");
      Alert.alert(
        "Không thể check-in",
        "Không có hành khách đủ điều kiện check-in cho chuyến bay này.",
        [{ text: "OK" }]
      );
      return;
    }

    // Kiểm tra xem có passenger nào có status ELIGIBLE không
    const hasEligiblePassenger = segmentPassengers.some(
      (p) => p.checkinStatus === "ELIGIBLE" || p.checkinStatus === "PENDING"
    );
    console.log("hasEligiblePassenger:", hasEligiblePassenger);
    console.log("Passenger statuses:", segmentPassengers.map(p => p.checkinStatus));

    if (!hasEligiblePassenger) {
      // Hiển thị lý do không thể check-in dựa trên status
      const statusMessages = {
        CHECKIN_NOT_OPEN: "Check-in chưa mở cho chuyến bay này.",
        ALREADY_CHECKED_IN: "Hành khách đã check-in.",
        BOOKING_NOT_CONFIRMED: "Đặt chỗ chưa được xác nhận.",
        PAYMENT_PENDING: "Thanh toán đang chờ xử lý.",
        BOOKING_CANCELLED: "Đặt chỗ đã bị hủy.",
        NOT_AVAILABLE: "Check-in không khả dụng.",
      };

      const firstPassenger = segmentPassengers[0];
      const message =
        statusMessages[
        firstPassenger.checkinStatus as keyof typeof statusMessages
        ] || "Check-in chưa khả dụng cho chuyến bay này.";

      Alert.alert("Không thể check-in", message, [{ text: "OK" }]);
      return;
    }

    // Nếu có passenger eligible, kiểm tra thời gian
    if (!canCheckInSegment(segment)) {
      Alert.alert(
        "Chưa mở check-in",
        "Check-in chỉ khả dụng từ 24 giờ trước giờ khởi hành.",
        [{ text: "OK" }]
      );
      return;
    }

    setSelectedSegment(segment);
    setCurrentStep(CheckinStep.SELECT_PASSENGER);
  };

  // Step 3: Chọn hành khách và tải ghế
  const handleSelectPassenger = async (passenger: CheckinEligiblePassenger) => {
    setSelectedPassenger(passenger);
    setSelectedSeat(passenger.seatNumber); // Mặc định ghế hiện tại

    if (!selectedSegment) return;

    setLoading(true);
    try {
      console.log("Loading seats for:", {
        flightId: selectedSegment.flightId,
        classId: selectedSegment.classId,
      });

      // Tải danh sách ghế theo hạng vé
      const seats = await getSeatsByFlightAndClass(
        selectedSegment.flightId,
        selectedSegment.classId
      );

      console.log("Received seats:", seats);
      console.log("Seats count:", seats?.length || 0);

      setAvailableSeats(seats || []); // Đảm bảo không bao giờ undefined

      // Tìm thông tin ghế hiện tại
      const currentSeat = (seats || []).find(
        (s) => s.seatNumber === passenger.seatNumber
      );
      console.log("Current seat found:", currentSeat);

      if (currentSeat) {
        setSelectedSeatId(currentSeat.seatId);
      } else {
        // Nếu không tìm thấy ghế hiện tại, reset selection
        setSelectedSeat(null);
        setSelectedSeatId(null);
      }

      setCurrentStep(CheckinStep.CONFIRM_AND_COMPLETE);
    } catch (error: any) {
      console.error("Error loading seats:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách ghế");
      setAvailableSeats([]); // Đặt về mảng rỗng khi lỗi
    } finally {
      setLoading(false);
    }
  };

  // Chọn ghế với logic tính phí
  const handleSelectSeat = async (seat: SeatResponse) => {
    if (!selectedPassenger || !bookingData || !selectedSegment) return;

    console.log(
      "🪑 Selecting seat:",
      seat.seatNumber,
      "Current:",
      selectedPassenger.seatNumber
    );

    // Reset states khi chọn ghế mới
    setSeatChangeCalculation(null);
    setShowSeatChangeConfirmation(false);
    setNeedsPayment(false);
    setPaymentProcessing(false);

    // Nếu chọn ghế hiện tại thì cho phép chọn lại (không cần tính phí)
    const isCurrentSeat = seat.seatNumber === selectedPassenger.seatNumber;

    if (isCurrentSeat) {
      console.log("✅ Reselecting current seat");
      setSelectedSeat(seat.seatNumber);
      setSelectedSeatId(seat.seatId);
      return;
    }

    // Tìm ghế hiện tại
    const currentSeat = availableSeats.find(
      (s) => s.seatNumber === selectedPassenger.seatNumber
    );
    if (!currentSeat) {
      Alert.alert("Lỗi", "Không thể tìm thấy thông tin ghế hiện tại");
      return;
    }

    console.log("💰 Calculating seat change cost...");
    setLoading(true);
    // Đặt selectedSeatId ngay lập tức để fill màu
    setSelectedSeatId(seat.seatId);
    setSelectedSeat(seat.seatNumber);

    try {
      setLoading(true);

      // Tính toán phí thay đổi ghế
      const calculation = await calculateSeatChange({
        bookingCode: bookingData.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId: seat.seatId,
        newSeatNumber: seat.seatNumber,
        servicesToAdd: [],
      });

      console.log("📊 Calculating seat change for:", {
        currentSeat: selectedPassenger.seatNumber,
        newSeat: seat.seatNumber,
        seatType: seat.seatType,
        className: selectedSegment.className,
      });

      // Kiểm tra miễn phí cho Business/First class
      const className = selectedSegment.className;
      const isPremiumClass = className === "Business" || className === "First";
      const isPremiumSeat = [
        "EXTRA_LEGROOM",
        "FRONT_ROW",
        "ACCESSIBLE",
      ].includes(seat.seatType);

      if (isPremiumClass && isPremiumSeat && calculation.totalCharge > 0) {
        console.log("🎆 Premium class detected - seat should be free!");
        calculation.totalCharge = 0;
        calculation.priceDifference = 0;
        calculation.newSeatPrice = 0;
      }

      setSeatChangeCalculation(calculation);
      console.log("💰 Seat change fee:", calculation.totalCharge);

      // Hiển thị thông tin ghế mới
      Alert.alert(
        "Thông tin ghế mới",
        `Ghế: ${seat.seatNumber}\nLoại ghế: ${calculation.newSeatType}\nPhí thay đổi: ${calculation.totalCharge.toLocaleString("vi-VN")} VNĐ\n\nBạn có muốn tiếp tục không?`,
        [
          {
            text: "Hủy",
            onPress: () => {
              // Reset lại ghế cũ
              const currentSeat = availableSeats.find(
                (s) => s.seatNumber === selectedPassenger.seatNumber
              );
              setSelectedSeatId(currentSeat?.seatId || null);
              setSelectedSeat(selectedPassenger.seatNumber);
              setSeatChangeCalculation(null);
            },
          },
          {
            text: "Tiếp tục",
            onPress: () => {
              if (calculation.totalCharge > 0) {
                // Có phí - hiện modal thanh toán
                setShowSeatChangeConfirmation(true);
                setNeedsPayment(true);
                console.log("💳 Payment required for seat change");
              } else {
                // Miễn phí - thực hiện ngay
                handleFreeSeatChange();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Seat selection error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tính phí thay đổi ghế");

      // Reset lại ghế cũ
      const currentSeat = availableSeats.find(
        (s) => s.seatNumber === selectedPassenger.seatNumber
      );
      setSelectedSeatId(currentSeat?.seatId || null);
      setSelectedSeat(selectedPassenger.seatNumber);
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận và thực hiện check-in
  const handleConfirmCheckin = async () => {
    if (!selectedPassenger || !selectedSegment || !bookingData) {
      Alert.alert("Lỗi", "Thiếu thông tin để thực hiện check-in");
      return;
    }

    setLoading(true);
    try {
      const checkinData = {
        bookingCode: bookingData.bookingCode,
        passengerFullName: selectedPassenger.fullName,
        passengerId: selectedPassenger.passengerId,
        segmentId: selectedSegment.segmentId,
        ...(selectedSeatId && { newSeatId: selectedSeatId }),
      };

      const result = await processCheckin(checkinData);
      setCheckinResult(result);
      // Check-in hoàn thành - sẽ hiển thị kết quả trong cùng màn hình
    } catch (error: any) {
      Alert.alert("Lỗi check-in", error.message || "Check-in thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận thay đổi ghế có phí
  const handleFreeSeatChange = async () => {
    if (
      !seatChangeCalculation ||
      !selectedPassenger ||
      !bookingData ||
      !selectedSegment ||
      selectedSeatId === null
    ) {
      Alert.alert("Lỗi", "Thiếu thông tin để thực hiện thay đổi ghế");
      return;
    }

    try {
      setLoading(true);
      console.log("🆓 Processing free seat change...");

      // Sử dụng cùng flow như paid seat nhưng với amount = 0
      const updateRequest: UpdateBookingTotalRequest = {
        additionalAmount: 0, // Free seat change
        reason: "SEAT_CHANGE_FREE",
        paymentMethod: "FREE",
      };

      const updateResponse = await updateBookingTotal(
        bookingData.bookingId,
        updateRequest
      );
      console.log("✅ Free seat change successful:", updateResponse);

      if (updateResponse.updated) {
        Alert.alert("Thành công", "Đã thay đổi ghế thành công!");

        // Reset state and reload data
        setShowSeatChangeConfirmation(false);
        setSeatChangeCalculation(null);
        setNeedsPayment(false);

        // Reload booking data
        await handleSearch();
      } else {
        throw new Error("Không thể cập nhật thông tin ghế");
      }
    } catch (error: any) {
      console.error("❌ Free seat change error:", error);
      Alert.alert("Lỗi", error.message || "Không thể thay đổi ghế");

      // Reset lại ghế cũ khi có lỗi
      const currentSeat = availableSeats.find(
        (s) => s.seatNumber === selectedPassenger.seatNumber
      );
      if (currentSeat) {
        setSelectedSeatId(currentSeat.seatId);
        setSelectedSeat(selectedPassenger.seatNumber);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSeatChange = async () => {
    if (
      !seatChangeCalculation ||
      !selectedPassenger ||
      !bookingData ||
      !selectedSegment ||
      selectedSeatId === null
    ) {
      Alert.alert("Lỗi", "Thiếu thông tin để thực hiện thay đổi ghế");
      return;
    }

    console.log("💳 Processing seat change payment...");
    try {
      setLoading(true);
      setPaymentProcessing(true);

      // Bước 1: Cập nhật total booking trước khi thanh toán
      console.log("📊 Updating booking total with seat change...");
      const updateRequest: UpdateBookingTotalRequest = {
        additionalAmount: seatChangeCalculation.totalCharge,
        reason: "SEAT_CHANGE",
        paymentMethod: selectedPaymentMethod,
      };

      const updateResponse = await updateBookingTotal(
        bookingData.bookingId,
        updateRequest
      );
      console.log("✅ Booking total updated:", updateResponse);

      // Bước 2: Sử dụng checkoutUrl từ response như booking flow
      const checkoutUrl = updateResponse.payment?.checkoutUrl;
      console.log("🔍 Payment response from backend:", {
        hasPayment: !!updateResponse.payment,
        checkoutUrl: checkoutUrl,
        fullResponse: updateResponse,
        paymentMethod: selectedPaymentMethod,
      });

      // Debug: Kiểm tra xem backend có hỗ trợ PayPal cho seat change không
      if (selectedPaymentMethod === PaymentMethod.PAYPAL && !checkoutUrl) {
        console.log(
          "⚠️ PayPal not supported for seat changes - using createPayment API like web frontend"
        );

        // Sử dụng createPayment API như web frontend (checkin-completion.jsx)
        try {
          console.log("🔄 Creating payment using createPayment API...");

          const paymentData = {
            bookingId: bookingData.bookingId,
            paymentMethod: selectedPaymentMethod,
          };

          const paymentResponse = await createPayment(paymentData);
          const paypalCheckoutUrl = paymentResponse.checkoutUrl;

          if (paypalCheckoutUrl) {
            console.log(
              "✅ Successfully created PayPal checkout for seat change:",
              paypalCheckoutUrl
            );

            // Sử dụng checkout URL từ payment API
            const navParams = {
              status: "pending",
              bookingId: bookingData.bookingId,
              bookingCode: bookingData.bookingCode,
              type: "SEAT_CHANGE",
              returnTo: "check-in",
              passengerFullName: selectedPassenger.fullName,
              passengerId: selectedPassenger.passengerId.toString(),
              newSeatId: selectedSeatId.toString(),
              segmentId: selectedSegment.segmentId.toString(),
            };

            // Reset states TRƯỚC khi mở URL ngoài
            setShowSeatChangeConfirmation(false);
            setPaymentProcessing(false);

            console.log("🚀 Opening PayPal URL for seat change...");
            await Linking.openURL(paypalCheckoutUrl);

            // Navigate đến payment result
            router.replace({
              pathname: "/(root)/(booking)/payment-result",
              params: navParams,
            });

            return; // Exit sớm
          } else {
            throw new Error("Không thể tạo PayPal checkout cho thay đổi ghế");
          }
        } catch (paymentError: any) {
          console.error(
            "❌ Failed to create payment for seat change:",
            paymentError
          );
          Alert.alert(
            "Lỗi PayPal",
            "Không thể tạo thanh toán PayPal cho thay đổi ghế. Vui lòng thử lại hoặc liên hệ hỗ trợ."
          );
          setPaymentProcessing(false);
          setLoading(false);
          return;
        }
      }
      if (!checkoutUrl) {
        // Fallback: Nếu backend chưa có payment field, thông báo user
        console.log("⚠️ No checkoutUrl received from backend");
        Alert.alert(
          "Yêu cầu thanh toán",
          `Cần thanh toán thêm ${seatChangeCalculation.totalCharge.toLocaleString("vi-VN")} VNĐ cho việc thay đổi ghế từ ${seatChangeCalculation.oldSeatType} sang ${seatChangeCalculation.newSeatType}.\n\nVui lòng liên hệ quầy check-in để hoàn tất thanh toán và cập nhật ghế.`,
          [
            {
              text: "Hủy",
            },
            {
              text: "Đã hiểu",
              onPress: () => {
                // Có thể tự động complete seat change mà không cần payment
                // hoặc để user tự liên hệ counter
                setShowSeatChangeConfirmation(false);
              },
            },
          ]
        );

        setPaymentProcessing(false);
        setLoading(false);
        return;
      }

      // Bước 3: Navigate to payment như checkout flow với EXACT same logic
      const navParams = {
        status: "pending",
        bookingId: bookingData.bookingId,
        bookingCode: bookingData.bookingCode,
        type: "SEAT_CHANGE",
        returnTo: "check-in",
        passengerFullName: selectedPassenger.fullName,
        passengerId: selectedPassenger.passengerId.toString(),
        newSeatId: selectedSeatId.toString(),
        segmentId: selectedSegment.segmentId.toString(),
      };

      if (selectedPaymentMethod === PaymentMethod.BANK_TRANSFER) {
        // Điều hướng đến màn hình QR code
        console.log("📱 Navigating to QR payment screen...");
        router.push({
          pathname: "/(root)/(booking)/payment-qr",
          params: { ...navParams, url: checkoutUrl },
        });
      } else if (selectedPaymentMethod === PaymentMethod.PAYPAL) {
        // Điều hướng đến PayPal EXACTLY như checkout
        console.log("🌐 PayPal payment process:");
        console.log("  - CheckoutURL:", checkoutUrl);
        console.log("  - PaymentMethod:", selectedPaymentMethod);
        console.log("  - NavParams:", navParams);

        try {
          // Reset states TRƯỜC khi mở URL ngoài (như checkout)
          setShowSeatChangeConfirmation(false);
          setPaymentProcessing(false);

          console.log("🚀 Opening PayPal URL...");
          await Linking.openURL(checkoutUrl);
          console.log("✅ PayPal URL opened successfully");

          // Navigate đến payment result tracking EXACTLY như checkout
          console.log("🔄 Redirecting to payment-result...");
          router.replace({
            pathname: "/(root)/(booking)/payment-result",
            params: navParams,
          });
          console.log(
            "✅ Redirected to payment-result with params:",
            navParams
          );

          return; // Exit sớm để tránh conflict
        } catch (linkingError) {
          console.error("❌ Failed to open PayPal URL:", linkingError);
          Alert.alert(
            "Lỗi",
            "Không thể mở trang thanh toán PayPal. Vui lòng thử lại."
          );
          setPaymentProcessing(false);
          setLoading(false);
          return;
        }
      }

      // Reset states sau khi redirect
      setShowSeatChangeConfirmation(false);
      setPaymentProcessing(false);
    } catch (error: any) {
      console.error("❌ Seat change payment error:", error);
      Alert.alert(
        "Lỗi thanh toán",
        error.message || "Không thể tạo thanh toán. Vui lòng thử lại."
      );
      setPaymentProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep(CheckinStep.SEARCH);
    setBookingCode("");
    setFullName("");
    setBookingData(null);
    setSelectedSegment(null);
    setSelectedPassenger(null);
    setSelectedSeat(null);
    setSelectedSeatId(null);
    setAvailableSeats([]);
    setCheckinResult(null);
    setSeatChangeCalculation(null);
    setShowSeatChangeConfirmation(false);
    setNeedsPayment(false);
    setPaymentProcessing(false);
    setSelectedPaymentMethod(PaymentMethod.PAYPAL);
  };

  const renderProgressBar = () => {
    const steps = [
      { step: CheckinStep.SEARCH, label: "Tìm kiếm" },
      { step: CheckinStep.SELECT_FLIGHT, label: "Chọn chuyến bay" },
      { step: CheckinStep.SELECT_PASSENGER, label: "Chọn hành khách" },
      {
        step: CheckinStep.CONFIRM_AND_COMPLETE,
        label: "Xác nhận",
      },
    ];

    // Adjust steps based on flight count
    const filteredSteps =
      bookingData?.flightSegments.length === 1
        ? steps.filter((s) => s.step !== CheckinStep.SELECT_FLIGHT)
        : steps;

    return (
      <View className="flex-row justify-between items-center px-4 py-3 bg-white rounded-t-[40px]">
        {filteredSteps.map((step, index) => (
          <View key={step.step} className="flex-1 items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= step.step ? "bg-blue-900" : "bg-gray-300"
                }`}
            >
              <Text
                className={`font-bold text-sm ${currentStep >= step.step ? "text-white" : "text-gray-500"
                  }`}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              className={`text-xs mt-1 ${currentStep >= step.step ? "text-blue-900" : "text-gray-500"
                }`}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSearchStep = () => (
    <ScrollView className="flex-1 p-4 ">
      <View className="space-y-4 gap-2 ">

        {/* Thông báo khi đến từ My Trips để xem boarding pass */}
        {params.viewBoardingPass === "true" && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <Text className="text-blue-800 text-sm font-medium">
              🎫 Xem boarding pass
            </Text>
            <Text className="text-blue-700 text-xs mt-1">
              Nhập họ tên để xem boarding pass của chuyến đi đã check-in.
            </Text>
          </View>
        )}

        <View className="pt-6">
          <TextInput
            mode="outlined"
            label="Mã đặt chỗ (PNR)"
            value={bookingCode}
            onChangeText={setBookingCode}
            placeholder="Ví dụ: ABC123"
            autoCapitalize="characters"
            style={{ backgroundColor: 'transparent', fontSize: 14 }} />
        </View>

        <View>
          <TextInput
            mode="outlined"
            label="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tên đầy đủ như trên giấy tờ"
            autoCapitalize="characters"
            style={{ backgroundColor: 'transparent', fontSize: 14 }} />
        </View>
        <Button
          mode="contained"
          onPress={handleSearch}
          loading={loading}
          disabled={loading || !bookingCode.trim() || !fullName.trim()}
          buttonColor="#172554"
          style={{ borderRadius: 9999 }}
          labelStyle={{ fontSize: 16, fontWeight: "bold", borderRadius: 9999 }}
        >
          <Text className="text-white text-center font-bold text-base ml-2 ">Tìm chuyến đi</Text>

        </Button>
      </View>


      <View className="bg-blue-50 rounded-xl p-4 mt-6 ">
        <Text className="font-bold text-blue-900 mb-2">Lưu ý</Text>
        <Text className="text-blue-800 text-sm">
          • Nhập chính xác tên như trên giấy tờ tùy thân{"\n"}• Mã đặt chỗ có
          thể tìm thấy trong email xác nhận{"\n"}• Check-in chỉ khả dụng từ 24h
          trước giờ khởi hành
        </Text>
      </View>
    </ScrollView>
  );

  const renderSelectFlightStep = () => (
    <ScrollView className="flex-1 p-4">
      <Text className="text-xl font-bold text-blue-900 mb-4">
        Chọn chuyến bay
      </Text>

      {bookingData?.flightSegments.map((segment, index) => {
        const eligiblePassengers = bookingData?.checkinEligiblePassengers || [];
        const segmentPassengers = eligiblePassengers.filter(
          (p) => p.segmentId === segment.segmentId || p.segmentId === null
        );

        console.log("🛫 Flight segment analysis:", {
          segmentId: segment.segmentId,
          flightNumber: segment.flightNumber,
          departureTime: segment.departureTime,
          totalEligiblePassengers: eligiblePassengers.length,
          segmentPassengersCount: segmentPassengers.length,
          segmentPassengers: segmentPassengers.map(p => ({
            passengerId: p.passengerId,
            segmentId: p.segmentId,
            checkinStatus: p.checkinStatus,
            fullName: p.fullName
          }))
        });

        // Xác định status dựa trên checkinStatus từ backend
        const hasEligiblePassenger = segmentPassengers.some(
          (p) => p.checkinStatus === "ELIGIBLE" || p.checkinStatus === "PENDING"
        );

        const canCheckIn = hasEligiblePassenger && canCheckInSegment(segment);
        const departureTime = new Date(segment.departureTime);
        const now = new Date();
        const hoursUntilDeparture =
          (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Xác định status text và color
        let statusText = "Chưa mở check-in";
        let statusColor = "gray";
        let canSelect = false;

        console.log("📊 Flight status determination:", {
          segmentId: segment.segmentId,
          hasEligiblePassenger: hasEligiblePassenger,
          canCheckInSegment: canCheckInSegment(segment),
          hoursUntilDeparture: hoursUntilDeparture,
          initialStatusText: statusText,
          finalStatusText: statusText,
          finalStatusColor: statusColor,
          canSelect: canSelect
        });

        if (hasEligiblePassenger) {
          if (canCheckInSegment(segment)) {
            statusText = "Có thể check-in";
            statusColor = "green";
            canSelect = true;
          } else {
            statusText = "Chưa đến giờ check-in";
            statusColor = "orange";
          }
        } else {
          // Hiển thị lý do không thể check-in
          const firstPassenger = segmentPassengers[0];
          if (firstPassenger) {
            const statusMessages = {
              CHECKIN_NOT_OPEN: "Chưa mở check-in",
              ALREADY_CHECKED_IN: "Đã check-in",
              BOOKING_NOT_CONFIRMED: "Chưa xác nhận",
              PAYMENT_PENDING: "Chờ thanh toán",
              BOOKING_CANCELLED: "Đã hủy",
              NOT_AVAILABLE: "Không khả dụng",
            };
            statusText =
              statusMessages[
              firstPassenger.checkinStatus as keyof typeof statusMessages
              ] || "Không khả dụng";
          }
        }

        return (
          <TouchableOpacity
            key={segment.segmentId}
            onPress={() => handleSelectFlight(segment)}
            disabled={!canSelect}
            className={`border rounded-xl p-4 mb-3 shadow-sm ${canSelect
              ? "bg-white border-gray-200"
              : "bg-gray-50 border-gray-300 opacity-60"
              }`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className={`font-bold text-lg ${canSelect ? "text-blue-900" : "text-gray-500"
                  }`}
              >
                {segment.flightNumber}
              </Text>
              <View className="flex-row items-center">
                <Text
                  className={`font-semibold mr-2 ${canSelect ? "text-blue-600" : "text-gray-500"
                    }`}
                >
                  Chặng {segment.segmentOrder}
                </Text>
                <View
                  className={`px-2 py-1 rounded-full ${statusColor === "green"
                    ? "bg-green-100"
                    : statusColor === "orange"
                      ? "bg-orange-100"
                      : "bg-gray-100"
                    }`}
                >
                  <Text
                    className={`font-semibold text-xs ${statusColor === "green"
                      ? "text-green-700"
                      : statusColor === "orange"
                        ? "text-orange-700"
                        : "text-gray-600"
                      }`}
                  >
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>{" "}
            <View className="flex-row justify-between items-center">
              <View>
                <Text
                  className={`font-bold text-2xl ${canCheckIn ? "text-gray-800" : "text-gray-500"
                    }`}
                >
                  {segment.departureAirport.airportCode}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {format(new Date(segment.departureTime), "HH:mm", {
                    locale: vi,
                  })}
                </Text>
              </View>

              <View className="flex-1 items-center mx-4">
                <Ionicons
                  name="airplane"
                  size={20}
                  color={canCheckIn ? "#9ca3af" : "#d1d5db"}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  {segment.duration} phút
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className={`font-bold text-2xl ${canCheckIn ? "text-gray-800" : "text-gray-500"
                    }`}
                >
                  {segment.arrivalAirport.airportCode}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {format(new Date(segment.arrivalTime), "HH:mm", {
                    locale: vi,
                  })}
                </Text>
              </View>
            </View>
            <View className="mt-3">
              <Text
                className={`text-center text-sm ${canCheckIn ? "text-gray-600" : "text-gray-500"
                  }`}
              >
                {format(new Date(segment.departureTime), "dd/MM/yyyy", {
                  locale: vi,
                })}{" "}
                • Hạng {segment.className}
              </Text>
              {!canCheckIn && hoursUntilDeparture > 24 && (
                <Text className="text-center text-orange-600 text-xs mt-1">
                  Check-in mở sau {formatCheckinTime(hoursUntilDeparture - 24)}
                </Text>
              )}
              {hasEligiblePassenger && (
                <Text className="text-center text-sm text-blue-600 mt-1">
                  {segmentPassengers.length} hành khách có thể check-in
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderSelectPassengerStep = () => {
    const eligiblePassengers = bookingData?.checkinEligiblePassengers || [];
    // Lọc passengers theo segment đã chọn
    const segmentPassengers = selectedSegment
      ? eligiblePassengers.filter(
        (passenger) => passenger.segmentId === selectedSegment.segmentId || passenger.segmentId === null
      )
      : [];

    console.log("👥 Select passenger step:", {
      selectedSegmentId: selectedSegment?.segmentId,
      totalEligiblePassengers: eligiblePassengers.length,
      segmentPassengersCount: segmentPassengers.length,
      segmentPassengers: segmentPassengers.map(p => ({
        passengerId: p.passengerId,
        segmentId: p.segmentId,
        checkinStatus: p.checkinStatus,
        fullName: p.fullName
      }))
    });

    return (
      <ScrollView className="flex-1 p-4">
        <Text className="text-xl font-bold text-blue-900 mb-4">
          Chọn hành khách
        </Text>

        {selectedSegment && (
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <Text className="font-bold text-blue-900 mb-2">
              Thông tin chuyến bay
            </Text>
            <Text className="text-gray-700">
              {selectedSegment.flightNumber} -{" "}
              {selectedSegment.departureAirport.airportCode} →{" "}
              {selectedSegment.arrivalAirport.airportCode}
            </Text>
            <Text className="text-gray-600 text-sm">
              {format(
                new Date(selectedSegment.departureTime),
                "dd/MM/yyyy HH:mm",
                { locale: vi }
              )}
            </Text>
          </View>
        )}

        {segmentPassengers.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="people" size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-4">
              Không có hành khách nào đủ điều kiện check-in cho chuyến bay này
            </Text>
          </View>
        ) : (
          segmentPassengers.map((passenger) => (
            <TouchableOpacity
              key={passenger.passengerId}
              onPress={() => {
                if (passenger.checkinStatus === "ALREADY_CHECKED_IN") {
                  Alert.alert(
                    "Đã check-in",
                    `${passenger.fullName} đã check-in thành công.\nGhế: ${passenger.seatNumber}`,
                    [{ text: "OK" }]
                  );
                } else {
                  handleSelectPassenger(passenger);
                }
              }}
              className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-bold text-lg text-blue-900">
                    {passenger.fullName}
                  </Text>
                  <Text className="text-gray-600 mt-1">
                    Ghế: {passenger.seatNumber} ({passenger.type})
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Hộ chiếu: {passenger.passportNumber}
                  </Text>
                </View>

                <View className="items-end">
                  {passenger.checkinStatus === "ALREADY_CHECKED_IN" ? (
                    <View className="bg-green-100 px-3 py-2 rounded-full">
                      <Text className="text-green-700 font-semibold text-xs">
                        Đã check-in
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-blue-100 px-3 py-2 rounded-full">
                      <Text className="text-blue-700 font-semibold text-xs">
                        Có thể check-in
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderConfirmAndCompleteStep = () => {
    // Nếu chưa có checkinResult, hiển thị form xác nhận
    if (!checkinResult) {
      return (
        <ScrollView className="flex-1 p-4 overflow-hidden">
          <Text className="text-xl font-bold text-blue-900 mb-4">
            Xác nhận & Check-in
          </Text>

          {/* Flight Info */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <Text className="font-bold text-blue-900 mb-2">
              Thông tin chuyến bay
            </Text>
            {selectedSegment && (
              <>
                <Text className="text-gray-700">
                  Chuyến bay:{" "}
                  <Text className="font-semibold">
                    {selectedSegment.flightNumber}
                  </Text>
                </Text>
                <Text className="text-gray-700">
                  Tuyến:{" "}
                  <Text className="font-semibold">
                    {selectedSegment.departureAirport.airportCode} →{" "}
                    {selectedSegment.arrivalAirport.airportCode}
                  </Text>
                </Text>
                <Text className="text-gray-700">
                  Khởi hành:{" "}
                  <Text className="font-semibold">
                    {format(
                      new Date(selectedSegment.departureTime),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )}
                  </Text>
                </Text>
              </>
            )}
          </View>

          {/* Passenger Info */}
          <View className="bg-green-50 rounded-xl p-4 mb-4">
            <Text className="font-bold text-green-900 mb-2">
              Thông tin hành khách
            </Text>
            {selectedPassenger && (
              <>
                <Text className="text-gray-700">
                  Họ tên:{" "}
                  <Text className="font-semibold">
                    {selectedPassenger.fullName}
                  </Text>
                </Text>
                <Text className="text-gray-700">
                  Loại hành khách:{" "}
                  <Text className="font-semibold">
                    {selectedPassenger.type}
                  </Text>
                </Text>
                <Text className="text-gray-700">
                  Ghế ngồi:{" "}
                  <Text className="font-semibold">
                    {selectedSeat || selectedPassenger.seatNumber}
                  </Text>
                </Text>
                <Text className="text-gray-700">
                  Hộ chiếu:{" "}
                  <Text className="font-semibold">
                    {selectedPassenger.passportNumber}
                  </Text>
                </Text>
              </>
            )}
          </View>

          {/* Seat Selection Section */}
          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <Text className="font-bold text-gray-800 mb-4">Chọn ghế ngồi</Text>

            {/* Seat Legend */}
            <View className="flex-row justify-around items-center mb-6 py-3 bg-gray-50 rounded-lg">
              <View className="flex-row items-center">
                <View className="w-5 h-5 bg-white border-2 border-green-400 rounded mr-2" />
                <Text className="text-sm text-gray-700 font-medium">Trống</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-5 h-5 bg-gray-400 rounded mr-2" />
                <Text className="text-sm text-gray-700 font-medium">
                  Đã đặt
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-5 h-5 bg-blue-500 rounded mr-2" />
                <Text className="text-sm text-gray-700 font-medium">
                  Đã chọn
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-5 h-5 bg-yellow-500 border-2 border-yellow-600 rounded mr-2" />
                <Text className="text-sm text-gray-700 font-medium">
                  Hiện tại
                </Text>
              </View>
            </View>

            {/* Seats Grid - Format 3-3 (ABC | DEF) */}
            <View className="space-y-2">
              {(() => {
                // Debug log
                console.log("availableSeats:", availableSeats);
                console.log("availableSeats length:", availableSeats?.length);

                // Kiểm tra nếu availableSeats tồn tại và không rỗng
                if (
                  !availableSeats ||
                  !Array.isArray(availableSeats) ||
                  availableSeats.length === 0
                ) {
                  return (
                    <View className="flex-1 justify-center items-center py-8">
                      <Text className="text-gray-500">
                        Không có ghế khả dụng
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        Debug: {availableSeats?.length || 0} ghế
                      </Text>
                    </View>
                  );
                }

                try {
                  // Nhóm ghế theo hàng với kiểm tra an toàn
                  const seatRows = availableSeats.reduce(
                    (acc, seat) => {
                      if (!seat || typeof seat.row !== "number") return acc;
                      if (!acc[seat.row]) acc[seat.row] = [];
                      acc[seat.row].push(seat);
                      return acc;
                    },
                    {} as { [key: number]: SeatResponse[] }
                  );

                  // Sắp xếp hàng theo số thứ tự
                  const sortedRows = Object.keys(seatRows)
                    .map(Number)
                    .sort((a, b) => a - b);

                  if (sortedRows.length === 0) {
                    return (
                      <View className="flex-1 justify-center items-center py-8">
                        <Text className="text-gray-500">
                          Không có dữ liệu ghế hợp lệ
                        </Text>
                      </View>
                    );
                  }

                  return sortedRows.map((row) => {
                    const rowSeats = (seatRows[row] || []).sort((a, b) =>
                      a.column.localeCompare(b.column)
                    );

                    // Chia ghế thành 2 nhóm: ABC và DEF
                    const leftSeats = rowSeats.filter((seat) =>
                      ["A", "B", "C"].includes(seat.column)
                    );
                    const rightSeats = rowSeats.filter((seat) =>
                      ["D", "E", "F"].includes(seat.column)
                    );

                    return (
                      <View
                        key={row}
                        className="flex-row items-center justify-center mb-3 px-2"
                      >
                        {/* Số hàng bên trái */}
                        <Text className="w-10 text-center text-gray-600 text-base font-bold">
                          {row}
                        </Text>

                        {/* Ghế bên trái (ABC) */}
                        <View className="flex-row space-x-2 mx-3">
                          {leftSeats.map((seat) => {
                            const isCurrentSeat =
                              seat.seatNumber === selectedPassenger?.seatNumber;
                            const isSelectedSeat =
                              selectedSeat === seat.seatNumber;
                            // Cho phép chọn nếu ghế available HOẶC là ghế hiện tại
                            const canSelect = seat.isAvailable || isCurrentSeat;

                            return (
                              <TouchableOpacity
                                key={seat.seatId}
                                onPress={() =>
                                  canSelect ? handleSelectSeat(seat) : null
                                }
                                className={`w-12 h-12 rounded-xl justify-center items-center border-2 ${isSelectedSeat
                                  ? "bg-blue-500 border-blue-700"
                                  : isCurrentSeat
                                    ? "bg-yellow-500 border-yellow-600" // Ghế hiện tại - màu vàng
                                    : seat.isAvailable
                                      ? "bg-white border-green-400"
                                      : "bg-gray-400 border-gray-500"
                                  } ${!canSelect ? "opacity-50" : "opacity-100"}`}
                                disabled={!canSelect}
                              >
                                <Text
                                  className={`text-sm font-bold ${isSelectedSeat
                                    ? "text-white"
                                    : isCurrentSeat
                                      ? "text-white"
                                      : seat.isAvailable
                                        ? "text-green-700"
                                        : "text-gray-600"
                                    }`}
                                >
                                  {seat.column}
                                </Text>
                                {seat.additionalPrice &&
                                  seat.additionalPrice > 0 && (
                                    <Text
                                      className={`text-xs ${isSelectedSeat || isCurrentSeat
                                        ? "text-yellow-200"
                                        : "text-orange-600"
                                        }`}
                                    >
                                      +
                                      {(seat.additionalPrice / 1000).toFixed(0)}
                                      k
                                    </Text>
                                  )}
                                {isCurrentSeat && !isSelectedSeat && (
                                  <Text className="text-xs text-white font-bold">
                                    Hiện tại
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Lối đi */}
                        <View className="w-12 items-center">
                          <View className="w-8 h-1 bg-gray-300 rounded" />
                        </View>

                        {/* Ghế bên phải (DEF) */}
                        <View className="flex-row space-x-2 mx-3">
                          {rightSeats.map((seat) => {
                            const isCurrentSeat =
                              seat.seatNumber === selectedPassenger?.seatNumber;
                            const isSelectedSeat =
                              selectedSeat === seat.seatNumber;
                            // Cho phép chọn nếu ghế available HOẶC là ghế hiện tại
                            const canSelect = seat.isAvailable || isCurrentSeat;

                            return (
                              <TouchableOpacity
                                key={seat.seatId}
                                onPress={() =>
                                  canSelect ? handleSelectSeat(seat) : null
                                }
                                className={`w-12 h-12 rounded-xl justify-center items-center border-2 ${isSelectedSeat
                                  ? "bg-blue-500 border-blue-700"
                                  : isCurrentSeat
                                    ? "bg-yellow-500 border-yellow-600" // Ghế hiện tại - màu vàng
                                    : seat.isAvailable
                                      ? "bg-white border-green-400"
                                      : "bg-gray-400 border-gray-500"
                                  } ${!canSelect ? "opacity-50" : "opacity-100"}`}
                                disabled={!canSelect}
                              >
                                <Text
                                  className={`text-sm font-bold ${isSelectedSeat
                                    ? "text-white"
                                    : isCurrentSeat
                                      ? "text-white"
                                      : seat.isAvailable
                                        ? "text-green-700"
                                        : "text-gray-600"
                                    }`}
                                >
                                  {seat.column}
                                </Text>
                                {seat.additionalPrice &&
                                  seat.additionalPrice > 0 && (
                                    <Text
                                      className={`text-xs ${isSelectedSeat || isCurrentSeat
                                        ? "text-yellow-200"
                                        : "text-orange-600"
                                        }`}
                                    >
                                      +
                                      {(seat.additionalPrice / 1000).toFixed(0)}
                                      k
                                    </Text>
                                  )}
                                {isCurrentSeat && !isSelectedSeat && (
                                  <Text className="text-xs text-white font-bold">
                                    Hiện tại
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Số hàng bên phải */}
                        <Text className="w-10 text-center text-gray-600 text-base font-bold">
                          {row}
                        </Text>
                      </View>
                    );
                  });
                } catch (error) {
                  console.error("Lỗi khi xử lý dữ liệu ghế:", error);
                  return (
                    <View className="flex-1 justify-center items-center py-8">
                      <Text className="text-gray-500">
                        Lỗi khi tải dữ liệu ghế
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>
          </View>

          {/* Selected Seat Info */}
          {selectedSeat && (
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <Text className="font-bold text-blue-900 mb-2">Ghế đã chọn</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-gray-700">
                    Số ghế:{" "}
                    <Text className="font-semibold">{selectedSeat}</Text>
                  </Text>
                  {(() => {
                    const seat =
                      availableSeats && availableSeats.length > 0
                        ? availableSeats.find(
                          (s) => s.seatNumber === selectedSeat
                        )
                        : null;
                    return (
                      seat && (
                        <>
                          <Text className="text-gray-700">
                            Loại ghế:{" "}
                            <Text className="font-semibold">
                              {seat.seatType}
                            </Text>
                          </Text>
                          {seat.additionalPrice && seat.additionalPrice > 0 && (
                            <Text className="text-gray-700">
                              Phí thêm:{" "}
                              <Text className="font-semibold text-orange-600">
                                +{seat.additionalPrice.toLocaleString("vi-VN")}{" "}
                                VNĐ
                              </Text>
                            </Text>
                          )}
                        </>
                      )
                    );
                  })()}
                </View>
              </View>
            </View>
          )}

          {/* Terms and Conditions */}
          <View className="bg-yellow-50 rounded-xl p-4 mb-6">
            <Text className="font-bold text-yellow-900 mb-2">
              Lưu ý quan trọng
            </Text>
            <Text className="text-yellow-800 text-sm">
              • Vui lòng có mặt tại cửa khởi hành ít nhất 45 phút trước giờ bay
              nội địa{"\n"}• Mang theo giấy tờ tùy thân hợp lệ{"\n"}• Kiểm tra
              kỹ thông tin trước khi xác nhận{"\n"}• Sau khi check-in, bạn sẽ
              nhận được boarding pass điện tử
            </Text>
          </View>

          {/* Seat Change Confirmation Modal */}
          {showSeatChangeConfirmation && seatChangeCalculation && (
            <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <Text className="font-bold text-orange-900 mb-3">
                Xác nhận thay đổi ghế
              </Text>

              <View className="space-y-2 mb-4">
                <Text className="text-gray-700">
                  Từ:{" "}
                  <Text className="font-semibold">
                    {seatChangeCalculation.oldSeatType}
                  </Text>
                  {" → "}
                  Đến:{" "}
                  <Text className="font-semibold">
                    {seatChangeCalculation.newSeatType}
                  </Text>
                </Text>

                <Text className="text-gray-700">
                  Phí thêm:{" "}
                  <Text className="font-semibold text-orange-600">
                    +{seatChangeCalculation.totalCharge.toLocaleString("vi-VN")}{" "}
                    VNĐ
                  </Text>
                </Text>

                {seatChangeCalculation.message && (
                  <Text className="text-sm text-gray-600 italic">
                    {seatChangeCalculation.message}
                  </Text>
                )}
              </View>

              {/* Payment Method Selection */}
              <View className="mb-4">
                <Text className="font-semibold text-gray-800 mb-2">
                  Chọn phương thức thanh toán:
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedPaymentMethod(PaymentMethod.PAYPAL)
                    }
                    className={`flex-1 flex-row items-center justify-center p-3 border-2 rounded-lg ${selectedPaymentMethod === PaymentMethod.PAYPAL
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white"
                      }`}
                  >
                    <Ionicons
                      name="logo-paypal"
                      size={24}
                      color={
                        selectedPaymentMethod === PaymentMethod.PAYPAL
                          ? "#0070ba"
                          : "#666"
                      }
                    />
                    <Text
                      className={`ml-2 font-medium ${selectedPaymentMethod === PaymentMethod.PAYPAL
                        ? "text-blue-600"
                        : "text-gray-600"
                        }`}
                    >
                      PayPal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setSelectedPaymentMethod(PaymentMethod.BANK_TRANSFER)
                    }
                    className={`flex-1 flex-row items-center justify-center p-3 border-2 rounded-lg ${selectedPaymentMethod === PaymentMethod.BANK_TRANSFER
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-white"
                      }`}
                  >
                    <Ionicons
                      name="qr-code"
                      size={24}
                      color={
                        selectedPaymentMethod === PaymentMethod.BANK_TRANSFER
                          ? "#16a34a"
                          : "#666"
                      }
                    />
                    <Text
                      className={`ml-2 font-medium ${selectedPaymentMethod === PaymentMethod.BANK_TRANSFER
                        ? "text-green-600"
                        : "text-gray-600"
                        }`}
                    >
                      SePay
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row space-x-3">
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowSeatChangeConfirmation(false);
                    setSeatChangeCalculation(null);
                    setNeedsPayment(false);
                    setPaymentProcessing(false);
                  }}
                  style={{ flex: 1, borderColor: "#f97316", borderRadius: 8 }}
                  labelStyle={{ color: "#f97316", fontSize: 14 }}
                >
                  Hủy
                </Button>

                <Button
                  mode="contained"
                  onPress={handleConfirmSeatChange}
                  loading={loading || paymentProcessing}
                  disabled={paymentProcessing}
                  style={{
                    flex: 1,
                    backgroundColor: "#f97316",
                    borderRadius: 8,
                  }}
                  labelStyle={{ fontSize: 14 }}
                >
                  {paymentProcessing ? "Đang xử lý..." : "Thanh toán"}
                </Button>
              </View>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleConfirmCheckin}
            loading={loading}
            disabled={loading || !canProceedCheckin || paymentProcessing}
            style={{
              borderRadius: 12,
              paddingVertical: 6,
              marginBottom: 24,
              backgroundColor:
                loading || !canProceedCheckin || paymentProcessing
                  ? "#9ca3af"
                  : "#2563eb",
            }}
            labelStyle={{ fontSize: 16, fontWeight: "bold" }}
          >
            {paymentProcessing
              ? "Đang xử lý thanh toán..."
              : needsPayment
                ? "Vui lòng xác nhận thanh toán ghế trước"
                : !selectedSeat
                  ? "Vui lòng chọn ghế"
                  : "Xác nhận Check-in"}
          </Button>
        </ScrollView>
      );
    }

    // Nếu đã có checkinResult, hiển thị kết quả hoàn thành
    return (
      <ScrollView className="flex-1 p-4">
        <View className="items-center mb-6">
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
          <Text className="text-2xl font-bold text-green-600 mt-4">
            Check-in thành công!
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Boarding pass của bạn đã sẵn sàng
          </Text>
        </View>

        {/* Boarding Pass Preview */}
        {checkinResult.boardingPassUrl ? (
          <View className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-4 mb-6">
            <Text className="font-bold text-blue-900 text-center mb-4">
              BOARDING PASS ĐIỆN TỬ
            </Text>

            {/* Hiển thị ảnh boarding pass từ backend */}
            <View className="items-center mb-4">
              <Image
                source={{ uri: checkinResult.boardingPassUrl }}
                style={{
                  width: "100%",
                  height: 300,
                  resizeMode: "contain",
                }}
                onError={() => {
                  Alert.alert(
                    "Lỗi",
                    "Không thể tải boarding pass. Vui lòng thử lại sau."
                  );
                }}
              />
            </View>

            <View className="mt-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-center text-blue-800 text-sm font-medium">
                📱 Lưu ảnh này hoặc chụp màn hình để sử dụng tại sân bay
              </Text>
            </View>
          </View>
        ) : (
          <View className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-4 mb-6">
            <Text className="font-bold text-blue-900 text-center mb-4">
              BOARDING PASS
            </Text>

            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-gray-600 text-sm">Hành khách</Text>
                <Text className="font-bold text-lg">
                  {checkinResult.passengerName}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-600 text-sm">Ghế</Text>
                <Text className="font-bold text-lg">
                  {checkinResult.seatNumber}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-gray-600 text-sm">Chuyến bay</Text>
                <Text className="font-bold">
                  {selectedSegment?.flightNumber}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-600 text-sm">Hạng</Text>
                <Text className="font-bold">{checkinResult.seatType}</Text>
              </View>
            </View>

            {selectedSegment && (
              <View className="flex-row justify-between mb-3">
                <View>
                  <Text className="text-gray-600 text-sm">Ngày bay</Text>
                  <Text className="font-bold">
                    {format(
                      new Date(selectedSegment.departureTime),
                      "dd/MM/yyyy",
                      { locale: vi }
                    )}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-600 text-sm">Tuyến</Text>
                  <Text className="font-bold">
                    {selectedSegment.departureAirport.airportCode} →{" "}
                    {selectedSegment.arrivalAirport.airportCode}
                  </Text>
                </View>
              </View>
            )}

            <View className="mt-4">
              <Text className="text-center text-gray-600 text-sm">
                Boarding Pass của bạn đã sẵn sàng
              </Text>
              <Text className="text-center text-blue-600 text-xs mt-1">
                Hãy đến cổng kiểm tra an ninh với boarding pass này
              </Text>
            </View>
          </View>
        )}

        {/* Additional Info */}
        <View className="bg-blue-50 rounded-xl p-4 mb-4">
          <Text className="font-bold text-blue-900 mb-2">
            Thông tin bổ sung
          </Text>
          <Text className="text-gray-700">
            Mã check-in:{" "}
            <Text className="font-semibold">{checkinResult.checkinId}</Text>
          </Text>
          <Text className="text-gray-700">
            Thời gian check-in:{" "}
            <Text className="font-semibold">
              {format(new Date(checkinResult.issueDate), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            </Text>
          </Text>
          <Text className="text-gray-700">
            Giá vé:{" "}
            <Text className="font-semibold">
              {checkinResult.ticketPrice.toLocaleString("vi-VN")} VNĐ
            </Text>
          </Text>
        </View>

        <Button
          mode="outlined"
          onPress={resetFlow}
          style={{ borderRadius: 12, paddingVertical: 6, marginBottom: 24 }}
          labelStyle={{ fontSize: 16, fontWeight: "bold" }}
        >
          Check-in chuyến bay khác
        </Button>
      </ScrollView>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case CheckinStep.SEARCH:
        return renderSearchStep();
      case CheckinStep.SELECT_FLIGHT:
        return renderSelectFlightStep();
      case CheckinStep.SELECT_PASSENGER:
        return renderSelectPassengerStep();
      case CheckinStep.CONFIRM_AND_COMPLETE:
        return renderConfirmAndCompleteStep();
      default:
        return renderSearchStep();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-950" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="" >
        {currentStep > CheckinStep.SEARCH && (
          <TouchableOpacity
            onPress={() => {
              if (
                currentStep === CheckinStep.SELECT_PASSENGER &&
                bookingData?.flightSegments.length === 1
              ) {
                setCurrentStep(CheckinStep.SEARCH);
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text
          className="p-4 text-center text-white font-bold uppercase"
        >
          CHECK-IN
        </Text>
      </View>

      {/* Progress Bar */}
      {currentStep > CheckinStep.SEARCH && renderProgressBar()}

      {/* Content */}
      <View
        style={{
          backgroundColor: "white",
          flex: 1,
        }}
      >
        {renderCurrentStep()}
      </View>
    </SafeAreaView>
  );
};

export default CheckIn;
