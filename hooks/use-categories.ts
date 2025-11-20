import { fetchAllCategories } from "@/services/categories-service";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchAllCategories,
    staleTime: 1000 * 60 * 5,
  });
};
