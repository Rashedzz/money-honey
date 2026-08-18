import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { DatabaseProvider } from '../src/db/DatabaseProvider';

if (Platform.OS !== 'web') {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    // Ignore notification setup error on platforms without notification service
  }
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </DatabaseProvider>
  );
}
