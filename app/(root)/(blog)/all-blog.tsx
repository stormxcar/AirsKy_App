import { Category } from "@/app/types/types";
import { useLoading } from "@/context/loading-context";
import { useBlogs } from "@/hooks/use-blogs";
import { useCategories } from "@/hooks/use-categories";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_W = Dimensions.get("window").width;


// const SkeletonCard = () => {
//     const shimmer = useRef(new Animated.Value(0)).current;

//     useEffect(() => {
//         Animated.loop(
//             Animated.timing(shimmer, {
//                 toValue: 1,
//                 duration: 1000,
//                 useNativeDriver: true,
//             })
//         ).start();
//     }, []);

//     const translateX = shimmer.interpolate({
//         inputRange: [0, 1],
//         outputRange: [-SCREEN_W, SCREEN_W],
//     });

//     return (
//         <View className="h-[260px] rounded-xl bg-white mb-4 overflow-hidden border border-slate-200 relative">
//             <View className="h-[140px] w-full bg-slate-200" />

//             <View className="p-3">
//                 <View className="h-3.5 w-1/3 bg-slate-200 mt-3 rounded-md" />
//                 <View className="h-3.5 w-4/5 bg-slate-200 mt-2 rounded-md" />

//                 <View className="flex-row items-center mt-3">
//                     <View className="w-7 h-7 rounded-full bg-slate-200" />
//                     <View className="h-3 w-1/5 bg-slate-200 ml-2 rounded-md" />
//                 </View>
//             </View>

//             <Animated.View
//                 style={{
//                     position: "absolute",
//                     left: -SCREEN_W,
//                     top: 0,
//                     bottom: 0,
//                     width: SCREEN_W * 1.5,
//                     backgroundColor: "rgba(255,255,255,0.35)",
//                     transform: [{ translateX }],
//                 }}
//             />
//         </View>
//     );
// };

const CategoryChip = ({
    category,
    selected,
    onPress,
}: {
    category: Category;
    selected: boolean;
    onPress: () => void;
}) => {
    const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: selected ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [selected]);

    const bg = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#ffffff", "#1e3a8a"],
    });

    const border = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#d1d5db", "#1e3a8a"],
    });

    const text = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#374151", "#ffffff"],
    });

    const scale = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <Animated.View style={{ transform: [{ scale }], marginRight: 12 }}>
            <Pressable onPress={onPress}>
                <Animated.View
                    style={{ backgroundColor: bg, borderColor: border }}
                    className="border rounded-full py-2 px-4"
                >
                    <Animated.Text style={{ color: text }} className="font-semibold">
                        {category.name}
                    </Animated.Text>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};


