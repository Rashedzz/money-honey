import React from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
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

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#080B14',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text style={{ color: '#FF4757', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>
            ⚠️ Display Recovery
          </Text>
          <Text style={{ color: '#8892A4', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'A visual component encountered an issue.'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#00E5B3',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '800' }}>Reload Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#E0F2FE' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </DatabaseProvider>
    </AppErrorBoundary>
  );
}
