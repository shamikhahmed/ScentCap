import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.capricorn.scentcap',
  appName: 'ScentCap',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scheme: 'ScentCap',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
