import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.embolo.cart',
  appName: 'Embolo',
  webDir: 'dist',
  server: {
    cleartext: true,
    hostname: 'embolo.in',
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'always'
  },
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
      backgroundColor: '#ffffff',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
      launchFadeOutDuration: 0
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: false
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
