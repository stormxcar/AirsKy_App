/**
 * Định nghĩa cấu trúc phản hồi API chung từ backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  path: string;
  timestamp: string;
  error?: string;
  statusCode?: number;
}

/**
 * Định nghĩa cấu trúc phản hồi phân trang từ backend.
 */
export interface PageResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}