import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { tap } from '@/lib/actions';
import { showPaywall } from '@/lib/purchases';
import { setSettings } from '@/lib/store';
import { colors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const PAGES: { icon: IconName; color: string; title: string; body: string }[] = [
  {
    icon: 'id-card',
    color: colors.accent,
    title: 'A pass for every member',
    body: 'Add a member, pick their plan, and PassDesk makes a QR pass you can send to their phone in one tap. No app for members to install.',
  },
  {
    icon: 'scan',
    color: colors.safe,
    title: 'Check people in at the door',
    body: 'Point your phone at a member pass. Green means welcome in, amber means the pass has expired. It works offline.',
  },
  {
    icon: 'calendar',
    color: colors.info,
    title: 'See who showed up',
    body: 'Every check-in is logged with the time. Track today and this week, and export the log to a spreadsheet. Everything stays on your phone.',
  },
];

const PRO_ROWS: { icon: IconName; text: string; pro?: boolean }[] = [
  { icon: 'scan', text: 'Unlimited check-ins at the door, always free' },
  { icon: 'id-card', text: 'Up to 10 members, always free' },
  { icon: 'people', text: 'Unlimited members', pro: true },
  { icon: 'download-outline', text: 'Export the check-in log to CSV', pro: true },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const last = PAGES.length; // index of the "what you get" page

  const finish = () => {
    setSettings({ onboarded: true });
    router.replace('/(tabs)');
  };

  const startTrial = async () => {
    tap();
    await showPaywall();
    finish();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <View style={s.dots}>
        {[...PAGES, null].map((_, i) => (
          <View key={i} style={[s.dot, i === step && s.dotOn]} />
        ))}
      </View>

      {step < last ? (
        <View style={s.page}>
          <View style={[s.badge, { borderColor: PAGES[step].color }]}>
            <Ionicons name={PAGES[step].icon} size={64} color={PAGES[step].color} />
          </View>
          <Text style={s.title}>{PAGES[step].title}</Text>
          <Text style={s.body}>{PAGES[step].body}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.page}>
          <Text style={s.title}>What you get</Text>
          <Card style={{ gap: 14, width: '100%' }}>
            {PRO_ROWS.map((r) => (
              <View key={r.text} style={s.row}>
                <Ionicons name={r.icon} size={22} color={r.pro ? colors.caution : colors.accent} />
                <Text style={s.rowText}>{r.text}</Text>
                {r.pro ? <Text style={s.proTag}>PRO</Text> : null}
              </View>
            ))}
          </Card>
          <Text style={s.fine}>Try Pro free for 7 days. Cancel anytime in Settings. You can also continue free.</Text>
        </ScrollView>
      )}

      <View style={{ gap: 10 }}>
        {step < last ? (
          <>
            <Button primary label="Continue" onPress={() => setStep(step + 1)} />
            <Pressable accessibilityRole="button" onPress={() => setStep(last)} style={s.skip}>
              <Text style={s.skipText}>Skip</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Button primary label="Start 7-day free trial" onPress={startTrial} />
            <Button label="Continue free" onPress={finish} />
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 24, backgroundColor: colors.accent },
  page: { flexGrow: 1, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 12 },
  badge: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { color: colors.text, fontSize: 15, flex: 1 },
  proTag: { color: colors.caution, fontSize: 11, fontWeight: '800' },
  fine: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  skip: { alignItems: 'center', padding: 10 },
  skipText: { color: colors.muted, fontSize: 15 },
});
