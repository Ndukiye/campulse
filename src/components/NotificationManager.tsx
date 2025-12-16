import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../services/pushNotificationService';

export const NotificationManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync(user.id);
    }
  }, [user]);

  useEffect(() => {
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  return null;
};
