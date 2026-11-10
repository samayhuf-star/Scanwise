import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/ui';
import { tap } from '@/lib/actions';
import { removeHistory, toggleFavorite, useHistory, type HistoryItem } from '@/lib/store';
import { colors, radius, verdictColor } from '@/lib/theme';

type Filter = 'all' | 'scan' | 'create' | 'fav';

const ago = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(ts).toLocaleDateString();
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const items = useHistory();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const data = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((h) => {
      if (filter === 'scan' && h.source !== 'scan') return false;
      if (filter === 'create' && h.source !== 'create') return false;
      if (filter === 'fav' && !h.fav) return false;
      return !needle || h.raw.toLowerCase().includes(needle) || h.title.toLowerCase().includes(needle);
    });
  }, [items, q, filter]);

  const open = (h: HistoryItem) =>
    router.push({ pathname: '/result', params: { raw: h.raw, format: h.format, src: 'history' } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <Text style={s.title}>History</Text>
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search scans and codes"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={s.search}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Scanned" active={filter === 'scan'} onPress={() => setFilter('scan')} />
        <Chip label="Created" active={filter === 'create'} onPress={() => setFilter('create')} />
        <Chip label="Starred" active={filter === 'fav'} onPress={() => setFilter('fav')} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Ionicons name="time-outline" size={48} color={colors.border} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>
              {items.length ? 'Nothing matches.' : 'Scans and codes you create show up here.'}
            </Text>
          </View>
        }
        renderItem={({ item: h }) => (
          <Pressable
            onPress={() => open(h)}
            onLongPress={() =>
              Alert.alert('Delete this entry?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => removeHistory(h.id) },
              ])
            }
            style={s.row}>
            <View style={[s.dot, { backgroundColor: verdictColor[h.verdict] + '26' }]}>
              <Ionicons
                name={h.source === 'create' ? 'qr-code' : h.verdict === 'danger' ? 'close-circle' : h.verdict === 'caution' ? 'warning' : 'shield-checkmark'}
                size={20}
                color={verdictColor[h.verdict]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>
                {h.title} <Text style={s.rowMeta}>· {h.source === 'create' ? 'Created' : 'Scanned'} · {ago(h.ts)}</Text>
              </Text>
              <Text numberOfLines={1} style={s.rowRaw}>
                {h.raw.replace(/\s+/g, ' ')}
              </Text>
            </View>
            <Pressable
              hitSlop={12}
              accessibilityLabel={h.fav ? 'Remove star' : 'Star'}
              onPress={() => {
                tap();
                toggleFavorite(h.id);
              }}>
              <Ionicons name={h.fav ? 'star' : 'star-outline'} size={22} color={h.fav ? colors.caution : colors.muted} />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800', paddingHorizontal: 16, marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  rowMeta: { color: colors.muted, fontWeight: '400', fontSize: 12 },
  rowRaw: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
