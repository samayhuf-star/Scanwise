import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';
import { initRevenueCat } from '@/lib/revenuecat';
import { ENTITLEMENT_ID, RC_API_KEY_ANDROID, RC_API_KEY_IOS } from '@/lib/rcConfig';

export default function RootLayout() {
  useEffect(() => {
    initRevenueCat({ entitlementId: ENTITLEMENT_ID, iosKey: RC_API_KEY_IOS, androidKey: RC_API_KEY_ANDROID });
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="result" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
