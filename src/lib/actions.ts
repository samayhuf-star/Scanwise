import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Alert, Share } from 'react-native';
import { getSettings } from './store';
import type { Action, Analysis } from './shield';

export function tap(kind: 'light' | 'success' | 'warning' = 'light') {
  if (!getSettings().haptics) return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else
    Haptics.notificationAsync(
      kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
}

export async function runAction(a: Action, analysis?: Analysis): Promise<string | null> {
  tap('light');
  switch (a.kind) {
    case 'copy':
      await Clipboard.setStringAsync(a.value);
      return 'Copied';
    case 'share':
      await Share.share({ message: a.value });
      return null;
    case 'open':
    case 'search':
    case 'map': {
      const go = async () => {
        await Linking.openURL(a.value).catch(() => Alert.alert('Can not open', 'No app on this device can handle it.'));
      };
      if (analysis?.verdict === 'danger') {
        Alert.alert(
          'Open a link flagged as dangerous?',
          'Scanwise found warning signs. Only continue if you fully trust where this came from.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open anyway', style: 'destructive', onPress: go },
          ],
        );
      } else await go();
      return null;
    }
    case 'call':
    case 'mail':
    case 'sms':
      await Linking.openURL(a.value).catch(() => Alert.alert('Can not open', 'This device can not do that.'));
      return null;
  }
}
