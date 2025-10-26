import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// Tạo một phiên bản "động" của FontAwesome để có thể animate màu sắc
type TabIconProps = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  // color prop không còn cần thiết khi chúng ta tự quản lý màu động
  name: string;
  focused: boolean;
};

const TabIcon = ({ icon, name, focused }: TabIconProps) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;
  const colorAnimValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    // Tạo hiệu ứng chuyển động song song, nhẹ và tự nhiên hơn
    Animated.parallel([
      Animated.timing(translateYValue, {
        toValue: focused ? -6 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(colorAnimValue, {
        toValue: focused ? 1 : 0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.spring(scaleValue, {
        toValue: focused ? 1.15 : 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const animatedColor = colorAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#CDCDE0", "#172554"],
  });

  const animatedBookFlightBgColor = colorAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#172554"], // White -> blue-950
  });

  const animatedBookFlightIconColor = colorAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#172554", "#FFFFFF"], // blue-950 -> White
  });

  // Nút đặc biệt "Book Flight"
  if (name === "Book Flight") {
    return (
      <Animated.View style={[styles.bookFlightContainer, focused && styles.bookFlightFocused, { transform: [{ scale: scaleValue }] }]} className="flex-1 items-center">
        {/* Gộp 2 View thành 1 và áp dụng tất cả animation */}
        <Animated.View
          style={{
            backgroundColor: animatedBookFlightBgColor,
          }}
          className="items-center justify-center rounded-full w-16 h-16 -mt-6 border-4 border-white shadow-lg"
        >
            <Animated.Text style={{ color: animatedBookFlightIconColor }}>
              <FontAwesome name={icon} size={28} />
            </Animated.Text>
          </Animated.View>
        </Animated.View>
    );
  }

  // Các tab thường
  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }, { translateY: translateYValue }],
        },
      ]}
      className="items-center justify-center gap-1 flex-1 pt-2"
    >
      <Animated.Text style={{ color: animatedColor }}>
        <FontAwesome name={icon} size={24} />
      </Animated.Text>
      <Animated.Text
        className={`${focused ? "font-semibold " : "font-normal"} text-[8px] w-full text-center`}
        style={{ color: animatedColor }}
        numberOfLines={1}
      >
        {name}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bookFlightContainer: {
    // Đảm bảo container có không gian để không bị co lại thành 0
    // flex: 1, // Thêm flex: 1 thông qua className
  },
  bookFlightFocused: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
});

export default TabIcon;