import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionTitle } from '@/components/ui';
import { manageSubscription, restore, showPaywall, useIsPro } from '@/lib/purchases';
import { clearCheckIns, setSettings, useCheckIns, useSettings } from '@/lib/store';
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
  const history = useCheckIns();
  const pro = useIsPro();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40 }}>
      <Text style={s.title}>Settings</Text>

      <Card style={{ gap: 6, marginBottom: 16, borderColor: colors.accent }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="lock-closed" size={26} color={colors.accent} />
          <Text style={[s.label, { fontSize: 17 }]}>Private by design</Text>
        </View>
        <Text style={s.hint}>
          There is no account and no ads. Members, passes and check-ins are stored only on this phone and are never uploaded. Purchases are handled by Apple and RevenueCat.
        </Text>
      </Card>

      <SectionTitle>Your venue</SectionTitle>
      <Card style={{ gap: 8, marginBottom: 16 }}>
        <Text style={s.hint}>Shown on every member pass and at the top of the Desk.</Text>
        <TextInput
          value={settings.venueName}
          onChangeText={(v) => setSettings({ venueName: v })}
          placeholder="Gym or venue name"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Venue name"
          style={s.input}
        />
      </Card>

      <SectionTitle>PassDesk Pro</SectionTitle>
      <Card style={{ gap: 10, marginBottom: 16 }}>
        <Text style={s.hint}>
          {pro ? 'PassDesk Pro is active. Thank you!' : 'Unlock unlimited members and CSV export. Free for 7 days, cancel anytime.'}
        </Text>
        {pro ? (
          <Button label="Manage subscription" onPress={manageSubscription} />
        ) : (
          <Button primary label="Try Pro free" onPress={showPaywall} />
        )}
        <Button label="Restore purchases" onPress={restore} />
      </Card>

      <SectionTitle>General</SectionTitle>
      <Card style={{ gap: 14 }}>
        <Row label="Haptic feedback" value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Text style={s.hint}>{history.length} check-in{history.length === 1 ? '' : 's'} saved on this device.</Text>
        <Button
          danger
          label="Clear check-in log"
          icon="trash-outline"
          disabled={!history.length}
          onPress={() =>
            Alert.alert('Clear the check-in log?', 'Members and passes are kept.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => clearCheckIns() },
            ])
          }
        />
      </Card>

      <Text style={s.foot}>
        PassDesk {Constants.expoConfig?.version ?? ''}
        {'\n'}Passes are checked offline on this device. Keep a backup of your member list if you change phones.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  input: { color: colors.text, backgroundColor: colors.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 16 },
  foot: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
