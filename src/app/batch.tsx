import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { QrView } from '@/components/CodeViews';
import { Button, Card } from '@/components/ui';
import { tap } from '@/lib/actions';
import { BATCH_MAX, batchLines } from '@/lib/pro';
import { analyze } from '@/lib/shield';
import { addHistory, usePro } from '@/lib/store';
import { colors, radius } from '@/lib/theme';

/** Pro: one QR code per line, exported together as one image sheet. */
export default function BatchScreen() {
  const insets = useSafeAreaInsets();
  const isPro = usePro();
  const [text, setText] = useState('');
  const sheet = useRef<any>(null);
  const lines = useMemo(() => batchLines(text), [text]);

  if (!isPro) return <Redirect href={{ pathname: '/paywall', params: { feature: 'batch' } }} />;

  const share = async () => {
    if (!lines.length) return;
    tap();
    try {
      const uri = await captureRef(sheet, { format: 'png', quality: 1, result: 'tmpfile' });
      for (const raw of lines) {
        const a = analyze(raw);
        addHistory({ raw, format: 'qr', source: 'create', kind: a.kind, verdict: a.verdict, title: a.title });
      }
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share codes' });
      else Alert.alert('Sharing is not available on this device');
    } catch {
      Alert.alert('Could not export the image', 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
        <View style={s.head}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace('/create'))}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={s.title}>Batch QR codes</Text>
        </View>
        <Card style={{ gap: 6 }}>
          <Text style={s.label}>One link or text per line (up to {BATCH_MAX})</Text>
          <TextInput
            testID="batch-input"
            value={text}
            onChangeText={setText}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={'example.com/menu\nexample.com/wifi'}
            placeholderTextColor={colors.muted}
            style={s.input}
          />
          <Text style={s.label}>{lines.length} {lines.length === 1 ? 'code' : 'codes'}</Text>
        </Card>

        {lines.length ? (
          <View ref={sheet} collapsable={false} style={s.sheet}>
            {lines.map((raw, i) => (
              <View key={`${i}-${raw}`} style={s.cell}>
                <QrView value={raw} size={140} ecc="M" />
                <Text numberOfLines={2} style={s.caption}>
                  {raw}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Button primary label="Share all as one image" icon="share-outline" disabled={!lines.length} onPress={share} style={{ marginTop: 14 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  sheet: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 12, marginTop: 14, rowGap: 14 },
  cell: { width: '48%', alignItems: 'center' },
  caption: { color: '#111827', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
