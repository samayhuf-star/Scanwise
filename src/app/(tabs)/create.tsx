import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { BarcodeView, QrView } from '@/components/CodeViews';
import { Button, Card, Chip, ProBadge, SectionTitle } from '@/components/ui';
import { tap } from '@/lib/actions';
import {
  BAR_FORMATS,
  QR_TYPES,
  buildPayload,
  encodeBarcode,
  type BarFormat,
  type Fields,
  type QrType,
} from '@/lib/generate';
import { analyze } from '@/lib/shield';
import { requirePro } from '@/lib/entitlement';
import { isProColor, isProQrType } from '@/lib/pro';
import { addHistory, usePro } from '@/lib/store';
import { colors, radius } from '@/lib/theme';

type FieldDef = { key: string; label: string; placeholder?: string; keyboard?: 'default' | 'url' | 'email-address' | 'phone-pad' | 'decimal-pad'; multiline?: boolean; secure?: boolean };

const FIELDS: Record<QrType, FieldDef[]> = {
  url: [{ key: 'url', label: 'Website address', placeholder: 'example.com', keyboard: 'url' }],
  text: [{ key: 'text', label: 'Text', placeholder: 'Anything you want to encode', multiline: true }],
  wifi: [
    { key: 'ssid', label: 'Network name' },
    { key: 'password', label: 'Password', secure: true },
  ],
  contact: [
    { key: 'name', label: 'Full name' },
    { key: 'org', label: 'Company' },
    { key: 'phone', label: 'Phone', keyboard: 'phone-pad' },
    { key: 'email', label: 'Email', keyboard: 'email-address' },
    { key: 'site', label: 'Website', keyboard: 'url' },
  ],
  email: [
    { key: 'to', label: 'To', keyboard: 'email-address' },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Message', multiline: true },
  ],
  phone: [{ key: 'phone', label: 'Phone number', placeholder: '+91 98765 43210', keyboard: 'phone-pad' }],
  sms: [
    { key: 'phone', label: 'Phone number', keyboard: 'phone-pad' },
    { key: 'message', label: 'Message', multiline: true },
  ],
  upi: [
    { key: 'pa', label: 'UPI ID', placeholder: 'name@bank' },
    { key: 'pn', label: 'Payee name' },
    { key: 'am', label: 'Amount (optional)', keyboard: 'decimal-pad' },
    { key: 'tn', label: 'Note (optional)' },
  ],
};

