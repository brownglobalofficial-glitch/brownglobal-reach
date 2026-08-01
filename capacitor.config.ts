import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.brownglobal.reach",
  appName: "Reach",
  webDir: "dist",
  ios: { contentInset: "automatic" },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 800, launchAutoHide: false, backgroundColor: "#6c5ce7", showSpinner: false },
    StatusBar: { style: "LIGHT", backgroundColor: "#6c5ce7" },
    Keyboard: { resize: "body", resizeOnFullScreen: true },
  },
};

export default config;
