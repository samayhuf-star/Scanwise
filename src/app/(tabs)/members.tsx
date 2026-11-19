import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip } from '@/components/ui';
import { tap } from '@/lib/actions';
import { PLANS, fmtDate, planLabel, statusOf, type PlanId } from '@/lib/pass';
import { showPaywall, useIsPro } from '@/lib/purchases';
import { FREE_MEMBER_LIMIT, addMember, useMembers } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const members = useMembers();
  const pro = useIsPro();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<PlanId>('month');
  const atLimit = !pro && members.length >= FREE_MEMBER_LIMIT;

  const save = () => {
    const m = addMember(name, plan);
    if (!m) return;
    tap('success');
    setName('');
    setAdding(false);
    router.push({ pathname: '/member/[id]', params: { id: m.id } });
  };

  const startAdd = () => {
    if (atLimit) {
      Alert.alert('Free plan holds 10 members', 'PassDesk Pro has no member limit. Try it free for 7 days.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'See Pro', onPress: () => showPaywall() },
      ]);
      return;
    }
    tap();
    setAdding(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <View style={s.head}>
              <Text style={s.title}>Members</Text>
              <Text style={s.count}>
                {members.length}
                {pro ? '' : ` / ${FREE_MEMBER_LIMIT}`}
              </Text>
            </View>
            {adding ? (
              <Card style={{ gap: 12 }}>
                <TextInput
                  autoFocus
                  value={name}
                  onChangeText={setName}
                  placeholder="Member name"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Member name"
                  returnKeyType="done"
                  style={s.input}
                />
                <View style={s.chips}>
                  {PLANS.map((p) => (
                    <Chip key={p.id} label={p.label} active={plan === p.id} onPress={() => setPlan(p.id)} />
                  ))}
                </View>
                <Button primary label="Create pass" icon="id-card" disabled={!name.trim()} onPress={save} />
                <Button label="Cancel" onPress={() => setAdding(false)} />
              </Card>
            ) : (
              <Button primary label="Add member" icon="person-add" onPress={startAdd} />
            )}
          </View>
        }
        ListEmptyComponent={
          adding ? (
            <View />
          ) : (
            <View style={s.empty}>
              <Ionicons name="id-card-outline" size={48} color={colors.muted} />
              <Text style={s.emptyTitle}>No members yet</Text>
              <Text style={s.emptyBody}>Add a member to make their QR pass. Send it to their phone, then scan it at the door.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const expired = statusOf(item.expires) === 'expired';
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${expired ? 'expired' : 'active'}`}
              onPress={() => router.push({ pathname: '/member/[id]', params: { id: item.id } })}>
              <Card style={s.row}>
                <View style={[s.avatar, expired && { backgroundColor: colors.cardAlt }]}>
                  <Text style={s.initial}>{item.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.sub}>
                    {planLabel(item.plan)} · {item.expires ? (expired ? `expired ${fmtDate(item.expires)}` : `until ${fmtDate(item.expires)}`) : 'no expiry'}
                  </Text>
                </View>
                <Ionicons name={expired ? 'time' : 'checkmark-circle'} size={22} color={expired ? colors.caution : colors.safe} />
              </Card>
            </Pressable>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  count: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
});
