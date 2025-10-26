import TabIcon from "@/components/tabs/tab-icon";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { Tabs, useRouter } from "expo-router";


export default function TabLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const { showLoading } = useLoading();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1e3a8a", 
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 80,
          borderTopWidth: 0,
          elevation: 15,
          paddingTop: 10
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
