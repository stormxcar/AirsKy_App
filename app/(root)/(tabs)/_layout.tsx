import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

type TabIconProps = {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  name: string;
  focused: boolean;
};

const TabIcon = ({ icon, color, name, focused }: TabIconProps) => {
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
    outputRange: ["#CDCDE0", color],
  });

  // Nút đặc biệt "Book Flight"
  if (name === "Book Flight") {
    return (
      <Animated.View style={[styles.bookFlightContainer, focused && styles.bookFlightFocused]}>
        <Animated.View
          style={{
            transform: [{ scale: scaleValue }],
          }}
          className={`${focused ? "bg-blue-500" : "bg-white"} items-center justify-center rounded-full w-20 h-20 -mt-8 border-4 border-white shadow-sm`}
        >
          <FontAwesome name={icon} size={30} color={focused ? "white" : "#3b82f6"} />
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
      <FontAwesome name={icon} size={24} color={focused ? color : "#CDCDE0"} />
      <Animated.Text
        className={`${focused ? "font-semibold" : "font-normal"} text-[8px] w-full text-center`}
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
    width: 80,
    height: 80,
  },
  bookFlightFocused: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 80,
          borderTopWidth: 0,
          elevation: 15,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="home" color={color} name="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-in",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="ticket" color={color} name="Check-in" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="book-flight"
        options={{
          title: "Book Flight",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="plane" color={color} name="Book Flight" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-trips"
        options={{
          title: "My Trips",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="briefcase" color={color} name="My Trips" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="user" color={color} name="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
