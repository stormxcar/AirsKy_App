import { Blog } from "@/app/types/types";
import api from "./api"; // Giả sử bạn có một file api.ts để cấu hình axios instance

/**
 * Lấy danh sách tất cả các sân bay từ API.
 * @returns Promise<Blog[]> - Danh sách các sân bay đã được map.
 */
export const fetchAllBlog = async (): Promise<Blog[]> => {
  try {
    const response = await api.get('/blogs', {
      params: { page: 0, size: 1000 }
    });

    return response.data.data.content.map((blog: any) => ({
      id: blog.blogId,
      title: blog.title,
      content: blog.content,
      slug: blog.slug,
      excerpt: blog.excerpt,
      featuredImage: blog.featuredImage,
      publishedDate: blog.publishedDate,
      isPublished: blog.isPublished,
      viewCount: blog.viewCount,
      likeCount: blog.likeCount,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      categories: blog.categories.map((c: any) => ({
        categoryId: c.categoryId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        blogCount: c.blogCount,
        active: c.active
      }))
    }));
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Không thể tải danh sách bài viết.");
  }
};

export const fetch5Blog = async (): Promise<Blog[]> => {
  const response = await api.get('/blogs', {
    params: { page: 0, size: 5 }
  });

  return response.data.data.content.map((blog: any) => ({
    id: blog.blogId,
    title: blog.title,
    content: blog.content,
    slug: blog.slug,
    excerpt: blog.excerpt,
    featuredImage: blog.featuredImage,
    publishedDate: blog.publishedDate,
    isPublished: blog.isPublished,
    viewCount: blog.viewCount,
    likeCount: blog.likeCount,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    authorName: blog.authorName,
    authorEmail: blog.authorEmail,
    categories: blog.categories.map((c: any) => ({
      categoryId: c.categoryId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      blogCount: c.blogCount,
      active: c.active
    }))
  }));
};

export const fetchBlogById = async (id: number): Promise<Blog> => {
  try {
    const response = await api.get(`/blogs/${id}`);
    const blog = response.data.data;

    return {
      id: blog.blogId,
      title: blog.title,
      content: blog.content,
      slug: blog.slug,
      excerpt: blog.excerpt,
      featuredImage: blog.featuredImage,
      publishedDate: blog.publishedDate,
      isPublished: blog.isPublished,
      viewCount: blog.viewCount,
      likeCount: blog.likeCount,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      categories: blog.categories.map((c: any) => ({
        categoryId: c.categoryId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        blogCount: c.blogCount,
        active: c.active
      }))
    };
  } catch (error) {
    throw new Error("Không thể tải bài viết.");
  }
};
