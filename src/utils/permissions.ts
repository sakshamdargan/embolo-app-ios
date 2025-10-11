import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Request location permission
 * @returns Promise<boolean> - true if granted, false otherwise
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not a native platform, skipping location permission');
    return true;
  }

  try {
    const permission = await Geolocation.checkPermissions();
    
    if (permission.location === 'granted') {
      return true;
    }

    if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
      const request = await Geolocation.requestPermissions();
      return request.location === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location
 * @returns Promise with coordinates or null
 */
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Request notification permission
 * @returns Promise<boolean> - true if granted, false otherwise
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not a native platform, skipping notification permission');
    return true;
  }

  try {
    const permission = await PushNotifications.checkPermissions();
    
    if (permission.receive === 'granted') {
      return true;
    }

    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      const request = await PushNotifications.requestPermissions();
      return request.receive === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Initialize push notifications
 */
export const initializePushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      // Send token to your server
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    // Listen for notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
    });
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

/**
 * Check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get platform name
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};
