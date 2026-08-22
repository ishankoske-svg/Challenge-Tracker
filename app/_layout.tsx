import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

// Suppress harmless DOM prop warnings caused by victory-native/react-native-svg on the web
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React does not recognize the `') ||
       args[0].includes('for a non-boolean attribute'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

LogBox.ignoreLogs([
  'React does not recognize the `accessibilityHint`',
  'React does not recognize the `testID`',
  'React does not recognize the `',
]);

export default function RootLayout() {
  const { user, isLoading, initializeAuth, isInitialized } = useAuthStore();
  const { theme, loadPersistedTheme } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadPersistedTheme();
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if user is not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to tabs index if user is authenticated
      router.replace('/(tabs)');
    }
  }, [user, isInitialized, isLoading, segments]);

  if (!isInitialized || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style="light" backgroundColor={theme.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'fade',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
