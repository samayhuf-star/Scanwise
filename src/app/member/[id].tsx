import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { QrView } from '@/components/CodeViews';
import { Button, Card, Chip, SectionTitle } from '@/components/ui';
import { tap } from '@/lib/actions';
import { PLANS, encodePass, fmtDate, planLabel, statusOf } from '@/lib/pass';
import { removeMember, renewMember, useMembers, useSettings } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const members = useMembers();
  const settings = useSettings();
  const shot = useRef<any>(null);
  const member = members.find((m) => m.id === id);

  if (!member) {
    return (
      <View style={[s.root, { paddingTop: insets.top + 12 }]}>
        <Button label="Back" icon="chevron-back" onPress={() => router.back()} />
        <Text style={s.muted}>This member was removed.</Text>
      </View>
    );
  }

  const expired = statusOf(member.expires) === 'expired';
  const value = encodePass({ memberId: member.id, name: member.name, expires: member.expires });

  const share = async () => {
    tap();
    try {
      const uri = await captureRef(shot, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${member.name}'s pass` });
      else Alert.alert('Sharing is not available on this device');
    } catch {
      Alert.alert('Could not export the pass', 'Please try again.');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 14 }}>
      <Button label="Back" icon="chevron-back" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />

      <View ref={shot} collapsable={false} style={s.pass}>
        <Text style={s.venue}>{settings.venueName || 'PassDesk'}</Text>
        <Text style={s.passName}>{member.name}</Text>
        <View style={s.qr}>
          <QrView value={value} size={240} />
        </View>
        <Text style={s.passMeta}>
          {planLabel(member.plan)} · {member.expires ? `valid until ${fmtDate(member.expires)}` : 'no expiry'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <Ionicons name={expired ? 'time' : 'checkmark-circle'} size={20} color={expired ? colors.caution : colors.safe} />
        <Text style={{ color: expired ? colors.caution : colors.safe, fontWeight: '700' }}>{expired ? 'Expired' : 'Active'}</Text>
      </View>

      <Button primary label="Send pass to member" icon="share-outline" onPress={share} />

      <SectionTitle>Renew</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Text style={s.muted}>Renewing extends from the current end date. Send the member the updated pass.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PLANS.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              onPress={() => {
                tap('success');
                renewMember(member.id, p.id);
              }}
            />
          ))}
        </View>
      </Card>

      <Button
        danger
        label="Remove member"
        icon="trash-outline"
        onPress={() =>
          Alert.alert(`Remove ${member.name}?`, 'Their past check-ins stay in the log.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                removeMember(member.id);
                router.back();
              },
            },
          ])
        }
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  pass: { backgroundColor: colors.accent, borderRadius: 28, padding: 22, alignItems: 'center', gap: 10 },
  venue: { color: colors.onAccent, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  passName: { color: colors.onAccent, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  qr: { backgroundColor: '#fff', padding: 10, borderRadius: 18 },
  passMeta: { color: colors.onAccent, fontSize: 13.5, fontWeight: '600' },
});
