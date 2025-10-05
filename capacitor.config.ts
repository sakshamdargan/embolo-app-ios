import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.616c1b5dc8534ed0959336674d44f339',
  appName: 'Easdeal',
  webDir: 'dist',
  server: {
    url: 'https://616c1b5d-c853-4ed0-9593-36674d44f339.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
