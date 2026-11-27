import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { markOnboarded, SLIDES } from '@/lib/onboarding';
import { usePushConsent } from '@/lib/push';
import { colors, radius } from '@/lib/theme';

export { ONBOARDING_SCREENS } from '@/lib/onboarding';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [push, setPush] = usePushConsent();
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const finish = (paywall: boolean) => {
    markOnboarded();
    router.replace('/');
    if (paywall) router.push('/paywall');
  };
  const next = () => (last ? finish(true) : setI(i + 1));

  return (
    <View testID="onboarding-screen" style={[s.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={s.top}>
        <Text style={s.step}>
          {i + 1} / {SLIDES.length}
        </Text>
        {!last ? (
          <Pressable testID="onboarding-skip" accessibilityRole="button" hitSlop={12} onPress={() => finish(false)}>
            <Text style={s.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.View key={slide.id} entering={FadeIn.duration(260).reduceMotion(ReduceMotion.System)} style={s.body}>
        <View style={s.badge}>
          <Ionicons name={slide.icon as never} size={52} color={colors.accent} />
        </View>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.text}>{slide.body}</Text>
        {slide.kind === 'push' ? (
          <View style={s.toggle}>
            <Text style={s.toggleLabel}>Send me tips and updates</Text>
            <Switch
              testID="onboarding-push"
              value={push}
              onValueChange={setPush}
              trackColor={{ true: colors.accent, false: colors.border }}
              accessibilityLabel="Send me tips and updates"
            />
          </View>
        ) : null}
      </Animated.View>

      <View style={s.dots}>
        {SLIDES.map((d, n) => (
          <View key={d.id} style={[s.dot, n === i && s.dotOn]} />
        ))}
      </View>
      <Button primary testID="onboarding-next" label={last ? 'Start free trial' : 'Continue'} onPress={next} />
      {last ? (
        <Pressable testID="onboarding-free" accessibilityRole="button" onPress={() => finish(false)} style={{ alignSelf: 'center', padding: 12 }}>
          <Text style={s.skip}>Continue with free</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  step: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  skip: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  badge: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10 },
  toggleLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.accent, width: 18 },
});
