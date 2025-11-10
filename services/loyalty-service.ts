import api from "./api"; 

/**
 * Gọi API để tính toán số tiền giảm giá từ số điểm.
 * @param points - Số điểm muốn đổi.
 * @returns Số tiền được giảm giá.
 */
export const calculateDiscountFromPoints = async (points: number): Promise<number> => {
    try {
        // Sửa lỗi: Truyền `points` như một query parameter cho phương thức GET
        const response = await api.get('/points-redemption/calculate-discount', {
            params: { points }
        });
        
        return response.data.data;
    } catch (error) {
        console.error("Không thể đổi điểm. Vui lòng thử lại", error);
        throw new Error("Không thể đổi điểm. Vui lòng thử lại");
    }
};