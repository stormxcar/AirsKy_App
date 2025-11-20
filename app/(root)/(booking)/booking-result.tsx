"use client"

import { AncillaryServiceType, type BookingResponse } from "@/app/types/booking"
import { useLoading } from "@/context/loading-context"
import { getBookingDetailsById } from "@/services/booking-service"
import { checkSepayPayment } from "@/services/payment-service"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { Alert, Image, Linking, ScrollView, Share, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Helper để dịch tên loại ghế
const getSeatTypeName = (seatType: string) => {
  switch (seatType) {
    case "FRONT_ROW":
      return "Hàng đầu"
    case "EXIT_ROW":
      return "Lối thoát hiểm"
    case "EXTRA_LEGROOM":
      return "Để chân rộng"
    case "ACCESSIBLE":
      return "Ghế ưu tiên"
    case "STANDARD":
      return "Tiêu chuẩn"
    default:
      return seatType
  }
}

// Helper để lấy icon cho từng loại dịch vụ
const getServiceIcon = (
  serviceType: AncillaryServiceType | "BAGGAGE" | "SEAT",
): { name: any; library: "Ionicons" | "MaterialIcons" } => {
  switch (serviceType) {
    case "BAGGAGE":
      return { name: "briefcase-outline", library: "Ionicons" }
    case "SEAT":
      return { name: "airline-seat-recline-normal", library: "MaterialIcons" }
    case AncillaryServiceType.WIFI:
      return { name: "wifi", library: "Ionicons" }
    case AncillaryServiceType.MEAL:
      return { name: "fast-food-outline", library: "Ionicons" }
    case AncillaryServiceType.PRIORITY_BOARDING:
      return { name: "rocket-outline", library: "Ionicons" }
    default:
      return { name: "add-circle-outline", library: "Ionicons" }
  }
}

const BookingResult = () => {
  const params = useLocalSearchParams()
  const router = useRouter()
  const { showLoading } = useLoading()

  const status = params.status as
    | "success"
    | "failure"
    | "pending"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "PENDING"
  const bookingId = params.bookingId as string
  const bookingCode = params.bookingCode as string
  const [bookingDetails, setBookingDetails] = useState<BookingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialData, setHasInitialData] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Parse initialDetails từ params để tránh double-fetch (từ Notifications)
  useEffect(() => {
    const initialDetailsStr = params.initialDetails as string | undefined
    if (initialDetailsStr && !hasInitialData) {
      try {
        const parsedDetails: BookingResponse = JSON.parse(initialDetailsStr)
        setBookingDetails(parsedDetails)
        setHasInitialData(true)
        console.log('Used pre-fetched data from params')
      } catch (parseErr) {
        console.warn('Failed to parse initialDetails, fallback to fetch:', parseErr)
      }
    }
  }, [params.initialDetails, hasInitialData])

  // Fetch details nếu không có initial data
  const shouldFetchDetails = bookingId && status !== "failure" && !hasInitialData
  useEffect(() => {
    if (shouldFetchDetails) {
      showLoading(async () => {
        try {
          const details = await getBookingDetailsById(bookingId)
          setBookingDetails(details)
          // Delay nhỏ để UX mượt (tùy chọn)
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (err: any) {
          setError(err.message || "Không thể tải chi tiết đơn đặt vé.")
        }
      }, 300)
    }
  }, [shouldFetchDetails, bookingId])

  // Countdown timer effect
  useEffect(() => {
    // Tính toán thời gian hết hạn: 10 phút sau khi đặt vé
    if (bookingDetails?.bookingDate) {
      const bookingTime = new Date(bookingDetails.bookingDate).getTime()
      const PAYMENT_DURATION_MINUTES = 30
      const expiryTime = bookingTime + PAYMENT_DURATION_MINUTES * 60 * 1000

      const timer = setInterval(() => {
        const now = new Date().getTime()
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000))
        setTimeLeft(remaining)

        if (remaining === 0) {
          clearInterval(timer)
        }
      }, 1000)

      // Initial set
      const now = new Date().getTime()
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000))
      setTimeLeft(remaining)

      return () => clearInterval(timer)
    }
  }, [bookingDetails?.bookingDate])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  const handleCheckPayment = async () => {
    if (!bookingCode) {
      Alert.alert("Lỗi", "Không tìm thấy mã đặt chỗ để kiểm tra.")
      return
    }
    showLoading(async () => {
      try {
        const result = await checkSepayPayment(bookingCode)
        if (result.success) {
          Alert.alert("Thanh toán thành công!", "Đơn hàng của bạn đã được xác nhận.")
          // Điều hướng lại chính trang này với status mới để refresh toàn bộ UI
          router.replace({
            pathname: "/(root)/(booking)/booking-result",
            params: { ...params, status: "success" },
          })
        } else {
          // Xử lý riêng cho từng phương thức thanh toán khi thất bại
          if (bookingDetails?.payment?.paymentMethod === "PAYPAL") {
            Alert.alert(
              "Chưa hoàn tất",
              "Thanh toán qua PayPal của bạn chưa được hoàn tất.",
              [
                { text: "Xác nhận", style: "cancel" },
                {
                  text: "Tiếp tục đến PayPal",
                  onPress: () => {
                    if (bookingDetails.payment?.checkoutUrl) {
                      Linking.openURL(bookingDetails.payment.checkoutUrl)
                    }
                  },
                },
              ],
            )
          } else {
            Alert.alert("Chưa thanh toán", "Giao dịch của bạn chưa được hoàn tất. Vui lòng thử lại sau ít phút.")
          }
        }
      } catch (error: any) {
        Alert.alert("Lỗi", error.message || "Không thể kiểm tra trạng thái thanh toán.")
      }
    })
  }
  const handleShare = async () => {
    if (!bookingDetails) {
      Alert.alert("Chưa có thông tin", "Không thể chia sẻ vì chưa tải được chi tiết đặt vé.")
      return
    }

    try {
      const departureSegment = bookingDetails.flightSegments.find((s) => s.segmentOrder === 1)
      const returnSegment = bookingDetails.flightSegments.find((s) => s.segmentOrder === 2)

      let message = `🎫 *XÁC NHẬN ĐẶT VÉ THÀNH CÔNG - AIRSKY*\n\n`
      message += `*Mã đặt chỗ:* ${bookingDetails.bookingCode}\n`
      message += `*Trạng thái:* ${bookingDetails.status === "CONFIRMED" ? "✅ Đã xác nhận" : bookingDetails.status}\n\n`

      if (departureSegment) {
        message += ` *CHUYẾN ĐI*\n`
        message += `• ${departureSegment.departureAirport.airportName} (${departureSegment.departureAirport.airportCode}) → ${departureSegment.arrivalAirport.airportName} (${departureSegment.arrivalAirport.airportCode})\n`
        message += `🗓️ ${new Date(departureSegment.departureTime).toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}\n`
        message += `⏰ ${new Date(departureSegment.departureTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })} → ${new Date(departureSegment.arrivalTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}\n\n`
      }

      if (returnSegment) {
        message += `🛬 *CHUYẾN VỀ*\n`
        message += `• ${returnSegment.departureAirport.airportName} (${returnSegment.departureAirport.airportCode}) → ${returnSegment.arrivalAirport.airportName} (${returnSegment.arrivalAirport.airportCode})\n`
        message += `🗓️ ${new Date(returnSegment.departureTime).toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}\n`
        message += `⏰ ${new Date(returnSegment.departureTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })} → ${new Date(returnSegment.arrivalTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}\n\n`
      }

      message += `👤 *Hành khách:* ${bookingDetails.passengers.map((p) => `${p.lastName} ${p.firstName}`).join(", ")}\n`
      message += `💺 *Dịch vụ:* ${bookingDetails.ancillaryServices?.length || 0} dịch vụ bổ sung\n`
      message += `💰 *Tổng tiền:* ${bookingDetails.totalAmount.toLocaleString("vi-VN")} ₫\n\n`
      message += `Cảm ơn bạn đã lựa chọn ✈️ *AirsKy Airlines*!\n`
      message += `Chúc bạn có chuyến bay an toàn và thoải mái 🌤️`

      await Share.share({
        message,
        title: `Thông tin đặt vé AirsKy: ${bookingDetails.bookingCode}`,
      })
    } catch (error: any) {
      Alert.alert("Lỗi", error.message)
    }
  }

  // Nhóm các dịch vụ theo loại để hiển thị (tối ưu deps)
  const groupedServices = useMemo(() => {
    if (!bookingDetails) return {}

    const servicesByPassenger: {
      [passengerId: number]: {
        [groupName: string]: { name: string; icon: { name: any; library: "Ionicons" | "MaterialIcons" } }[]
      }
    } = {}

    bookingDetails.passengers.forEach((p) => {
      servicesByPassenger[p.passengerId] = {}

      // Nhóm ghế ngồi
      if (p.seatAssignments && p.seatAssignments.length > 0) {
        servicesByPassenger[p.passengerId]["Ghế đã chọn"] = p.seatAssignments
          .sort((a, b) => a.segmentOrder - b.segmentOrder)
          .map((seat) => ({
            name: `${seat.segmentOrder === 1 ? "Chuyến đi" : "Chuyến về"}: ${seat.seatNumber} (${getSeatTypeName(seat.seatType)})`,
            icon: getServiceIcon("SEAT"),
          }))
      }

      // Nhóm hành lý
      if (bookingDetails.baggage && bookingDetails.baggage.length > 0) {
        const baggageForPassenger = bookingDetails.baggage.filter(
          (bag) =>
            bag.passengerId === p.passengerId ||
            (bag.passengerId === null && p.passengerId === bookingDetails.passengers[0].passengerId),
        )

        if (baggageForPassenger.length > 0) {
          servicesByPassenger[p.passengerId]["Hành lý ký gửi"] = baggageForPassenger.map((bag) => ({
            name: `Gói ${bag.purchasedPackage.replace("KG_", "")}kg`,
            icon: getServiceIcon("BAGGAGE"),
          }))
        }
      }

      // Nhóm các dịch vụ khác
      const otherServices = bookingDetails.ancillaryServices?.filter((s) => s.passengerId === p.passengerId) || []
      if (otherServices.length > 0) {
        servicesByPassenger[p.passengerId]["Dịch vụ cộng thêm"] = otherServices.map((s) => ({
          name: s.serviceName,
          icon: getServiceIcon(s.serviceType as AncillaryServiceType),
        }))
      }
    })
    return servicesByPassenger
  }, [bookingDetails])

  // Helper để lấy thông tin hiển thị dựa trên trạng thái
  const getStatusInfo = () => {
    switch (status) {
      case "success":
      case "CONFIRMED":
        return {
          icon: "checkmark-circle",
          color: "#16a34a",
          bgColor: "bg-green-100",
          title: "Đặt vé thành công!",
          message: "Cảm ơn bạn đã sử dụng dịch vụ của AirsKy.",
        }
      case "failure":
        return {
          icon: "close-circle",
          color: "#dc2626",
          bgColor: "bg-red-100",
          title: "Đặt vé thất bại",
          message: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        }
      case "pending":
      case "PENDING":
        return {
          icon: "hourglass",
          color: "#f59e0b",
          bgColor: "bg-yellow-100",
          title: "Chờ thanh toán",
          message: "Vui lòng hoàn tất thanh toán và quay lại ứng dụng.",
        }
      case "COMPLETED":
        return {
          icon: "checkmark-done-circle",
          color: "#1e3a8a",
          bgColor: "bg-blue-100",
          title: "Chuyến đi đã hoàn thành",
          message: "Cảm ơn bạn đã đồng hành cùng AirsKy.",
        }
      case "CANCELLED":
        return {
          icon: "remove-circle",
          color: "#6b7280",
          bgColor: "bg-gray-200",
          title: "Vé đã bị hủy",
          message: "Rất tiếc, vé này đã được hủy.",
        }
      default:
        return {
          icon: "help-circle",
          color: "#6b7280",
          bgColor: "bg-gray-200",
          title: "Không rõ trạng thái",
          message: "Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
        }
    }
  }

  const statusInfo = getStatusInfo()
  const isSuccessState = status === "success" || status === "CONFIRMED"
  const isViewableState = isSuccessState || status === "COMPLETED" || status === "CANCELLED"

  // Render cơ bản nếu có bookingId (status + booking code)
  const hasBasicInfo = !!bookingId
  // Render full details nếu có bookingDetails
  const hasFullDetails = !!bookingDetails
  // Điều kiện để render nội dung: chỉ khi có lỗi hoặc đã có đủ thông tin chi tiết
  const canRenderContent = !!error || hasFullDetails
  if (!canRenderContent && status !== "failure") {
    return null // Không render gì cả trong khi đang tải và chưa có lỗi
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <ScrollView className="flex-1">
        <View className="p-4 items-center">
          {/* Trạng thái đặt vé (luôn hiển thị nếu có status) */}
          {hasBasicInfo && (
            <View className="items-center my-6">
              <View className={`w-24 h-24 rounded-full items-center justify-center ${statusInfo.bgColor}`}>
                <Ionicons name={statusInfo.icon as any} size={80} color={statusInfo.color} />
              </View>
              <Text className="text-2xl font-bold mt-4" style={{ color: statusInfo.color }}>
                {statusInfo.title}
              </Text>
              <Text className="text-gray-600 mt-1 text-center">{statusInfo.message}</Text>
            </View>
          )}

          {/* Thông tin đặt vé cơ bản (mã code) */}
          {hasBasicInfo && (
            <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
              <Text className="text-lg font-bold text-blue-900 mb-3 border-b border-gray-200 pb-2">
                Thông tin đặt vé
              </Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base text-gray-600">Mã đặt chỗ:</Text>
                <Text className="text-base font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
                  {bookingDetails!==null?bookingDetails?.bookingCode : "..."}
                </Text>
              </View>

              {isSuccessState && !hasFullDetails && (
                <Text className="text-gray-600 mt-2 text-center">
                  Thông tin chi tiết về chuyến bay đã được gửi đến email của bạn. Bạn cũng có thể xem lại trong mục
                  &apos;Chuyến đi của tôi&apos;.
                </Text>
              )}
              {/* Nút kiểm tra thanh toán khi đang pending */}
              {(status === "pending" || status === "PENDING") &&
                bookingDetails?.payment && (
                  <View className="mt-4">
                    {/* Hiển thị QR cho Bank Transfer */}
                    {bookingDetails.payment.paymentMethod === "BANK_TRANSFER" && bookingDetails.payment.checkoutUrl && (
                      <View className="items-center mb-4">
                        <Text className="text-center text-gray-600 mb-4">
                          Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử hỗ trợ VietQR để hoàn tất.
                        </Text>
                        <Image
                          source={{ uri: bookingDetails.payment.checkoutUrl }}
                          className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"
                        />
                      </View>
                    )}

                    {/* Hiển thị thời gian còn lại */}
                    {timeLeft !== null && timeLeft > 0 && (
                      <View className="items-center my-4">
                        <Text className="text-gray-500">Thời gian thanh toán còn lại:</Text>
                        <Text className="text-2xl font-bold text-red-600 mt-1">{formatTime(timeLeft)}</Text>
                      </View>
                    )}
                    {/* {timeLeft === 0 && (
                      <Text className="text-center font-bold text-red-600 my-4">Đã hết hạn thanh toán</Text>
                    )} */}

                    {/* Nút kiểm tra thanh toán */}
                    <TouchableOpacity onPress={handleCheckPayment} className="bg-blue-900 py-3 rounded-full">
                      <Text className="text-white text-center font-bold">Kiểm tra</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          )}

          {/* Chi tiết đầy đủ nếu có bookingDetails */}
          {hasFullDetails && isViewableState && (
            <View className="w-full mt-4 space-y-4">
              {/* Flight Segments */}
              {bookingDetails.flightSegments.map((segment, index) => (
                <View key={index} className="bg-white p-4 rounded-xl w-full border border-gray-200">
                  <Text className="text-lg font-bold text-blue-900 mb-3">
                    {segment.segmentOrder === 1 ? "Chuyến đi" : "Chuyến về"}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <View className="items-start">
                      <Text className="text-xl font-bold text-blue-900">
                        {new Date(segment.departureTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text className="text-gray-500 font-semibold">{segment.departureAirport.airportCode}</Text>
                    </View>
                    <View className="items-center">
                      <Ionicons name="airplane" size={24} color="#1e3a8a" />
                      <Text className="text-xs text-gray-500">{segment.duration}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-blue-900">
                        {new Date(segment.arrivalTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text className="text-gray-500 font-semibold">{segment.arrivalAirport.airportCode}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-gray-500 text-center mt-2">
                    {new Date(segment.departureTime).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              ))}

              {/* Passengers & Services */}
              <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
                <Text className="text-lg font-bold text-blue-900 mb-2">Hành khách & Dịch vụ</Text>
                {bookingDetails.passengers.map((p, index) => (
                  <View key={index} className="py-3 border-b border-gray-100 last:border-b-0">
                    <Text className="text-base font-semibold text-gray-800">
                      {p.lastName} {p.firstName} {p.type}
                    </Text>
                    {/* Hiển thị dịch vụ đã nhóm */}
                    {Object.entries(groupedServices[p.passengerId] || {}).map(([groupName, services], gIdx) => (
                      <View key={gIdx} className="mt-2">
                        <Text className="text-sm font-semibold text-gray-700">{groupName}:</Text>
                        {services.map((service, sIdx) => (
                          <View key={sIdx} className="flex-row items-center ml-2 mt-1">
                            {service.icon.library === "Ionicons" ? (
                              <Ionicons name={service.icon.name} size={14} color="#4b5563" />
                            ) : (
                              <MaterialIcons name={service.icon.name} size={14} color="#4b5563" />
                            )}
                            <Text className="text-sm text-gray-600 ml-1">{service.name}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {/* Payment Summary */}
              <View className="bg-white p-4 rounded-xl w-full border border-gray-200">
                <Text className="text-lg font-bold text-blue-900 mb-2">Thanh toán</Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-base text-gray-600">Tổng cộng:</Text>
                  <Text className="text-xl font-bold text-red-600">
                    {bookingDetails.totalAmount.toLocaleString("vi-VN")} ₫
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <Text className="text-base text-gray-600">Phương thức:</Text>
                  <Text className="text-base font-semibold text-gray-800">
                    {bookingDetails.payment?.paymentMethod || "Không xác định"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}
        </View>
      </ScrollView>

      {/* Bottom bar chỉ khi có full details */}
      {hasFullDetails && (
        <View className="p-4 bg-white border-t border-gray-200 flex-row items-center gap-x-3">
          {isViewableState && (
            <TouchableOpacity onPress={handleShare} className="bg-gray-200 p-3 rounded-full shadow-md">
              <Ionicons name="share-social-outline" size={24} color="#1e3a8a" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.replace("/(root)/(tabs)/my-trips")}
            className="bg-blue-900 py-3 rounded-full shadow-md flex-1"
          >
            <Text className="text-white text-center font-bold text-lg">Chuyến bay của tôi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("/(root)/(tabs)/home")}
            className="bg-gray-200 p-3 rounded-full shadow-md"
          >
            <Ionicons name="home-outline" size={24} color="#1e3a8a" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

export default BookingResult