const SWATCHES = ['#000000', '#0B2A6F', '#0B3D33', '#4C1D95'];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'qr' | 'bar'>('qr');
  const [type, setType] = useState<QrType>('url');
  const [fields, setFields] = useState<Fields>({ security: 'WPA' });
  const [format, setFormat] = useState<BarFormat>('CODE128');
  const [barText, setBarText] = useState('');
  const [fg, setFg] = useState(SWATCHES[0]);
  const shot = useRef<any>(null);
  const isPro = usePro();
  // A Pro choice made earlier falls back to the free default if Pro is no longer active.
  const activeMode = mode === 'bar' && !isPro ? 'qr' : mode;
  const activeType: QrType = isProQrType(type) && !isPro ? 'url' : type;
  const activeFg = isProColor(fg) && !isPro ? SWATCHES[0] : fg;

  const payload = useMemo(() => (activeMode === 'qr' ? buildPayload(activeType, fields) : barText.trim()), [activeMode, activeType, fields, barText]);
  const barCheck = useMemo(() => (activeMode === 'bar' ? encodeBarcode(payload, format) : null), [activeMode, payload, format]);
  const ready = activeMode === 'qr' ? !!payload : !!barCheck?.ok;

  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const save = () => {
    const a = analyze(payload);
    addHistory({
      raw: payload,
      format: activeMode === 'qr' ? 'qr' : format.toLowerCase(),
      source: 'create',
      kind: a.kind,
      verdict: a.verdict,
      title: a.title,
    });
  };

  const share = async () => {
    if (!ready) return;
    tap();
    try {
      const uri = await captureRef(shot, { format: 'png', quality: 1, result: 'tmpfile' });
      save();
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share code' });
      else Alert.alert('Sharing is not available on this device');
    } catch {
      Alert.alert('Could not export the image', 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40 }}>
        <Text style={s.title}>Create</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <Chip label="QR code" testID="mode-qr" active={activeMode === 'qr'} onPress={() => setMode('qr')} icon="qr-code" />
          <Chip label="Barcode" testID="mode-bar" pro={!isPro} active={activeMode === 'bar'} onPress={() => requirePro('barcodes', () => setMode('bar'))} icon="barcode" />
          <Chip label="Batch" testID="open-batch" pro={!isPro} onPress={() => requirePro('batch', () => router.push('/batch'))} icon="layers" />
        </View>

        {activeMode === 'qr' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
              {QR_TYPES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  active={activeType === t.id}
                  pro={isProQrType(t.id) && !isPro}
                  testID={`qr-type-${t.id}`}
                  onPress={() => (isProQrType(t.id) ? requirePro('upi', () => setType(t.id)) : setType(t.id))}
                  icon={t.icon as React.ComponentProps<typeof Chip>['icon']}
                />
              ))}
            </ScrollView>
            <Card style={{ gap: 12 }}>
              {FIELDS[activeType].map((f) => (
                <View key={f.key}>
                  <Text style={s.label}>{f.label}</Text>
                  <TextInput
                    value={fields[f.key] ?? ''}
                    onChangeText={(v) => set(f.key, v)}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.muted}
                    keyboardType={f.keyboard ?? 'default'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={f.secure && activeType === 'wifi' && fields.security === 'nopass'}
                    multiline={f.multiline}
                    style={[s.input, f.multiline && { minHeight: 90, textAlignVertical: 'top' }]}
                  />
                </View>
              ))}
              {activeType === 'wifi' && (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    ['WPA', 'WPA / WPA2 / WPA3'],
                    ['WEP', 'WEP'],
                    ['nopass', 'Open'],
                  ].map(([id, label]) => (
                    <Chip key={id} label={label} active={fields.security === id} onPress={() => set('security', id)} />
                  ))}
                  <Chip label="Hidden network" active={fields.hidden === 'true'} onPress={() => set('hidden', fields.hidden === 'true' ? 'false' : 'true')} />
                </View>
              )}
            </Card>
          </>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
              {BAR_FORMATS.map((b) => (
                <Chip key={b.id} label={b.label} active={format === b.id} onPress={() => setFormat(b.id)} />
              ))}
            </ScrollView>
            <Card style={{ gap: 6 }}>
              <Text style={s.label}>Value · {BAR_FORMATS.find((b) => b.id === format)?.hint}</Text>
              <TextInput
                value={barText}
                onChangeText={setBarText}
                placeholder="e.g. 5901234123457"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={s.input}
              />
              {barCheck && !barCheck.ok && barText.length > 0 && <Text style={{ color: colors.caution, fontSize: 13 }}>{barCheck.error}</Text>}
            </Card>
          </>
        )}

        <SectionTitle>Preview</SectionTitle>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          {ready ? (
            activeMode === 'qr' ? (
              <QrView ref={shot} value={payload} size={240} fg={activeFg} ecc="M" />
            ) : (
              <BarcodeView ref={shot} value={payload} format={format} width={290} height={130} />
            )
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 60 }}>
              Fill in the details and your code appears here.
            </Text>
          )}
          {activeMode === 'qr' && ready && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              {SWATCHES.map((c) => (
                <Pressable
                  key={c}
                  accessibilityLabel={isProColor(c) && !isPro ? `Code colour ${c}, Pro` : `Code colour ${c}`}
                  onPress={() => (isProColor(c) ? requirePro('colors', () => setFg(c)) : setFg(c))}
                  style={[s.swatch, s.center, { backgroundColor: c }, activeFg === c && { borderColor: colors.accent, borderWidth: 3 }]}>
                  {isProColor(c) && !isPro ? <Ionicons name="lock-closed" size={13} color="#FFFFFF" /> : null}
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Button primary label="Share image" icon="share-outline" disabled={!ready} onPress={share} style={{ flex: 1 }} />
          <Button
            label="Copy text"
            icon="copy-outline"
            disabled={!ready}
            onPress={async () => {
              await Clipboard.setStringAsync(payload);
              save();
              tap('success');
            }}
            style={{ flex: 1 }}
          />
        </View>
        {!isPro ? (
          <Pressable testID="go-pro-create" accessibilityRole="button" onPress={() => router.push('/paywall')} style={s.proRow}>
            <ProBadge />
            <Text style={s.proRowText}>Barcodes, UPI, colours and batch codes come with Scanwise Pro</Text>
          </Pressable>
        ) : null}
        <Text style={s.note}>Codes you create never expire and are not tied to a server. Dark code on white scans best.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginBottom: 14 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14 },
  proRowText: { color: colors.muted, fontSize: 12.5, flexShrink: 1 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border },
  note: { color: colors.muted, fontSize: 12.5, textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
