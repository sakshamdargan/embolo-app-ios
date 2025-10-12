import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.embolo.cart',
  appName: 'Embolo',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#00aa63',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00aa63',
      overlaysWebView: false
    }
  }
};

export default config;
