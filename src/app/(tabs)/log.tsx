import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { fmtDate, fmtTime, sameDay } from '@/lib/pass';
import { showPaywall, useIsPro } from '@/lib/purchases';
import { toCsv, useCheckIns } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const log = useCheckIns();
  const pro = useIsPro();
  const now = Date.now();
  const todayOk = log.filter((c) => c.status === 'ok' && sameDay(c.ts, now)).length;
  const weekOk = log.filter((c) => c.status === 'ok' && now - c.ts < 7 * 86_400_000).length;

  const exportCsv = async () => {
    if (!pro) {
      Alert.alert('CSV export is part of Pro', 'Export your full check-in log to a spreadsheet. Try Pro free for 7 days.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'See Pro', onPress: () => showPaywall() },
      ]);
      return;
    }
    await Share.share({ message: toCsv(log), title: 'PassDesk check-ins' });
  };

  return (
    <FlatList
      data={log}
      keyExtractor={(c) => c.id}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 8 }}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 6 }}>
          <Text style={s.title}>Check-in log</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card style={s.stat}>
              <Text style={s.statNum}>{todayOk}</Text>
              <Text style={s.statLabel}>Today</Text>
            </Card>
            <Card style={s.stat}>
              <Text style={s.statNum}>{weekOk}</Text>
              <Text style={s.statLabel}>Last 7 days</Text>
            </Card>
          </View>
          <Button label={pro ? 'Export CSV' : 'Export CSV (Pro)'} icon="download-outline" disabled={!log.length} onPress={exportCsv} />
        </View>
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.muted} />
          <Text style={s.emptyTitle}>No check-ins yet</Text>
          <Text style={s.emptyBody}>Scan a member pass on the Desk tab and it shows up here.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const ok = item.status === 'ok';
        return (
          <Card style={s.row}>
            <Ionicons name={ok ? 'checkmark-circle' : 'time'} size={22} color={ok ? colors.safe : colors.caution} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>{ok ? 'Checked in' : 'Pass expired'}</Text>
            </View>
            <Text style={s.sub}>
              {sameDay(item.ts, now) ? '' : `${fmtDate(item.ts)} `}
              {fmtTime(item.ts)}
            </Text>
          </Card>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum: { color: colors.accent, fontSize: 30, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  name: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12.5, marginTop: 1 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
});
