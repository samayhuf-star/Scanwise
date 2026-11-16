import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initPurchases } from '@/lib/purchases';
import { useSettings, settingsReady } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const settings = useSettings();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initPurchases();
  }, []);

  useEffect(() => {
    let alive = true;
    settingsReady().then(() => {
      if (alive && !settings.onboarded && segments[0] !== 'onboarding') router.replace('/onboarding');
    });
    return () => {
      alive = false;
    };
  }, [settings.onboarded, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="result" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
