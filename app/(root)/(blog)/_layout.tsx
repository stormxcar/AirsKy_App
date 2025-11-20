import { Stack } from "expo-router";
import React from "react";

const BlogLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: "",
        contentStyle: { backgroundColor: "#172554" }, // bg-blue-50
      }}
    >
      <Stack.Screen name="all-blog" options={{ headerShown: false }} />
      <Stack.Screen name="[blogId]" options={{ headerShown: false }}/>
    </Stack>
  );
};

export default BlogLayout;