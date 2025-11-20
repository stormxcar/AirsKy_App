import { fetchAllBlog } from "@/services/blog-service";
import { useQuery } from "@tanstack/react-query";

export const useBlogs = () => {
  return useQuery({
    queryKey: ["blogs"],
    queryFn: fetchAllBlog,
    staleTime: 1000 * 60 * 3, // cache 3 phút
  });
};
