import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '../store/authStore';

import '../../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    async function init() {
      try {
        await initialize();
      } catch (e) {
        console.log('INIT ERROR', e);
      }
    }

    init();
  }, []);

  useEffect(() => {
    async function hideSplash() {
      if (initialized) {
        await SplashScreen.hideAsync();
      }
    }

    hideSplash();
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <Toast />
    </GestureHandlerRootView>
  );
}