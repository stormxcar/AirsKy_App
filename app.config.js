import 'dotenv/config';

export default {
  expo: {

    name: "AirsKy_App",
    slug: "AirsKy_App",
    version: "1.0.0",
    orientation: "portrait",
    // "icon": "./assets/images/icon.png",
    scheme: "airskyapp",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: "com.nguyentruongan0610.airskyapp",
      supportsTablet: true
    },
    android: {
      package: "com.nguyentruongan0610.airskyapp",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      usesCleartextTraffic: true, // Giữ lại dòng này để gọi API http trên Android
    },
    web: {
      bundler: "metro",
      output: "static",
      // "favicon": "./assets/images/favicon.png"
    },


    plugins: [
      "expo-router",
      // [
      //   "expo-splash-screen",
      //   {
      //     "image": "./assets/images/splash-icon.png",
      //     "imageWidth": 200,
      //     "resizeMode": "contain",
      //     "backgroundColor": "#ffffff",
      //     "dark": {
      //       "backgroundColor": "#000000"
      //     },
      //   }
      // ],
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    // Thêm trường 'extra' để chứa các biến môi trường
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      API_SOCKET_URL: process.env.API_SOCKET_URL,
      eas: {
        projectId: '6494497f-bf83-40f0-a72b-397d07505ee1', // copy từ log
      },
    },
  }
};

