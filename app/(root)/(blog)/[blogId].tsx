import { fetchBlogById } from "@/services/blog-service";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import RenderHTML from "react-native-render-html";
const SCREEN_W = Dimensions.get("window").width;
const BlogDetailSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_W, SCREEN_W],
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-3 border-b border-slate-200 bg-white z-10">
        <View className="p-1 w-10 h-6" />
        <View className="flex-1 h-6 bg-slate-200 rounded-md" />
        <View className="w-10" />
      </View>

      {/* Shimmer Overlay */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "200%",
          backgroundColor: "rgba(255,255,255,0.3)",
          transform: [{ translateX }],
          zIndex: 99,
        }}
      />

      {/* Content */}
      <View className="h-56 bg-slate-200" />
      <View className="p-4 space-y-4">
        <View className="h-8 w-3/4 bg-slate-200 rounded-md" />
        <View className="h-4 w-1/2 bg-slate-200 rounded-md" />
        <View className="h-24 w-full bg-slate-200 rounded-md mt-4" />
        <View className="h-48 w-full bg-slate-200 rounded-md" />
      </View>
    </SafeAreaView>
  );
};
const DetailBlog = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ blogId?: string; blog?: string }>();
  const initialBlogData = params.blog ? JSON.parse(params.blog) : undefined;
  const blogId = initialBlogData?.id || params.blogId;

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => fetchBlogById(Number(blogId)),
    enabled: !!blogId,
    initialData: initialBlogData,
  });

  if (isLoading && !initialBlogData) return <BlogDetailSkeleton />; if (isError || !blog) return <SafeAreaView className="flex-1 justify-center items-center bg-white"><Text>Không thể tải bài viết</Text></SafeAreaView>;
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View>
        {/* HEADER */}
        <View className="flex-row items-center p-3 border-b border-slate-200 bg-white z-10">
          <TouchableOpacity onPress={() => router.back()} className="p-1 w-10">
            <Ionicons name="chevron-back" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-bold text-lg text-blue-900">Bài viết</Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* FEATURED IMAGE */}
          {blog.featuredImage && (
            <Image
              source={{ uri: blog.featuredImage }}
              style={{ width: SCREEN_W, height: 220 }}
              resizeMode="cover"
            />
          )}

          <View className="px-4 mt-4">
            {/* CATEGORIES */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {blog.categories.map((c) => (
                <View key={c.categoryId} className="bg-blue-100 border border-blue-300 rounded-full px-3 py-1 mr-2">
                  <Text className="text-blue-800 text-xs font-semibold">{c.name}</Text>
                </View>
              ))}
            </ScrollView>

            {/* TITLE */}
            <Text className="text-2xl font-bold text-slate-900 mb-2">{blog.title}</Text>

            {/* AUTHOR & DATE */}
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-circle-outline" size={20} color="#475569" />
              <Text className="text-slate-600 ml-2 text-sm">{blog.authorName}</Text>

              <Ionicons name="calendar-outline" size={16} color="#475569" className="ml-4" />
              <Text className="text-slate-500 ml-1 text-sm">
                {blog.publishedDate ? new Date(blog.publishedDate).toLocaleDateString("vi-VN") : ""}
              </Text>
            </View>

            {/* STATS: views + likes */}
            <View className="flex-row items-center mb-4">
              <Ionicons name="eye-outline" size={16} color="#475569" />
              <Text className="text-slate-500 ml-1 text-sm">{blog.viewCount}</Text>

              <Ionicons name="heart-outline" size={16} color="#ef4444" className="ml-4" />
              <Text className="text-slate-500 ml-1 text-sm">{blog.likeCount}</Text>
            </View>

            {/* HTML CONTENT */}
            <RenderHTML
              contentWidth={SCREEN_W - 32}
              source={{ html: blog.content }}
              tagsStyles={{
                h2: { fontSize: 24, fontWeight: "bold", marginVertical: 12, color: "#1e3a8a" },
                h4: { fontSize: 20, fontWeight: "bold", marginVertical: 10, color: "#1e40af" },
                p: { fontSize: 17, marginVertical: 8, lineHeight: 28, color: "#334155" }, strong: { fontWeight: "bold" },
                img: { width: SCREEN_W - 32, height: 200, resizeMode: "cover", marginVertical: 8 },
                br: { height: 8 },
                a: { color: "#2563eb", textDecorationLine: "none" },
              }}
              enableExperimentalMarginCollapsing={true}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default DetailBlog;
