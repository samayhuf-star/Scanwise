import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { ctaText, planLine, renewalDisclosure } from '@/lib/introOffer';
import { APPLE_EULA_URL, FREE_FEATURES, PRIVACY_URL, PRO_FEATURES, TERMS_URL, type ProFeature } from '@/lib/pro';
import { buy, loadPlans, restore, type Plan } from '@/lib/purchases';
import { setPro, usePro } from '@/lib/store';
import { colors, radius } from '@/lib/theme';

const enter = (i: number) => FadeInDown.duration(320).delay(60 * i).reduceMotion(ReduceMotion.System);

export default function PaywallScreen() {
  const { feature } = useLocalSearchParams<{ feature?: ProFeature }>();
  const insets = useSafeAreaInsets();
  const isPro = usePro();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<'yearly' | 'monthly'>('yearly');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => {
    let live = true;
    loadPlans()
      .then((r) => {
        if (!live) return;
        setPlans(r.plans);
        setError(r.error);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const plan = plans.find((p) => p.kind === selected) ?? plans[0];
  const highlight = PRO_FEATURES.find((f) => f.id === feature);
  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';

  const onBuy = async () => {
    if (!plan || busy) return;
    setBusy('buy');
    try {
      const r = await buy(plan);
      if (r === 'purchased') {
        setPro(true);
        Alert.alert('Welcome to Scanwise Pro', 'All Pro features are unlocked.', [{ text: 'OK', onPress: close }]);
      } else if (r === 'pending') {
        Alert.alert('Purchase pending', 'Pro unlocks as soon as the purchase is approved.');
      } else if (r === 'error') {
        Alert.alert('Purchase failed', 'Please try again.');
      }
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy('restore');
    try {
      const ok = await restore();
      setPro(ok);
      Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Scanwise Pro is active again.' : 'No active Scanwise Pro subscription was found for this account.', [
        { text: 'OK', onPress: ok ? close : undefined },
      ]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View testID="paywall-screen" style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={s.topRow}>
          <Pressable testID="paywall-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={14} onPress={close} style={s.close}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <Animated.View entering={enter(0)} style={{ alignItems: 'center' }}>
          <View style={s.badge}>
            <Ionicons name="sparkles" size={30} color={colors.accent} />
          </View>
          <Text style={s.title}>Scanwise Pro</Text>
          <Text style={s.sub}>
            {highlight ? `${highlight.title} is part of Scanwise Pro.` : 'More ways to create and keep your codes.'} Scanning and Safe-Link Shield stay free.
          </Text>
        </Animated.View>

        <Animated.View entering={enter(1)} style={s.card}>
          {PRO_FEATURES.map((f) => (
            <View key={f.id} style={s.feat}>
              <Ionicons name={f.id === feature ? 'star' : 'checkmark-circle'} size={20} color={f.id === feature ? colors.caution : colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.featTitle}>{f.title}</Text>
                <Text style={s.featDetail}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Text style={s.freeHead}>Always free</Text>
        <Text style={s.freeText}>{FREE_FEATURES.join(' · ')}</Text>

        {isPro ? (
          <View testID="pro-active" style={[s.card, { alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle" size={28} color={colors.accent} />
            <Text style={s.featTitle}>Scanwise Pro is active</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 30 }} />
        ) : !plans.length ? (
          <Text testID="plans-unavailable" style={[s.sub, { marginVertical: 20 }]}>
            {error ?? 'Plans unavailable right now. Please try again shortly.'}
          </Text>
        ) : (
          <Animated.View entering={enter(2)} style={{ gap: 10, marginTop: 6 }}>
            {plans.map((p) => {
              const on = p.kind === (plan?.kind ?? selected);
              return (
                <Pressable
                  key={p.id}
                  testID={`plan-${p.kind}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${p.label}, ${planLine({ price: p.price, period: p.period, trialDays: p.trialDays })}`}
                  onPress={() => setSelected(p.kind)}
                  style={[s.plan, on && { borderColor: colors.accent, backgroundColor: colors.accentDark }]}>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.accent : colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.planLabel}>{p.label}</Text>
                    <Text style={s.planPrice}>{planLine({ price: p.price, period: p.period, trialDays: p.trialDays })}</Text>
                  </View>
                </Pressable>
              );
            })}
            {plan ? (
              <Button
                primary
                testID="paywall-cta"
                label={busy === 'buy' ? 'Please wait' : ctaText({ price: plan.price, period: plan.period, trialDays: plan.trialDays })}
                disabled={!!busy}
                onPress={onBuy}
                style={{ marginTop: 6 }}
              />
            ) : null}
            <Text testID="renewal-disclosure" style={s.legal}>
              {renewalDisclosure(!!plan?.trialDays, store)}
            </Text>
          </Animated.View>
        )}

        <Pressable testID="paywall-restore" accessibilityRole="button" accessibilityLabel="Restore purchases" onPress={onRestore} style={s.restore}>
          <Text style={s.link}>{busy === 'restore' ? 'Restoring' : 'Restore purchases'}</Text>
        </Pressable>
        <View style={s.links}>
          <Text accessibilityRole="link" style={s.link} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Use
          </Text>
          <Text style={s.dot}>·</Text>
          <Text accessibilityRole="link" style={s.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          {Platform.OS === 'ios' ? (
            <>
              <Text style={s.dot}>·</Text>
              <Text accessibilityRole="link" style={s.link} onPress={() => Linking.openURL(APPLE_EULA_URL)}>
                Apple EULA
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 12 },
  sub: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 6, lineHeight: 21 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12, marginTop: 18 },
  feat: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  featTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  featDetail: { color: colors.muted, fontSize: 13, marginTop: 1 },
  freeHead: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18 },
  freeText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 10 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  planLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  planPrice: { color: colors.muted, fontSize: 14, marginTop: 2 },
  legal: { color: colors.muted, fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 4 },
  restore: { alignSelf: 'center', paddingVertical: 12, marginTop: 8 },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  link: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  dot: { color: colors.muted },
});
