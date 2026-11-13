import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProBadge, SectionTitle } from '@/components/ui';
import { FREE_HISTORY_LIMIT, PRIVACY_URL, TERMS_URL } from '@/lib/pro';
import { restore } from '@/lib/purchases';
import { clearHistory, setPro, setSettings, useHistory, usePro, useSettings } from '@/lib/store';
import { colors } from '@/lib/theme';

function Row({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: colors.border }}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const history = useHistory();
  const isPro = usePro();
  const [restoring, setRestoring] = useState(false);

  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const ok = await restore();
      setPro(ok);
      Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Scanwise Pro is active again.' : 'No active Scanwise Pro subscription was found for this account.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40 }}>
      <Text style={s.title}>Settings</Text>

      <Card style={{ gap: 6, marginBottom: 16, borderColor: colors.accent }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="shield-checkmark" size={26} color={colors.accent} />
          <Text style={[s.label, { fontSize: 17 }]}>Private by design</Text>
        </View>
        <Text style={s.hint}>
          Links are checked on your phone. There is no account, no ads and no tracking. Codes you create are static and never expire.
        </Text>
      </Card>

      <SectionTitle>Scanwise Pro</SectionTitle>
      <Card style={{ gap: 10, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ProBadge />
          <Text testID="plan-status" style={s.label}>
            {isPro ? 'Plan: Pro' : 'Plan: Free'}
          </Text>
        </View>
        <Text style={s.hint}>
          {isPro
            ? 'Barcodes, UPI codes, colours, batch codes, unlimited history and export are unlocked.'
            : `Scanning, Safe-Link Shield and QR codes stay free. Pro adds barcodes, UPI codes, colours, batch codes, history beyond the newest ${FREE_HISTORY_LIMIT} and export.`}
        </Text>
        {!isPro ? <Button primary label="Go Pro" icon="sparkles" onPress={() => router.push('/paywall')} /> : null}
        <Button label={restoring ? 'Restoring' : 'Restore purchases'} icon="refresh" disabled={restoring} onPress={onRestore} />
      </Card>

      <SectionTitle>Scanning</SectionTitle>
      <Card style={{ gap: 14 }}>
        <Row label="Haptic feedback" value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
        <Row
          label="Save scans to history"
          hint="Stored only on this device."
          value={settings.saveHistory}
          onChange={(v) => setSettings({ saveHistory: v })}
        />
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Text style={s.hint}>{history.length} saved {history.length === 1 ? 'entry' : 'entries'} on this device.</Text>
        <Button
          danger
          label="Clear history (keep starred)"
          icon="trash-outline"
          disabled={!history.length}
          onPress={() =>
            Alert.alert('Clear history?', 'Starred items are kept.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => clearHistory(true) },
            ])
          }
        />
      </Card>

      <View style={s.links}>
        <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
          <Text style={s.link}>Terms of Use</Text>
        </Pressable>
        <Text style={s.hint}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
          <Text style={s.link}>Privacy Policy</Text>
        </Pressable>
      </View>

      <Text style={s.foot}>
        Scanwise {Constants.expoConfig?.version ?? ''}
        {'\n'}Link checks are heuristics that look for common warning signs. They reduce risk but can not guarantee a link is safe.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  foot: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
