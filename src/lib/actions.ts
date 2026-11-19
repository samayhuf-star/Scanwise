import * as Haptics from 'expo-haptics';
import { getSettings } from './store';

export function tap(kind: 'light' | 'success' | 'warning' = 'light') {
  if (!getSettings().haptics) return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else
    Haptics.notificationAsync(
      kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
}
