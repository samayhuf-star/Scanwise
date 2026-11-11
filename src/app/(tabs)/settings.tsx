import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionTitle } from '@/components/ui';
import { clearHistory, setSettings, useHistory, useSettings } from '@/lib/store';
import { colors } from '@/lib/theme';
import { openCustomerCenter, presentPaywall, restorePurchases, useEntitlement } from '@/lib/revenuecat';

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
  const { active: pro } = useEntitlement();
  const restore = async () => {
    try {
      const ok = await restorePurchases();
      Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Scanwise Pro is active again.' : 'No Scanwise Pro purchase was found for this account.');
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'Please try again.');
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

      <SectionTitle>Scanwise Pro</SectionTitle>
      <Card style={{ gap: 10 }}>
        {pro ? (
          <Button label="Manage subscription" icon="sparkles-outline" onPress={openCustomerCenter} />
        ) : (
          <Button label="Unlock Scanwise Pro" icon="sparkles-outline" onPress={() => presentPaywall('settings')} />
        )}
        <Button label="Restore purchases" icon="refresh-outline" onPress={restore} />
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
  foot: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
