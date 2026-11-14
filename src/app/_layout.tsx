import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { startEntitlements } from '@/lib/entitlement';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  useEffect(() => {
    startEntitlements();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="result" options={{ presentation: 'modal' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', gestureEnabled: true }} />
          <Stack.Screen name="batch" />
          <Stack.Screen name="qa/[...path]" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
