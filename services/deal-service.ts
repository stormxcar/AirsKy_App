import { DealResponse } from "@/app/types/deal";
import api from "./api";

/**
 * Lấy danh sách tất cả các mã giảm giá từ API.
 */
export const getEligibleDeals = async (): Promise<DealResponse[]> => {
    const response = await api.get('/deals');
    // API trả về dữ liệu có phân trang, chúng ta lấy mảng 'content'
    return response.data.data.content;
};