import TabIcon from "@/components/tabs/tab-icon";
import { Tabs } from "expo-router";


export default function TabLayout() {
  return (
   
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#1e3a8a", // blue-900
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
