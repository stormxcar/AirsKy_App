import { Category } from "@/app/types/types";
import api from "./api"; // Giả sử bạn có một file api.ts để cấu hình axios instance

/**
 * @returns Promise<Categories[]> - Danh sách các sân bay đã được map.
 */
export const fetchAllCategories = async (): Promise<Category[]> => {
    try {

        const response = await api.get('/categories');
        return response.data.data.content.map((category: any) => ({
            categoryId: category.categoryId,
            name:       category.name,
            slug:       category.slug,
            active:     category.active
        }));
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Không thể tải danh sách bài viết.");
    }
};