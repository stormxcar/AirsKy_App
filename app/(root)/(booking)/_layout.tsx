import { Stack } from "expo-router";
import React from "react";

const BookingLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // Ẩn header mặc định vì chúng ta dùng header tùy chỉnh
                contentStyle: { backgroundColor: "#1e3a8a" }, // Đặt màu nền chung cho tất cả các màn hình trong Stack này
            }}
        />
    );
};

export default BookingLayout;