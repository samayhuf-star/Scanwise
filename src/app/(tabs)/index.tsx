import { Ionicons } from '@expo/vector-icons';
import { CameraView, scanFromURLAsync, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { tap } from '@/lib/actions';
import { analyze } from '@/lib/shield';
import { addHistory } from '@/lib/store';
import { colors } from '@/lib/theme';

const TYPES: BarcodeType[] = [
  'qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'codabar', 'pdf417', 'aztec', 'datamatrix',
];

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [torch, setTorch] = useState(false);
  const lock = useRef(false);

  useFocusEffect(
    useCallback(() => {
      lock.current = false;
      setFocused(true);
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  const handle = useCallback((raw: string, format: string) => {
    if (lock.current || !raw) return;
    lock.current = true;
    const a = analyze(raw);
    tap(a.verdict === 'danger' || a.verdict === 'caution' ? 'warning' : 'success');
    addHistory({ raw, format, source: 'scan', kind: a.kind, verdict: a.verdict, title: a.title });
    router.push({ pathname: '/result', params: { raw, format, src: 'scan' } });
  }, []);

  const onScanned = useCallback(
    (r: BarcodeScanningResult) => handle(r.data, r.type),
    [handle],
  );

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled || !res.assets[0]) return;
    try {
      const found = await scanFromURLAsync(res.assets[0].uri, TYPES);
      if (found.length) handle(found[0].data, found[0].type);
      else Alert.alert('No code found', 'Try a sharper photo where the code fills most of the picture.');
    } catch {
      Alert.alert('Could not read the photo', 'Try another image.');
    }
  };

  if (!permission) return <View style={s.fill} />;

  if (!permission.granted) {
    return (
      <View style={[s.fill, s.center, { padding: 28 }]}>
        <Ionicons name="shield-checkmark" size={64} color={colors.accent} />
        <Text style={s.h1}>Scan safely</Text>
        <Text style={s.p}>
          Scanwise needs the camera to read codes. Everything is checked on your phone. Nothing is uploaded.
        </Text>
        {permission.canAskAgain ? (
          <Button primary label="Allow camera" icon="camera" onPress={requestPermission} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        ) : (
          <Button primary label="Open Settings" icon="settings" onPress={() => Linking.openSettings()} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        )}
        <Button label="Scan from a photo instead" icon="image" onPress={pickImage} style={{ marginTop: 10, alignSelf: 'stretch' }} />
      </View>
    );
  }

  return (
    <View style={s.fill}>
      {focused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: TYPES }}
          onBarcodeScanned={onScanned}
        />
      )}

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.center]}>
        <View style={s.frame}>
          <View style={[s.corner, s.tl]} />
          <View style={[s.corner, s.tr]} />
          <View style={[s.corner, s.bl]} />
          <View style={[s.corner, s.br]} />
        </View>
        <Text style={s.hint}>Point at a QR code or barcode</Text>
      </View>

      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <View style={s.badge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.accent} />
          <Text style={s.badgeText}>Checked on this device</Text>
        </View>
      </View>

      <View style={[s.bottom, { paddingBottom: 24 }]}>
        <Pressable accessibilityLabel="Scan from photo" onPress={pickImage} style={s.round}>
          <Ionicons name="image" size={24} color="#fff" />
        </Pressable>
        <Pressable
          accessibilityLabel={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
          onPress={() => {
            tap();
            setTorch((t) => !t);
          }}
          style={[s.round, torch && { backgroundColor: colors.accent }]}>
          <Ionicons name={torch ? 'flash' : 'flash-off'} size={24} color={torch ? '#04251D' : '#fff'} />
        </Pressable>
      </View>
    </View>
  );
}

const C = 34;
const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 16 },
  p: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  frame: { width: 260, height: 260 },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.accent },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  hint: {
    color: '#fff',
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '600',
  },
  top: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(11,18,32,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  round: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(11,18,32,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
