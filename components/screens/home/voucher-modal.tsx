import { getEligibleDeals } from "@/services/deal-service";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const DealSkeleton = () => {
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
        outputRange: [-300, 300],
    });

    return (
        <View className="p-4 border-b border-gray-100 relative overflow-hidden">
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
            <View className="h-5 w-3/4 bg-slate-200 rounded-md mb-2" />
            <View className="h-4 w-1/2 bg-slate-200 rounded-md mb-4" />
            <View className="flex-row justify-between items-center">
                <View className="h-10 w-32 bg-slate-200 rounded-lg" />
                <View className="h-10 w-24 bg-slate-200 rounded-full" />
            </View>
        </View>
    );
};

const VoucherModal = ({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) => {
    const {
        data: deals = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["allDeals"],
        queryFn: getEligibleDeals,
        enabled: visible, // Chỉ fetch khi modal được mở
    });
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    // Lọc các deal hợp lệ
    const filteredDeals = useMemo(() => {
        return deals.filter(
            (deal: any) =>
                deal.pointsRequired === null && deal.status === "ĐANG HOẠT ĐỘNG"
        );
    }, [deals]);
    const copyToClipboard = async (code: string) => {
        await Clipboard.setStringAsync(code);
        Alert.alert("Đã sao chép", `Mã "${code}" đã được sao chép vào bộ nhớ tạm.`);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 5000);
    };

    const renderDealItem = ({ item }: { item: any }) => {
        const isCopied = copiedCode === item.dealCode;
        return (
            <View className="p-4 border-b border-gray-100">
                <Text className="text-base font-bold text-blue-900">{item.title}</Text>
                <Text className="text-sm text-gray-600 mt-1">{item.description}</Text>
                <Text className="text-xs text-gray-500 mt-2">
                    HSD: {format(new Date(item.validTo), "dd/MM/yyyy")}
                </Text>
                <View className="flex-row justify-between items-center mt-3">
                    <View className="flex-row items-center bg-blue-50 border border-dashed border-blue-300 rounded-lg px-3 py-2">
                        <Text className="text-blue-900 font-extrabold text-lg">
                            {item.dealCode}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => copyToClipboard(item.dealCode)}
                        disabled={isCopied}
                        className={`py-2 px-4 rounded-full flex-row items-center ${isCopied ? "bg-green-600" : "bg-blue-900"
                            }`}
                    >
                        <Ionicons
                            name={isCopied ? "checkmark-done" : "copy-outline"}
                            size={16}
                            color="white"
                        />
                        <Text className="text-white font-semibold text-sm ml-1">
                            {isCopied ? "Đã sao chép" : "Sao chép"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>


        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <View>
                    <DealSkeleton />
                    <DealSkeleton />
                    <DealSkeleton />
                    <DealSkeleton />
                </View>
            );
        }

        if (isError) {
            return (
                <View className="items-center justify-center py-16">
                    <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
                    <Text className="text-gray-500 mt-4">
                        Không thể tải danh sách ưu đãi.
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={filteredDeals}
                renderItem={renderDealItem}
                keyExtractor={(item) => item.dealId.toString()}
                ListEmptyComponent={
                    <View className="items-center justify-center py-16">
                        <Ionicons name="gift-outline" size={48} color="#9ca3af" />
                        <Text className="text-gray-500 mt-4">
                            Hiện chưa có ưu đãi nào.
                        </Text>
                    </View>
                }
            />
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-white rounded-t-3xl max-h-[70%] shadow-xl">
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                        <Text className="text-xl font-bold text-blue-900">
                            Ưu đãi & Voucher
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
};

export default VoucherModal;