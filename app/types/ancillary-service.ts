import { AncillaryServiceType } from "./booking";

/**
 * DTO phản hồi từ backend cho thông tin một dịch vụ bổ trợ (Ancillary Service).
 * Cấu trúc này tương ứng với AncillaryServiceResponse.java từ backend.
 */
export interface AncillaryServiceResponse {
  /**
   * ID của dịch vụ.
   */
  serviceId: number;
  /**
   * Tên dịch vụ.
   */
  serviceName: string;
  /**
   * Loại dịch vụ (enum).
   */
  serviceType: AncillaryServiceType;
  /**
   * Tên hiển thị của loại dịch vụ (tiếng Việt).
   */
  serviceTypeDisplayName: string;
  /**
   * Mô tả chi tiết về dịch vụ.
   */
  description: string;
  /**
   * Giá của dịch vụ.
   */
  price: number;
  isActive: boolean;
  thumbnail?: string;
  maxQuantity: number;
  isPerPassenger: boolean;
  isPerSegment: boolean; // true = tính phí theo từng chặng bay, false = tính phí một lần cho cả hành trình
  createdAt: string; // LocalDateTime in Java
  updatedAt: string; // LocalDateTime in Java
}