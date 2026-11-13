import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  icon,
  primary,
  danger,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = primary ? colors.accent : danger ? 'transparent' : colors.cardAlt;
  const fg = primary ? '#04251D' : danger ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        danger && { borderWidth: 1, borderColor: colors.danger },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  pro,
  testID,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Shows a small PRO badge (feature needs Scanwise Pro). */
  pro?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={pro ? `${label}, Pro` : label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: colors.accentDark, borderColor: colors.accent }]}>
      {icon ? <Ionicons name={icon} size={15} color={active ? colors.accent : colors.muted} /> : null}
      <Text style={{ color: active ? colors.accent : colors.muted, fontWeight: '600', fontSize: 13 }}>{label}</Text>
      {pro ? <ProBadge /> : null}
    </Pressable>
  );
}

export function ProBadge() {
  return (
    <View style={s.pro}>
      <Text style={s.proText}>PRO</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pro: { backgroundColor: colors.caution, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  proText: { color: '#1F1300', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  section: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
});
