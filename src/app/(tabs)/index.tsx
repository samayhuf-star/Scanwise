import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { tap } from '@/lib/actions';
import { fmtDate, parsePass, sameDay, statusOf } from '@/lib/pass';
import { findMember, recordCheckIn, useCheckIns, useSettings } from '@/lib/store';
import { colors } from '@/lib/theme';

type Outcome = { kind: 'ok' | 'expired' | 'invalid'; title: string; detail: string };

export default function DeskScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [torch, setTorch] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const lock = useRef(false);
  const settings = useSettings();
  const log = useCheckIns();
  const today = log.filter((c) => c.status === 'ok' && sameDay(c.ts, Date.now())).length;

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

  const show = useCallback((o: Outcome) => {
    setOutcome(o);
    setTimeout(() => {
      setOutcome(null);
      lock.current = false;
    }, 2600);
  }, []);

  const onScanned = useCallback(
    (r: BarcodeScanningResult) => {
      if (lock.current || !r.data) return;
      lock.current = true;
      const pass = parsePass(r.data);
      if (!pass) {
        tap('warning');
        show({ kind: 'invalid', title: 'Not a PassDesk pass', detail: 'This code was not made by PassDesk.' });
        return;
      }
      const known = findMember(pass.memberId);
      // A pass can be checked on any device. If the member is saved here, the saved expiry wins (renewals).
      const expires = known ? known.expires : pass.expires;
      const name = known?.name ?? pass.name;
      if (statusOf(expires) === 'expired') {
        tap('warning');
        recordCheckIn({ memberId: pass.memberId, name, status: 'expired' });
        show({ kind: 'expired', title: `${name}: pass expired`, detail: expires ? `Expired ${fmtDate(expires)}. Ask them to renew.` : 'Ask them to renew.' });
        return;
      }
      tap('success');
      recordCheckIn({ memberId: pass.memberId, name, status: 'ok' });
      show({ kind: 'ok', title: `${name} is checked in`, detail: expires ? `Valid until ${fmtDate(expires)}` : 'No expiry' });
    },
    [show],
  );

  if (!permission) return <View style={s.fill} />;

  if (!permission.granted) {
    return (
      <View style={[s.fill, s.center, { padding: 28 }]}>
        <Ionicons name="id-card" size={64} color={colors.accent} />
        <Text style={s.h1}>Open your front desk</Text>
        <Text style={s.p}>
          PassDesk uses the camera to read member passes at the door. Everything is checked on this phone. Nothing is uploaded.
        </Text>
        {permission.canAskAgain ? (
          <Button primary label="Allow camera" icon="camera" onPress={requestPermission} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        ) : (
          <Button primary label="Open Settings" icon="settings" onPress={() => Linking.openSettings()} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        )}
      </View>
    );
  }

  const tint = outcome?.kind === 'ok' ? colors.safe : outcome?.kind === 'expired' ? colors.caution : colors.danger;

  return (
    <View style={s.fill}>
      {focused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      )}

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.center]}>
        <View style={[s.frame, outcome && { borderColor: tint }]} />
        <Text style={s.hint}>Hold a member pass inside the frame</Text>
      </View>

      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <View style={s.badge}>
          <Ionicons name="people" size={14} color={colors.accent} />
          <Text style={s.badgeText}>
            {settings.venueName || 'Front desk'} · {today} in today
          </Text>
        </View>
      </View>

      {outcome ? (
        <View style={[s.result, { borderColor: tint, bottom: 110 }]} accessibilityLiveRegion="polite">
          <Ionicons
            name={outcome.kind === 'ok' ? 'checkmark-circle' : outcome.kind === 'expired' ? 'time' : 'close-circle'}
            size={34}
            color={tint}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.resultTitle}>{outcome.title}</Text>
            <Text style={s.resultDetail}>{outcome.detail}</Text>
          </View>
        </View>
      ) : null}

      <View style={s.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
          onPress={() => {
            tap();
            setTorch((t) => !t);
          }}
          style={[s.round, torch && { backgroundColor: colors.accent }]}>
          <Ionicons name={torch ? 'flash' : 'flash-off'} size={24} color={torch ? colors.onAccent : '#fff'} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 16 },
  p: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  frame: { width: 260, height: 260, borderRadius: 24, borderWidth: 4, borderColor: colors.accent },
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
    backgroundColor: 'rgba(13,15,20,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  result: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
  },
  resultTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  resultDetail: { color: colors.muted, fontSize: 13.5, marginTop: 2 },
  bottom: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  round: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(13,15,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
