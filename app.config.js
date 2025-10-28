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
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        // "foregroundImage": "./assets/images/android-icon-foreground.png",
        // "backgroundImage": "./assets/images/android-icon-background.png",
        // "monochromeImage": "./assets/images/android-icon-monochrome.png"
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
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          },
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    // Thêm trường 'extra' để chứa các biến môi trường
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
    },
  }
};

