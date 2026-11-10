import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionTitle } from '@/components/ui';
import { runAction } from '@/lib/actions';
import { analyze, type Finding } from '@/lib/shield';
import { colors, radius, verdictColor } from '@/lib/theme';

const VERDICT_ICON = {
  safe: 'shield-checkmark',
  caution: 'warning',
  danger: 'close-circle',
  info: 'information-circle',
} as const;

const VERDICT_LABEL = { safe: 'SAFE', caution: 'CAUTION', danger: 'DANGER', info: 'DETAILS' } as const;

const FINDING_ICON: Record<Finding['level'], { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  ok: { name: 'checkmark-circle', color: colors.safe },
  info: { name: 'information-circle', color: colors.info },
  warn: { name: 'warning', color: colors.caution },
  bad: { name: 'close-circle', color: colors.danger },
};

export default function ResultScreen() {
  const { raw = '', format = 'qr' } = useLocalSearchParams<{ raw?: string; format?: string; src?: string }>();
  const insets = useSafeAreaInsets();
  const a = useMemo(() => analyze(raw), [raw]);
  const [toast, setToast] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const c = verdictColor[a.verdict];

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const act = async (i: number) => {
    const msg = await runAction(a.actions[i], a);
    if (msg) {
      setToast(msg);
      setTimeout(() => setToast(null), 1500);
    }
  };

  const primary = a.actions.findIndex((x) => x.primary);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}>
        <View style={s.grab} />
        <View style={[s.banner, { borderColor: c, backgroundColor: c + '1A' }]}>
          <Ionicons name={VERDICT_ICON[a.verdict]} size={44} color={c} />
          <View style={{ flex: 1 }}>
            <Text style={[s.verdict, { color: c }]}>{VERDICT_LABEL[a.verdict]}</Text>
            <Text style={s.headline}>{a.headline}</Text>
            <Text style={s.sub}>
              {a.title} · {format.toUpperCase().replace('_', '-')}
            </Text>
          </View>
        </View>

        {a.fields.length > 0 && (
          <>
            <SectionTitle>Details</SectionTitle>
            <Card style={{ gap: 12 }}>
              {a.fields.map((f) => (
                <View key={f.label}>
                  <Text style={s.label}>{f.label}</Text>
                  {f.secret ? (
                    <Pressable onPress={() => setReveal((r) => !r)}>
                      <Text style={s.value} selectable={reveal}>
                        {reveal ? f.value : '•'.repeat(Math.min(f.value.length, 12)) + '  (tap to show)'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={s.value} selectable>
                      {f.value}
                    </Text>
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        {a.findings.length > 0 && (
          <>
            <SectionTitle>{a.kind === 'url' ? 'Safe-Link Shield' : 'Notes'}</SectionTitle>
            <Card style={{ gap: 12 }}>
              {a.findings.map((f, i) => (
                <View key={i} style={s.finding}>
                  <Ionicons name={FINDING_ICON[f.level].name} size={20} color={FINDING_ICON[f.level].color} />
                  <Text style={s.findingText}>{f.text}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <SectionTitle>Full content</SectionTitle>
        <Card>
          <Text style={s.raw} selectable>
            {raw}
          </Text>
        </Card>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        {toast ? <Text style={s.toast}>{toast}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {a.actions.slice(0, 3).map((x, i) => (
            <Button
              key={x.label}
              label={x.label}
              primary={i === primary || (primary < 0 && i === 0)}
              danger={a.verdict === 'danger' && x.kind === 'open'}
              onPress={() => act(i)}
              style={{ flex: 1, paddingHorizontal: 8 }}
            />
          ))}
        </View>
        <Button label="Done" onPress={close} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.lg, borderWidth: 1.5 },
  verdict: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  headline: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 2 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  value: { color: colors.text, fontSize: 16 },
  finding: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  findingText: { color: colors.text, fontSize: 14.5, lineHeight: 21, flex: 1 },
  raw: { color: colors.muted, fontSize: 13, fontFamily: 'Courier' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toast: { color: colors.accent, textAlign: 'center', marginBottom: 8, fontWeight: '700' },
});