const AllBlog = () => {
    const router = useRouter();
    const { hideLoading, showLoading } = useLoading();
    // React Query
    const {
        data: blogs = [],
        isLoading: loadingBlogs,
        isError: blogError,
    } = useBlogs();

    const {
        data: categories = [],
        isLoading: loadingCategories,
        isError: catError,
    } = useCategories();
    const isLoadingData = loadingBlogs || loadingCategories;
    // Sử dụng useLayoutEffect để hiển thị loading overlay ngay lập tức
    useLayoutEffect(() => {
        if (isLoadingData) {
            showLoading();
        } else {
            hideLoading();
        }
    }, [isLoadingData]);
    // Local state
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const debounceTimer = useRef<number | null>(null);

    // Debounce search
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        // @ts-ignore
        debounceTimer.current = setTimeout(() => {
            setDebouncedQuery(query.toLowerCase());
        }, 300);

        return () => debounceTimer.current && clearTimeout(debounceTimer.current);
    }, [query]);

    // Filter data
    const filteredBlogs = blogs.filter((b) => {
        const matchCategory =
            !selectedCategory ||
            b.categories.some((c) => c.categoryId === selectedCategory);

        const matchQuery =
            debouncedQuery === "" ||
            b.title.toLowerCase().includes(debouncedQuery) ||
            (b.excerpt ?? "").toLowerCase().includes(debouncedQuery);

        return matchCategory && matchQuery;
    });

    // Error display
    useEffect(() => {
        if (blogError || catError) {
            Alert.alert("Lỗi", "Không thể tải dữ liệu");
        }
    }, [blogError, catError]);


    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="flex-row items-center p-3 bg-white border-b border-slate-200">
                <TouchableOpacity onPress={() => router.back()} className="p-1 w-10">
                    <Ionicons name="chevron-back" size={24} color="#1e3a8a" />
                </TouchableOpacity>

                <Text className="flex-1 text-center font-bold text-lg text-blue-900">
                    Theo dõi bài viết
                </Text>
                <View className="w-10" />
            </View>

            {/* Categories & Search */}
            <View className="bg-white pt-2 pb-3 border-b border-slate-200">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}
                >
                    <Pressable onPress={() => setSelectedCategory(null)}>
                        <View
                            className={`border rounded-full py-2 px-4 mr-3 ${selectedCategory === null
                                ? "bg-blue-900 border-blue-900"
                                : "bg-white border-slate-300"
                                }`}
                        >
                            <Text
                                className={`font-semibold ${selectedCategory === null ? "text-white" : "text-slate-700"
                                    }`}
                            >
                                Tất cả
                            </Text>
                        </View>
                    </Pressable>

                    {/* Category chips */}
                    {categories.map((c) => (
                        <CategoryChip
                            key={c.categoryId}
                            category={c}
                            selected={selectedCategory === c.categoryId}
                            onPress={() => setSelectedCategory(c.categoryId)}
                        />
                    ))}
                </ScrollView>

                {/* Search */}
                <View className="mx-4 mt-3 rounded-xl px-3 py-2 flex-row items-center">
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholderTextColor="#94a3b8"
                        mode="outlined"
                        label="Tìm bài viết..."
                        style={{ backgroundColor: 'transparent', fontSize: 14, flex: 1 }}
                    />

                    {query.length > 0 && (
                        <Pressable onPress={() => setQuery("")} className="p-2 mt-2">
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredBlogs}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: `/(root)/(blog)/${item.id}`, // Vẫn giữ pathname để URL đẹp
                                params: { blog: JSON.stringify(item) }, // Truyền cả object blog
                            })
                        }
                        className="bg-white rounded-xl mb-4 border border-slate-200 overflow-hidden shadow-sm"
                    >
                        <ImageBackground
                            source={{ uri: item.featuredImage }}
                            className="h-44 w-full"
                            resizeMode="cover"
                        />

                        <View className="p-4">
                            <Text className="text-xs text-blue-600 font-bold mb-1">
                                {item.categories?.[0]?.name ?? "Không phân loại"}
                            </Text>

                            <Text className="text-lg font-extrabold text-slate-900 mb-1" numberOfLines={2}>
                                {item.title}
                            </Text>

                            <Text className="text-sm text-slate-500 mb-2" numberOfLines={2}>
                                {item.excerpt}
                            </Text>

                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Ionicons name="eye-outline" size={14} color="#475569" />
                                    <Text className="text-xs text-slate-600 ml-1">{item.viewCount ?? 0}</Text>

                                    <View className="flex-row items-center ml-4">
                                        <Ionicons name="heart-outline" size={14} color="#ef4444" />
                                        <Text className="text-xs text-slate-600 ml-1">{item.likeCount ?? 0}</Text>
                                    </View>
                                </View>

                                <Text className="text-xs text-slate-400">
                                    {item.publishedDate
                                        ? new Date(item.publishedDate).toLocaleDateString("vi-VN")
                                        : ""}
                                </Text>

                            </View>

                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
                ListEmptyComponent={
                    // Chỉ hiển thị khi không loading và không có dữ liệu
                    !isLoadingData && (
                        <View className="mt-16 items-center">
                            <Ionicons name="newspaper-outline" size={64} color="#9ca3af" />
                            <Text className="mt-4 text-slate-400 text-base">Không có bài viết nào.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
};

export default AllBlog;

