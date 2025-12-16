import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updatePushToken } from './profileService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId?: string) {
  let token;

  // Check if running in Expo Go
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo && Platform.OS === 'android') {
    console.log('Push notifications are not supported in Expo Go on Android. Please use a development build.');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the project ID from env or config
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID;

    if (!projectId) {
      console.log('Project ID not found. Run `eas init` or set EXPO_PUBLIC_PROJECT_ID to enable push notifications.');
      return;
    }

    // Get the token that uniquely identifies this device
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.error('Error getting push token:', e);
      return;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (token && userId) {
    await updatePushToken(userId, token);
  }

  return token;
}

export function setupNotificationListeners() {
  const subscription1 = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  const subscription2 = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    // Navigate to specific screen based on data
    const data = response.notification.request.content.data;
    if (data?.screen) {
      // Navigation logic would go here, or emit an event
    }
  });

  return () => {
    subscription1.remove();
    subscription2.remove();
  };
}
